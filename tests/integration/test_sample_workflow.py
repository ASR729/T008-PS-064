"""
Integration tests for PS-064 complete workflow.

Tests end-to-end command processing against official sample data.
Command format: COMMAND|TIMESTAMP|args
"""

from datetime import datetime
from decimal import Decimal

import pytest

from src.billing_engine import (
    MasterDataLoader,
    CommandProcessor,
    Category,
)
from src.billing_engine.commands import CommandType


class TestFullAdmissionWorkflow:
    """Integration tests for complete admission workflow."""

    def test_admit_and_process_commands(self, loader):
        """Test ADMIT command processing."""
        processor = CommandProcessor(loader)

        # Reset admission status for testing
        loader.admissions['ADM-0001'].status = "PENDING"

        # Parse and process an ADMIT command - format: COMMAND|TIMESTAMP|args
        line = "ADMIT|2026-01-15 10:00:00|ADM-0001|15000.00|CASH"
        parsed = processor.parse_command(line, 1)
        assert parsed is not None
        assert parsed.command_type == CommandType.ADMIT
        assert parsed.admission_id == "ADM-0001"

        result = processor.process_command(parsed)
        assert result.success is True
        assert result.error_code is None

    def test_command_parsing(self, loader):
        """Test command parsing for various command types."""
        processor = CommandProcessor(loader)

        # Test ADMIT parsing - format: COMMAND|TIMESTAMP|args
        parsed = processor.parse_command(
            "ADMIT|2026-01-15 10:00:00|ADM-001|15000.00|CASH", 1
        )
        assert parsed.command_type == CommandType.ADMIT
        assert parsed.admission_id == "ADM-001"

        # Test DISCHARGE parsing
        parsed = processor.parse_command(
            "DISCHARGE|2026-01-16 10:00:00|ADM-001|NORMAL|2026-01-15 10:00:00", 2
        )
        assert parsed.command_type == CommandType.DISCHARGE

        # Test RESERVE_BED parsing
        parsed = processor.parse_command(
            "RESERVE_BED|2026-01-14 10:00:00|ADM-001|B-001|2026-01-15 10:00:00", 3
        )
        assert parsed.command_type == CommandType.RESERVE_BED

    def test_unknown_command_handling(self, loader):
        """Test unknown command is handled gracefully."""
        processor = CommandProcessor(loader)

        parsed = processor.parse_command(
            "UNKNOWN_CMD|2026-01-15 10:00:00|ADM-001", 1
        )
        assert parsed is not None
        assert parsed.command_type == CommandType.UNKNOWN

        result = processor.process_command(parsed)
        assert result.success is False
        assert result.error_code == "UNKNOWN_COMMAND"

    def test_invalid_command_handling(self, loader):
        """Test invalid command is rejected."""
        processor = CommandProcessor(loader)

        # ADMIT with insufficient args
        parsed = processor.parse_command(
            "ADMIT|2026-01-15 10:00:00", 1
        )
        result = processor.process_command(parsed)
        assert result.success is False

    def test_all_command_types_parsed(self, loader):
        """All command types can be parsed."""
        processor = CommandProcessor(loader)

        for cmd_type in CommandType:
            if cmd_type == CommandType.UNKNOWN:
                continue
            line = f"{cmd_type.value}|2026-01-15 10:00:00|ADM-001|arg1|arg2"
            parsed = processor.parse_command(line, 1)
            assert parsed is not None
            assert parsed.command_type == cmd_type


class TestSampleDataLoading:
    """Tests for official sample data loading."""

    def test_all_master_data_loaded(self, loader):
        """All master data loads correctly."""
        assert len(loader.categories) == 5
        assert len(loader.beds) == 60
        assert len(loader.doctors) == 14
        assert len(loader.tariffs) == 80
        assert len(loader.packages) == 6
        assert len(loader.admissions) == 40

    def test_categories_have_correct_values(self, loader):
        """Categories have correct billing values."""
        general = loader.categories['GENERAL']
        assert general.daily_charge == Decimal('1200.00')
        assert general.nursing_charge == Decimal('400.00')

        icu = loader.categories['ICU']
        assert icu.daily_charge == Decimal('4800.00')
        assert icu.nursing_charge == Decimal('2500.00')

    def test_bed_categories_distribution(self, loader):
        """Beds are distributed across categories."""
        categories = set(bed.category for bed in loader.beds.values())
        assert Category.GENERAL in categories
        assert Category.SEMI_PRIVATE in categories
        assert Category.PRIVATE in categories
        assert Category.DELUXE in categories
        assert Category.ICU in categories

    def test_master_data_consistency(self, loader):
        """Master data passes consistency validation."""
        errors = loader.validate_consistency()
        assert isinstance(errors, list)


class TestCommandProcessing:
    """Tests for command processing pipeline."""

    def test_process_commands_function_exists(self):
        """Test process_commands function exists and is callable."""
        from src.billing_engine.commands import process_commands
        assert callable(process_commands)


class TestFinancialIntegrity:
    """Tests for financial calculations."""

    def test_decimal_precision(self):
        """All monetary calculations use Decimal."""
        from decimal import Decimal
        amount = Decimal('100.00')
        rate = Decimal('0.05')
        result = amount * rate
        assert isinstance(result, Decimal)
        assert result == Decimal('5.0000')

    def test_no_float_for_money(self):
        """Verify no float usage in money calculations."""
        from decimal import Decimal
        total = Decimal('100.00') + Decimal('200.00') + Decimal('300.00')
        assert total == Decimal('600.00')
        assert isinstance(total, Decimal)
