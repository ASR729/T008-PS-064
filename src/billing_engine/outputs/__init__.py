"""
Output generation for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module provides output serialization for patient ledgers, final bills,
demands, interim bills, rejections, and bed occupancy snapshots.
"""

from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Optional, Any

from ..models import Admission, LedgerEntry, Demand, InterimBill, Rejection

__all__ = [
    'OutputGenerator',
    'LedgerOutput',
    'FinalBillOutput',
    'DemandsOutput',
    'InterimBillsOutput',
    'RejectionsOutput',
    'OccupancyOutput',
]


class LedgerOutput:
    """Patient ledger output format."""

    HEADER = [
        'line_no', 'event_ts', 'counting_ts', 'head', 'item_code',
        'description', 'category_at_event', 'qty', 'base_amount',
        'multiplier', 'gross', 'discount_pct', 'discount_amt',
        'gst_amt', 'net', 'locked_by_interim'
    ]

    @classmethod
    def serialize_entry(cls, entry: LedgerEntry) -> List[str]:
        """Serialize a ledger entry to output row."""
        return [
            str(entry.line_no),
            entry.event_ts.strftime('%Y-%m-%d %H:%M:%S'),
            entry.counting_ts.strftime('%Y-%m-%d %H:%M:%S') if entry.counting_ts else '',
            entry.head,
            entry.item_code,
            entry.description,
            entry.category_at_event.value,
            str(entry.qty),
            str(entry.base_amount),
            str(entry.multiplier),
            str(entry.gross),
            str(entry.discount_pct),
            str(entry.discount_amt),
            str(entry.gst_amt),
            str(entry.net),
            entry.locked_by_interim or '',
        ]

    @classmethod
    def generate(
        cls,
        admission_id: str,
        entries: List[LedgerEntry]
    ) -> str:
        """Generate ledger output for an admission."""
        lines = [','.join(cls.HEADER)]
        for entry in entries:
            lines.append(','.join(cls.serialize_entry(entry)))
        return '\n'.join(lines)


class FinalBillOutput:
    """Final bill output format."""

    HEADER = [
        'admission_id', 'patient_name', 'total_charges', 'discounts',
        'gst', 'deposits', 'final_balance', 'discharge_status',
        'refund_obligation'
    ]

    @classmethod
    def generate(
        cls,
        admission: Admission,
        total_charges: Decimal,
        discounts: Decimal,
        gst: Decimal,
        deposits: Decimal
    ) -> str:
        """Generate final bill output."""
        balance = total_charges - discounts - deposits
        refund = max(Decimal('0.00'), -balance)

        lines = [','.join(cls.HEADER)]
        lines.append(','.join([
            admission.adm_id,
            admission.patient_name,
            str(total_charges),
            str(discounts),
            str(gst),
            str(deposits),
            str(balance),
            admission.discharge_type or 'ACTIVE',
            str(refund),
        ]))
        return '\n'.join(lines)


class DemandsOutput:
    """Demands output format."""

    HEADER = [
        'demand_id', 'admission_id', 'demand_ts', 'trigger_line_no',
        'running_bill', 'deposits_at_demand', 'threshold_80pct',
        'avg_daily_charge', 'demand_amount', 'outstanding', 'status'
    ]

    @classmethod
    def generate(cls, demands: List[Demand]) -> str:
        """Generate demands output."""
        lines = [','.join(cls.HEADER)]
        for demand in demands:
            lines.append(','.join([
                demand.demand_id,
                demand.admission_id,
                demand.demand_ts.strftime('%Y-%m-%d %H:%M:%S'),
                str(demand.trigger_line_no or ''),
                str(demand.running_bill),
                str(demand.deposits_at_demand),
                str(demand.threshold_80pct),
                str(demand.avg_daily_charge),
                str(demand.demand_amount),
                str(demand.outstanding),
                demand.status,
            ]))
        return '\n'.join(lines)


class InterimBillsOutput:
    """Interim bills output format."""

    HEADER = [
        'interim_id', 'admission_id', 'interim_ts', 'trigger',
        'lines_locked', 'gross_total', 'discount_total', 'gst_total',
        'running_bill', 'deposits_to_date', 'balance'
    ]

    @classmethod
    def generate(cls, interim_bills: List[InterimBill]) -> str:
        """Generate interim bills output."""
        lines = [','.join(cls.HEADER)]
        for bill in interim_bills:
            lines.append(','.join([
                bill.interim_id,
                bill.admission_id,
                bill.interim_ts.strftime('%Y-%m-%d %H:%M:%S'),
                bill.trigger,
                str(bill.lines_locked),
                str(bill.gross_total),
                str(bill.discount_total),
                str(bill.gst_total),
                str(bill.running_bill),
                str(bill.deposits_to_date),
                str(bill.balance),
            ]))
        return '\n'.join(lines)


class RejectionsOutput:
    """Rejections output format."""

    HEADER = [
        'line_no', 'command_ts', 'command', 'adm_id', 'code', 'detail'
    ]

    @classmethod
    def generate(cls, rejections: List[Rejection]) -> str:
        """Generate rejections output."""
        lines = [','.join(cls.HEADER)]
        for rejection in rejections:
            lines.append(','.join([
                str(rejection.line_no),
                rejection.command_ts.strftime('%Y-%m-%d %H:%M:%S'),
                rejection.command,
                rejection.adm_id or '',
                rejection.code,
                rejection.detail or '',
            ]))
        return '\n'.join(lines)


class OccupancyOutput:
    """Bed occupancy snapshot output format."""

    HEADER = [
        'bed_id', 'ward_id', 'ward_name', 'category', 'status',
        'adm_id', 'since_ts', 'billing_category', 'floor'
    ]

    @classmethod
    def generate_snapshot(
        cls,
        beds: Dict[str, Any],
        timestamp: datetime
    ) -> str:
        """Generate bed occupancy snapshot."""
        lines = [','.join(cls.HEADER)]
        for bed_id, bed in sorted(beds.items()):
            lines.append(','.join([
                bed.bed_id,
                bed.ward_id,
                bed.ward_name,
                bed.category.value,
                bed.status,
                bed.adm_id or '',
                bed.since_ts.strftime('%Y-%m-%d %H:%M:%S') if bed.since_ts else '',
                bed.billing_category.value if bed.billing_category else '',
                str(bed.floor),
            ]))
        return '\n'.join(lines)


class OutputGenerator:
    """
    Main output generator for all required output files.
    """

    def __init__(self, output_dir: str):
        self.output_dir = output_dir

    def write_ledger(
        self,
        admission_id: str,
        entries: List[LedgerEntry]
    ) -> str:
        """Write patient ledger file."""
        content = LedgerOutput.generate(admission_id, entries)
        filepath = f'{self.output_dir}/{admission_id}_ledger.csv'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath

    def write_final_bill(
        self,
        admission: Admission,
        total_charges: Decimal,
        discounts: Decimal,
        gst: Decimal,
        deposits: Decimal
    ) -> str:
        """Write final bill file."""
        content = FinalBillOutput.generate(
            admission, total_charges, discounts, gst, deposits
        )
        filepath = f'{self.output_dir}/{admission.adm_id}_final_bill.csv'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath

    def write_demands(self, demands: List[Demand]) -> str:
        """Write demands.csv file."""
        content = DemandsOutput.generate(demands)
        filepath = f'{self.output_dir}/demands.csv'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath

    def write_interim_bills(self, interim_bills: List[InterimBill]) -> str:
        """Write interim_bills.csv file."""
        content = InterimBillsOutput.generate(interim_bills)
        filepath = f'{self.output_dir}/interim_bills.csv'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath

    def write_rejections(self, rejections: List[Rejection]) -> str:
        """Write rejections.csv file."""
        content = RejectionsOutput.generate(rejections)
        filepath = f'{self.output_dir}/rejections.csv'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath

    def write_occupancy_snapshot(
        self,
        beds: Dict[str, Any],
        timestamp: datetime,
        snapshot_id: str
    ) -> str:
        """Write bed occupancy snapshot file."""
        content = OccupancyOutput.generate_snapshot(beds, timestamp)
        filepath = f'{self.output_dir}/occupancy_{snapshot_id}.csv'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath
