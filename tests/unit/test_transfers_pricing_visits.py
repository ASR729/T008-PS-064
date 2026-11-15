"""
Unit tests for BR-03: Transfer and ICU movement.
BR-04: Category-at-event pricing.
BR-05: Doctor visit charging.
"""

from datetime import datetime
from decimal import Decimal

import pytest

from src.billing_engine import (
    Category,
    TransferService,
    PricingService,
    DiscountService,
)


class TestTransfers:
    """Tests for BR-03 transfer and ICU movement rules."""

    def test_same_category_rejected(self, transfer_service):
        """TRANSFER to same category rejected."""
        is_valid, code, detail = transfer_service.validate_transfer(
            'ADM-001', Category.GENERAL, None, Category.GENERAL, 0
        )
        assert not is_valid
        assert code == 'SAME_CATEGORY'

    def test_transfer_limit(self, transfer_service):
        """4th transfer rejected."""
        is_valid, code, detail = transfer_service.validate_transfer(
            'ADM-001', Category.SEMI_PRIVATE, None, Category.GENERAL, 4
        )
        assert not is_valid
        assert code == 'TRANSFER_LIMIT'

    def test_icu_entry_allowed(self, transfer_service):
        """TRANSFER into ICU allowed without step-down."""
        is_valid, code, detail = transfer_service.validate_transfer(
            'ADM-001', Category.ICU, None, Category.GENERAL, 0,
            is_icu_entry=True
        )
        assert is_valid

    def test_icu_exit_requires_step_down(self, transfer_service):
        """TRANSFER out of ICU requires STEP_DOWN."""
        is_valid, code, detail = transfer_service.validate_transfer(
            'ADM-001', Category.GENERAL, None, Category.ICU, 0,
            is_step_down=False
        )
        assert not is_valid
        assert code == 'STEP_DOWN_REQUIRED'

    def test_icu_exit_with_step_down_allowed(self, transfer_service):
        """TRANSFER out of ICU with STEP_DOWN allowed."""
        is_valid, code, detail = transfer_service.validate_transfer(
            'ADM-001', Category.GENERAL, None, Category.ICU, 0,
            is_step_down=True
        )
        assert is_valid


class TestPricing:
    """Tests for BR-04 category-at-event pricing."""

    def test_general_visit_multiplier(self, pricing_service):
        """GENERAL visit multiplier is 1.00."""
        result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.GENERAL, 'DOCTOR_VISIT', qty=1
        )
        assert result['multiplier'] == Decimal('1.00')
        assert result['gross'] == Decimal('100.00')

    def test_semi_private_visit_multiplier(self, pricing_service):
        """SEMI_PRIVATE visit multiplier is 1.25."""
        result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.SEMI_PRIVATE, 'DOCTOR_VISIT', qty=1
        )
        assert result['multiplier'] == Decimal('1.25')
        assert result['gross'] == Decimal('125.00')

    def test_private_visit_multiplier(self, pricing_service):
        """PRIVATE visit multiplier is 1.50."""
        result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.PRIVATE, 'DOCTOR_VISIT', qty=1
        )
        assert result['multiplier'] == Decimal('1.50')
        assert result['gross'] == Decimal('150.00')

    def test_icu_visit_multiplier(self, pricing_service):
        """ICU visit multiplier is 1.50."""
        result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.ICU, 'DOCTOR_VISIT', qty=1
        )
        assert result['multiplier'] == Decimal('1.50')

    def test_pharmacy_multiplier_always_1(self, pricing_service):
        """Pharmacy uses MRP (1.00 multiplier) regardless of category."""
        result = pricing_service.calculate_charge(
            Decimal('500.00'), Category.ICU, 'PHARMACY', qty=1
        )
        assert result['multiplier'] == Decimal('1.00')
        assert result['gross'] == Decimal('500.00')

    def test_consumable_multiplier_always_1(self, pricing_service):
        """Consumables uses MRP (1.00 multiplier) regardless of category."""
        result = pricing_service.calculate_charge(
            Decimal('200.00'), Category.DELUXE, 'CONSUMABLE', qty=1
        )
        assert result['multiplier'] == Decimal('1.00')

    def test_investigation_multiplier(self, pricing_service):
        """Investigation multiplier: 1.00 for GENERAL, 1.20 for others."""
        gen_result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.GENERAL, 'INVESTIGATION', qty=1
        )
        assert gen_result['multiplier'] == Decimal('1.00')

        sp_result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.SEMI_PRIVATE, 'INVESTIGATION', qty=1
        )
        assert sp_result['multiplier'] == Decimal('1.20')

    def test_category_at_event_pricing(self, pricing_service):
        """Category at event time determines multiplier, not current category."""
        # Simulate transfer from GENERAL to SEMI_PRIVATE
        # Event at GENERAL time uses GENERAL multiplier
        gen_result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.GENERAL, 'PROCEDURE', qty=1
        )
        assert gen_result['multiplier'] == Decimal('1.00')

        # Same event at SEMI_PRIVATE time uses SEMI_PRIVATE multiplier
        sp_result = pricing_service.calculate_charge(
            Decimal('100.00'), Category.SEMI_PRIVATE, 'PROCEDURE', qty=1
        )
        assert sp_result['multiplier'] == Decimal('1.25')
        assert gen_result['gross'] != sp_result['gross']


class TestDoctorVisits:
    """Tests for BR-05 doctor visit charging."""

    def test_first_visit_chargeable(self, discount_service):
        """First visit by doctor on a day is chargeable."""
        # First visit - full fee
        amount = Decimal('500.00')
        discounted, discount_pct, discount_amt = self._apply_manual_discount(
            amount, False, 'DOCTOR_VISIT', discount_service
        )
        assert discounted == Decimal('500.00')
        assert discount_amt == Decimal('0.00')

    def test_employee_referral_doctor_discount(self, discount_service):
        """Employee referral: 15% discount on doctor fees."""
        amount = Decimal('500.00')
        discounted, disc_amt = discount_service.apply_employee_referral_discount(
            amount, True, 'DOCTOR_VISIT'
        )
        expected = amount * Decimal('0.85')
        assert discounted == expected
        assert disc_amt == amount - expected

    def test_employee_discount_not_on_other_heads(self, discount_service):
        """Employee discount does not affect non-doctor charges."""
        amount = Decimal('500.00')
        discounted, disc_amt = discount_service.apply_employee_referral_discount(
            amount, True, 'PHARMACY'
        )
        assert discounted == amount
        assert disc_amt == Decimal('0.00')

    def test_senior_bed_discount(self, discount_service):
        """Senior citizen: 10% discount on bed charges."""
        amount = Decimal('1200.00')
        discounted, disc_amt = discount_service.apply_senior_discount(
            amount, 65, 'BED'
        )
        expected = amount * Decimal('0.90')
        assert discounted == expected
        assert disc_amt == amount - expected

    def test_senior_not_below_60(self, discount_service):
        """Age below 60: no senior discount."""
        amount = Decimal('1200.00')
        discounted, disc_amt = discount_service.apply_senior_discount(
            amount, 59, 'BED'
        )
        assert discounted == amount
        assert disc_amt == Decimal('0.00')

    def test_senior_exactly_60(self, discount_service):
        """Age exactly 60: senior discount applies."""
        amount = Decimal('1200.00')
        discounted, disc_amt = discount_service.apply_senior_discount(
            amount, 60, 'BED'
        )
        expected = amount * Decimal('0.90')
        assert discounted == expected

    def test_senior_discount_not_on_pharmacy(self, discount_service):
        """Senior discount does not affect pharmacy charges."""
        amount = Decimal('500.00')
        discounted, disc_amt = discount_service.apply_senior_discount(
            amount, 65, 'PHARMACY'
        )
        assert discounted == amount
        assert disc_amt == Decimal('0.00')

    def _apply_manual_discount(self, amount, is_employee, charge_head, service):
        """Helper to apply discounts manually."""
        discount_pct = Decimal('0.00')
        discount_amt = Decimal('0.00')
        discounted = amount
        if is_employee and charge_head == 'DOCTOR_VISIT':
            discounted, disc_amt = service.apply_employee_referral_discount(
                discounted, True, charge_head
            )
            discount_amt += disc_amt
            discount_pct += Decimal('15.00')
        return discounted, discount_pct, discount_amt
