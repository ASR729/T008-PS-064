"""
Domain services for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module provides the core business services for bed-day counting,
pricing, transfers, packages, discounts, GST, and demand lifecycle.
"""

from decimal import Decimal, ROUND_UP
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple
from enum import Enum

from ..models import (
    Category, Bed, Doctor, Admission, BedAllocation, BedOccupancyPeriod,
    Transfer, StepDown, PackageEnrollment, PackageConversion, ChargeEvent,
    Deposit, Demand, InterimBill, LedgerEntry, Rejection
)

__all__ = [
    'BedDayCounter', 'PricingService', 'TransferService', 'PackageService',
    'DiscountService', 'GSTService', 'DemandService', 'LedgerService',
]


class BedDayCounter:
    """
    BR-01: Bed-day counting service.

    Implements noon anchor for non-ICU beds and 08:00 anchor for ICU beds.
    Admission before noon counts that day's noon as bed day.
    Admission at exactly 12:00:00 does NOT count that noon.
    Discharge after 14:00:00 adds one extra bed day.
    Discharge at exactly 14:00:00 or 10:00:00 adds nothing.
    Discharge before 10:00:00 adds one extra bed day unless planned.
    Minimum stay of 24 hours rule.
    ICU 08:00 counting anchor.
    """

    NOON_HOUR = 12
    ICU_HOUR = 8
    EARLY_DISCHARGE_HOUR = 10
    EXTRA_DISCHARGE_HOUR = 14

    def __init__(self):
        self.bed_days: List[Dict] = []

    def count_bed_days(
        self,
        admission_id: str,
        category: Category,
        admit_time: datetime,
        discharge_time: Optional[datetime] = None,
        transfer_times: Optional[List[Tuple[datetime, Category]]] = None
    ) -> List[Dict]:
        """
        Count bed days for a patient stay.

        Args:
            admission_id: Admission identifier
            category: Current category (for non-transfer stays)
            admit_time: Admission timestamp
            discharge_time: Discharge timestamp (None if still active)
            transfer_times: List of (timestamp, category) for transfers

        Returns:
            List of bed day entries with date, category, and count
        """
        if discharge_time is None:
            return []

        bed_days = []
        transfer_times = transfer_times or []

        # Determine effective date range
        start_date = admit_time.date()
        end_date = discharge_time.date()

        # Build category timeline
        timeline = [(admit_time, category)]
        for ts, cat in transfer_times:
            timeline.append((ts, cat))

        timeline.sort(key=lambda x: x[0])

        # Count bed days for each calendar day in range
        current_date = start_date
        while current_date <= end_date:
            day_bed_days = self._count_day_bed_days(
                admission_id, current_date, timeline, admit_time, discharge_time
            )
            bed_days.extend(day_bed_days)
            current_date += timedelta(days=1)

        # Apply minimum one-day rule
        if not bed_days and (discharge_time - admit_time) < timedelta(hours=24):
            # Stay under 24 hours but no bed day counted - post one bed day at discharge
            bed_day_category = self._get_category_at_time(discharge_time, timeline)
            bed_days.append({
                'admission_id': admission_id,
                'date': discharge_time.date(),
                'category': bed_day_category,
                'counting_timestamp': discharge_time,
                'chargeable': True,
                'reason': 'minimum_one_day_rule'
            })

        self.bed_days.extend(bed_days)
        return bed_days

    def _count_day_bed_days(
        self,
        admission_id: str,
        day: date,
        timeline: List[Tuple[datetime, Category]],
        admit_time: datetime,
        discharge_time: Optional[datetime]
    ) -> List[Dict]:
        """Count bed days for a single calendar day."""
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        # Determine counting anchors for this day
        noon_anchor = datetime.combine(day, datetime.min.time().replace(hour=self.NOON_HOUR))
        icu_anchor = datetime.combine(day, datetime.min.time().replace(hour=self.ICU_HOUR))

        # Check if day has any occupancy
        occupied_periods = self._get_occupied_periods(day, timeline, admit_time, discharge_time)
        if not occupied_periods:
            return []

        # Determine which category occupied at noon/ICU anchor
        category_at_noon = self._get_category_at_time(noon_anchor, timeline)
        category_at_icu_anchor = self._get_category_at_time(icu_anchor, timeline)

        # Apply discharge boundary rule FIRST (before checking noon occupancy)
        if day == discharge_time.date():
            # Discharge after 14:00 adds one extra bed day
            if discharge_time.hour > self.EXTRA_DISCHARGE_HOUR:
                counting_category = self._get_category_at_time(noon_anchor, timeline)
                return [{
                    'admission_id': admission_id,
                    'date': day,
                    'category': counting_category,
                    'counting_timestamp': noon_anchor,
                    'chargeable': True,
                    'reason': 'bed_day_count'
                }]
            # Discharge at exactly 14:00 or 10:00 adds nothing
            elif (discharge_time.hour == self.EXTRA_DISCHARGE_HOUR and
                  discharge_time.minute == 0 and discharge_time.second == 0):
                return []
            elif (discharge_time.hour == self.EARLY_DISCHARGE_HOUR and
                  discharge_time.minute == 0 and discharge_time.second == 0):
                return []
            # Discharge before 10:00 adds one extra bed day unless planned
            elif discharge_time.hour < self.EARLY_DISCHARGE_HOUR:
                counting_category = self._get_category_at_time(noon_anchor, timeline)
                return [{
                    'admission_id': admission_id,
                    'date': day,
                    'category': counting_category,
                    'counting_timestamp': noon_anchor,
                    'chargeable': True,
                    'reason': 'bed_day_count'
                }]

        # Determine counting time based on category at anchor times
        counting_time = None
        counting_category = None

        # If ICU at 08:00 anchor, count at ICU anchor
        if category_at_icu_anchor == Category.ICU and self._is_occupying_at(icu_anchor, occupied_periods):
            counting_time = icu_anchor
            counting_category = Category.ICU
        # Otherwise count at noon anchor for non-ICU
        elif category_at_noon != Category.ICU and self._is_occupying_at(noon_anchor, occupied_periods):
            counting_time = noon_anchor
            counting_category = category_at_noon
        # Fallback: count at noon with current category
        elif self._is_occupying_at(noon_anchor, occupied_periods):
            counting_time = noon_anchor
            counting_category = category_at_noon

        if counting_time is None:
            return []

        # Apply admission boundary rule
        if day == admit_time.date():
            # Admission before noon counts that noon
            if admit_time.hour < self.NOON_HOUR:
                counting_time = noon_anchor
                counting_category = self._get_category_at_time(noon_anchor, timeline)
            # Admission at exactly noon does NOT count that noon
            elif admit_time.hour == self.NOON_HOUR and admit_time.minute == 0 and admit_time.second == 0:
                return []
            # Admission after noon - count at noon (already set)

        return [{
            'admission_id': admission_id,
            'date': day,
            'category': counting_category,
            'counting_timestamp': counting_time,
            'chargeable': True,
            'reason': 'bed_day_count'
        }]

    def _get_occupied_periods(
        self,
        day: date,
        timeline: List[Tuple[datetime, Category]],
        admit_time: datetime,
        discharge_time: Optional[datetime]
    ) -> List[Tuple[datetime, Optional[datetime]]]:
        """Get occupancy periods for a day."""
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        periods = []
        current_start = max(admit_time, day_start)
        current_end = discharge_time if discharge_time else day_end

        if current_start <= current_end:
            periods.append((current_start, min(current_end, day_end)))

        return periods

    def _is_occupying_at(self, timestamp: datetime, occupied_periods: List[Tuple[datetime, Optional[datetime]]]) -> bool:
        """Check if patient is occupying a bed at a given timestamp."""
        for start, end in occupied_periods:
            if start <= timestamp and (end is None or timestamp <= end):
                return True
        return False

    def _get_category_at_time(self, timestamp: datetime, timeline: List[Tuple[datetime, Category]]) -> Category:
        """Get category active at a given time."""
        category = timeline[0][1] if timeline else Category.GENERAL
        for ts, cat in timeline:
            if ts <= timestamp:
                category = cat
            else:
                break
        return category


class PricingService:
    """
    BR-04: Category-at-event pricing service.

    Applies category-specific multipliers to charges based on the category
    occupied at the event timestamp.
    """

    def __init__(self, categories: Dict[str, Category]):
        self.categories = categories

    def calculate_charge(
        self,
        base_amount: Decimal,
        category_at_event: Category,
        charge_head: str,
        qty: int = 1
    ) -> Dict[str, Decimal]:
        """
        Calculate charge with category-at-event multiplier.

        Args:
            base_amount: Base rate for the charge head
            category_at_event: Category occupied at event time
            charge_head: Type of charge (doctor, procedure, OT, pharmacy, etc.)
            qty: Quantity

        Returns:
            Dict with base_amount, multiplier, gross calculation
        """
        multiplier = self._get_multiplier(category_at_event, charge_head)
        gross = base_amount * qty * multiplier

        return {
            'base_amount': base_amount,
            'multiplier': multiplier,
            'gross': gross,
            'qty': Decimal(str(qty)),
            'category': category_at_event,
        }

    def _get_multiplier(self, category: Category, charge_head: str) -> Decimal:
        """Get multiplier for charge head based on category."""
        # Pharmacy and consumables use 1.00 multiplier
        if charge_head in ('PHARMACY', 'CONSUMABLE'):
            return Decimal('1.00')

        # Bed and nursing charges use base_amount directly (multiplier 1.00)
        if charge_head in ('BED', 'NURSING', 'ICU_ROUND'):
            return Decimal('1.00')

        # Investigations use investigation_multiplier
        if charge_head == 'INVESTIGATION':
            return category.investigation_multiplier

        # Doctor visits, procedures, OT use visit/procedure/ot multipliers
        if charge_head == 'DOCTOR_VISIT':
            return category.visit_multiplier
        if charge_head == 'PROCEDURE':
            return category.procedure_multiplier
        if charge_head == 'OT':
            return category.ot_multiplier

        # Default to visit multiplier
        return category.visit_multiplier


class TransferService:
    """
    BR-03: Transfer and ICU movement service.

    Handles category transfers, ICU step-down requirements,
    transfer count limits, and occupancy boundary management.
    """

    MAX_TRANSFERS = 4

    def __init__(self, beds: Dict[str, Bed]):
        self.beds = beds
        self.transfers: List[Transfer] = []

    def validate_transfer(
        self,
        admission_id: str,
        target_category: Category,
        target_bed_id: Optional[str],
        current_category: Category,
        transfer_count: int,
        is_icu_entry: bool = False,
        is_step_down: bool = False
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validate a transfer command.

        Returns:
            (is_valid, error_code, error_detail)
        """
        # Check same category rejection
        if target_category == current_category:
            return False, 'SAME_CATEGORY', 'Transfer to same category is not allowed'

        # Check transfer count limit
        if transfer_count >= self.MAX_TRANSFERS:
            return False, 'TRANSFER_LIMIT', f'Maximum {self.MAX_TRANSFERS} transfers allowed'

        # ICU entry: TRANSFER into ICU allowed without step-down
        if target_category == Category.ICU:
            return True, None, None

        # ICU exit requires STEP_DOWN
        if current_category == Category.ICU and not is_step_down:
            return False, 'STEP_DOWN_REQUIRED', 'ICU discharge requires STEP_DOWN command'

        # Validate target bed if specified
        if target_bed_id and target_bed_id in self.beds:
            bed = self.beds[target_bed_id]
            if not bed.is_available():
                return False, 'BED_NOT_AVAILABLE', f'Bed {target_bed_id} is not available'
            if bed.category != target_category:
                return False, 'BED_CATEGORY_MISMATCH', f'Bed {target_bed_id} category does not match target'

        return True, None, None

    def record_transfer(
        self,
        admission_id: str,
        transfer_time: datetime,
        target_category: Category,
        target_bed_id: Optional[str],
        doctor_id: Optional[str] = None,
        step_down_required: bool = False
    ) -> Transfer:
        """Record a transfer in the system."""
        transfer = Transfer(
            admission_id=admission_id,
            transfer_time=transfer_time,
            target_category=target_category,
            target_bed_id=target_bed_id,
            ordered_by_doctor_id=doctor_id,
            order_issued_ts=transfer_time,
            step_down_required=step_down_required,
        )
        self.transfers.append(transfer)
        return transfer

    def record_step_down(
        self,
        admission_id: str,
        step_down_time: datetime,
        target_category: Category,
        doctor_id: Optional[str] = None
    ) -> StepDown:
        """Record a step-down from ICU."""
        step_down = StepDown(
            admission_id=admission_id,
            step_down_time=step_down_time,
            target_category=target_category,
            doctor_id=doctor_id,
        )
        return step_down


class PackageService:
    """
    BR-06: Package management and conversion service.

    Handles package enrollment, conversion triggers,
    retroactive repricing, and package billing.
    """

    def __init__(self, packages: Dict):
        self.packages = packages
        self.enrollments: List[PackageEnrollment] = []
        self.conversions: List[PackageConversion] = []

    def check_package_conversion(
        self,
        admission_id: str,
        package_code: str,
        icu_hours: Decimal,
        has_non_included_procedure: bool,
        current_time: datetime
    ) -> Tuple[bool, Optional[datetime], str]:
        """
        Check if package should convert to itemized billing.

        Conversion triggers:
        - ICU stay exceeds 48 hours
        - Non-included procedure triggers conversion condition

        Returns:
            (should_convert, effective_timestamp, reason)
        """
        package = self.packages.get(package_code)
        if not package:
            return False, None, 'UNKNOWN_PACKAGE'

        # ICU stay exceeds 48 hours
        if icu_hours > 48:
            # Conversion effective at 48-hour boundary
            effective_ts = current_time  # Will be adjusted by caller
            return True, effective_ts, 'ICU_EXCEEDS_48_HOURS'

        # Non-included procedure conversion
        if has_non_included_procedure:
            return True, current_time, 'NON_INCLUDED_PROCEDURE'

        return False, None, 'NO_CONVERSION_TRIGGER'

    def convert_package(
        self,
        admission_id: str,
        package_code: str,
        conversion_time: datetime,
        covered_events: List[str],
        repriced_events: List[str]
    ) -> PackageConversion:
        """Convert package to itemized billing."""
        conversion = PackageConversion(
            admission_id=admission_id,
            conversion_time=conversion_time,
            original_package=package_code,
            covered_events=covered_events,
            repriced_events=repriced_events,
        )
        self.conversions.append(conversion)
        return conversion


class DiscountService:
    """
    BR-08: Discount service.

    Implements senior citizen (10% on bed/nursing),
    employee referral (15% on doctor fees),
    charity (up to 50% with CEO reference).
    """

    SENIOR_AGE_THRESHOLD = 60
    SENIOR_DISCOUNT_PCT = Decimal('10.00')
    EMPLOYEE_REFERRAL_DISCOUNT_PCT = Decimal('15.00')
    MAX_CHARITY_DISCOUNT_PCT = Decimal('50.00')

    def __init__(self):
        self.discounts: List[Dict] = []

    def apply_senior_discount(
        self,
        amount: Decimal,
        patient_age: int,
        charge_head: str
    ) -> Tuple[Decimal, Decimal]:
        """
        Apply senior citizen discount.

        Returns:
            (discounted_amount, discount_amount)
        """
        if patient_age < self.SENIOR_AGE_THRESHOLD:
            return amount, Decimal('0.00')

        if charge_head not in ('BED', 'NURSING'):
            return amount, Decimal('0.00')

        discount_amount = amount * self.SENIOR_DISCOUNT_PCT / Decimal('100')
        discounted = amount - discount_amount

        self.discounts.append({
            'type': 'SENIOR',
            'charge_head': charge_head,
            'original_amount': amount,
            'discount_pct': self.SENIOR_DISCOUNT_PCT,
            'discount_amount': discount_amount,
            'final_amount': discounted,
        })

        return discounted, discount_amount

    def apply_employee_referral_discount(
        self,
        amount: Decimal,
        is_employee_referral: bool,
        charge_head: str
    ) -> Tuple[Decimal, Decimal]:
        """Apply employee referral discount on doctor fees."""
        if not is_employee_referral:
            return amount, Decimal('0.00')

        if charge_head != 'DOCTOR_VISIT':
            return amount, Decimal('0.00')

        discount_amount = amount * self.EMPLOYEE_REFERRAL_DISCOUNT_PCT / Decimal('100')
        discounted = amount - discount_amount

        self.discounts.append({
            'type': 'EMPLOYEE_REFERRAL',
            'charge_head': charge_head,
            'original_amount': amount,
            'discount_pct': self.EMPLOYEE_REFERRAL_DISCOUNT_PCT,
            'discount_amount': discount_amount,
            'final_amount': discounted,
        })

        return discounted, discount_amount

    def apply_charity_discount(
        self,
        amount: Decimal,
        charity_pct: Decimal,
        ceo_reference: str,
        is_valid_reference: bool
    ) -> Tuple[Decimal, Decimal]:
        """Apply charity discount with CEO reference validation."""
        if not is_valid_reference:
            return amount, Decimal('0.00')

        effective_pct = min(charity_pct, self.MAX_CHARITY_DISCOUNT_PCT)
        discount_amount = amount * effective_pct / Decimal('100')
        discounted = amount - discount_amount

        self.discounts.append({
            'type': 'CHARITY',
            'charge_head': 'ALL',
            'original_amount': amount,
            'discount_pct': effective_pct,
            'discount_amount': discount_amount,
            'final_amount': discounted,
            'ceo_reference': ceo_reference,
        })

        return discounted, discount_amount


class GSTService:
    """
    BR-11: GST calculation service.

    5% GST on qualifying room charges only.
    Threshold is strictly greater than ₹5,000 per day.
    Exactly ₹5,000 does not attract GST.
    """

    GST_RATE = Decimal('5.00')
    GST_THRESHOLD = Decimal('5000.00')

    def __init__(self):
        self.gst_entries: List[Dict] = []

    def calculate_gst(
        self,
        room_charge: Decimal,
        category: Category,
        discount_applied: bool = False
    ) -> Dict[str, Decimal]:
        """
        Calculate GST on qualifying room charges.

        Args:
            room_charge: Daily room charge amount
            category: Bed category
            discount_applied: Whether discount was applied

        Returns:
            Dict with gst_amount, is_applicable, threshold_check
        """
        # GST applies only to room charges above ₹5,000
        threshold_met = room_charge > self.GST_THRESHOLD

        if not threshold_met:
            self.gst_entries.append({
                'category': category,
                'room_charge': room_charge,
                'gst_amount': Decimal('0.00'),
                'applicable': False,
                'reason': 'below_threshold',
            })
            return {
                'gst_amount': Decimal('0.00'),
                'applicable': False,
                'threshold_met': False,
            }

        gst_amount = room_charge * self.GST_RATE / Decimal('100')

        self.gst_entries.append({
            'category': category,
            'room_charge': room_charge,
            'gst_amount': gst_amount,
            'applicable': True,
            'reason': 'above_threshold',
        })

        return {
            'gst_amount': gst_amount,
            'applicable': True,
            'threshold_met': True,
        }


class DemandService:
    """
    BR-07, BR-07a, BR-07b: Deposit and top-up demand lifecycle service.

    BR-07a: Average daily charge = total charges posted in last 3 calendar days
            divided by number of calendar days containing at least one charge line.

    BR-07b: Demand created at charge event taking running bill strictly above 80%
            of total deposits. Exactly 80% does not trigger demand.
    """

    THRESHOLD_PERCENT = Decimal('80.00')
    LOOKBACK_DAYS = 3
    DEMAND_ROUNDING = Decimal('100.00')
    BLOCK_DURATION_HOURS = 48

    def __init__(self):
        self.demands: List[Demand] = []
        self.charge_events: List[Dict] = []
        self.deposits: List[Deposit] = []
        self.procedure_block_active = False
        self.block_start_time: Optional[datetime] = None

    def calculate_average_daily_charge(
        self,
        admission_id: str,
        current_time: datetime
    ) -> Tuple[Decimal, int]:
        """
        BR-07a: Calculate average daily charge over last 3 calendar days.

        Returns:
            (avg_daily_charge, days_with_charges)
        """
        # Collect charge events for last 3 calendar days including current day
        end_date = current_time.date()
        start_date = end_date - timedelta(days=self.LOOKBACK_DAYS - 1)

        daily_charges: Dict[date, Decimal] = {}

        for event in self.charge_events:
            if event['admission_id'] != admission_id:
                continue
            event_date = event['timestamp'].date()
            if start_date <= event_date <= end_date:
                if event_date not in daily_charges:
                    daily_charges[event_date] = Decimal('0.00')
                daily_charges[event_date] += event['amount']

        # Count days with at least one charge line
        days_with_charges = len(daily_charges)
        total_charges = sum(daily_charges.values())

        if days_with_charges == 0:
            return Decimal('0.00'), 0

        avg_daily_charge = total_charges / Decimal(str(days_with_charges))

        return avg_daily_charge, days_with_charges

    def calculate_demand_amount(
        self,
        admission_id: str,
        current_time: datetime
    ) -> Decimal:
        """
        BR-07a: Calculate demand amount by rounding upward to nearest ₹100.

        Returns:
            Demand amount rounded up to nearest ₹100
        """
        avg_daily_charge, days_with_charges = self.calculate_average_daily_charge(
            admission_id, current_time
        )

        if days_with_charges == 0:
            return Decimal('0.00')

        # Round up to nearest ₹100
        demand_amount = (avg_daily_charge / self.DEMAND_ROUNDING).quantize(
            Decimal('1'), rounding=ROUND_UP
        ) * self.DEMAND_ROUNDING

        return demand_amount

    def check_demand_trigger(
        self,
        admission_id: str,
        running_bill: Decimal,
        total_deposits: Decimal,
        current_time: datetime,
        trigger_line_no: Optional[int] = None
    ) -> Optional[Demand]:
        """
        BR-07b: Check if demand should be created.

        Demand created when running bill > 80% of total deposits.
        Exactly 80% does NOT trigger demand.

        Returns:
            Demand object if created, None otherwise
        """
        if total_deposits == Decimal('0.00'):
            return None

        threshold_80pct = total_deposits * self.THRESHOLD_PERCENT / Decimal('100')

        # Strictly above 80% required
        if running_bill <= threshold_80pct:
            return None

        # Check for existing OPEN demand
        for demand in self.demands:
            if demand.admission_id == admission_id and demand.status == 'OPEN':
                return None

        avg_daily_charge, days_with_charges = self.calculate_average_daily_charge(
            admission_id, current_time
        )
        demand_amount = self.calculate_demand_amount(admission_id, current_time)

        demand = Demand(
            demand_id=f'DEM-{admission_id}-{len(self.demands) + 1}',
            admission_id=admission_id,
            seq=len(self.demands) + 1,
            demand_ts=current_time,
            trigger_line_no=trigger_line_no,
            running_bill=running_bill,
            deposits_at_demand=total_deposits,
            threshold_80pct=threshold_80pct,
            charges_last_3_days=avg_daily_charge * Decimal(str(days_with_charges)) if days_with_charges > 0 else Decimal('0.00'),
            days_with_charges=days_with_charges,
            avg_daily_charge=avg_daily_charge,
            demand_amount=demand_amount,
            deposits_since_demand=Decimal('0.00'),
            outstanding=demand_amount,
            status='OPEN',
            status_ts=current_time,
            procedure_block_from=None,
            procedure_block_to=None,
        )

        self.demands.append(demand)
        return demand

    def record_deposit(
        self,
        admission_id: str,
        amount: Decimal,
        timestamp: datetime,
        payment_mode: str = 'CASH',
        demand_id: Optional[str] = None
    ) -> Deposit:
        """Record a deposit payment."""
        deposit = Deposit(
            transaction_id=f'DEP-{admission_id}-{len(self.deposits) + 1}',
            admission_id=admission_id,
            amount=amount,
            timestamp=timestamp,
            payment_mode=payment_mode,
            demand_id=demand_id,
        )
        self.deposits.append(deposit)

        # Update demand outstanding if linked
        if demand_id:
            for demand in self.demands:
                if demand.demand_id == demand_id:
                    demand.deposits_since_demand += amount
                    demand.outstanding = max(
                        Decimal('0.00'),
                        demand.demand_amount - demand.deposits_since_demand
                    )
                    if demand.outstanding == Decimal('0.00'):
                        demand.status = 'CLOSED'
                        demand.status_ts = timestamp
                    break

        return deposit

    def check_procedure_block(
        self,
        admission_id: str,
        running_bill: Decimal,
        total_deposits: Decimal,
        current_time: datetime,
        is_emergency: bool = False
    ) -> Tuple[bool, Optional[str]]:
        """
        BR-07b: Check if procedure should be blocked due to open demand.

        Returns:
            (is_blocked, rejection_code)
        """
        # Check if block should be activated (48 hours + open demand + bill > 80%)
        open_demand = None
        for demand in self.demands:
            if (demand.admission_id == admission_id and
                demand.status == 'OPEN'):
                open_demand = demand
                break

        if open_demand is None:
            self.procedure_block_active = False
            self.block_start_time = None
            return False, None

        # Check 48-hour condition
        if self.block_start_time is None:
            block_threshold = open_demand.demand_ts + timedelta(hours=self.BLOCK_DURATION_HOURS)
            if current_time >= block_threshold:
                threshold_80pct = total_deposits * self.THRESHOLD_PERCENT / Decimal('100')
                if running_bill > threshold_80pct:
                    self.procedure_block_active = True
                    self.block_start_time = block_threshold
                    open_demand.procedure_block_from = block_threshold
                    # Emergency procedures are allowed even during block
                    if is_emergency:
                        return False, None
                    return True, 'TOPUP_BLOCK'

        if self.procedure_block_active:
            if is_emergency:
                return False, None  # Emergency procedures allowed
            return True, 'TOPUP_BLOCK'

        return False, None

    def check_block_lift(
        self,
        admission_id: str,
        current_time: datetime
    ) -> bool:
        """Check if procedure block should be lifted."""
        open_demands = [
            d for d in self.demands
            if d.admission_id == admission_id and d.status == 'OPEN'
        ]

        if not open_demands:
            self.procedure_block_active = False
            self.block_start_time = None
            return True

        return False

    def record_charge_event(
        self,
        admission_id: str,
        amount: Decimal,
        timestamp: datetime,
        head: str
    ):
        """Record a charge event for demand calculation."""
        self.charge_events.append({
            'admission_id': admission_id,
            'amount': amount,
            'timestamp': timestamp,
            'head': head,
        })


class LedgerService:
    """
    BR-09, BR-10: Ledger service for financial tracking.

    Manages ledger entries, interim bill locks, corrections,
    adjustments, and final settlement.
    """

    def __init__(self):
        self.entries: List[LedgerEntry] = []
        self.locked_entries: Dict[int, str] = {}  # line_no -> interim_id
        self.interim_bills: List[InterimBill] = []
        self.line_counter = 0

    def add_entry(
        self,
        admission_id: str,
        timestamp: datetime,
        head: str,
        item_code: str,
        description: str,
        category_at_event: Category,
        qty: int,
        base_amount: Decimal,
        multiplier: Decimal,
        gross: Decimal,
        discount_pct: Decimal,
        discount_amt: Decimal,
        gst_amt: Decimal,
        net: Decimal,
        counting_timestamp: Optional[datetime] = None,
    ) -> LedgerEntry:
        """Add a new ledger entry."""
        self.line_counter += 1

        entry = LedgerEntry(
            line_no=self.line_counter,
            event_ts=timestamp,
            counting_ts=counting_timestamp,
            head=head,
            item_code=item_code,
            description=description,
            category_at_event=category_at_event,
            qty=qty,
            base_amount=base_amount,
            multiplier=multiplier,
            gross=gross,
            discount_pct=discount_pct,
            discount_amt=discount_amt,
            gst_amt=gst_amt,
            net=net,
            locked_by_interim=None,
        )
        self.entries.append(entry)
        return entry

    def lock_entries_before_interim(
        self,
        interim_id: str,
        interim_timestamp: datetime
    ) -> int:
        """Lock all entries before interim bill timestamp."""
        locked_count = 0
        for entry in self.entries:
            if entry.locked_by_interim is None and entry.event_ts < interim_timestamp:
                entry.locked_by_interim = interim_id
                self.locked_entries[entry.line_no] = interim_id
                locked_count += 1
        return locked_count

    def is_entry_locked(self, line_no: int) -> bool:
        """Check if a ledger entry is locked."""
        return line_no in self.locked_entries

    def create_adjustment(
        self,
        admission_id: str,
        original_line_no: int,
        timestamp: datetime,
        head: str,
        item_code: str,
        description: str,
        category_at_event: Category,
        qty: int,
        base_amount: Decimal,
        multiplier: Decimal,
        gross: Decimal,
        discount_pct: Decimal,
        discount_amt: Decimal,
        gst_amt: Decimal,
        net: Decimal,
        is_positive: bool = True,
    ) -> LedgerEntry:
        """Create a signed adjustment line for locked event correction."""
        # For locked events, create adjustment instead of modifying in place
        adjustment_net = net if is_positive else -net

        self.line_counter += 1

        entry = LedgerEntry(
            line_no=self.line_counter,
            event_ts=timestamp,
            counting_ts=None,
            head=head,
            item_code=item_code,
            description=description,
            category_at_event=category_at_event,
            qty=qty,
            base_amount=base_amount,
            multiplier=multiplier,
            gross=gross if is_positive else -gross,
            discount_pct=discount_pct,
            discount_amt=discount_amt,
            gst_amt=gst_amt,
            net=adjustment_net,
            locked_by_interim=None,
        )
        self.entries.append(entry)
        return entry

    def create_interim_bill(
        self,
        admission_id: str,
        interim_timestamp: datetime,
        trigger: str
    ) -> InterimBill:
        """Create an interim bill and lock prior entries."""
        locked_count = self.lock_entries_before_interim(
            f'INTERIM-{admission_id}-{len(self.interim_bills) + 1}',
            interim_timestamp
        )

        gross_total = sum(e.gross for e in self.entries if e.locked_by_interim is not None)
        discount_total = sum(e.discount_amt for e in self.entries if e.locked_by_interim is not None)
        gst_total = sum(e.gst_amt for e in self.entries if e.locked_by_interim is not None)
        running_bill = sum(e.net for e in self.entries if e.locked_by_interim is not None)

        interim = InterimBill(
            interim_id=f'INTERIM-{admission_id}-{len(self.interim_bills) + 1}',
            admission_id=admission_id,
            interim_ts=interim_timestamp,
            trigger=trigger,
            lines_locked=locked_count,
            last_line_no=self.line_counter,
            gross_total=gross_total,
            discount_total=discount_total,
            gst_total=gst_total,
            running_bill=running_bill,
            deposits_to_date=Decimal('0.00'),
            balance=running_bill,
        )
        self.interim_bills.append(interim)
        return interim

    def calculate_balance(
        self,
        total_charges: Decimal,
        discounts: Decimal,
        deposits: Decimal
    ) -> Decimal:
        """Calculate final balance: Charges - Discounts - Deposits."""
        return total_charges - discounts - deposits
