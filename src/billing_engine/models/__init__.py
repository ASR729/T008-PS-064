"""
Domain models for the PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module contains the core domain entities and value objects used by the
system to represent hospital operations, admissions, beds, patients, and billing.
"""

from decimal import Decimal
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Any

class Gender(str, Enum):
    """Gender enumeration for patient and bed restrictions."""
    M = "M"
    F = "F"
    ANY = "ANY"

class Category(str, Enum):
    """Bed categories with their characteristics and pricing."""
    GENERAL = "GENERAL"
    SEMI_PRIVATE = "SEMI_PRIVATE"
    PRIVATE = "PRIVATE"
    DELUXE = "DELUXE"
    ICU = "ICU"

    @property
    def daily_charge(self) -> Decimal:
        """Get the daily bed charge for this category."""
        charges = {
            Category.GENERAL: Decimal("1200.00"),
            Category.SEMI_PRIVATE: Decimal("2500.00"),
            Category.PRIVATE: Decimal("5000.00"),
            Category.DELUXE: Decimal("5500.00"),
            Category.ICU: Decimal("4800.00"),
        }
        return charges[self]

    @property
    def nursing_charge(self) -> Decimal:
        """Get the nursing charge for this category."""
        charges = {
            Category.GENERAL: Decimal("400.00"),
            Category.SEMI_PRIVATE: Decimal("600.00"),
            Category.PRIVATE: Decimal("800.00"),
            Category.DELUXE: Decimal("1000.00"),
            Category.ICU: Decimal("2500.00"),
        }
        return charges[self]

    @property
    def visit_multiplier(self) -> Decimal:
        """Get the visit multiplier for this category."""
        multipliers = {
            Category.GENERAL: Decimal("1.00"),
            Category.SEMI_PRIVATE: Decimal("1.25"),
            Category.PRIVATE: Decimal("1.50"),
            Category.DELUXE: Decimal("2.00"),
            Category.ICU: Decimal("1.50"),
        }
        return multipliers[self]

    @property
    def procedure_multiplier(self) -> Decimal:
        """Get the procedure multiplier for this category."""
        return self.visit_multiplier

    @property
    def ot_multiplier(self) -> Decimal:
        """Get the OT multiplier for this category."""
        return self.visit_multiplier

    @property
    def investigation_multiplier(self) -> Decimal:
        """Get the investigation multiplier for this category."""
        multipliers = {
            Category.GENERAL: Decimal("1.00"),
            Category.SEMI_PRIVATE: Decimal("1.20"),
            Category.PRIVATE: Decimal("1.20"),
            Category.DELUXE: Decimal("1.20"),
            Category.ICU: Decimal("1.20"),
        }
        return multipliers[self]

    @property
    def pharmacy_consumable_multiplier(self) -> Decimal:
        """Get the pharmacy/consumable multiplier for this category."""
        return Decimal("1.00")

    @property
    def max_chargeable_doctors_per_day(self) -> int:
        """Get the max chargeable doctors per day for this category."""
        limits = {
            Category.GENERAL: 2,
            Category.SEMI_PRIVATE: 0,
            Category.PRIVATE: 0,
            Category.DELUXE: 0,
            Category.ICU: 0,
        }
        return limits[self]

    @property
    def upgrade_rank(self) -> int:
        """Get the upgrade rank (0 for ICU, higher for non-ICU)."""
        ranks = {
            Category.GENERAL: 1,
            Category.SEMI_PRIVATE: 2,
            Category.PRIVATE: 3,
            Category.DELUXE: 4,
            Category.ICU: 0,
        }
        return ranks[self]

    def is_upgrade_target(self) -> bool:
        """Check if this category can be targeted for upgrades."""
        return self != Category.ICU

    def gender_allowed(self, patient_gender: Gender) -> bool:
        """Check if a patient of given gender can be allocated to this category."""
        if self == Category.GENERAL:
            return patient_gender in [Gender.M, Gender.F]
        return True

@dataclass
class Patient:
    """Patient information and demographics."""
    patient_id: str
    name: str
    gender: Gender
    date_of_birth: datetime
    mobile: str
    city: str
    senior: bool = field(init=False)

    def __post_init__(self):
        """Calculate senior status based on age."""
        self.senior = (datetime.now() - self.date_of_birth).days >= 60 * 365

@dataclass
class Doctor:
    """Doctor information."""
    doctor_id: str
    name: str
    specialty: str
    visit_fee: Decimal
    is_intensivist: bool = False

@dataclass
class Bed:
    """Hospital bed with characteristics."""
    bed_id: str
    ward_id: str
    ward_name: str
    category: Category
    gender_restriction: Gender
    daily_bed_charge: Decimal
    nursing_charge: Decimal
    floor: int
    status: str = "AVAILABLE"
    adm_id: Optional[str] = None
    since_ts: Optional[datetime] = None
    billing_category: Optional[Category] = None
    hold_until: Optional[datetime] = None

    def is_available(self) -> bool:
        """Check if bed is available for allocation."""
        return self.status == "AVAILABLE"

    def is_reserved(self) -> bool:
        """Check if bed is reserved."""
        return self.status == "RESERVED"

    def is_occupied(self) -> bool:
        """Check if bed is occupied."""
        return self.status == "OCCUPIED"

    def is_housekeeping(self) -> bool:
        """Check if bed is in housekeeping."""
        return self.status == "HOUSEKEEPING"

@dataclass
class Admission:
    """Patient admission with all related information."""
    adm_id: str
    patient_id: str
    patient_name: str
    gender: Gender
    date_of_birth: datetime
    mobile: str
    city: str
    requested_category: Category
    admitting_doctor_id: str
    package_code: Optional[str]
    employee_referral: bool
    senior: bool = field(init=False)
    status: str = "ADMITTED"
    allocated_category: Optional[Category] = None
    allocated_bed_id: Optional[str] = None
    running_bill: Decimal = Decimal("0.00")
    deposits: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")
    discharge_type: Optional[str] = None
    discharge_time: Optional[datetime] = None
    planned_discharge: Optional[datetime] = None
    discharge_order_time: Optional[datetime] = None

    def __post_init__(self):
        """Calculate derived fields."""
        self.senior = (datetime.now() - self.date_of_birth).days >= 60 * 365

@dataclass
class BedAllocation:
    """Bed allocation for an admission."""
    admission_id: str
    bed_id: str
    category: Category
    allocated_at: datetime
    from_category: Category

@dataclass
class BedOccupancyPeriod:
    """Period when a bed is occupied by a patient."""
    bed_id: str
    admission_id: str
    start_time: datetime
    end_time: Optional[datetime]
    category: Category
    status: str = "ACTIVE"

@dataclass
class Transfer:
    """Category transfer for a patient."""
    admission_id: str
    transfer_time: datetime
    target_category: Category
    target_bed_id: Optional[str]
    ordered_by_doctor_id: Optional[str]
    order_issued_ts: Optional[datetime]
    step_down_required: bool = False

@dataclass
class StepDown:
    """Step-down from ICU to lower category."""
    admission_id: str
    step_down_time: datetime
    target_category: Category
    doctor_id: Optional[str]

@dataclass
class PackageEnrollment:
    """Package enrollment for an admission."""
    admission_id: str
    package_code: str
    enrollment_time: datetime
    status: str = "ACTIVE"
    conversion_time: Optional[datetime] = None

@dataclass
class PackageConversion:
    """Package conversion to itemized billing."""
    admission_id: str
    conversion_time: datetime
    original_package: str
    covered_events: List[str]
    repriced_events: List[str]

@dataclass
class ChargeEvent:
    """Individual charge event."""
    event_id: str
    admission_id: str
    head: str
    item_code: str
    description: str
    category_at_event: Category
    qty: int
    base_amount: Decimal
    multiplier: Decimal
    gross: Decimal
    discount_pct: Decimal
    discount_amt: Decimal
    gst_amt: Decimal
    net: Decimal
    event_timestamp: datetime
    locked_by_interim: Optional[str]
    counting_timestamp: Optional[datetime]

@dataclass
class Deposit:
    """Deposit or payment transaction."""
    transaction_id: str
    admission_id: str
    amount: Decimal
    timestamp: datetime
    payment_mode: Optional[str]
    demand_id: Optional[str] = None

@dataclass
class Demand:
    """Top-up demand for additional funds."""
    demand_id: str
    admission_id: str
    seq: int
    demand_ts: datetime
    trigger_line_no: Optional[int]
    running_bill: Decimal
    deposits_at_demand: Decimal
    threshold_80pct: Decimal
    charges_last_3_days: Decimal
    days_with_charges: int
    avg_daily_charge: Decimal
    demand_amount: Decimal
    deposits_since_demand: Decimal
    outstanding: Decimal
    status: str
    status_ts: datetime
    procedure_block_from: Optional[datetime]
    procedure_block_to: Optional[datetime]

@dataclass
class InterimBill:
    """Interim bill (manual or automatic)."""
    interim_id: str
    admission_id: str
    interim_ts: datetime
    trigger: str
    lines_locked: int
    last_line_no: int
    gross_total: Decimal
    discount_total: Decimal
    gst_total: Decimal
    running_bill: Decimal
    deposits_to_date: Decimal
    balance: Decimal

@dataclass
class LedgerEntry:
    """Individual entry in patient ledger."""
    line_no: int
    event_ts: datetime
    counting_ts: Optional[datetime]
    head: str
    item_code: str
    description: str
    category_at_event: Category
    qty: int
    base_amount: Decimal
    multiplier: Decimal
    gross: Decimal
    discount_pct: Decimal
    discount_amt: Decimal
    gst_amt: Decimal
    net: Decimal
    locked_by_interim: Optional[str]

@dataclass
class TariffItem:
    """Tariff item for pricing."""
    item_code: str
    description: str
    head: str
    base_rate: Decimal
    unit: str


@dataclass
class Package:
    """Package configuration for bundled billing."""
    package_code: str
    package_name: str
    package_category: Category
    package_price: Decimal
    los_days: int
    included_procedures: List[str]
    exclusions: List[str]
    covered_heads: List[str]


@dataclass
class Rejection:
    """Rejected command with reason."""
    line_no: int
    command_ts: datetime
    command: str
    adm_id: Optional[str]
    code: str
    detail: Optional[str]

    def __init__(self, line_no: int, command_ts: datetime, command: str,
                 adm_id: Optional[str] = None, code: str = "", detail: Optional[str] = None):
        self.line_no = line_no
        self.command_ts = command_ts
        self.command = command
        self.adm_id = adm_id
        self.code = code
        self.detail = detail

    def __str__(self):
        return f"Rejection(line_no={self.line_no}, command={self.command}, adm_id={self.adm_id}, code={self.code})"

    def __repr__(self):
        return self.__str__()