"""
Billing calculations for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module provides billing calculation functionality including bed-day charges,
nursing charges, and billing totals.
"""

from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Optional

from ..models import Category, Admission, ChargeEvent, LedgerEntry

__all__ = [
    'BillingCalculator',
]


class BillingCalculator:
    """
    Calculates billing amounts for admissions.
    
    Handles bed-day charges, nursing charges, and total billing calculations.
    """

    def __init__(self, categories: Dict[str, Category]):
        self.categories = categories

    def calculate_bed_charge(
        self,
        category: Category,
        bed_days: int,
        upgrade_free: bool = False,
        requested_category: Optional[Category] = None
    ) -> Decimal:
        """
        Calculate bed charge for a category over a number of bed days.

        Args:
            category: Bed category
            bed_days: Number of bed days
            upgrade_free: Whether UPGRADE_FREE window applies
            requested_category: Originally requested category (for UPGRADE_FREE)

        Returns:
            Total bed charge amount
        """
        if upgrade_free and requested_category:
            # Charge at requested category rate during UPGRADE_FREE window
            daily_rate = requested_category.daily_charge
        else:
            daily_rate = category.daily_charge

        return daily_rate * Decimal(str(bed_days))

    def calculate_nursing_charge(
        self,
        category: Category,
        bed_days: int
    ) -> Decimal:
        """Calculate nursing charge for a category over bed days."""
        daily_rate = category.nursing_charge
        return daily_rate * Decimal(str(bed_days))

    def calculate_icu_round_charge(
        self,
        category: Category,
        icu_days: int
    ) -> Decimal:
        """Calculate ICU round charge."""
        if category != Category.ICU:
            return Decimal('0.00')
        return category.nursing_charge * Decimal(str(icu_days))

    def calculate_subtotal(
        self,
        entries: List[LedgerEntry]
    ) -> Decimal:
        """Calculate subtotal from ledger entries."""
        return sum(entry.net for entry in entries)
