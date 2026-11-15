"""
Command parsing and processing for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module handles the parsing of command files, command validation, and command execution
for the billing engine.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from .models import (
    Category, Bed, Doctor, TariffItem, Package, Admission,
    Patient, BedAllocation, BedOccupancyPeriod, Transfer, StepDown,
    PackageEnrollment, PackageConversion, ChargeEvent, Deposit,
    Demand, InterimBill, LedgerEntry, Rejection
)
from .loaders import MasterDataLoader

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
        if len(self.args) > 1:
            self.admission_id = self.args[1]

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
                    command_type=CommandType(UNKNOWN_COMMAND),
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
                command_type=CommandType(UNKNOWN_COMMAND),
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
                CommandType.ADMIT: 2,  # ts, adm_id, deposit, payment_mode
                CommandType.RESERVE_BED: 2,  # ts, adm_id, planned_admit_ts
                CommandType.TRANSFER: 4,  # ts, adm_id, target_category, doctor_id
                CommandType.STEP_DOWN: 4,  # ts, adm_id, target_category, doctor_id
                CommandType.VISIT: 3,  # ts, adm_id, event_id, doctor_id
                CommandType.PROCEDURE: 6,  # ts, adm_id, event_id, item_code, doctor_id, emergency
                CommandType.OT: 7,  # ts, adm_id, event_id, ot_code, hours, surgeon_id, emergency
                CommandType.PHARMACY: 5,  # ts, adm_id, event_id, item_code, qty
                CommandType.CONSUMABLE: 5,  # ts, adm_id, event_id, item_code, qty
                CommandType.INVESTIGATION: 5,  # ts, adm_id, event_id, item_code, qty
                CommandType.DEPOSIT: 3,  # ts, adm_id, amount_or_FULL, payment_mode
                CommandType.INTERIM_BILL: 2,  # ts, adm_id
                CommandType.CORRECTION: 5,  # ts, adm_id, event_id, new_qty, reason
                CommandType.CHARITY: 4,  # ts, adm_id, pct, ceo_ref
                CommandType.DISCHARGE: 4,  # ts, adm_id, discharge_type, order_issued_ts
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

            adm_id = parsed_command.args[1]
            deposit = parsed_command.args[2]
            payment_mode = parsed_command.args[3] if len(parsed_command.args) > 3 else "CASH"

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
            bed_charge = self.loader.categories[requested_category.name].daily_bed_charge
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
                    command_id=CommandType.ADMIT,
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
        # TODO: Implement RESERVE_BED functionality
        return CommandResult(
            command_type=CommandType.RESERVE_BED,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="RESERVE_BED not yet implemented"
        )

    def _handle_transfer(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle TRANSFER command."""
        # TODO: Implement TRANSFER functionality
        return CommandResult(
            command_type=CommandType.TRANSFER,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="TRANSFER not yet implemented"
        )

    def _handle_step_down(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle STEP_DOWN command."""
        # TODO: Implement STEP_DOWN functionality
        return CommandResult(
            command_type=CommandType.STEP_DOWN,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="STEP_DOWN not yet implemented"
        )

    def _handle_visit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle VISIT command."""
        # TODO: Implement VISIT functionality
        return CommandResult(
            command_type=CommandType.VISIT,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="VISIT not yet implemented"
        )

    def _handle_procedure(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle PROCEDURE command."""
        # TODO: Implement PROCEDURE functionality
        return CommandResult(
            command_type=CommandType.PROCEDURE,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="PROCEDURE not yet implemented"
        )

    def _handle_ot(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle OT command."""
        # TODO: Implement OT functionality
        return CommandResult(
            command_type=CommandType.OT,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="OT not yet implemented"
        )

    def _handle_pharmacy(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle PHARMACY command."""
        # TODO: Implement PHARMACY functionality
        return CommandResult(
            command_type=CommandType.PHARMACY,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="PHARMACY not yet implemented"
        )

    def _handle_consumable(self, parsed_command: ParsedCommand) -> CommandResult:
        """Hanclose[CONSUMABLE command."""
        # TODO: Implement CONSUMABLE functionality
        return CommandResult(
            command_type=CommandType.CONSUMABLE,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="CONSUMABLE not yet implemented"
        )

    def _handle_investigation(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle INVESTIGATION command."""
        # TODO: Implement INVESTIGATION functionality
        return CommandResult(
            command_type=CommandType.INVESTIGATION,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="INVESTIGATION not yet implemented"
        )

    def _handle_deposit(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle DEPOSIT command."""
        # TODO: Implement DEPOSIT functionality
        return CommandResult(
            command_type=CommandType.DEPOSIT,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="DEPOSIT not yet implemented"
        )

    def _handle_interim_bill(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle INTERIM_BILL command."""
        # TODO: Implement INTERIM_BILL functionality
        return CommandResult(
            command_type=CommandType.INTERIM_BILL,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="INTERIM_BILL not yet implemented"
        )

    def _handle_correction(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CORRECTION command."""
        # TODO: Implement CORRECTION functionality
        return CommandResult(
            command_type=CommandType.CORRECTION,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="CORRECTION not yet implemented"
        )

    def _handle_charity(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle CHARITY command."""
        # TODO: Implement CHARITY functionality
        return CommandResult(
            command_type=CommandType.CHARITY,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="CHARITY not yet implemented"
        )

    def _handle_discharge(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle DISCHARGE command."""
        # TODO: Implement DISCHARGE functionality
        return CommandResult(
            command_type=CommandType.DISCHARGE,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="DISCHARGE not yet implemented"
        )

    def _handle_housekeeping_cleared(self, parsed_command: ParsedCommand) -> CommandResult:
        """Handle HOUSEKEEPING_CLEARED command."""
        # TODO: Implement HOUSEKEEPING_CLEARED functionality
        return CommandResult(
            command_type=CommandType.HOUSEKEEPING_CLEARED,
            admission_id=parsed_command.admission_id,
            success=False,
            error_code="NOT_IMPLEMENTED",
            error_detail="HOUSEKEEPING_CLEARED not yet implemented"
        )

    def _allocate_bed(self, category: Category, admission_id: str) -> Optional[str]:
        """Allocate a bed for the given category and admission."""
        try:
            # Find available beds in the requested category
            available_beds = [
                (bed_id, bed) for bed_id, bed in self.loader.beds.items()
                if bed.category == category and bed.is_available()
            ]

            if not available_beds:
                return None

            # Sort by bed_id (string order)
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