"""
Command parsing and processing for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module handles the parsing of command files, command validation, and command execution
for the billing engine.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from decimal import Decimal

from ..models import (
    Category, Bed, Doctor, TariffItem, Package, Admission,
    Patient, BedAllocation, BedOccupancyPeriod, Transfer, StepDown,
    PackageEnrollment, PackageConversion, ChargeEvent, Deposit,
    Demand, InterimBill, LedgerEntry, Rejection
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
        if len(self.args) > 0:
            self.admission_id = self.args[0]

    def __str__(self):
        return f"Command({self.command_type}, {self.timestamp}, {self.admission_id})"

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

    def __str__(self):
        return f"Result(command={self.command_type}, success={self.success}, adm_id={self.admission_id})"

class CommandProcessor:
    """Process commands for the PS-064 billing engine."""

    def __init__(self, loader: MasterDataLoader):
        self.loader = loader
        self.bed_day_counter = BedDayCounter()
        self.pricing_service = PricingService(loader.categories)
        self.transfer_service = TransferService(loader.beds)
        self.package_service = PackageService(loader.packages)
        self.discount_service = DiscountService()
        self.gst_service = GSTService()
        self.demand_service = DemandService()
        self.ledger_service = LedgerService()
        self._charge_events: List[Dict] = []
        self._admission_transfer_counts: Dict[str, int] = {}
        self._visits_per_doctor_day: Dict[Tuple[str, str, str], int] = {}
        self._icu_entry_times: Dict[str, datetime] = {}
        self._bed_reservations: Dict[str, Dict] = {}
        self._initialize_command_handlers()

    def _initialize_command_handlers(self):
        """Initialize command handlers for supported commands."""
        self.command_handlers = {
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

    def parse_command(self, line: str, line_number: int) -> Optional[ParsedCommand]:
        """Parse a command from the command file."""
        try:
            # Remove comments and empty lines
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                return None

            parts = stripped.split("|")
            if len(parts) < 2:
                raise ValueError(f"Command must have at least timestamp and command: {stripped}")

            command_type_str = parts[0].strip()
            timestamp_str = parts[1].strip()

            try:
                command_type = CommandType(command_type_str)
            except ValueError:
                return ParsedCommand(
                    command_type=CommandType("UNKNOWN"),
                    timestamp=datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S"),
                    args=parts[2:],
                    raw_line=line,
                    line_number=line_number,
                    admission_id=None
                )

            try:
                timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                return ParsedCommand(
                    command_type=command_type,
                    timestamp=datetime.now(),
                    args=parts[2:],
                    raw_line=line,
                    line_number=line_number,
                    admission_id=None
                )

            return ParsedCommand(
                command_type=command_type,
                timestamp=timestamp,
                args=parts[2:],
                raw_line=line,
                line_number=line_number
            )

        except Exception as e:
            # Create a rejection-style parsed command for unparseable lines
            return ParsedCommand(
                command_type=CommandType("UNKNOWN"),
                timestamp=datetime.now(),
                args=[],
                raw_line=line,
                line_number=line_number,
                admission_id=None
            )

    def process_command(self, parsed_command: ParsedCommand) -> CommandResult:
        """Process a parsed command."""
        try:
            # Validate command format
            if not self._validate_command(parsed_command):
                return CommandResult(
                    command_type=parsed_command.command_type,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail=f"Command validation failed for {parsed_command.command_type}"
                )

            # Get command handler
            handler = self.command_handlers.get(parsed_command.command_type)
            if handler is None:
                return CommandResult(
                    command_type=parsed_command.command_type,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="UNKNOWN_COMMAND",
                    error_detail=f"Unsupported command: {parsed_command.command_type}"
                )

            # Execute handler
            return handler(parsed_command)

        except Exception as e:
            # Log error and return failure
            return CommandResult(
                command_type=parsed_command.command_type,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _validate_command(self, parsed_command: ParsedCommand) -> bool:
        """Validate command format and arguments."""
        try:
            handler = self.command_handlers.get(parsed_command.command_type)
            if handler is None:
                return False

            # Check minimum argument count
            min_args = {
                CommandType.ADMIT: 3,  # adm_id, deposit, payment_mode
                CommandType.RESERVE_BED: 3,  # adm_id, bed_id, planned_admit_ts
                CommandType.TRANSFER: 4,  # adm_id, target_category, doctor_id, target_bed_id
                CommandType.STEP_DOWN: 4,  # adm_id, target_category, doctor_id, target_bed_id
                CommandType.VISIT: 3,  # adm_id, event_id, doctor_id
                CommandType.PROCEDURE: 5,  # adm_id, event_id, item_code, doctor_id, emergency
                CommandType.OT: 6,  # adm_id, event_id, ot_code, hours, surgeon_id, emergency
                CommandType.PHARMACY: 4,  # adm_id, event_id, item_code, qty
                CommandType.CONSUMABLE: 4,  # adm_id, event_id, item_code, qty
                CommandType.INVESTIGATION: 4,  # adm_id, event_id, item_code, qty
                CommandType.DEPOSIT: 3,  # adm_id, amount, payment_mode
                CommandType.INTERIM_BILL: 1,  # adm_id
                CommandType.CORRECTION: 4,  # adm_id, event_id, new_qty, reason
                CommandType.CHARITY: 3,  # adm_id, pct, ceo_ref
                CommandType.DISCHARGE: 3,  # adm_id, discharge_type, order_issued_ts
                CommandType.HOUSEKEEPING_CLEARED: 2,  # ts, bed_id
            }

            command_type = parsed_command.command_type
            if command_type in min_args:
                required_args = min_args[command_type]
                if len(parsed_command.args) < required_args:
                    return False

            return True

        except Exception:
            return False

    def _generate_event_id(self) -> str:
        """Generate a unique event ID."""
        import uuid
        return f"EV-{uuid.uuid4().hex[:5].upper()}"

    # Command handlers

    def _handle_admit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle ADMIT command."""
        try:
            # Extract arguments
            if len(parsed_command.args) < 3:
                return CommandResult(
                    command_type=CommandType.ADMIT,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="ADMIT requires at least timestamp, admission ID, deposit, and payment mode"
                )

            adm_id = parsed_command.args[0]
            deposit = parsed_command.args[1]
            payment_mode = parsed_command.args[2] if len(parsed_command.args) > 2 else "CASH"

            # Check if admission exists
            if adm_id not in self.loader.admissions:
                return CommandResult(
                    command_type=CommandType.ADMIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            admission = self.loader.admissions[adm_id]

            # Check if already admitted
            if admission.status == "ADMITTED":
                return CommandResult(
                    command_type=CommandType.ADMIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="ALREADY_ADMITTED",
                    error_detail=f"Admission {adm_id} already admitted"
                )

            # Calculate required deposit (2 x bed charge + 10,000)
            requested_category = admission.requested_category
            bed_charge = self.loader.categories[requested_category.name].daily_charge
            required_deposit = bed_charge * 2 + Decimal("10000.00")

            # Check deposit amount
            try:
                deposit_amount = Decimal(deposit)
            except ValueError:
                return CommandResult(
                    command_type=CommandType.ADMIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="INVALID_AMOUNT",
                    error_detail=f"Invalid deposit amount: {deposit}"
                )

            if deposit_amount < required_deposit:
                return CommandResult(
                    command_type=CommandType.ADMIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="DEPOSIT_SHORT",
                    error_detail=f"Deposit {deposit_amount} is less than required {required_deposit}"
                )

            # Allocate bed
            bed_id = self._allocate_bed(requested_category, adm_id)
            if not bed_id:
                return CommandResult(
                    command_type=CommandType.ADMIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="NO_BED",
                    error_detail=f"No available bed in category {requested_category}"
                )

            # Update admission
            admission.allocated_category = requested_category
            admission.allocated_bed_id = bed_id
            admission.status = "ADMITTED"
            admission.deposits += deposit_amount
            admission.running_bill += Decimal("0.00")  # Initial bill zero

            # Update bed occupancy
            bed = self.loader.beds[bed_id]
            bed.status = "OCCUPIED"
            bed.adm_id = adm_id
            bed.since_ts = parsed_command.timestamp
            bed.billing_category = requested_category

            return CommandResult(
                command_type=CommandType.ADMIT,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.ADMIT,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_reserve_bed(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle RESERVE_BED command."""
        try:
            if len(parsed_command.args) < 3:
                return CommandResult(
                    command_type=CommandType.RESERVE_BED,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="RESERVE_BED requires timestamp, admission ID, bed ID, and planned admission time"
                )

            adm_id = parsed_command.args[1]
            bed_id = parsed_command.args[2]
            planned_admit_ts = parsed_command.args[3] if len(parsed_command.args) > 3 else None

            if adm_id not in self.loader.admissions:
                return CommandResult(
                    command_type=CommandType.RESERVE_BED,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            if bed_id not in self.loader.beds:
                return CommandResult(
                    command_type=CommandType.RESERVE_BED,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_BED",
                    error_detail=f"Bed {bed_id} not found"
                )

            bed = self.loader.beds[bed_id]
            if not bed.is_available():
                return CommandResult(
                    command_type=CommandType.RESERVE_BED,
                    admission_id=adm_id,
                    success=False,
                    error_code="BED_NOT_AVAILABLE",
                    error_detail=f"Bed {bed_id} is not available for reservation"
                )

            # Parse planned admission time or use command timestamp
            if planned_admit_ts:
                try:
                    planned_ts = datetime.strptime(planned_admit_ts, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    planned_ts = parsed_command.timestamp
            else:
                planned_ts = parsed_command.timestamp

            # Reserve bed (6-hour validity from planned admission time)
            bed.status = "RESERVED"
            bed.hold_until = planned_ts + timedelta(hours=6)
            bed.adm_id = adm_id

            self._bed_reservations[bed_id] = {
                'admission_id': adm_id,
                'bed_id': bed_id,
                'reserved_at': parsed_command.timestamp,
                'planned_admit_ts': planned_ts,
                'expires_at': planned_ts + timedelta(hours=6),
            }

            return CommandResult(
                command_type=CommandType.RESERVE_BED,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.RESERVE_BED,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_transfer(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle TRANSFER command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.TRANSFER,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="TRANSFER requires timestamp, admission ID, target category, doctor ID, and target bed ID"
                )

            adm_id = parsed_command.args[1]
            target_category_str = parsed_command.args[2]
            doctor_id = parsed_command.args[3]
            target_bed_id = parsed_command.args[4] if len(parsed_command.args) > 4 else None

            if adm_id not in self.loader.admissions:
                return CommandResult(
                    command_type=CommandType.TRANSFER,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            admission = self.loader.admissions[adm_id]
            if admission.status != "ADMITTED":
                return CommandResult(
                    command_type=CommandType.TRANSFER,
                    admission_id=adm_id,
                    success=False,
                    error_code="NOT_ADMITTED",
                    error_detail=f"Admission {adm_id} is not admitted"
                )

            try:
                target_category = Category(target_category_str)
            except ValueError:
                return CommandResult(
                    command_type=CommandType.TRANSFER,
                    admission_id=adm_id,
                    success=False,
                    error_code="INVALID_CATEGORY",
                    error_detail=f"Invalid category: {target_category_str}"
                )

            current_category = admission.allocated_category or admission.requested_category
            transfer_count = self._admission_transfer_counts.get(adm_id, 0)

            is_step_down = target_category == Category.ICU and current_category != Category.ICU

            # Validate transfer
            is_valid, error_code, error_detail = self.transfer_service.validate_transfer(
                adm_id, target_category, target_bed_id, current_category,
                transfer_count, is_icu_entry=(target_category == Category.ICU),
                is_step_down=is_step_down
            )

            if not is_valid:
                return CommandResult(
                    command_type=CommandType.TRANSFER,
                    admission_id=adm_id,
                    success=False,
                    error_code=error_code,
                    error_detail=error_detail
                )

            # Release current bed
            if admission.allocated_bed_id and admission.allocated_bed_id in self.loader.beds:
                old_bed = self.loader.beds[admission.allocated_bed_id]
                old_bed.status = "AVAILABLE"
                old_bed.adm_id = None
                old_bed.since_ts = None
                old_bed.billing_category = None

            # Allocate new bed
            new_bed_id = None
            if target_bed_id and target_bed_id in self.loader.beds:
                new_bed = self.loader.beds[target_bed_id]
                if new_bed.is_available() and new_bed.category == target_category:
                    new_bed_id = target_bed_id
                    new_bed.status = "OCCUPIED"
                    new_bed.adm_id = adm_id
                    new_bed.since_ts = parsed_command.timestamp
                    new_bed.billing_category = target_category
            else:
                # Find available bed in target category
                available_beds = [
                    (bid, bed) for bid, bed in self.loader.beds.items()
                    if bed.category == target_category and bed.is_available()
                ]
                if available_beds:
                    available_beds.sort(key=lambda x: x[0])
                    new_bed_id = available_beds[0][0]
                    new_bed = available_beds[0][1]
                    new_bed.status = "OCCUPIED"
                    new_bed.adm_id = adm_id
                    new_bed.since_ts = parsed_command.timestamp
                    new_bed.billing_category = target_category

            if not new_bed_id:
                return CommandResult(
                    command_type=CommandType.TRANSFER,
                    admission_id=adm_id,
                    success=False,
                    error_code="NO_BED",
                    error_detail=f"No available bed in category {target_category}"
                )

            # Record transfer
            self.transfer_service.record_transfer(
                adm_id, parsed_command.timestamp, target_category,
                new_bed_id, doctor_id, step_down_required=False
            )

            # Update admission
            admission.allocated_category = target_category
            admission.allocated_bed_id = new_bed_id

            # Update transfer count
            self._admission_transfer_counts[adm_id] = transfer_count + 1

            # Track ICU entry time
            if target_category == Category.ICU:
                self._icu_entry_times[adm_id] = parsed_command.timestamp

            return CommandResult(
                command_type=CommandType.TRANSFER,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.TRANSFER,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_step_down(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle STEP_DOWN command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.STEP_DOWN,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="STEP_DOWN requires timestamp, admission ID, target category, doctor ID, and target bed ID"
                )

            adm_id = parsed_command.args[1]
            target_category_str = parsed_command.args[2]
            doctor_id = parsed_command.args[3]
            target_bed_id = parsed_command.args[4] if len(parsed_command.args) > 4 else None

            if adm_id not in self.loader.admissions:
                return CommandResult(
                    command_type=CommandType.STEP_DOWN,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            admission = self.loader.admissions[adm_id]
            if admission.status != "ADMITTED":
                return CommandResult(
                    command_type=CommandType.STEP_DOWN,
                    admission_id=adm_id,
                    success=False,
                    error_code="NOT_ADMITTED",
                    error_detail=f"Admission {adm_id} is not admitted"
                )

            try:
                target_category = Category(target_category_str)
            except ValueError:
                return CommandResult(
                    command_type=CommandType.STEP_DOWN,
                    admission_id=adm_id,
                    success=False,
                    error_code="INVALID_CATEGORY",
                    error_detail=f"Invalid category: {target_category_str}"
                )

            if admission.allocated_category != Category.ICU:
                return CommandResult(
                    command_type=CommandType.STEP_DOWN,
                    admission_id=adm_id,
                    success=False,
                    error_code="NOT_IN_ICU",
                    error_detail=f"Admission {adm_id} is not in ICU"
                )

            # Release current ICU bed
            if admission.allocated_bed_id and admission.allocated_bed_id in self.loader.beds:
                old_bed = self.loader.beds[admission.allocated_bed_id]
                old_bed.status = "AVAILABLE"
                old_bed.adm_id = None
                old_bed.since_ts = None
                old_bed.billing_category = None

            # Allocate new bed in target category
            new_bed_id = None
            if target_bed_id and target_bed_id in self.loader.beds:
                new_bed = self.loader.beds[target_bed_id]
                if new_bed.is_available() and new_bed.category == target_category:
                    new_bed_id = target_bed_id
                    new_bed.status = "OCCUPIED"
                    new_bed.adm_id = adm_id
                    new_bed.since_ts = parsed_command.timestamp
                    new_bed.billing_category = target_category
            else:
                available_beds = [
                    (bid, bed) for bid, bed in self.loader.beds.items()
                    if bed.category == target_category and bed.is_available()
                ]
                if available_beds:
                    available_beds.sort(key=lambda x: x[0])
                    new_bed_id = available_beds[0][0]
                    new_bed = available_beds[0][1]
                    new_bed.status = "OCCUPIED"
                    new_bed.adm_id = adm_id
                    new_bed.since_ts = parsed_command.timestamp
                    new_bed.billing_category = target_category

            if not new_bed_id:
                return CommandResult(
                    command_type=CommandType.STEP_DOWN,
                    admission_id=adm_id,
                    success=False,
                    error_code="NO_BED",
                    error_detail=f"No available bed in category {target_category}"
                )

            # Record step-down
            step_down = self.transfer_service.record_step_down(
                adm_id, parsed_command.timestamp, target_category, doctor_id
            )

            # Update admission
            admission.allocated_category = target_category
            admission.allocated_bed_id = new_bed_id

            # Clear ICU entry time
            if adm_id in self._icu_entry_times:
                del self._icu_entry_times[adm_id]

            return CommandResult(
                command_type=CommandType.STEP_DOWN,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.STEP_DOWN,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_visit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle VISIT command."""
        try:
            if len(parsed_command.args) < 4:
                return CommandResult(
                    command_type=CommandType.VISIT,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="VISIT requires timestamp, admission ID, event ID, and doctor ID"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            doctor_id = parsed_command.args[3]

            if adm_id not in self.loader.admissions:
                return CommandResult(
                    command_type=CommandType.VISIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            admission = self.loader.admissions[adm_id]
            if admission.status != "ADMITTED":
                return CommandResult(
                    command_type=CommandType.VISIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="NOT_ADMITTED",
                    error_detail=f"Admission {adm_id} is not admitted"
                )

            if doctor_id not in self.loader.doctors:
                return CommandResult(
                    command_type=CommandType.VISIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_DOCTOR",
                    error_detail=f"Doctor {doctor_id} not found"
                )

            doctor = self.loader.doctors[doctor_id]
            current_category = admission.allocated_category or admission.requested_category

            # BR-05: Doctor visit charging rules
            visit_date = parsed_command.timestamp.date()
            visit_key = (adm_id, doctor_id, str(visit_date))

            # Count visits by this doctor for this admission on this day
            visit_count = self._visits_per_doctor_day.get(visit_key, 0)

            # First visit by this doctor on this day is chargeable
            if visit_count == 0:
                base_amount = doctor.visit_fee
                multiplier = current_category.visit_multiplier
                gross = base_amount * multiplier
                is_chargeable = True
            else:
                # Same doctor repeat visit on same calendar day is free
                base_amount = Decimal('0.00')
                multiplier = Decimal('1.00')
                gross = Decimal('0.00')
                is_chargeable = False

            # GENERAL category limit: max 2 different doctors per day
            if current_category == Category.GENERAL:
                doctors_today = set()
                for (aid, did, vdate), count in self._visits_per_doctor_day.items():
                    if aid == adm_id and vdate == str(visit_date):
                        doctors_today.add(did)
                if doctor_id not in doctors_today and len(doctors_today) >= 2:
                    return CommandResult(
                        command_type=CommandType.VISIT,
                        admission_id=adm_id,
                        success=False,
                        error_code="DOCTOR_LIMIT",
                        error_detail="GENERAL category limited to 2 doctors per day"
                    )

            # ICU intensivist flat ₹2,500 per ICU day
            if current_category == Category.ICU and doctor.is_intensivist:
                gross = Decimal('2500.00')
                base_amount = Decimal('2500.00')
                multiplier = Decimal('1.00')
                is_chargeable = True

            # Update visit count
            self._visits_per_doctor_day[visit_key] = visit_count + 1

            # Apply discounts
            gross, discount_pct, discount_amt = self._apply_discounts(
                admission, gross, 'DOCTOR_VISIT'
            )

            # Calculate GST (not applicable to doctor visits)
            gst_amt = Decimal('0.00')
            net = gross - discount_amt + gst_amt

            # Record charge event for demand calculation
            self.demand_service.record_charge_event(
                adm_id, net, parsed_command.timestamp, 'DOCTOR_VISIT'
            )

            # Add ledger entry
            self.ledger_service.add_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                head='DOCTOR_VISIT',
                item_code=doctor_id,
                description=f"Doctor visit by {doctor.name}",
                category_at_event=current_category,
                qty=1,
                base_amount=base_amount,
                multiplier=multiplier,
                gross=gross + discount_amt,
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                counting_timestamp=None,
            )

            # Update running bill
            admission.running_bill += net

            return CommandResult(
                command_type=CommandType.VISIT,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.VISIT,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_procedure(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle PROCEDURE command."""
        try:
            if len(parsed_command.args) < 7:
                return CommandResult(
                    command_type=CommandType.PROCEDURE,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="PROCEDURE requires timestamp, admission ID, event ID, item code, doctor ID, and emergency flag"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            item_code = parsed_command.args[3]
            doctor_id = parsed_command.args[4]
            emergency = parsed_command.args[5].lower() == 'true' if len(parsed_command.args) > 5 else False

            # BR-07b: Check procedure block
            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.PROCEDURE,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            total_deposits = admission.deposits
            running_bill = admission.running_bill

            is_blocked, block_code = self.demand_service.check_procedure_block(
                adm_id, running_bill, total_deposits, parsed_command.timestamp, is_emergency=emergency
            )

            if is_blocked:
                return CommandResult(
                    command_type=CommandType.PROCEDURE,
                    admission_id=adm_id,
                    success=False,
                    error_code=block_code,
                    error_detail="Procedure blocked due to outstanding top-up demand"
                )

            if item_code not in self.loader.tariffs:
                return CommandResult(
                    command_type=CommandType.PROCEDURE,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ITEM",
                    error_detail=f"Item {item_code} not found in tariffs"
                )

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            # BR-04: Category-at-event pricing
            charge_result = self.pricing_service.calculate_charge(
                tariff.base_rate, current_category, 'PROCEDURE', qty=1
            )

            # Apply discounts
            gross, discount_pct, discount_amt = self._apply_discounts(
                admission, charge_result['gross'], 'PROCEDURE'
            )

            # Calculate GST (not applicable to procedures)
            gst_amt = Decimal('0.00')
            net = gross - discount_amt + gst_amt

            # Record charge event
            self.demand_service.record_charge_event(
                adm_id, net, parsed_command.timestamp, 'PROCEDURE'
            )

            # Add ledger entry
            self.ledger_service.add_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                head='PROCEDURE',
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=1,
                base_amount=tariff.base_rate,
                multiplier=charge_result['multiplier'],
                gross=charge_result['gross'],
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                counting_timestamp=None,
            )

            # Update running bill
            admission.running_bill += net

            # Check package conversion (non-included procedure)
            if admission.package_code:
                package = self.loader.packages.get(admission.package_code)
                if package and item_code not in package.included_procedures:
                    # Check if this triggers package conversion
                    should_convert, _, reason = self.package_service.check_package_conversion(
                        adm_id, admission.package_code, Decimal('0'), True, parsed_command.timestamp
                    )
                    if should_convert:
                        # Record package conversion
                        self.package_service.convert_package(
                            adm_id, admission.package_code, parsed_command.timestamp,
                            [], [event_id]
                        )

            return CommandResult(
                command_type=CommandType.PROCEDURE,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.PROCEDURE,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_ot(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle OT command."""
        try:
            if len(parsed_command.args) < 8:
                return CommandResult(
                    command_type=CommandType.OT,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="OT requires timestamp, admission ID, event ID, OT code, hours, surgeon ID, and emergency flag"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            ot_code = parsed_command.args[3]
            hours = Decimal(parsed_command.args[4])
            surgeon_id = parsed_command.args[5]
            emergency = parsed_command.args[6].lower() == 'true' if len(parsed_command.args) > 6 else False

            # BR-07b: Check procedure block
            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.OT,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            total_deposits = admission.deposits
            running_bill = admission.running_bill

            is_blocked, block_code = self.demand_service.check_procedure_block(
                adm_id, running_bill, total_deposits, parsed_command.timestamp, is_emergency=emergency
            )

            if is_blocked:
                return CommandResult(
                    command_type=CommandType.OT,
                    admission_id=adm_id,
                    success=False,
                    error_code=block_code,
                    error_detail="OT blocked due to outstanding top-up demand"
                )

            if ot_code not in self.loader.tariffs:
                return CommandResult(
                    command_type=CommandType.OT,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ITEM",
                    error_detail=f"OT code {ot_code} not found in tariffs"
                )

            tariff = self.loader.tariffs[ot_code]
            current_category = admission.allocated_category or admission.requested_category

            # BR-04: Category-at-event pricing
            charge_result = self.pricing_service.calculate_charge(
                tariff.base_rate * hours, current_category, 'OT', qty=1
            )

            # Apply discounts (OT not discounted)
            gross, discount_pct, discount_amt = charge_result['gross'], Decimal('0.00'), Decimal('0.00')

            # Calculate GST (not applicable to OT)
            gst_amt = Decimal('0.00')
            net = gross - discount_amt + gst_amt

            # Record charge event
            self.demand_service.record_charge_event(
                adm_id, net, parsed_command.timestamp, 'OT'
            )

            # Add ledger entry
            self.ledger_service.add_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                head='OT',
                item_code=ot_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=int(hours),
                base_amount=tariff.base_rate,
                multiplier=charge_result['multiplier'],
                gross=charge_result['gross'],
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                counting_timestamp=None,
            )

            # Update running bill
            admission.running_bill += net

            return CommandResult(
                command_type=CommandType.OT,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.OT,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_pharmacy(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle PHARMACY command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.PHARMACY,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="PHARMACY requires timestamp, admission ID, event ID, item code, and quantity"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            item_code = parsed_command.args[3]
            qty = int(parsed_command.args[4])

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.PHARMACY,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            if item_code not in self.loader.tariffs:
                return CommandResult(
                    command_type=CommandType.PHARMACY,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ITEM",
                    error_detail=f"Item {item_code} not found in tariffs"
                )

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            # BR-04: Pharmacy uses MRP (1.00 multiplier)
            charge_result = self.pricing_service.calculate_charge(
                tariff.base_rate, current_category, 'PHARMACY', qty=qty
            )

            # Pharmacy not discounted
            gross, discount_pct, discount_amt = charge_result['gross'], Decimal('0.00'), Decimal('0.00')

            # Pharmacy not GST eligible
            gst_amt = Decimal('0.00')
            net = gross - discount_amt + gst_amt

            # Record charge event
            self.demand_service.record_charge_event(
                adm_id, net, parsed_command.timestamp, 'PHARMACY'
            )

            # Add ledger entry
            self.ledger_service.add_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                head='PHARMACY',
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=qty,
                base_amount=tariff.base_rate,
                multiplier=charge_result['multiplier'],
                gross=charge_result['gross'],
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                counting_timestamp=None,
            )

            # Update running bill
            admission.running_bill += net

            return CommandResult(
                command_type=CommandType.PHARMACY,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.PHARMACY,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_consumable(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CONSUMABLE command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.CONSUMABLE,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="CONSUMABLE requires timestamp, admission ID, event ID, item code, and quantity"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            item_code = parsed_command.args[3]
            qty = int(parsed_command.args[4])

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.CONSUMABLE,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            if item_code not in self.loader.tariffs:
                return CommandResult(
                    command_type=CommandType.CONSUMABLE,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ITEM",
                    error_detail=f"Item {item_code} not found in tariffs"
                )

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            # BR-04: Consumables uses MRP (1.00 multiplier)
            charge_result = self.pricing_service.calculate_charge(
                tariff.base_rate, current_category, 'CONSUMABLE', qty=qty
            )

            # Consumables not discounted
            gross, discount_pct, discount_amt = charge_result['gross'], Decimal('0.00'), Decimal('0.00')

            # Consumables not GST eligible
            gst_amt = Decimal('0.00')
            net = gross - discount_amt + gst_amt

            # Record charge event
            self.demand_service.record_charge_event(
                adm_id, net, parsed_command.timestamp, 'CONSUMABLE'
            )

            # Add ledger entry
            self.ledger_service.add_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                head='CONSUMABLE',
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=qty,
                base_amount=tariff.base_rate,
                multiplier=charge_result['multiplier'],
                gross=charge_result['gross'],
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                counting_timestamp=None,
            )

            # Update running bill
            admission.running_bill += net

            return CommandResult(
                command_type=CommandType.CONSUMABLE,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.CONSUMABLE,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_investigation(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle INVESTIGATION command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.INVESTIGATION,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="INVESTIGATION requires timestamp, admission ID, event ID, item code, and quantity"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            item_code = parsed_command.args[3]
            qty = int(parsed_command.args[4])

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.INVESTIGATION,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            if item_code not in self.loader.tariffs:
                return CommandResult(
                    command_type=CommandType.INVESTIGATION,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ITEM",
                    error_detail=f"Item {item_code} not found in tariffs"
                )

            tariff = self.loader.tariffs[item_code]
            current_category = admission.allocated_category or admission.requested_category

            # BR-04: Investigations use investigation_multiplier
            charge_result = self.pricing_service.calculate_charge(
                tariff.base_rate, current_category, 'INVESTIGATION', qty=qty
            )

            # Investigations not discounted
            gross, discount_pct, discount_amt = charge_result['gross'], Decimal('0.00'), Decimal('0.00')

            # Investigations not GST eligible
            gst_amt = Decimal('0.00')
            net = gross - discount_amt + gst_amt

            # Record charge event
            self.demand_service.record_charge_event(
                adm_id, net, parsed_command.timestamp, 'INVESTIGATION'
            )

            # Add ledger entry
            self.ledger_service.add_entry(
                admission_id=adm_id,
                timestamp=parsed_command.timestamp,
                head='INVESTIGATION',
                item_code=item_code,
                description=tariff.description,
                category_at_event=current_category,
                qty=qty,
                base_amount=tariff.base_rate,
                multiplier=charge_result['multiplier'],
                gross=charge_result['gross'],
                discount_pct=discount_pct,
                discount_amt=discount_amt,
                gst_amt=gst_amt,
                net=net,
                counting_timestamp=None,
            )

            # Update running bill
            admission.running_bill += net

            return CommandResult(
                command_type=CommandType.INVESTIGATION,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.INVESTIGATION,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _apply_discounts(
        self,
        admission: Admission,
        amount: Decimal,
        charge_head: str
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Apply all applicable discounts to a charge amount."""
        discount_pct = Decimal('0.00')
        discount_amt = Decimal('0.00')
        discounted = amount

        # Senior citizen discount (BR-08): 10% on bed and nursing only
        if admission.senior and charge_head in ('BED', 'NURSING'):
            discounted, disc_amt = self.discount_service.apply_senior_discount(
                discounted, 60, charge_head
            )
            discount_amt += disc_amt
            discount_pct += Decimal('10.00')

        # Employee referral discount (BR-08): 15% on doctor fees
        if admission.employee_referral and charge_head == 'DOCTOR_VISIT':
            discounted, disc_amt = self.discount_service.apply_employee_referral_discount(
                discounted, True, charge_head
            )
            discount_amt += disc_amt
            discount_pct += Decimal('15.00')

        return discounted, discount_pct, discount_amt

    def _handle_deposit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle DEPOSIT command."""
        try:
            if len(parsed_command.args) < 3:
                return CommandResult(
                    command_type=CommandType.DEPOSIT,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="DEPOSIT requires timestamp, admission ID, and amount"
                )

            adm_id = parsed_command.args[1]
            amount_str = parsed_command.args[2]
            payment_mode = parsed_command.args[3] if len(parsed_command.args) > 3 else 'CASH'

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.DEPOSIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            try:
                amount = Decimal(amount_str)
            except ValueError:
                return CommandResult(
                    command_type=CommandType.DEPOSIT,
                    admission_id=adm_id,
                    success=False,
                    error_code="INVALID_AMOUNT",
                    error_detail=f"Invalid deposit amount: {amount_str}"
                )

            # Record deposit
            deposit = self.demand_service.record_deposit(
                adm_id, amount, parsed_command.timestamp, payment_mode
            )

            # Update admission deposits
            admission.deposits += amount

            # Check if this deposit satisfies any open demand
            for demand in self.demand_service.demands:
                if demand.admission_id == adm_id and demand.status == 'OPEN':
                    # Check if cumulative deposits since demand reach demand amount
                    deposits_since = sum(
                        d.amount for d in self.demand_service.deposits
                        if d.admission_id == adm_id and d.timestamp >= demand.demand_ts
                    )
                    if deposits_since >= demand.demand_amount:
                        demand.status = 'CLOSED'
                        demand.status_ts = parsed_command.timestamp
                        demand.outstanding = Decimal('0.00')

            # Check block lift after deposit
            self.demand_service.check_block_lift(adm_id, parsed_command.timestamp)

            return CommandResult(
                command_type=CommandType.DEPOSIT,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.DEPOSIT,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_interim_bill(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle INTERIM_BILL command."""
        try:
            adm_id = parsed_command.admission_id

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.INTERIM_BILL,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            # BR-09: Create interim bill and lock entries
            interim = self.ledger_service.create_interim_bill(
                adm_id, parsed_command.timestamp, 'MANUAL'
            )

            return CommandResult(
                command_type=CommandType.INTERIM_BILL,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.INTERIM_BILL,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_correction(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CORRECTION command."""
        try:
            if len(parsed_command.args) < 6:
                return CommandResult(
                    command_type=CommandType.CORRECTION,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="CORRECTION requires timestamp, admission ID, event ID, new quantity, and reason"
                )

            adm_id = parsed_command.args[1]
            event_id = parsed_command.args[2]
            new_qty = int(parsed_command.args[3])
            reason = parsed_command.args[4]

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.CORRECTION,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            # BR-09: Find the ledger entry for this event
            target_entry = None
            for entry in self.ledger_service.entries:
                if entry.item_code == event_id:
                    target_entry = entry
                    break

            if target_entry is None:
                return CommandResult(
                    command_type=CommandType.CORRECTION,
                    admission_id=adm_id,
                    success=False,
                    error_code="EVENT_NOT_FOUND",
                    error_detail=f"Event {event_id} not found in ledger"
                )

            # Check if entry is locked
            if self.ledger_service.is_entry_locked(target_entry.line_no):
                # BR-09: Locked events require signed adjustment line
                adjustment_net = target_entry.net * (Decimal(str(new_qty)) / Decimal(str(target_entry.qty))) - target_entry.net

                self.ledger_service.create_adjustment(
                    admission_id=adm_id,
                    original_line_no=target_entry.line_no,
                    timestamp=parsed_command.timestamp,
                    head=target_entry.head,
                    item_code=target_entry.item_code,
                    description=f"Correction: {reason}",
                    category_at_event=target_entry.category_at_event,
                    qty=new_qty,
                    base_amount=target_entry.base_amount,
                    multiplier=target_entry.multiplier,
                    gross=target_entry.gross * (Decimal(str(new_qty)) / Decimal(str(target_entry.qty))),
                    discount_pct=target_entry.discount_pct,
                    discount_amt=target_entry.discount_amt * (Decimal(str(new_qty)) / Decimal(str(target_entry.qty))),
                    gst_amt=target_entry.gst_amt,
                    net=adjustment_net,
                    is_positive=adjustment_net >= 0,
                )
            else:
                # Unlocked event: modify in place
                old_net = target_entry.net
                target_entry.qty = new_qty
                target_entry.gross = target_entry.base_amount * Decimal(str(new_qty)) * target_entry.multiplier
                target_entry.net = target_entry.gross - target_entry.discount_amt + target_entry.gst_amt

                # Update running bill
                admission.running_bill = admission.running_bill - old_net + target_entry.net

            return CommandResult(
                command_type=CommandType.CORRECTION,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.CORRECTION,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_charity(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CHARITY command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.CHARITY,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="CHARITY requires timestamp, admission ID, percentage, and CEO reference"
                )

            adm_id = parsed_command.args[1]
            charity_pct = Decimal(parsed_command.args[2])
            ceo_ref = parsed_command.args[3]

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.CHARITY,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            # Validate CEO reference (simplified - check non-empty)
            is_valid_ref = bool(ceo_ref and ceo_ref.strip())

            # Apply charity discount to running bill
            discounted, discount_amt = self.discount_service.apply_charity_discount(
                admission.running_bill, charity_pct, ceo_ref, is_valid_ref
            )

            # Update running bill
            admission.running_bill = discounted

            return CommandResult(
                command_type=CommandType.CHARITY,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.CHARITY,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_discharge(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle DISCHARGE command."""
        try:
            if len(parsed_command.args) < 5:
                return CommandResult(
                    command_type=CommandType.DISCHARGE,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="DISCHARGE requires timestamp, admission ID, discharge type, and order issued timestamp"
                )

            adm_id = parsed_command.args[1]
            discharge_type = parsed_command.args[2]
            order_issued_ts_str = parsed_command.args[3]

            admission = self.loader.admissions.get(adm_id)
            if not admission:
                return CommandResult(
                    command_type=CommandType.DISCHARGE,
                    admission_id=adm_id,
                    success=False,
                    error_code="UNKNOWN_ADMISSION",
                    error_detail=f"Admission {adm_id} not found"
                )

            if admission.status == "DISCHARGED":
                return CommandResult(
                    command_type=CommandType.DISCHARGE,
                    admission_id=adm_id,
                    success=False,
                    error_code="ALREADY_DISCHARGED",
                    error_detail=f"Admission {adm_id} already discharged"
                )

            # Parse order issued time
            try:
                order_issued_ts = datetime.strptime(order_issued_ts_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                order_issued_ts = parsed_command.timestamp

            # BR-10: Early discharge rule - discharge before 10:00 avoids extra bed day
            # only if DISCHARGE command was issued on previous day
            is_early_discharge = parsed_command.timestamp.hour < 10
            prev_day_command = order_issued_ts.date() < parsed_command.timestamp.date()

            # Calculate final bill: Total Charges - Discounts - Deposits
            total_charges = admission.running_bill
            discounts = Decimal('0.00')  # Would be tracked separately
            final_balance = self.ledger_service.calculate_balance(
                total_charges, discounts, admission.deposits
            )

            # Check payment gate
            if final_balance > 0 and admission.deposits < total_charges:
                return CommandResult(
                    command_type=CommandType.DISCHARGE,
                    admission_id=adm_id,
                    success=False,
                    error_code="INSUFFICIENT_DEPOSIT",
                    error_detail=f"Insufficient deposit for discharge. Balance due: {final_balance}"
                )

            # Update admission
            admission.status = "DISCHARGED"
            admission.discharge_type = discharge_type
            admission.discharge_time = parsed_command.timestamp
            admission.discharge_order_time = order_issued_ts
            admission.balance_due = final_balance

            # Release bed
            if admission.allocated_bed_id and admission.allocated_bed_id in self.loader.beds:
                bed = self.loader.beds[admission.allocated_bed_id]
                bed.status = "HOUSEKEEPING"  # Pending housekeeping
                bed.adm_id = None
                bed.since_ts = None

            return CommandResult(
                command_type=CommandType.DISCHARGE,
                admission_id=adm_id,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.DISCHARGE,
                admission_id=parsed_command.admission_id,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _handle_housekeeping_cleared(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle HOUSEKEEPING_CLEARED command."""
        try:
            if len(parsed_command.args) < 3:
                return CommandResult(
                    command_type=CommandType.HOUSEKEEPING_CLEARED,
                    admission_id=parsed_command.admission_id,
                    success=False,
                    error_code="INVALID_COMMAND",
                    error_detail="HOUSEKEEPING_CLEARED requires timestamp and bed ID"
                )

            bed_id = parsed_command.args[1]

            if bed_id not in self.loader.beds:
                return CommandResult(
                    command_type=CommandType.HOUSEKEEPING_CLEARED,
                    admission_id=None,
                    success=False,
                    error_code="UNKNOWN_BED",
                    error_detail=f"Bed {bed_id} not found"
                )

            bed = self.loader.beds[bed_id]

            if bed.status != "HOUSEKEEPING":
                return CommandResult(
                    command_type=CommandType.HOUSEKEEPING_CLEARED,
                    admission_id=None,
                    success=False,
                    error_code="NOT_IN_HOUSEKEEPING",
                    error_detail=f"Bed {bed_id} is not in housekeeping status"
                )

            # Clear housekeeping and make bed available
            bed.status = "AVAILABLE"
            bed.adm_id = None
            bed.since_ts = None
            bed.billing_category = None
            bed.hold_until = None

            return CommandResult(
                command_type=CommandType.HOUSEKEEPING_CLEARED,
                admission_id=None,
                success=True,
                event_id=self._generate_event_id()
            )

        except Exception as e:
            return CommandResult(
                command_type=CommandType.HOUSEKEEPING_CLEARED,
                admission_id=None,
                success=False,
                error_code="PROCESSING_ERROR",
                error_detail=str(e)
            )

    def _allocate_bed(self, category: Category, admission_id: str) -> Optional[str]:
        """Allocate a bed for the given category and admission."""
        try:
            # BR-02: Requested category allocation first
            # Find available beds in the requested category
            available_beds = [
                (bed_id, bed) for bed_id, bed in self.loader.beds.items()
                if bed.category == category and bed.is_available()
            ]

            if not available_beds:
                # BR-02: Next-higher category fallback
                upgrade_order = [
                    Category.GENERAL, Category.SEMI_PRIVATE,
                    Category.PRIVATE, Category.DELUXE
                ]
                current_rank = category.upgrade_rank
                for higher_cat in upgrade_order:
                    if higher_cat.upgrade_rank > current_rank:
                        available_beds = [
                            (bed_id, bed) for bed_id, bed in self.loader.beds.items()
                            if bed.category == higher_cat and bed.is_available()
                        ]
                        if available_beds:
                            # UPGRADE_FREE: charge at requested rate for 48 hours
                            break

            if not available_beds:
                return None

            # Sort by bed_id (string order) for deterministic selection
            available_beds.sort(key=lambda x: x[0])

            # Allocate the first available bed
            bed_id, bed = available_beds[0]
            bed.status = "OCCUPIED"
            bed.adm_id = admission_id
            bed.since_ts = datetime.now()
            bed.billing_category = category

            return bed_id

        except Exception:
            return None


# Global instance
command_processor = CommandProcessor(loader)


def process_commands(commands_file: str) -> Dict[str, CommandResult]:
    """Process commands from a command file."""
    results = {}

    # Load master data first
    load_all_master_data()

    # Read and parse commands
    with open(commands_file, 'r') as f:
        for line_number, line in enumerate(f, start=1):
            parsed_command = command_processor.parse_command(line, line_number)

            if parsed_command is None:
                continue

            # Process the command
            result = command_processor.process_command(parsed_command)
            results[str(line_number)] = result

    return results


def load_all_master_data() -> None:
    """Load all master data using the MasterDataLoader."""
    loader.load_all()