"""
Unit tests for BR-06: Package management and conversion.
BR-07: Deposit and top-up demand lifecycle.
BR-07a: Average daily charge and rounding.
BR-07b: Demand blocking and emergency handling.
BR-08: Discount rules.
"""

from datetime import datetime, timedelta
from decimal import Decimal, ROUND_UP

import pytest

from src.billing_engine import (
    Category,
    PackageService,
    DemandService,
    GSTService,
    DiscountService,
)


class TestPackages:
    """Tests for BR-06 package management and conversion."""

    def test_icu_exactly_48_hours_no_convert(self, package_service):
        """ICU exactly 48 hours does NOT trigger conversion."""
        should_convert, _, reason = package_service.check_package_conversion(
            'ADM-001', 'PKG-LAPCHOLE', Decimal('48.0'), False, datetime(2026, 1, 17, 10, 0, 0)
        )
        assert not should_convert

    def test_icu_more_than_48_hours_convert(self, package_service):
        """ICU more than 48 hours triggers conversion."""
        should_convert, _, reason = package_service.check_package_conversion(
            'ADM-001', 'PKG-LAPCHOLE', Decimal('48.01'), False, datetime(2026, 1, 17, 10, 0, 0)
        )
        assert should_convert
        assert reason == 'ICU_EXCEEDS_48_HOURS'

    def test_non_included_procedure_convert(self, package_service):
        """Non-included procedure triggers conversion."""
        should_convert, _, reason = package_service.check_package_conversion(
            'ADM-001', 'PKG-LAPCHOLE', Decimal('0.0'), True, datetime(2026, 1, 15, 10, 0, 0)
        )
        assert should_convert
        assert reason == 'NON_INCLUDED_PROCEDURE'

    def test_package_conversion_record(self, package_service):
        """Package conversion is recorded correctly."""
        conversion = package_service.convert_package(
            'ADM-001', 'PKG-01', datetime(2026, 1, 17, 10, 0, 0),
            ['EV-001', 'EV-002'], ['EV-003']
        )
        assert conversion.admission_id == 'ADM-001'
        assert conversion.original_package == 'PKG-01'
        assert conversion.conversion_time == datetime(2026, 1, 17, 10, 0, 0)
        assert len(conversion.covered_events) == 2
        assert len(conversion.repriced_events) == 1


class TestDemands:
    """Tests for BR-07: Deposit and top-up demand lifecycle."""

    def test_exactly_80_percent_no_demand(self, demand_service):
        """Exactly 80% does NOT trigger demand."""
        demand = demand_service.check_demand_trigger(
            'ADM-001', Decimal('8000.00'), Decimal('10000.00'),
            datetime(2026, 1, 15, 10, 0, 0)
        )
        assert demand is None

    def test_above_80_percent_demand(self, demand_service):
        """Above 80% triggers demand."""
        demand = demand_service.check_demand_trigger(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 15, 10, 0, 0), trigger_line_no=5
        )
        assert demand is not None
        assert demand.status == 'OPEN'

    def test_one_charge_bearing_day(self, demand_service):
        """One charge-bearing day is sufficient for demand."""
        demand_service.record_charge_event(
            'ADM-001', Decimal('100.00'), datetime(2026, 1, 15, 10, 0, 0), 'PHARMACY'
        )
        avg, days = demand_service.calculate_average_daily_charge(
            'ADM-001', datetime(2026, 1, 15, 10, 0, 0)
        )
        assert days == 1
        assert avg == Decimal('100.00')

    def test_two_charge_bearing_days(self, demand_service):
        """Two charge-bearing days sufficient."""
        demand_service.record_charge_event(
            'ADM-001', Decimal('100.00'), datetime(2026, 1, 15, 10, 0, 0), 'PHARMACY'
        )
        demand_service.record_charge_event(
            'ADM-001', Decimal('200.00'), datetime(2026, 1, 16, 10, 0, 0), 'PHARMACY'
        )
        avg, days = demand_service.calculate_average_daily_charge(
            'ADM-001', datetime(2026, 1, 16, 10, 0, 0)
        )
        assert days == 2
        assert avg == Decimal('150.00')

    def test_upward_rounding_to_100(self, demand_service):
        """Demand amount rounded upward to nearest ₹100."""
        demand_service.record_charge_event(
            'ADM-001', Decimal('250.00'), datetime(2026, 1, 15, 10, 0, 0), 'PHARMACY'
        )
        demand_amount = demand_service.calculate_demand_amount(
            'ADM-001', datetime(2026, 1, 15, 10, 0, 0)
        )
        # 250 / 100 = 2.5, rounded up = 3, * 100 = 300
        assert demand_amount == Decimal('300.00')

    def test_partial_deposit(self, demand_service):
        """Partial deposit reduces outstanding but doesn't close demand."""
        # Add charge events to create meaningful demand
        demand_service.record_charge_event(
            'ADM-001', Decimal('5000.00'), datetime(2026, 1, 15, 10, 0, 0), 'PHARMACY'
        )
        demand = demand_service.check_demand_trigger(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 15, 10, 0, 0)
        )
        assert demand is not None
        demand_id = demand.demand_id
        assert demand.demand_amount > Decimal('0.00')

        # Record partial deposit (less than demand amount)
        deposit = demand_service.record_deposit(
            'ADM-001', Decimal('100.00'), datetime(2026, 1, 15, 11, 0, 0),
            'CASH', demand_id
        )
        assert deposit.amount == Decimal('100.00')

        # Demand should still be OPEN
        updated_demand = None
        for d in demand_service.demands:
            if d.demand_id == demand_id:
                updated_demand = d
                break
        assert updated_demand is not None
        assert updated_demand.status == 'OPEN'
        assert updated_demand.outstanding > Decimal('0.00')

    def test_procedure_block_after_48_hours(self, demand_service):
        """Procedure block after 48 hours with open demand."""
        demand = demand_service.check_demand_trigger(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 15, 10, 0, 0)
        )
        assert demand is not None

        # Check block before 48 hours
        is_blocked, code = demand_service.check_procedure_block(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 16, 10, 0, 0), is_emergency=False
        )
        assert not is_blocked  # Before 48 hours

        # Check block after 48 hours
        is_blocked, code = demand_service.check_procedure_block(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 17, 10, 0, 1), is_emergency=False
        )
        assert is_blocked
        assert code == 'TOPUP_BLOCK'

    def test_emergency_procedure_allowed_during_block(self, demand_service):
        """Emergency procedures allowed during block."""
        demand = demand_service.check_demand_trigger(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 15, 10, 0, 0)
        )
        assert demand is not None

        is_blocked, code = demand_service.check_procedure_block(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 17, 10, 0, 1), is_emergency=True
        )
        assert not is_blocked

    def test_non_emergency_procedure_rejected_during_block(self, demand_service):
        """Non-emergency procedure rejected during block."""
        demand = demand_service.check_demand_trigger(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 15, 10, 0, 0)
        )
        assert demand is not None

        is_blocked, code = demand_service.check_procedure_block(
            'ADM-001', Decimal('8001.00'), Decimal('10000.00'),
            datetime(2026, 1, 17, 10, 0, 1), is_emergency=False
        )
        assert is_blocked
        assert code == 'TOPUP_BLOCK'


class TestGST:
    """Tests for BR-11: GST calculation."""

    def test_gst_below_threshold(self, gst_service):
        """₹5,000 exactly does NOT attract GST."""
        result = gst_service.calculate_gst(
            Decimal('5000.00'), Category.GENERAL
        )
        assert result['gst_amount'] == Decimal('0.00')
        assert result['applicable'] is False

    def test_gst_above_threshold(self, gst_service):
        """Above ₹5,000 attracts 5% GST."""
        result = gst_service.calculate_gst(
            Decimal('5500.00'), Category.PRIVATE
        )
        expected_gst = Decimal('5500.00') * Decimal('5.00') / Decimal('100')
        assert result['gst_amount'] == expected_gst
        assert result['applicable'] is True

    def test_gst_rate(self, gst_service):
        """GST rate is 5%."""
        assert GSTService.GST_RATE == Decimal('5.00')

    def test_gst_threshold(self, gst_service):
        """GST threshold is ₹5,000."""
        assert GSTService.GST_THRESHOLD == Decimal('5000.00')


class TestDiscounts:
    """Tests for BR-08: Discount rules."""

    def test_charity_with_valid_ceo_ref(self, discount_service):
        """Charity with valid CEO reference."""
        amount = Decimal('10000.00')
        discounted, disc_amt = discount_service.apply_charity_discount(
            amount, Decimal('50.00'), 'CEO-REF-001', True
        )
        assert discounted == Decimal('5000.00')
        assert disc_amt == Decimal('5000.00')

    def test_charity_invalid_ceo_ref(self, discount_service):
        """Charity with invalid CEO reference."""
        amount = Decimal('10000.00')
        discounted, disc_amt = discount_service.apply_charity_discount(
            amount, Decimal('50.00'), '', False
        )
        assert discounted == amount
        assert disc_amt == Decimal('0.00')

    def test_charity_max_50_percent(self, discount_service):
        """Charity capped at 50%."""
        amount = Decimal('10000.00')
        discounted, disc_amt = discount_service.apply_charity_discount(
            amount, Decimal('75.00'), 'CEO-REF-001', True
        )
        assert discounted == Decimal('5000.00')  # Capped at 50%
        assert disc_amt == Decimal('5000.00')
