"""
Ledger management for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module provides financial ledger functionality including entry management,
balance tracking, and reconciliation.
"""

from decimal import Decimal
from typing import Dict, List, Optional

from ..models import LedgerEntry, InterimBill, Deposit, Demand

__all__ = [
    'LedgerManager',
]


class LedgerManager:
    """
    Manages patient financial ledger.
    
    Provides balance tracking, deposit management, and ledger reconciliation.
    """

    def __init__(self):
        self.entries: List[LedgerEntry] = []
        self.deposits: List[Deposit] = []
        self.demands: List[Demand] = []
        self.interim_bills: List[InterimBill] = []

    def add_deposit(
        self,
        admission_id: str,
        amount: Decimal,
        timestamp: datetime,
        payment_mode: str = 'CASH'
    ) -> Deposit:
        """Add a deposit to the ledger."""
        from ..models import Deposit
        deposit = Deposit(
            transaction_id=f'DEP-{admission_id}-{len(self.deposits) + 1}',
            admission_id=admission_id,
            amount=amount,
            timestamp=timestamp,
            payment_mode=payment_mode,
        )
        self.deposits.append(deposit)
        return deposit

    def get_total_deposits(self, admission_id: str) -> Decimal:
        """Get total deposits for an admission."""
        return sum(
            d.amount for d in self.deposits
            if d.admission_id == admission_id
        )

    def get_outstanding_demands(self, admission_id: str) -> List[Demand]:
        """Get open demands for an admission."""
        return [
            d for d in self.demands
            if d.admission_id == admission_id and d.status == 'OPEN'
        ]

    def calculate_gross_charges(self, admission_id: str) -> Decimal:
        """Calculate gross charges from ledger entries."""
        return sum(
            e.gross for e in self.entries
            # Filter by admission_id would need to be added to LedgerEntry
        )
