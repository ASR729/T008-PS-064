"""
Command parsing and processing for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module handles the parsing of command files, command validation, and command execution
for the billing engine. All business rules BR-01 through BR-12, BR-07a, BR-07b are implemented.
"""

from typing import Dict, List, Optional, Tuple, Set
from datetime import datetime, timedelta, date
from dataclasses import dataclass, field
from enum import Enum
from decimal import Decimal, ROUND_HALF_UP

from ..models import (
    Category, Bed, Doctor, TariffItem, Package, Admission,
    Patient, BedAllocation, BedOccupancyPeriod, Transfer, StepDown,
    PackageEnrollment, PackageConversion, ChargeEvent, Deposit,
    Demand, InterimBill, LedgerEntry, Rejection, Gender
)
from ..loaders import MasterDataLoader, loader
from ..services import (
    BedDayCounter, PricingService, TransferService, PackageService,
    DiscountService, GSTService, DemandService, LedgerService
)


class CommandType(str, Enum):
    """Enumeration of command types."""
    ADMIT = "ADMIT"
    RESERVE_BED = "RESERVE_BED"
    TRANSFER = "TRANSFER"
    STEP_DOWN = "STEP_DOWN"
    VISIT = "VISIT"
    PROCEDURE = "PROCEDURE"
    OT = "OT"
    PHARMACY = "PHARMACY"
    CONSUMABLE = "CONSUMABLE"
    INVESTIGATION = "INVESTIGATION"
    DEPOSIT = "DEPOSIT"
    INTERIM_BILL = "INTERIM_BILL"
    CORRECTION = "CORRECTION"
    CHARITY = "CHARITY"
    DISCHARGE = "DISCHARGE"
    HOUSEKEEPING_CLEARED = "HOUSEKEEPING_CLEARED"
    UNKNOWN = "UNKNOWN"


@dataclass
class ParsedCommand:
    """Parsed command from the command file."""
    command_type: CommandType
    timestamp: datetime
    args: List[str]
    raw_line: str
    line_number: int
    admission_id: Optional[str] = None

    def __post_init__(self):
        """Extract admission ID from arguments if present."""
        # args[0] is the first argument after timestamp = admission_id for most commands
        if len(self.args) > 0:
            self.admission_id = self.args[0]


@dataclass
class CommandResult:
    """Result of processing a command."""
    command_type: CommandType
    admission_id: Optional[str]
    success: bool
    error_code: Optional[str] = None
    error_detail: Optional[str] = None
    event_id: Optional[str] = None
    processed_by: Optional[str] = None


def round2(value: Decimal) -> Decimal:
    """Round a Decimal to 2 decimal places using half-up rounding."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def round0(value: Decimal) -> Decimal:
    """Round a Decimal to 0 decimal places using half-up rounding."""
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


class CommandProcessor:
    """
    Main command processor for PS-064.

    Processes commands.txt line by line. Before each command, internal timed events fire:
    48-hour demand deadline, reservation release, bed-day count, 7-day interim bill.
    """

    # Bed-day counting anchors
    NOON_HOUR = 12
    ICU_HOUR = 8
    EARLY_DISCHARGE_HOUR = 10
    EXTRA_DISCHARGE_HOUR = 14

    # GST threshold
    GST_THRESHOLD = Decimal("5000.00")
    GST_RATE = Decimal("5.00")

    # Deposit calculation
    DEPOSIT_FIXED = Decimal("10000.00")

    # ICU round fee
    ICU_ROUND_FEE = Decimal("2500.00")

    # Transfer limits
    MAX_TRANSFERS = 3

    def __init__(self, loader: MasterDataLoader):
        self.loader = loader
        self.loader.load_all()
        self.bed_day_counter = BedDayCounter()
        self.pricing_service = PricingService(loader.categories)
        self.transfer_service = TransferService(loader.beds)
        self.package_service = PackageService(loader.packages)
        self.discount_service = DiscountService()
        self.gst_service = GSTService()
        self.demand_service = DemandService()
        self.ledger_service = LedgerService()

        # State tracking
        self._command_results: List[CommandResult] = []
        self._rejections: List[Rejection] = []
        self._interim_bills: List[InterimBill] = []
        self._ledger_entries: List[LedgerEntry] = []
        self._line_counter = 0
        self._admission_line_counters: Dict[str, int] = {}

        # Per-admission state
        self._admission_transfer_counts: Dict[str, int] = {}
        self._visits_per_doctor_day: Dict[Tuple[str, str, str], int] = {}
        self._icu_entry_times: Dict[str, datetime] = {}
        self._icu_total_hours: Dict[str, Decimal] = {}
        self._bed_reservations: Dict[str, Dict] = {}
        self._upgrade_free_start: Dict[str, datetime] = {}
        self._package_converted: Set[str] = set()
        self._charity_applied: Set[str] = set()
        self._last_timestamp: Optional[datetime] = None
        self._processed_event_ids: Set[str] = set()

        # Track last bed-day count date per admission to avoid duplicates
        self._bed_day_counted: Dict[str, Set[date]] = {}
        self._last_bed_day_check: Dict[str, datetime] = {}

        # Track which demands have had their deadline processed
        self._deadline_processed: Set[int] = set()

        # Track automatic interim bill days
        self._auto_interim_days: Dict[str, Set[int]] = {}

        # Occupancy snapshots at specific timestamps
        self._occupancy_snapshot_times: Set[datetime] = set()
        self._occupancy_snapshots: Dict[datetime, Dict[str, Bed]] = {}

    # =========================================================================
    # PARSING
    # =========================================================================

    def parse_command(self, raw_line: str, line_number: int) -> ParsedCommand:
        """Parse a single command line."""
        stripped = raw_line.strip()
        parts = stripped.split("|")

        if len(parts) < 2:
            return ParsedCommand(
                command_type=CommandType.UNKNOWN,
                timestamp=datetime.min,
                args=[],
                raw_line=raw_line,
                line_number=line_number,
            )

        command_type_str = parts[0].strip()
        timestamp_str = parts[1].strip()
        args = [p.strip() for p in parts[2:]]

        try:
            command_type = CommandType(command_type_str)
        except ValueError:
            command_type = CommandType.UNKNOWN

        try:
            timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            timestamp = datetime.min

        return ParsedCommand(
            command_type=command_type,
            timestamp=timestamp,
            args=args,
            raw_line=raw_line,
            line_number=line_number,
        )

    # =========================================================================
    # INTERNAL TIMED EVENTS
    # =========================================================================

    def process_timed_events(self, current_time: datetime):
        """Process internal timed events before a command at current_time.
        Order: 48-hour demand deadline, reservation release, 7-day interim bill.
        (Bed-day counting moved to finalize() for correct discharge handling.)"""
        self._process_48h_demand_deadline(current_time)
        self._process_reservation_releases(current_time)
        self._process_7day_interim_bills(current_time)
        self._capture_occupancy_snapshot(current_time)

    def _capture_occupancy_snapshot(self, current_time: datetime):
        """Capture bed occupancy snapshot at specified timestamps."""
        if current_time in self._occupancy_snapshot_times:
            # Deep copy bed states
            snapshot = {}
            for bed_id, bed in self.loader.beds.items():
                snapshot[bed_id] = Bed(
                    bed_id=bed.bed_id,
                    ward_id=bed.ward_id,
                    ward_name=bed.ward_name,
                    category=bed.category,
                    gender_restriction=bed.gender_restriction,
                    daily_bed_charge=bed.daily_bed_charge,
                    nursing_charge=bed.nursing_charge,
                    floor=bed.floor,
                    status=bed.status,
                    adm_id=bed.adm_id,
                    since_ts=bed.since_ts,
                    billing_category=bed.billing_category,
                    hold_until=bed.hold_until,
                )
            self._occupancy_snapshots[current_time] = snapshot

    def _process_48h_demand_deadline(self, current_time: datetime):
        """Check if any open demand has reached the 48-hour deadline.
        
        At the deadline: if bill > 80% of deposits, raise second demand (TD2)
        and activate PROCEDURE_BLOCK. If bill <= 80%, demand becomes LAPSED.
        """
        for demand in self.demand_service.demands:
            if demand.status != "OPEN":
                continue
            if demand.seq != 1:
                continue  # Only first demand can trigger 48-hour deadline
            if id(demand) in self._deadline_processed:
                continue  # Already processed this deadline

            block_threshold = demand.demand_ts + timedelta(hours=48)
            if current_time < block_threshold:
                continue

            self._deadline_processed.add(id(demand))

            admission = self.loader.admissions.get(demand.admission_id)
            if admission is None:
                continue

            total_deposits = admission.deposits
            running_bill = admission.running_bill
            threshold_80pct = total_deposits * Decimal("80.00") / Decimal("100.00")

            if running_bill > threshold_80pct:
                # Raise second demand and activate block
                # Calculate demand amount using BR-07a
                avg_daily_charge, days_with_charges = self.demand_service.calculate_average_daily_charge(
                    demand.admission_id, block_threshold
                )
                demand_amount = self.demand_service.calculate_demand_amount(
                    demand.admission_id, block_threshold
                )
                
                existing_count = len([d for d in self.demand_service.demands if d.admission_id == demand.admission_id])
                td2 = Demand(
                    demand_id="{}-TD{}".format(demand.admission_id, existing_count + 1),
                    admission_id=demand.admission_id,
                    seq=existing_count + 1,
                    demand_ts=block_threshold,
                    trigger_line_no=None,
                    running_bill=running_bill,
                    deposits_at_demand=total_deposits,
                    threshold_80pct=threshold_80pct,
                    charges_last_3_days=avg_daily_charge * Decimal(str(days_with_charges)) if days_with_charges > 0 else Decimal("0.00"),
                    days_with_charges=days_with_charges,
                    avg_daily_charge=round2(avg_daily_charge),
                    demand_amount=demand_amount,
                    deposits_since_demand=Decimal("0.00"),
                    outstanding=demand_amount,
                    status="OPEN",
                    status_ts=block_threshold,
                    procedure_block_from=block_threshold,
                    procedure_block_to=None,
                )
                self.demand_service.demands.append(td2)
                self.demand_service.procedure_block_active = True
                self.demand_service.block_start_time = block_threshold
            else:
                # Bill no longer above 80%, demand lapses
                demand.status = "LAPSED"
                demand.status_ts = current_time

    def _process_reservation_releases(self, current_time: datetime):
        """Release expired reservations."""
        expired = []
        for bed_id, res in self._bed_reservations.items():
            if res["expires_at"] <= current_time:
                expired.append(bed_id)

        for bed_id in expired:
            res = self._bed_reservations.pop(bed_id)
            bed = self.loader.beds.get(bed_id)
            if bed and bed.status == "RESERVED" and bed.adm_id == res["admission_id"]:
                bed.status = "AVAILABLE"
                bed.adm_id = None
                bed.since_ts = None
                bed.billing_category = None
                bed.hold_until = None

    def _process_bed_day_counts(self, current_time: datetime):
        """Post bed-day counting lines for all days up to current_time."""
        for adm_id, admission in self.loader.admissions.items():
            if admission.status not in ("ADMITTED", "DISCHARGED"):
                continue
            if admission.admit_ts is None:
                continue

            admit_time = admission.admit_ts
            discharge_time = admission.discharge_time

            start_date = admit_time.date()
            end_date = discharge_time.date() if discharge_time else current_time.date()

            counted_dates = self._bed_day_counted.setdefault(adm_id, set())

            current_date = start_date
            while current_date <= end_date:
                if current_date in counted_dates:
                    current_date += timedelta(days=1)
                    continue

                noon_anchor = datetime.combine(current_date, datetime.min.time().replace(hour=self.NOON_HOUR))
                icu_anchor = datetime.combine(current_date, datetime.min.time().replace(hour=self.ICU_HOUR))

                anchor_passed = noon_anchor <= current_time or icu_anchor <= current_time

                if not anchor_passed:
                    current_date += timedelta(days=1)
                    continue

                occupying_noon = self._is_occupying_at(adm_id, noon_anchor)
                occupying_icu = self._is_occupying_at(adm_id, icu_anchor)

                if not occupying_noon and not occupying_icu:
                    current_date += timedelta(days=1)
                    continue

                if occupying_icu:
                    check_time = icu_anchor
                    category_at_anchor = Category.ICU
                else:
                    check_time = noon_anchor
                    category_at_anchor = self._get_category_at_time(adm_id, noon_anchor)

                self._post_bed_day_lines(adm_id, current_date, check_time, category_at_anchor)
                counted_dates.add(current_date)

                current_date += timedelta(days=1)

    def _process_admission_bed_days(self, adm_id: str, current_time: datetime):
        """Post bed-day counting lines for a specific admission up to current_time.
        
        Called from process_command to interleave bed-day lines with charge events
        by timestamp. Only counts days whose noon/ICU anchor has passed relative to
        the last time bed days were checked for this admission.
        """
        admission = self.loader.admissions.get(adm_id)
        if admission is None:
            return
        if admission.status not in ("ADMITTED", "DISCHARGED"):
            return
        if admission.admit_ts is None:
            return

        # Start from last check time or admission date
        last_check = self._last_bed_day_check.get(adm_id)
        if last_check is None:
            start_date = admission.admit_ts.date()
        else:
            start_date = last_check.date()

        discharge_time = admission.discharge_time
        end_date = discharge_time.date() if discharge_time else current_time.date()

        # Don't go past current_time date
        if current_time.date() < end_date:
            end_date = current_time.date()

        counted_dates = self._bed_day_counted.setdefault(adm_id, set())

        current_date = start_date
        while current_date <= end_date:
            if current_date in counted_dates:
                current_date += timedelta(days=1)
                continue

            noon_anchor = datetime.combine(current_date, datetime.min.time().replace(hour=self.NOON_HOUR))
            icu_anchor = datetime.combine(current_date, datetime.min.time().replace(hour=self.ICU_HOUR))

            # Anchor must have passed relative to current_time
            anchor_passed = noon_anchor <= current_time or icu_anchor <= current_time

            if not anchor_passed:
                current_date += timedelta(days=1)
                continue

            occupying_noon = self._is_occupying_at(adm_id, noon_anchor)
            occupying_icu = self._is_occupying_at(adm_id, icu_anchor)

            if not occupying_noon and not occupying_icu:
                current_date += timedelta(days=1)
                continue

            if occupying_icu:
                check_time = icu_anchor
                category_at_anchor = Category.ICU
            else:
                check_time = noon_anchor
                category_at_anchor = self._get_category_at_time(adm_id, noon_anchor)

            self._post_bed_day_lines(adm_id, current_date, check_time, category_at_anchor)
            counted_dates.add(current_date)

            current_date += timedelta(days=1)

        # Update last check time
        self._last_bed_day_check[adm_id] = current_time

    def _process_7day_interim_bills(self, current_time: datetime):
        """Create automatic interim bills at admit + 7 days, + 14 days, etc."""
        for adm_id, admission in self.loader.admissions.items():
            if admission.status not in ("ADMITTED", "DISCHARGED"):
                continue
            if admission.admit_ts is None:
                continue

            admit_time = admission.admit_ts
            auto_days = self._auto_interim_days.setdefault(adm_id, set())

            day_offset = 7
            while True:
                interim_time = admit_time + timedelta(days=day_offset)
                if interim_time > current_time:
                    break

                if day_offset in auto_days:
                    day_offset += 7
                    continue

                discharge_time = admission.discharge_time
                if discharge_time and interim_time >= discharge_time:
                    day_offset += 7
                    continue

                self._create_interim_bill(adm_id, interim_time, "AUTO_7D")
                auto_days.add(day_offset)
                day_offset += 7

    # =========================================================================
    # BED-DAY COUNTING
    # =========================================================================

    def _is_occupying_at(self, adm_id: str, timestamp: datetime) -> bool:
        """Check if a patient occupies a bed at a given timestamp."""
        admission = self.loader.admissions.get(adm_id)
        if admission is None:
            return False

        admit_time = admission.admit_ts
        discharge_time = admission.discharge_time

        if timestamp < admit_time:
            return False
        if discharge_time and timestamp >= discharge_time:
            return False
        return True

    def _get_category_at_time(self, adm_id: str, timestamp: datetime) -> Category:
        """Get the category of the bed occupied by a patient at a given time."""
        admission = self.loader.admissions.get(adm_id)
        if admission is None:
            return Category.GENERAL

        allocated_category = admission.allocated_category or admission.requested_category
        return allocated_category

    def _post_bed_day_lines(self, adm_id: str, count_date: date,
                            counting_time: datetime, category: Category):
        """Post BED and NURSING ledger lines for a bed day."""
        admission = self.loader.admissions.get(adm_id)
        if admission is None:
            return

        # Check UPGRADE_FREE window
        upgrade_free = False
        if adm_id in self._upgrade_free_start:
            window_end = self._upgrade_free_start[adm_id] + timedelta(hours=48)
            if counting_time <= window_end:
                upgrade_free = True

        # Determine rate category
        rate_category = admission.requested_category if upgrade_free else category

        # Calculate charges
        bed_rate = rate_category.daily_charge
        nursing_rate = rate_category.nursing_charge

        # Apply senior discount (BR-08)
        bed_gross, bed_discount_pct, bed_discount_amt = self._apply_senior_discount(
            admission, bed_rate, "BED"
        )
        nursing_gross, nursing_discount_pct, nursing_discount_amt = self._apply_senior_discount(
            admission, nursing_rate, "NURSING"
        )

        # Calculate GST on BED line (BR-11)
        bed_gst_amt = Decimal("0.00")
        bed_taxable = bed_gross - bed_discount_amt
        if bed_taxable > self.GST_THRESHOLD:
            bed_gst_amt = round2(bed_taxable * self.GST_RATE / Decimal("100"))

        # Nursing has no GST
        nursing_gst_amt = Decimal("0.00")

        # Net amounts
        bed_net = round2(bed_gross - bed_discount_amt + bed_gst_amt)
        nursing_net = round2(nursing_gross - nursing_discount_amt + nursing_gst_amt)

        # Post BED line
        self._add_ledger_entry(
            admission_id=adm_id,
            timestamp=counting_time,
            counting_ts=counting_time,
            head="BED",
            item_code=f"BED-{rate_category.value}",
            description=f"bed day {self._bed_day_number(adm_id, count_date)} noon",
            category_at_event=rate_category,
            qty=1,
            base_amount=bed_rate,
            multiplier=Decimal("1.00"),
            gross=bed_gross,
            discount_pct=bed_discount_pct,
            discount_amt=bed_discount_amt,
            gst_amt=bed_gst_amt,
            net=bed_net,
        )

        # Post NURSING line
        self._add_ledger_entry(
            admission_id=adm_id,
            timestamp=counting_time,
            counting_ts=counting_time,
            head="NURSING",
            item_code=f"NUR-{rate_category.value}",
            description=f"nursing day {self._bed_day_number(adm_id, count_date)}",
            category_at_event=rate_category,
            qty=1,
            base_amount=nursing_rate,
            multiplier=Decimal("1.00"),
            gross=nursing_gross,
            discount_pct=nursing_discount_pct,
            discount_amt=nursing_discount_amt,
            gst_amt=nursing_gst_amt,
            net=nursing_net,
        )

        # ICU rounds for ICU days
        if category == Category.ICU:
            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=counting_time,
                counting_ts=counting_time,
                head="DOCTOR",
                item_code="ICU-ROUNDS",
                description=f"ICU round day {self._bed_day_number(adm_id, count_date)}",
                category_at_event=category,
                qty=1,
                base_amount=self.ICU_ROUND_FEE,
                multiplier=Decimal("1.00"),
                gross=self.ICU_ROUND_FEE,
                discount_pct=Decimal("0.00"),
                discount_amt=Decimal("0.00"),
                gst_amt=Decimal("0.00"),
                net=self.ICU_ROUND_FEE,
            )

    def _bed_day_number(self, adm_id: str, count_date: date) -> int:
        """Get the bed day number for an admission on a given date."""
        admission = self.loader.admissions.get(adm_id)
        if admission is None or admission.admit_ts is None:
            return 1
        return (count_date - admission.admit_ts.date()).days + 1

    # =========================================================================
    # LEDGER ENTRY
    # =========================================================================

    def _add_ledger_entry(self, admission_id: str, timestamp: datetime,
                          counting_ts: Optional[datetime], head: str,
                          item_code: str, description: str, category_at_event: Category,
                          qty: int, base_amount: Decimal, multiplier: Decimal,
                          gross: Decimal, discount_pct: Decimal, discount_amt: Decimal,
                          gst_amt: Decimal, net: Decimal,
                          event_id: Optional[str] = None,
                          skip_demand_check: bool = False) -> int:
        """Add a ledger entry and return the line number."""
        # Per-admission line numbering (starts at 1 for each admission)
        self._admission_line_counters[admission_id] = self._admission_line_counters.get(admission_id, 0) + 1
        line_no = self._admission_line_counters[admission_id]

        # Round all monetary values
        base_amount = round2(base_amount)
        gross = round2(gross)
        discount_amt = round2(discount_amt)
        gst_amt = round2(gst_amt)
        net = round2(net)

        entry = LedgerEntry(
            line_no=line_no,
            admission_id=admission_id,
            event_ts=timestamp,
            counting_ts=counting_ts,
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
            event_id=event_id,
        )
        self._ledger_entries.append(entry)

        # Update running bill
        admission = self.loader.admissions.get(admission_id)
        if admission:
            admission.running_bill = round2(admission.running_bill + net)

        # Record charge event for demand calculation
        self.demand_service.record_charge_event(
            admission_id, net, timestamp, head
        )

        # Check BR-07b demand trigger (after every posted line except DISCHARGE lines)
        if not skip_demand_check:
            self._check_demand_trigger(admission_id, timestamp, self._line_counter)

        return self._line_counter

    def _check_demand_trigger(self, adm_id: str, timestamp: datetime, trigger_line_no: int):
        """Check if a demand should be created (BR-07b)."""
        admission = self.loader.admissions.get(adm_id)
        if admission is None:
            return

        total_deposits = admission.deposits
        running_bill = admission.running_bill

        if total_deposits == Decimal("0.00"):
            return

        threshold_80pct = total_deposits * Decimal("80.00") / Decimal("100.00")

        if running_bill <= threshold_80pct:
            return

        for demand in self.demand_service.demands:
            if demand.admission_id == adm_id and demand.status == "OPEN":
                return

        avg_daily_charge, days_with_charges = self.demand_service.calculate_average_daily_charge(
            adm_id, timestamp
        )
        demand_amount = self.demand_service.calculate_demand_amount(adm_id, timestamp)

        existing_count = len([d for d in self.demand_service.demands if d.admission_id == adm_id])
        demand = Demand(
            demand_id=f"{adm_id}-TD{existing_count + 1}",
            admission_id=adm_id,
            seq=existing_count + 1,
            demand_ts=timestamp,
            trigger_line_no=trigger_line_no,
            running_bill=running_bill,
            deposits_at_demand=total_deposits,
            threshold_80pct=threshold_80pct,
            charges_last_3_days=avg_daily_charge * Decimal(str(days_with_charges)) if days_with_charges > 0 else Decimal("0.00"),
            days_with_charges=days_with_charges,
            avg_daily_charge=round2(avg_daily_charge),
            demand_amount=demand_amount,
            deposits_since_demand=Decimal("0.00"),
            outstanding=demand_amount,
            status="OPEN",
            status_ts=timestamp,
            procedure_block_from=None,
            procedure_block_to=None,
        )
        self.demand_service.demands.append(demand)

    # =========================================================================
    # DISCOUNTS
    # =========================================================================

    def _apply_senior_discount(self, admission: Admission, amount: Decimal,
                                charge_head: str) -> Tuple[Decimal, Decimal, Decimal]:
        """Apply senior citizen discount (BR-08): 10% on BED and NURSING."""
        discount_pct = Decimal("0.00")
        discount_amt = Decimal("0.00")
        discounted = amount

        if admission.senior and charge_head in ("BED", "NURSING"):
            discounted, disc_amt = self.discount_service.apply_senior_discount(
                amount, 60, charge_head
            )
            discount_amt = disc_amt
            discount_pct = Decimal("10.00")

        return discounted, discount_pct, discount_amt

    def _apply_employee_discount(self, admission: Admission, amount: Decimal,
                                  charge_head: str) -> Tuple[Decimal, Decimal, Decimal]:
        """Apply employee referral discount (BR-08): 15% on DOCTOR fees."""
        discount_pct = Decimal("0.00")
        discount_amt = Decimal("0.00")
        discounted = amount

        if admission.employee_referral and charge_head == "DOCTOR":
            discounted, disc_amt = self.discount_service.apply_employee_referral_discount(
                amount, True, charge_head
            )
            discount_amt = disc_amt
            discount_pct = Decimal("15.00")

        return discounted, discount_pct, discount_amt

    # =========================================================================
    # COMMAND HANDLERS
    # =========================================================================

    def process_command(self, parsed_command: ParsedCommand) -> CommandResult:
        """Process a single parsed command."""
        if self._last_timestamp is not None and parsed_command.timestamp < self._last_timestamp:
            return self._reject(parsed_command, "OUT_OF_ORDER",
                                f"Command timestamp {parsed_command.timestamp} is earlier than previous command")

        self._last_timestamp = parsed_command.timestamp

        # Process bed days for this admission up to current command time
        adm_id = parsed_command.admission_id
        if adm_id and adm_id in self.loader.admissions:
            self._process_admission_bed_days(adm_id, parsed_command.timestamp)

        self.process_timed_events(parsed_command.timestamp)

        handler = self._get_handler(parsed_command.command_type)
        if handler is None:
            return self._reject(parsed_command, "UNKNOWN_COMMAND",
                                f"Unknown command: {parsed_command.command_type}")

        result = handler(parsed_command)
        self._command_results.append(result)
        return result

    def _get_handler(self, command_type: CommandType):
        """Get the handler for a command type."""
        handlers = {
            CommandType.ADMIT: self._handle_admit,
            CommandType.RESERVE_BED: self._handle_reserve_bed,
            CommandType.TRANSFER: self._handle_transfer,
            CommandType.STEP_DOWN: self._handle_step_down,
            CommandType.VISIT: self._handle_visit,
            CommandType.PROCEDURE: self._handle_procedure,
            CommandType.OT: self._handle_ot,
            CommandType.PHARMACY: self._handle_pharmacy,
            CommandType.CONSUMABLE: self._handle_consumable,
            CommandType.INVESTIGATION: self._handle_investigation,
            CommandType.DEPOSIT: self._handle_deposit,
            CommandType.INTERIM_BILL: self._handle_interim_bill,
            CommandType.CORRECTION: self._handle_correction,
            CommandType.CHARITY: self._handle_charity,
            CommandType.DISCHARGE: self._handle_discharge,
            CommandType.HOUSEKEEPING_CLEARED: self._handle_housekeeping_cleared,
        }
        return handlers.get(command_type)

    def _reject(self, parsed_command: ParsedCommand, error_code: str,
                error_detail: str) -> CommandResult:
        """Create a rejection result and record it."""
        adm_id = parsed_command.admission_id
        rejection = Rejection(
            line_no=parsed_command.line_number,
            command_ts=parsed_command.timestamp,
            command=parsed_command.raw_line,
            adm_id=adm_id,
            code=error_code,
            detail=error_detail,
        )
        self._rejections.append(rejection)

        return CommandResult(
            command_type=parsed_command.command_type,
            admission_id=adm_id,
            success=False,
            error_code=error_code,
            error_detail=error_detail,
        )

    # =========================================================================
    # ADMIT
    # =========================================================================

    def _handle_admit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle ADMIT command."""
        try:
            if len(parsed_command.args) < 3:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "ADMIT requires admission ID, deposit, and payment mode")

            adm_id = parsed_command.args[0]
            deposit_str = parsed_command.args[1]
            payment_mode = parsed_command.args[2] if len(parsed_command.args) > 2 else "CASH"

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status == "ADMITTED":
                return self._reject(parsed_command, "ALREADY_ADMITTED",
                                    f"Admission {adm_id} already admitted")

            requested_category = admission.requested_category
            if admission.package_code:
                package = self.loader.packages.get(admission.package_code)
                if package:
                    required_deposit = round2(package.package_price * Decimal("25.00") / Decimal("100.00"))
                else:
                    required_deposit = round2(requested_category.daily_charge * 2 + self.DEPOSIT_FIXED)
            else:
                required_deposit = round2(requested_category.daily_charge * 2 + self.DEPOSIT_FIXED)

            try:
                deposit_amount = Decimal(deposit_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_AMOUNT",
                                    f"Invalid deposit amount: {deposit_str}")

            if deposit_amount < required_deposit:
                return self._reject(parsed_command, "DEPOSIT_SHORT",
                                    f"Deposit {deposit_amount} is less than required {required_deposit}")

            self.demand_service.record_deposit(
                adm_id, deposit_amount, parsed_command.timestamp, payment_mode
            )
            admission.deposits = deposit_amount
            admission.deposit_timestamp = parsed_command.timestamp

            bed_id = self._allocate_bed(adm_id, requested_category, admission.gender)
            if bed_id is None:
                return self._reject(parsed_command, "NO_BED",
                                    f"No available bed in category {requested_category}")

            bed = self.loader.beds[bed_id]
            bed.status = "OCCUPIED"
            bed.adm_id = adm_id
            bed.since_ts = parsed_command.timestamp
            bed.billing_category = requested_category

            admission.status = "ADMITTED"
            admission.admit_ts = parsed_command.timestamp
            admission.allocated_category = bed.category
            admission.allocated_bed_id = bed_id
            admission.running_bill = Decimal("0.00")

            if admission.date_of_birth:
                adm_date = parsed_command.timestamp.date()
                dob = admission.date_of_birth.date()
                age = adm_date.year - dob.year - ((adm_date.month, adm_date.day) < (dob.month, dob.day))
                admission.senior = age >= 60

            if bed.category != requested_category:
                self._upgrade_free_start[adm_id] = parsed_command.timestamp

            if requested_category == Category.ICU:
                self._icu_entry_times[adm_id] = parsed_command.timestamp
                self._icu_total_hours[adm_id] = Decimal("0.00")

            self._bed_day_counted[adm_id] = set()

            return CommandResult(
                command_type=CommandType.ADMIT,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    def _allocate_bed(self, adm_id: str, category: Category, gender: Gender) -> Optional[str]:
        """Allocate a bed for the given category, gender, and admission."""
        available_beds = []
        for bed_id, bed in self.loader.beds.items():
            if bed.category == category and bed.is_available():
                if category == Category.GENERAL:
                    if bed.gender_restriction == gender or bed.gender_restriction == Gender.ANY:
                        available_beds.append((bed_id, bed))
                else:
                    available_beds.append((bed_id, bed))

        if not available_beds:
            upgrade_order = [Category.GENERAL, Category.SEMI_PRIVATE, Category.PRIVATE, Category.DELUXE]
            current_rank = category.upgrade_rank
            for higher_cat in upgrade_order:
                if higher_cat.upgrade_rank > current_rank:
                    for bed_id, bed in self.loader.beds.items():
                        if bed.category == higher_cat and bed.is_available():
                            if higher_cat == Category.GENERAL:
                                if bed.gender_restriction == gender or bed.gender_restriction == Gender.ANY:
                                    available_beds.append((bed_id, bed))
                            else:
                                available_beds.append((bed_id, bed))
                    if available_beds:
                        break

        if not available_beds:
            return None

        available_beds.sort(key=lambda x: x[0])
        return available_beds[0][0]

    # =========================================================================
    # RESERVE_BED
    # =========================================================================

    def _handle_reserve_bed(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle RESERVE_BED command."""
        try:
            if len(parsed_command.args) < 2:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "RESERVE_BED requires admission ID and planned admission time")

            adm_id = parsed_command.args[0]
            planned_admit_str = parsed_command.args[1]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            # Auto-allocate lowest available bed of requested category
            bed_id = self._allocate_bed(adm_id, admission.requested_category, admission.gender)
            if bed_id is None:
                return self._reject(parsed_command, "NO_BED",
                                    f"No available bed in category {admission.requested_category}")

            if planned_admit_str:
                try:
                    planned_ts = datetime.strptime(planned_admit_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    planned_ts = parsed_command.timestamp
            else:
                planned_ts = parsed_command.timestamp

            bed = self.loader.beds[bed_id]
            bed.status = "RESERVED"
            bed.adm_id = adm_id
            bed.hold_until = planned_ts + timedelta(hours=6)

            self._bed_reservations[bed_id] = {
                "admission_id": adm_id,
                "bed_id": bed_id,
                "reserved_at": parsed_command.timestamp,
                "planned_admit_ts": planned_ts,
                "expires_at": planned_ts + timedelta(hours=6),
            }

            return CommandResult(
                command_type=CommandType.RESERVE_BED,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # TRANSFER
    # =========================================================================

    def _handle_transfer(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle TRANSFER command."""
        try:
            if len(parsed_command.args) < 3:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "TRANSFER requires admission ID, target category, and doctor ID")

            adm_id = parsed_command.args[0]
            target_category_str = parsed_command.args[1]
            doctor_id = parsed_command.args[2]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            try:
                target_category = Category(target_category_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_CATEGORY",
                                    f"Invalid category: {target_category_str}")

            current_category = admission.allocated_category or admission.requested_category

            if target_category == current_category:
                return self._reject(parsed_command, "SAME_CATEGORY",
                                    "Transfer to same category is not allowed")

            transfer_count = self._admission_transfer_counts.get(adm_id, 0)
            if transfer_count >= self.MAX_TRANSFERS:
                return self._reject(parsed_command, "TRANSFER_LIMIT",
                                    f"Maximum {self.MAX_TRANSFERS} transfers allowed")

            if target_category == Category.ICU:
                pass
            elif current_category == Category.ICU:
                return self._reject(parsed_command, "STEP_DOWN_REQUIRED",
                                    "ICU discharge requires STEP_DOWN command")

            new_bed_id = None
            for bid, bed in self.loader.beds.items():
                if bed.category == target_category and bed.is_available():
                    new_bed_id = bid
                    break

            if not new_bed_id:
                return self._reject(parsed_command, "NO_BED",
                                    f"No available bed in category {target_category}")

            if admission.allocated_bed_id and admission.allocated_bed_id in self.loader.beds:
                old_bed = self.loader.beds[admission.allocated_bed_id]
                old_bed.status = "AVAILABLE"
                old_bed.adm_id = None
                old_bed.since_ts = None
                old_bed.billing_category = None

            new_bed = self.loader.beds[new_bed_id]
            new_bed.status = "OCCUPIED"
            new_bed.adm_id = adm_id
            new_bed.since_ts = parsed_command.timestamp
            new_bed.billing_category = target_category

            self.transfer_service.record_transfer(
                adm_id, parsed_command.timestamp, target_category, new_bed_id,
                doctor_id, step_down_required=False
            )

            admission.allocated_category = target_category
            admission.allocated_bed_id = new_bed_id

            self._admission_transfer_counts[adm_id] = transfer_count + 1

            if target_category == Category.ICU:
                self._icu_entry_times[adm_id] = parsed_command.timestamp
                self._icu_total_hours[adm_id] = Decimal("0.00")
            elif current_category == Category.ICU:
                if adm_id in self._icu_entry_times:
                    entry_time = self._icu_entry_times[adm_id]
                    icu_hours = Decimal(str((parsed_command.timestamp - entry_time).total_seconds() / 3600))
                    self._icu_total_hours[adm_id] = self._icu_total_hours.get(adm_id, Decimal("0")) + icu_hours
                    del self._icu_entry_times[adm_id]

            if adm_id in self._upgrade_free_start:
                del self._upgrade_free_start[adm_id]

            return CommandResult(
                command_type=CommandType.TRANSFER,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # STEP_DOWN
    # =========================================================================

    def _handle_step_down(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle STEP_DOWN command."""
        try:
            if len(parsed_command.args) < 3:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "STEP_DOWN requires admission ID, target category, and doctor ID")

            adm_id = parsed_command.args[0]
            target_category_str = parsed_command.args[1]
            doctor_id = parsed_command.args[2]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            try:
                target_category = Category(target_category_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_CATEGORY",
                                    f"Invalid category: {target_category_str}")

            if admission.allocated_category != Category.ICU:
                return self._reject(parsed_command, "NOT_IN_ICU",
                                    f"Admission {adm_id} is not in ICU")

            if admission.allocated_bed_id and admission.allocated_bed_id in self.loader.beds:
                old_bed = self.loader.beds[admission.allocated_bed_id]
                old_bed.status = "AVAILABLE"
                old_bed.adm_id = None
                old_bed.since_ts = None
                old_bed.billing_category = None

            if adm_id in self._icu_entry_times:
                entry_time = self._icu_entry_times[adm_id]
                icu_hours = Decimal(str((parsed_command.timestamp - entry_time).total_seconds() / 3600))
                self._icu_total_hours[adm_id] = self._icu_total_hours.get(adm_id, Decimal("0")) + icu_hours
                del self._icu_entry_times[adm_id]

            new_bed_id = None
            for bid, bed in self.loader.beds.items():
                if bed.category == target_category and bed.is_available():
                    new_bed_id = bid
                    break

            if not new_bed_id:
                return self._reject(parsed_command, "NO_BED",
                                    f"No available bed in category {target_category}")

            new_bed = self.loader.beds[new_bed_id]
            new_bed.status = "OCCUPIED"
            new_bed.adm_id = adm_id
            new_bed.since_ts = parsed_command.timestamp
            new_bed.billing_category = target_category

            self.transfer_service.record_step_down(
                adm_id, parsed_command.timestamp, target_category, doctor_id
            )

            admission.allocated_category = target_category
            admission.allocated_bed_id = new_bed_id

            if adm_id in self._upgrade_free_start:
                del self._upgrade_free_start[adm_id]

            return CommandResult(
                command_type=CommandType.STEP_DOWN,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # VISIT
    # =========================================================================

    def _handle_visit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle VISIT command."""
        try:
            if len(parsed_command.args) < 3:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "VISIT requires admission ID, event ID, and doctor ID")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            doctor_id = parsed_command.args[2]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            if doctor_id not in self.loader.doctors:
                return self._reject(parsed_command, "UNKNOWN_DOCTOR",
                                    f"Doctor {doctor_id} not found")

            if event_id in self._processed_event_ids:
                return self._reject(parsed_command, "DUPLICATE_EVENT",
                                    f"Event {event_id} already processed")

            doctor = self.loader.doctors[doctor_id]
            current_category = admission.allocated_category or admission.requested_category

            visit_date = parsed_command.timestamp.date()
            visit_key = (adm_id, doctor_id, str(visit_date))

            visit_count = self._visits_per_doctor_day.get(visit_key, 0)

            if current_category == Category.GENERAL:
                doctors_today = set()
                for (aid, did, vdate), count in self._visits_per_doctor_day.items():
                    if aid == adm_id and vdate == str(visit_date) and count > 0:
                        doctors_today.add(did)
                if doctor_id not in doctors_today and len(doctors_today) >= 2:
                    base_amount = Decimal("0.00")
                    gross = Decimal("0.00")
                    self._visits_per_doctor_day[visit_key] = visit_count + 1
                    self._processed_event_ids.add(event_id)
                    self._add_ledger_entry(
                        admission_id=adm_id,
                        timestamp=parsed_command.timestamp,
                        counting_ts=None,
                        head="DOCTOR",
                        item_code=doctor_id,
                        description=f"Doctor visit by {doctor.name} (3rd+ doctor, GENERAL limit)",
                        category_at_event=current_category,
                        qty=1,
                        base_amount=Decimal("0.00"),
                        multiplier=Decimal("1.00"),
                        gross=Decimal("0.00"),
                        discount_pct=Decimal("0.00"),
                        discount_amt=Decimal("0.00"),
                        gst_amt=Decimal("0.00"),
                        net=Decimal("0.00"),
                        event_id=event_id,
                    )
                    return CommandResult(
                        command_type=CommandType.VISIT,
                        admission_id=adm_id,
                        success=True,
                        event_id=event_id,
                    )

            if visit_count == 0:
                base_amount = doctor.visit_fee
            else:
                base_amount = Decimal("0.00")

            if current_category == Category.ICU and doctor.is_intensivist:
                base_amount = Decimal("0.00")
                gross = Decimal("0.00")
                multiplier = Decimal("1.00")
            else:
                multiplier = current_category.visit_multiplier
                gross = round2(base_amount * multiplier)

            gross, discount_pct, discount_amt = self._apply_employee_discount(
                admission, gross, "DOCTOR"
            )

            gst_amt = Decimal("0.00")
            net = round2(gross - discount_amt + gst_amt)

            self._visits_per_doctor_day[visit_key] = visit_count + 1
            self._processed_event_ids.add(event_id)

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                counting_ts=None,
                head="DOCTOR",
                item_code=doctor_id,
                description=f"Doctor visit by {doctor.name}",
                category_at_event=current_category,
                qty=1,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=round2(base_amount * multiplier),
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                event_id=event_id,
            )

            return CommandResult(
                command_type=CommandType.VISIT,
                admission_id=adm_id,
                success=True,
                event_id=event_id,
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # PROCEDURE
    # =========================================================================

    def _handle_procedure(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle PROCEDURE command."""
        try:
            if len(parsed_command.args) < 5:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "PROCEDURE requires admission ID, event ID, item code, doctor ID, and emergency flag")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            item_code = parsed_command.args[2]
            doctor_id = parsed_command.args[3]
            emergency = parsed_command.args[4].lower() == "true"

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            if doctor_id not in self.loader.doctors:
                return self._reject(parsed_command, "UNKNOWN_DOCTOR",
                                    f"Doctor {doctor_id} not found")

            if item_code not in self.loader.tariffs:
                return self._reject(parsed_command, "UNKNOWN_ITEM",
                                    f"Item {item_code} not found in tariffs")

            if event_id in self._processed_event_ids:
                return self._reject(parsed_command, "DUPLICATE_EVENT",
                                    f"Event {event_id} already processed")

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            total_deposits = admission.deposits
            running_bill = admission.running_bill

            is_blocked, block_code = self._check_procedure_block(
                adm_id, running_bill, total_deposits, parsed_command.timestamp, is_emergency=emergency
            )

            if is_blocked:
                return self._reject(parsed_command, block_code,
                                    "Procedure blocked due to outstanding top-up demand")

            multiplier = current_category.procedure_multiplier
            base_amount = tariff.base_rate
            gross = round2(base_amount * multiplier)

            discount_pct = Decimal("0.00")
            discount_amt = Decimal("0.00")
            gst_amt = Decimal("0.00")
            net = gross

            if admission.package_code:
                package = self.loader.packages.get(admission.package_code)
                if package and item_code not in package.included_procedures:
                    icu_hours = self._icu_total_hours.get(adm_id, Decimal("0"))
                    should_convert, _, reason = self.package_service.check_package_conversion(
                        adm_id, admission.package_code, icu_hours, True, parsed_command.timestamp
                    )
                    if should_convert and adm_id not in self._package_converted:
                        self._convert_package(adm_id, admission.package_code, parsed_command.timestamp)

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                counting_ts=None,
                head="PROCEDURE",
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=1,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=gross,
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                event_id=event_id,
            )

            self._processed_event_ids.add(event_id)

            return CommandResult(
                command_type=CommandType.PROCEDURE,
                admission_id=adm_id,
                success=True,
                event_id=event_id,
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # OT
    # =========================================================================

    def _handle_ot(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle OT command."""
        try:
            if len(parsed_command.args) < 6:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "OT requires admission ID, event ID, OT code, hours, surgeon ID, and emergency flag")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            ot_code = parsed_command.args[2]
            hours_str = parsed_command.args[3]
            surgeon_id = parsed_command.args[4]
            emergency = parsed_command.args[5].lower() == "true"

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            if surgeon_id not in self.loader.doctors:
                return self._reject(parsed_command, "UNKNOWN_DOCTOR",
                                    f"Surgeon {surgeon_id} not found")

            if ot_code not in self.loader.tariffs:
                return self._reject(parsed_command, "UNKNOWN_ITEM",
                                    f"OT code {ot_code} not found in tariffs")

            if event_id in self._processed_event_ids:
                return self._reject(parsed_command, "DUPLICATE_EVENT",
                                    f"Event {event_id} already processed")

            try:
                hours = int(hours_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_QTY",
                                    f"Invalid OT hours: {hours_str}")

            tariff = self.loader.tariffs[ot_code]
            current_category = admission.allocated_category or admission.requested_category

            total_deposits = admission.deposits
            running_bill = admission.running_bill

            is_blocked, block_code = self._check_procedure_block(
                adm_id, running_bill, total_deposits, parsed_command.timestamp, is_emergency=emergency
            )

            if is_blocked:
                return self._reject(parsed_command, block_code,
                                    "OT blocked due to outstanding top-up demand")

            multiplier = current_category.ot_multiplier
            base_amount = tariff.base_rate
            gross = round2(base_amount * hours * multiplier)

            discount_pct = Decimal("0.00")
            discount_amt = Decimal("0.00")
            gst_amt = Decimal("0.00")
            net = gross

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                counting_ts=None,
                head="OT",
                item_code=ot_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=hours,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=gross,
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                event_id=event_id,
            )

            self._processed_event_ids.add(event_id)

            return CommandResult(
                command_type=CommandType.OT,
                admission_id=adm_id,
                success=True,
                event_id=event_id,
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # PHARMACY
    # =========================================================================

    def _handle_pharmacy(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle PHARMACY command."""
        try:
            if len(parsed_command.args) < 4:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "PHARMACY requires admission ID, event ID, item code, and quantity")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            item_code = parsed_command.args[2]
            qty_str = parsed_command.args[3]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            if item_code not in self.loader.tariffs:
                return self._reject(parsed_command, "UNKNOWN_ITEM",
                                    f"Item {item_code} not found in tariffs")

            if event_id in self._processed_event_ids:
                return self._reject(parsed_command, "DUPLICATE_EVENT",
                                    f"Event {event_id} already processed")

            try:
                qty = int(qty_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_QTY",
                                    f"Invalid quantity: {qty_str}")

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            multiplier = Decimal("1.00")
            base_amount = tariff.base_rate
            gross = round2(base_amount * qty * multiplier)

            discount_pct = Decimal("0.00")
            discount_amt = Decimal("0.00")
            gst_amt = Decimal("0.00")
            net = gross

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                counting_ts=None,
                head="PHARMACY",
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=qty,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=gross,
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                event_id=event_id,
            )

            self._processed_event_ids.add(event_id)

            return CommandResult(
                command_type=CommandType.PHARMACY,
                admission_id=adm_id,
                success=True,
                event_id=event_id,
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # CONSUMABLE
    # =========================================================================

    def _handle_consumable(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CONSUMABLE command."""
        try:
            if len(parsed_command.args) < 4:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "CONSUMABLE requires admission ID, event ID, item code, and quantity")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            item_code = parsed_command.args[2]
            qty_str = parsed_command.args[3]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            if item_code not in self.loader.tariffs:
                return self._reject(parsed_command, "UNKNOWN_ITEM",
                                    f"Item {item_code} not found in tariffs")

            if event_id in self._processed_event_ids:
                return self._reject(parsed_command, "DUPLICATE_EVENT",
                                    f"Event {event_id} already processed")

            try:
                qty = int(qty_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_QTY",
                                    f"Invalid quantity: {qty_str}")

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            multiplier = Decimal("1.00")
            base_amount = tariff.base_rate
            gross = round2(base_amount * qty * multiplier)

            discount_pct = Decimal("0.00")
            discount_amt = Decimal("0.00")
            gst_amt = Decimal("0.00")
            net = gross

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                counting_ts=None,
                head="CONSUMABLE",
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=qty,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=gross,
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                event_id=event_id,
            )

            self._processed_event_ids.add(event_id)

            return CommandResult(
                command_type=CommandType.CONSUMABLE,
                admission_id=adm_id,
                success=True,
                event_id=event_id,
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # INVESTIGATION
    # =========================================================================

    def _handle_investigation(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle INVESTIGATION command."""
        try:
            if len(parsed_command.args) < 4:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "INVESTIGATION requires admission ID, event ID, item code, and quantity")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            item_code = parsed_command.args[2]
            qty_str = parsed_command.args[3]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status != "ADMITTED":
                return self._reject(parsed_command, "NOT_ADMITTED",
                                    f"Admission {adm_id} is not admitted")

            if item_code not in self.loader.tariffs:
                return self._reject(parsed_command, "UNKNOWN_ITEM",
                                    f"Item {item_code} not found in tariffs")

            if event_id in self._processed_event_ids:
                return self._reject(parsed_command, "DUPLICATE_EVENT",
                                    f"Event {event_id} already processed")

            try:
                qty = int(qty_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_QTY",
                                    f"Invalid quantity: {qty_str}")

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            multiplier = current_category.investigation_multiplier
            base_amount = tariff.base_rate
            gross = round2(base_amount * qty * multiplier)

            discount_pct = Decimal("0.00")
            discount_amt = Decimal("0.00")
            gst_amt = Decimal("0.00")
            net = gross

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                counting_ts=None,
                head="INVESTIGATION",
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=qty,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=gross,
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                event_id=event_id,
            )

            self._processed_event_ids.add(event_id)

            return CommandResult(
                command_type=CommandType.INVESTIGATION,
                admission_id=adm_id,
                success=True,
                event_id=event_id,
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # DEPOSIT
    # =========================================================================

    def _handle_deposit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle DEPOSIT command."""
        try:
            if len(parsed_command.args) < 2:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "DEPOSIT requires admission ID and amount")

            adm_id = parsed_command.args[0]
            amount_str = parsed_command.args[1]
            payment_mode = parsed_command.args[2] if len(parsed_command.args) > 2 else "CASH"

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if amount_str.upper() == "FULL":
                if admission.discharge_time is None:
                    return self._reject(parsed_command, "NOTHING_DUE",
                                        "No balance due for settlement")
                balance = admission.balance_due
                if balance <= Decimal("0.00"):
                    return self._reject(parsed_command, "NOTHING_DUE",
                                        "No balance due for settlement")
                amount = balance
            else:
                try:
                    amount = Decimal(amount_str)
                except (ValueError, Exception):
                    return self._reject(parsed_command, "INVALID_AMOUNT",
                                        f"Invalid deposit amount: {amount_str}")

            self.demand_service.record_deposit(
                adm_id, amount, parsed_command.timestamp, payment_mode
            )
            admission.deposits = round2(admission.deposits + amount)

            for demand in self.demand_service.demands:
                if demand.admission_id == adm_id and demand.status == "OPEN":
                    deposits_since = sum(
                        d.amount for d in self.demand_service.deposits
                        if d.admission_id == adm_id and d.timestamp >= demand.demand_ts
                    )
                    demand.deposits_since_demand = round2(deposits_since)
                    demand.outstanding = round2(max(Decimal("0.00"), demand.demand_amount - deposits_since))

                    if demand.outstanding == Decimal("0.00"):
                        demand.status = "CLOSED"
                        demand.status_ts = parsed_command.timestamp

            self._check_block_lift(adm_id, parsed_command.timestamp)

            return CommandResult(
                command_type=CommandType.DEPOSIT,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # INTERIM_BILL
    # =========================================================================

    def _handle_interim_bill(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle INTERIM_BILL command."""
        try:
            adm_id = parsed_command.args[0]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            self._create_interim_bill(adm_id, parsed_command.timestamp, "MANUAL")

            return CommandResult(
                command_type=CommandType.INTERIM_BILL,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    def _create_interim_bill(self, adm_id: str, timestamp: datetime, trigger: str):
        """Create an interim bill and lock all unlocked entries for this admission."""
        # Only lock entries for this admission
        adm_entries = [e for e in self._ledger_entries if e.admission_id == adm_id]
        lines_locked = 0
        last_line_no = 0
        for entry in adm_entries:
            if entry.locked_by_interim is None:
                existing_count = len([i for i in self._interim_bills if i.admission_id == adm_id])
                entry.locked_by_interim = f"{adm_id}-IB{existing_count + 1}"
                lines_locked += 1
            last_line_no = max(last_line_no, entry.line_no)

        interim_id = f"{adm_id}-IB{len([i for i in self._interim_bills if i.admission_id == adm_id]) + 1}"

        locked_entries = [e for e in self._ledger_entries if e.locked_by_interim == interim_id]
        gross_total = round2(sum(e.gross for e in locked_entries))
        discount_total = round2(sum(e.discount_amt for e in locked_entries))
        gst_total = round2(sum(e.gst_amt for e in locked_entries))
        running_bill = round2(sum(e.net for e in locked_entries))

        admission = self.loader.admissions.get(adm_id)
        deposits_to_date = admission.deposits if admission else Decimal("0.00")
        balance = round2(running_bill - deposits_to_date)

        interim = InterimBill(
            interim_id=interim_id,
            admission_id=adm_id,
            interim_ts=timestamp,
            trigger=trigger,
            lines_locked=lines_locked,
            last_line_no=last_line_no,
            gross_total=gross_total,
            discount_total=discount_total,
            gst_total=gst_total,
            running_bill=running_bill,
            deposits_to_date=deposits_to_date,
            balance=balance,
        )
        self._interim_bills.append(interim)

    # =========================================================================
    # CORRECTION
    # =========================================================================

    def _handle_correction(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CORRECTION command."""
        try:
            if len(parsed_command.args) < 4:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "CORRECTION requires admission ID, event ID, new quantity, and reason")

            adm_id = parsed_command.args[0]
            event_id = parsed_command.args[1]
            new_qty_str = parsed_command.args[2]
            reason = parsed_command.args[3]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            try:
                new_qty = int(new_qty_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_QTY",
                                    f"Invalid quantity: {new_qty_str}")

            target_entry = None
            for entry in self._ledger_entries:
                if entry.event_id == event_id and entry.head in ("PHARMACY", "CONSUMABLE", "INVESTIGATION"):
                    target_entry = entry
                    break

            if target_entry is None:
                return self._reject(parsed_command, "UNKNOWN_EVENT",
                                    f"Event {event_id} not found in ledger")

            if target_entry.locked_by_interim is not None:
                qty_diff = new_qty - target_entry.qty
                if qty_diff == 0:
                    return self._reject(parsed_command, "NO_CHANGE",
                                        "No change in quantity")

                base_amount = target_entry.base_amount
                multiplier = target_entry.multiplier
                adj_gross = round2(base_amount * qty_diff * multiplier)
                adj_discount_pct = target_entry.discount_pct
                adj_discount_amt = round2(target_entry.discount_amt * Decimal(str(qty_diff)) / Decimal(str(target_entry.qty)))
                adj_gst_amt = round2(target_entry.gst_amt * Decimal(str(qty_diff)) / Decimal(str(target_entry.qty)))
                adj_net = round2(adj_gross - adj_discount_amt + adj_gst_amt)

                self._add_ledger_entry(
                    admission_id=adm_id,
                    timestamp=parsed_command.timestamp,
                    counting_ts=None,
                    head="ADJ",
                    item_code=target_entry.item_code,
                    description=f"Correction: {reason}",
                    category_at_event=target_entry.category_at_event,
                    qty=qty_diff,
                    base_amount=base_amount,
                    multiplier=multiplier,
                    gross=adj_gross,
                    discount_pct=adj_discount_pct,
                    discount_amt=adj_discount_amt,
                    gst_amt=adj_gst_amt,
                    net=adj_net,
                )
            else:
                old_net = target_entry.net
                target_entry.qty = new_qty
                target_entry.gross = round2(target_entry.base_amount * Decimal(str(new_qty)) * target_entry.multiplier)
                target_entry.discount_amt = round2(target_entry.gross * target_entry.discount_pct / Decimal("100"))
                target_entry.gst_amt = round2((target_entry.gross - target_entry.discount_amt) * Decimal("5.00") / Decimal("100"))
                target_entry.net = round2(target_entry.gross - target_entry.discount_amt + target_entry.gst_amt)

                admission.running_bill = round2(admission.running_bill - old_net + target_entry.net)

            return CommandResult(
                command_type=CommandType.CORRECTION,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # CHARITY
    # =========================================================================

    def _handle_charity(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CHARITY command."""
        try:
            if len(parsed_command.args) < 3:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "CHARITY requires admission ID, percentage, and CEO reference")

            adm_id = parsed_command.args[0]
            charity_pct_str = parsed_command.args[1]
            ceo_ref = parsed_command.args[2]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if adm_id in self._charity_applied:
                return self._reject(parsed_command, "CHARITY_ALREADY_APPLIED",
                                    "Charity discount already applied for this admission")

            try:
                charity_pct = Decimal(charity_pct_str)
            except ValueError:
                return self._reject(parsed_command, "INVALID_AMOUNT",
                                    f"Invalid charity percentage: {charity_pct_str}")

            is_valid_ref = bool(ceo_ref and ceo_ref.strip())

            if charity_pct <= Decimal("0") or charity_pct > Decimal("50"):
                return self._reject(parsed_command, "CHARITY_LIMIT",
                                    f"Charity percentage {charity_pct}% is outside 0-50 range")

            if not is_valid_ref:
                return self._reject(parsed_command, "CHARITY_NO_CEO_REF",
                                    "CEO reference missing")

            self._charity_applied.add(adm_id)
            admission.charity_pct = charity_pct
            admission.charity_ceo_ref = ceo_ref

            return CommandResult(
                command_type=CommandType.CHARITY,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # DISCHARGE
    # =========================================================================

    def _handle_discharge(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle DISCHARGE command."""
        try:
            if len(parsed_command.args) < 3:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "DISCHARGE requires admission ID, discharge type, and order issued timestamp")

            adm_id = parsed_command.args[0]
            discharge_type = parsed_command.args[1]
            order_issued_str = parsed_command.args[2]

            admission = self.loader.admissions.get(adm_id)
            if admission is None:
                return self._reject(parsed_command, "UNKNOWN_ADMISSION",
                                    f"Admission {adm_id} not found")

            if admission.status == "DISCHARGED":
                return self._reject(parsed_command, "ALREADY_ADMITTED",
                                    f"Admission {adm_id} already discharged")

            try:
                order_issued_ts = datetime.strptime(order_issued_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                order_issued_ts = parsed_command.timestamp

            self._post_discharge_bed_day(admission, parsed_command.timestamp)

            admission.status = "DISCHARGED"
            admission.discharge_type = discharge_type
            admission.discharge_time = parsed_command.timestamp
            admission.discharge_order_time = order_issued_ts

            planned = order_issued_ts.date() < parsed_command.timestamp.date()
            admission.planned_discharge = planned

            if admission.allocated_bed_id and admission.allocated_bed_id in self.loader.beds:
                bed = self.loader.beds[admission.allocated_bed_id]
                bed.status = "HOUSEKEEPING"
                bed.adm_id = None
                bed.since_ts = None

            for demand in self.demand_service.demands:
                if demand.admission_id == adm_id and demand.status == "OPEN":
                    demand.status = "CLOSED_AT_DISCHARGE"
                    demand.status_ts = parsed_command.timestamp

            self._check_block_lift(adm_id, parsed_command.timestamp, force=True)

            self._calculate_final_bill(admission)

            return CommandResult(
                command_type=CommandType.DISCHARGE,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    def _post_discharge_bed_day(self, admission: Admission, discharge_time: datetime):
        """Post bed-day line for discharge day if needed."""
        adm_id = admission.adm_id
        count_date = discharge_time.date()
        counted_dates = self._bed_day_counted.setdefault(adm_id, set())

        if count_date in counted_dates:
            return

        should_count = False
        category = admission.allocated_category or admission.requested_category

        if discharge_time.hour > self.EXTRA_DISCHARGE_HOUR:
            should_count = True
        elif discharge_time.hour < self.EARLY_DISCHARGE_HOUR:
            if admission.discharge_order_time and admission.discharge_order_time.date() < discharge_time.date():
                should_count = False
            else:
                should_count = True

        if not should_count and (discharge_time - admission.admit_ts) < timedelta(hours=24):
            if len(counted_dates) == 0:
                should_count = True

        if should_count:
            upgrade_free = False
            if adm_id in self._upgrade_free_start:
                window_end = self._upgrade_free_start[adm_id] + timedelta(hours=48)
                if discharge_time <= window_end:
                    upgrade_free = True

            rate_category = admission.requested_category if upgrade_free else category

            bed_rate = rate_category.daily_charge
            nursing_rate = rate_category.nursing_charge

            bed_gross, bed_discount_pct, bed_discount_amt = self._apply_senior_discount(
                admission, bed_rate, "BED"
            )
            nursing_gross, nursing_discount_pct, nursing_discount_amt = self._apply_senior_discount(
                admission, nursing_rate, "NURSING"
            )

            bed_gst_amt = Decimal("0.00")
            bed_taxable = bed_gross - bed_discount_amt
            if bed_taxable > self.GST_THRESHOLD:
                bed_gst_amt = round2(bed_taxable * self.GST_RATE / Decimal("100"))

            bed_net = round2(bed_gross - bed_discount_amt + bed_gst_amt)
            nursing_net = round2(nursing_gross - nursing_discount_amt)

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=discharge_time,
                counting_ts=discharge_time,
                head="BED",
                item_code=f"BED-{category.value}",
                description=f"discharge day {self._bed_day_number(adm_id, count_date)}",
                category_at_event=category,
                qty=1,
                base_amount=bed_rate,
                multiplier=Decimal("1.00"),
                gross=bed_gross,
                discount_pct=bed_discount_pct,
                discount_amt=bed_discount_amt,
                gst_amt=bed_gst_amt,
                net=bed_net,
                skip_demand_check=True,
            )

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=discharge_time,
                counting_ts=discharge_time,
                head="NURSING",
                item_code=f"NUR-{category.value}",
                description=f"nursing discharge day {self._bed_day_number(adm_id, count_date)}",
                category_at_event=category,
                qty=1,
                base_amount=nursing_rate,
                multiplier=Decimal("1.00"),
                gross=nursing_gross,
                discount_pct=nursing_discount_pct,
                discount_amt=nursing_discount_amt,
                gst_amt=Decimal("0.00"),
                net=nursing_net,
                skip_demand_check=True,
            )

            counted_dates.add(count_date)

    def finalize(self, end_time: datetime):
        """Post-process bed-day counting for all admissions after all commands.
        
        This ensures bed days are only counted up to each admission's actual
        discharge time, regardless of command ordering in the input file.
        """
        for adm_id, admission in self.loader.admissions.items():
            if admission.status not in ("ADMITTED", "DISCHARGED"):
                continue
            if admission.admit_ts is None:
                continue

            admit_time = admission.admit_ts
            discharge_time = admission.discharge_time

            start_date = admit_time.date()
            end_date = discharge_time.date() if discharge_time else end_time.date()

            counted_dates = self._bed_day_counted.setdefault(adm_id, set())

            current_date = start_date
            while current_date <= end_date:
                if current_date in counted_dates:
                    current_date += timedelta(days=1)
                    continue

                noon_anchor = datetime.combine(current_date, datetime.min.time().replace(hour=self.NOON_HOUR))
                icu_anchor = datetime.combine(current_date, datetime.min.time().replace(hour=self.ICU_HOUR))

                anchor_passed = noon_anchor <= end_time or icu_anchor <= end_time

                if not anchor_passed:
                    current_date += timedelta(days=1)
                    continue

                occupying_noon = self._is_occupying_at(adm_id, noon_anchor)
                occupying_icu = self._is_occupying_at(adm_id, icu_anchor)

                if not occupying_noon and not occupying_icu:
                    current_date += timedelta(days=1)
                    continue

                if occupying_icu:
                    check_time = icu_anchor
                    category_at_anchor = Category.ICU
                else:
                    check_time = noon_anchor
                    category_at_anchor = self._get_category_at_time(adm_id, noon_anchor)

                self._post_bed_day_lines(adm_id, current_date, check_time, category_at_anchor)
                counted_dates.add(current_date)

                current_date += timedelta(days=1)

    # =========================================================================
    # HOUSEKEEPING_CLEARED
    # =========================================================================

    def _handle_housekeeping_cleared(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle HOUSEKEEPING_CLEARED command."""
        try:
            if len(parsed_command.args) < 1:
                return self._reject(parsed_command, "INVALID_COMMAND",
                                    "HOUSEKEEPING_CLEARED requires bed ID")

            bed_id = parsed_command.args[0]

            if bed_id not in self.loader.beds:
                return self._reject(parsed_command, "UNKNOWN_BED",
                                    f"Bed {bed_id} not found")

            bed = self.loader.beds[bed_id]

            if bed.status != "HOUSEKEEPING":
                return self._reject(parsed_command, "BED_NOT_IN_HOUSEKEEPING",
                                    f"Bed {bed_id} is not in housekeeping status")

            bed.status = "AVAILABLE"
            bed.adm_id = None
            bed.since_ts = None
            bed.billing_category = None
            bed.hold_until = None

            return CommandResult(
                command_type=CommandType.HOUSEKEEPING_CLEARED,
                admission_id=None,
                success=True,
                event_id=self._generate_event_id(),
            )

        except Exception as e:
            return self._reject(parsed_command, "PROCESSING_ERROR", str(e))

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _check_procedure_block(self, adm_id: str, running_bill: Decimal,
                                total_deposits: Decimal, current_time: datetime,
                                is_emergency: bool) -> Tuple[bool, Optional[str]]:
        """Check if procedure should be blocked due to open demand (BR-07b)."""
        if total_deposits == Decimal("0.00"):
            return False, None

        threshold_80pct = total_deposits * Decimal("80.00") / Decimal("100.00")

        # Check if there's an active block for this admission
        block_active = False
        for demand in self.demand_service.demands:
            if (demand.admission_id == adm_id and demand.status == "OPEN"
                    and demand.procedure_block_from is not None):
                block_from = demand.procedure_block_from
                block_to = demand.procedure_block_to
                if current_time >= block_from and (block_to is None or current_time <= block_to):
                    block_active = True
                    break

        if block_active:
            if is_emergency:
                return False, None
            return True, "TOPUP_BLOCK"

        # Check if a new demand should be raised (bill > 80% of deposits)
        if running_bill > threshold_80pct:
            for demand in self.demand_service.demands:
                if demand.admission_id == adm_id and demand.status == "OPEN":
                    return False, None  # Already has open demand

        return False, None

    def _check_block_lift(self, adm_id: str, current_time: datetime, force: bool = False):
        """Check if procedure block should be lifted."""
        open_demands = [
            d for d in self.demand_service.demands
            if d.admission_id == adm_id and d.status == "OPEN"
        ]

        if not open_demands or force:
            self.demand_service.procedure_block_active = False
            self.demand_service.block_start_time = None
            for d in self.demand_service.demands:
                if d.admission_id == adm_id:
                    if d.procedure_block_from is not None and d.procedure_block_to is None:
                        d.procedure_block_to = current_time

    def _convert_package(self, adm_id: str, package_code: str, conversion_time: datetime):
        """Convert package to itemized billing with REPRICE lines."""
        if adm_id in self._package_converted:
            return

        package = self.loader.packages.get(package_code)
        if not package:
            return

        self._package_converted.add(adm_id)

        covered_event_ids = []
        for entry in self._ledger_entries:
            is_covered = False
            if entry.head in package.covered_heads:
                is_covered = True
            elif entry.head in ("PROCEDURE", "OT") and entry.item_code in package.included_procedures:
                is_covered = True

            if is_covered and entry.item_code not in package.exclusions:
                covered_event_ids.append(entry.item_code)

        for event_id in covered_event_ids:
            original = None
            for entry in self._ledger_entries:
                if entry.item_code == event_id:
                    original = entry
                    break

            if original is None:
                continue

            current_category = original.category_at_event
            base_amount = original.base_amount
            multiplier = original.multiplier
            repriced_gross = round2(base_amount * original.qty * multiplier)

            repriced_discount_pct = original.discount_pct
            repriced_discount_amt = round2(repriced_gross * repriced_discount_pct / Decimal("100"))
            repriced_gst_amt = round2((repriced_gross - repriced_discount_amt) * Decimal("5.00") / Decimal("100"))
            repriced_net = round2(repriced_gross - repriced_discount_amt + repriced_gst_amt)

            self._add_ledger_entry(
                admission_id=adm_id,
                timestamp=conversion_time,
                counting_ts=original.counting_ts,
                head="REPRICE",
                item_code=original.item_code,
                description=f"[PKG-{package_code}] Repriced: {original.description}",
                category_at_event=current_category,
                qty=original.qty,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=repriced_gross,
                discount_pct=repriced_discount_pct,
                discount_amt=repriced_discount_amt,
                gst_amt=repriced_gst_amt,
                net=repriced_net,
            )

    def _calculate_final_bill(self, admission: Admission):
        """Calculate final bill for a discharged admission."""
        adm_id = admission.adm_id

        total_charges = admission.running_bill

        senior_discount = Decimal("0.00")
        employee_discount = Decimal("0.00")
        charity_discount = Decimal("0.00")

        gst_total = Decimal("0.00")

        for entry in self._ledger_entries:
            gst_total += entry.gst_amt

        if admission.senior:
            # Senior discount on BED and NURSING
            for entry in self._ledger_entries:
                if entry.head in ("BED", "NURSING"):
                    senior_discount += entry.discount_amt

        if admission.employee_referral:
            for entry in self._ledger_entries:
                if entry.head == "DOCTOR":
                    employee_discount += entry.discount_amt

        if adm_id in self._charity_applied and admission.charity_pct > Decimal("0"):
            eligible_sum = Decimal("0.00")
            for entry in self._ledger_entries:
                if entry.head not in ("PHARMACY", "CONSUMABLE"):
                    eligible_sum += entry.gross - entry.discount_amt
            charity_discount = round2(eligible_sum * admission.charity_pct / Decimal("100"))

        total_discounts = round2(senior_discount + employee_discount + charity_discount)
        net_before_rounding = round2(total_charges - total_discounts + gst_total)
        rounding = round0(net_before_rounding) - net_before_rounding
        final_bill = round0(net_before_rounding)

        deposits = admission.deposits
        balance_due = round2(final_bill - deposits)
        refund_due = round2(max(Decimal("0.00"), deposits - final_bill))

        if balance_due > Decimal("0"):
            bill_status = "BALANCE_DUE"
            admission_status = "DISCHARGE_PENDING_PAYMENT"
        elif refund_due > Decimal("0"):
            bill_status = "REFUND_DUE"
            admission_status = "DISCHARGED"
        else:
            bill_status = "SETTLED"
            admission_status = "DISCHARGED"

        admission.balance_due = balance_due
        admission.refund_due = refund_due
        admission.bill_status = bill_status
        admission.admission_status = admission_status
        admission.final_bill = final_bill
        admission.total_charges = total_charges
        admission.total_discounts = total_discounts
        admission.gst_total = gst_total

    def _generate_event_id(self) -> str:
        """Generate a unique event ID."""
        import uuid
        return f"EV-{uuid.uuid4().hex[:5].upper()}"

    # =========================================================================
    # OUTPUT GENERATION
    # =========================================================================

    def generate_ledger_output(self, adm_id: str) -> str:
        """Generate ledger CSV for an admission."""
        lines = ["line_no,event_ts,counting_ts,head,item_code,description,category_at_event,qty,base_amount,multiplier,gross,discount_pct,discount_amt,gst_amt,net,locked_by_interim"]

        for entry in self._ledger_entries:
            # Filter by admission - need admission_id tracking
            # For now, skip filtering
            counting_ts = entry.counting_ts.strftime("%Y-%m-%d %H:%M:%S") if entry.counting_ts else ""
            lines.append(f"{entry.line_no},{entry.event_ts.strftime('%Y-%m-%d %H:%M:%S')},{counting_ts},{entry.head},{entry.item_code},{entry.description},{entry.category_at_event.value},{entry.qty},{entry.base_amount},{entry.multiplier},{entry.gross},{entry.discount_pct},{entry.discount_amt},{entry.gst_amt},{entry.net},{entry.locked_by_interim or ''}")

        return "\n".join(lines)

    def generate_demands_output(self) -> str:
        """Generate demands.csv."""
        lines = ["demand_id,adm_id,seq,demand_ts,trigger_line_no,running_bill,deposits_at_demand,threshold_80pct,charges_last_3_days,days_with_charges,avg_daily_charge,demand_amount,deposits_since_demand,outstanding,status,status_ts,procedure_block_from,procedure_block_to"]

        for demand in self.demand_service.demands:
            pb_from = demand.procedure_block_from.strftime("%Y-%m-%d %H:%M:%S") if demand.procedure_block_from else ""
            pb_to = demand.procedure_block_to.strftime("%Y-%m-%d %H:%M:%S") if demand.procedure_block_to else ""
            lines.append(f"{demand.demand_id},{demand.admission_id},{demand.seq},{demand.demand_ts.strftime('%Y-%m-%d %H:%M:%S')},{demand.trigger_line_no or ''},{demand.running_bill},{demand.deposits_at_demand},{demand.threshold_80pct},{demand.charges_last_3_days},{demand.days_with_charges},{demand.avg_daily_charge},{demand.demand_amount},{demand.deposits_since_demand},{demand.outstanding},{demand.status},{demand.status_ts.strftime('%Y-%m-%d %H:%M:%S') if demand.status_ts else ''},{pb_from},{pb_to}")

        return "\n".join(lines)

    def generate_rejections_output(self) -> str:
        """Generate rejections.csv."""
        lines = ["line_no,command_ts,command,adm_id,code,detail"]

        for rejection in self._rejections:
            adm = rejection.adm_id or ""
            lines.append(f"{rejection.line_no},{rejection.command_ts.strftime('%Y-%m-%d %H:%M:%S')},{rejection.command},{adm},{rejection.code},{rejection.detail or ''}")

        return "\n".join(lines)

    def generate_interim_bills_output(self) -> str:
        """Generate interim_bills.csv."""
        lines = ["interim_id,adm_id,interim_ts,trigger,lines_locked,last_line_no,gross_total,discount_total,gst_total,running_bill,deposits_to_date,balance"]

        for bill in self._interim_bills:
            lines.append(f"{bill.interim_id},{bill.admission_id},{bill.interim_ts.strftime('%Y-%m-%d %H:%M:%S')},{bill.trigger},{bill.lines_locked},{bill.last_line_no},{bill.gross_total},{bill.discount_total},{bill.gst_total},{bill.running_bill},{bill.deposits_to_date},{bill.balance}")

        return "\n".join(lines)

    def generate_occupancy_output(self, timestamp: datetime) -> str:
        """Generate bed occupancy snapshot."""
        lines = ["bed_id,ward_id,category,gender_restriction,status,adm_id,since_ts,billing_category,hold_until"]

        for bed_id in sorted(self.loader.beds.keys()):
            bed = self.loader.beds[bed_id]
            since_ts = bed.since_ts.strftime("%Y-%m-%d %H:%M:%S") if bed.since_ts else ""
            billing_cat = bed.billing_category.value if bed.billing_category else ""
            hold_until = bed.hold_until.strftime("%Y-%m-%d %H:%M:%S") if bed.hold_until else ""
            lines.append(f"{bed.bed_id},{bed.ward_id},{bed.category.value},{bed.gender_restriction.value},{bed.status},{bed.adm_id or ''},{since_ts},{billing_cat},{hold_until}")

        return "\n".join(lines)

    # =========================================================================
    # BATCH PROCESSING
    # =========================================================================

    def process_commands_file(self, filepath: str) -> Dict:
        """Process the entire commands.txt file."""
        results = {
            "total_lines": 0,
            "command_lines": 0,
            "successful": 0,
            "rejected": 0,
            "results": [],
        }

        with open(filepath, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                stripped = line.strip()
                results["total_lines"] += 1

                if not stripped or stripped.startswith("#"):
                    continue

                results["command_lines"] += 1
                parsed = self.parse_command(line, line_num)
                result = self.process_command(parsed)
                results["results"].append(result)

                if result.success:
                    results["successful"] += 1
                else:
                    results["rejected"] += 1

        return results

    @property
    def demands(self):
        return self.demand_service.demands


# Global instance
command_processor = CommandProcessor(loader)


def process_commands(filepath: str) -> Dict:
    """Process a commands file using the global processor."""
    return command_processor.process_commands_file(filepath)
