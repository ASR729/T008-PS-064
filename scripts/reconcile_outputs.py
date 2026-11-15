"""
Output generation and reconciliation for PS-064 official sample execution.

Processes commands.txt, generates all required output files, and compares
against official expected_outputs/ field by field.
"""

import csv
import os
import shutil
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from src.billing_engine.commands import CommandProcessor, loader
from src.billing_engine.models import Category


def round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def round0(value: Decimal) -> Decimal:
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def format_decimal(value: Decimal) -> str:
    """Format Decimal with exactly 2 decimal places, no commas."""
    return f"{value:.2f}"


def run_sample_execution(
    commands_path: str,
    output_dir: str,
    expected_dir: str
) -> dict:
    """
    Execute the full command file and generate all outputs.
    
    Returns a reconciliation report dict.
    """
    # Initialize processor with fresh data
    fresh_loader = type(loader)()
    fresh_loader.load_all()
    processor = CommandProcessor(fresh_loader)
    
    # Register occupancy snapshot times
    occupancy_times = [
        datetime(2026, 10, 12, 10, 0, 0),
        datetime(2026, 10, 16, 12, 0, 0),
        datetime(2026, 10, 21, 12, 0, 0),
    ]
    for ts in occupancy_times:
        processor._occupancy_snapshot_times.add(ts)
    
    # Process all commands
    results = processor.process_commands_file(commands_path)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate outputs for each visible admission
    visible_admissions = [
        "ADM-0001", "ADM-0002", "ADM-0003", "ADM-0005", "ADM-0008",
        "ADM-0010", "ADM-0013", "ADM-0019", "ADM-0020", "ADM-0022",
        "ADM-0023", "ADM-0026", "ADM-0027", "ADM-0028", "ADM-0030",
        "ADM-0033", "ADM-0036", "ADM-0038",
    ]
    
    # Generate ledger files
    for adm_id in visible_admissions:
        entries = [e for e in processor._ledger_entries if e.admission_id == adm_id]
        ledger_path = os.path.join(output_dir, f"ledger_{adm_id}.csv")
        write_ledger(ledger_path, entries)
    
    # Generate final bill files
    for adm_id in visible_admissions:
        admission = processor.loader.admissions.get(adm_id)
        if admission and admission.status == "DISCHARGED":
            bill_path = os.path.join(output_dir, f"bill_{adm_id}.csv")
            adm_entries = [e for e in processor._ledger_entries if e.admission_id == adm_id]
            write_final_bill(bill_path, admission, adm_entries)
    
    # Generate demands.csv (only visible admissions)
    visible_demands = [d for d in processor.demand_service.demands if d.admission_id in visible_admissions]
    demands_path = os.path.join(output_dir, "demands.csv")
    write_demands(demands_path, visible_demands)
    
    # Generate rejections.csv (only visible admissions)
    visible_rejections = [r for r in processor._rejections if r.adm_id in visible_admissions]
    rejections_path = os.path.join(output_dir, "rejections.csv")
    write_rejections(rejections_path, visible_rejections)
    
    # Generate interim_bills.csv (only visible admissions)
    visible_interim = [b for b in processor._interim_bills if b.admission_id in visible_admissions]
    interim_path = os.path.join(output_dir, "interim_bills.csv")
    write_interim_bills(interim_path, visible_interim)
    
    # Generate bed occupancy snapshots from processor snapshots
    occupancy_times = [
        datetime(2026, 10, 12, 10, 0, 0),
        datetime(2026, 10, 16, 12, 0, 0),
        datetime(2026, 10, 21, 12, 0, 0),
    ]
    for ts in occupancy_times:
        ts_str = ts.strftime("%Y%m%d_%H%M")
        occ_path = os.path.join(output_dir, f"bed_occupancy_{ts_str}.csv")
        snapshot_beds = processor._occupancy_snapshots.get(ts, processor.loader.beds)
        write_occupancy(occ_path, snapshot_beds, ts)
    
    # Now reconcile against expected outputs
    report = reconcile_outputs(output_dir, expected_dir, visible_admissions)
    
    return report


def write_ledger(path: str, entries) -> None:
    """Write a ledger CSV file."""
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'line_no', 'event_ts', 'counting_ts', 'head', 'item_code',
            'description', 'category_at_event', 'qty', 'base_amount',
            'multiplier', 'gross', 'discount_pct', 'discount_amt',
            'gst_amt', 'net', 'locked_by_interim'
        ])
        for e in entries:
            counting_ts = e.counting_ts.strftime('%Y-%m-%d %H:%M:%S') if e.counting_ts else ''
            writer.writerow([
                e.line_no,
                e.event_ts.strftime('%Y-%m-%d %H:%M:%S'),
                counting_ts,
                e.head,
                e.item_code,
                e.description,
                e.category_at_event.value,
                e.qty,
                format_decimal(e.base_amount),
                format_decimal(e.multiplier),
                format_decimal(e.gross),
                format_decimal(e.discount_pct),
                format_decimal(e.discount_amt),
                format_decimal(e.gst_amt),
                format_decimal(e.net),
                e.locked_by_interim or '',
            ])


def write_final_bill(path: str, admission, entries) -> None:
    """Write a final bill CSV file."""
    # Calculate totals from entries
    bed_total = Decimal('0')
    nursing_total = Decimal('0')
    doctor_total = Decimal('0')
    procedure_total = Decimal('0')
    ot_total = Decimal('0')
    pharmacy_total = Decimal('0')
    consumable_total = Decimal('0')
    investigation_total = Decimal('0')
    package_total = Decimal('0')
    gst_total = Decimal('0')
    
    for e in entries:
        if e.head == 'BED':
            bed_total += e.gross
        elif e.head == 'NURSING':
            nursing_total += e.gross
        elif e.head == 'DOCTOR':
            doctor_total += e.gross
        elif e.head == 'PROCEDURE':
            procedure_total += e.gross
        elif e.head == 'OT':
            ot_total += e.gross
        elif e.head == 'PHARMACY':
            pharmacy_total += e.gross
        elif e.head == 'CONSUMABLE':
            consumable_total += e.gross
        elif e.head == 'INVESTIGATION':
            investigation_total += e.gross
        elif e.head == 'PACKAGE':
            package_total += e.gross
        gst_total += e.gst_amt
    
    gross_charges = round2(bed_total + nursing_total + doctor_total + procedure_total +
                          ot_total + pharmacy_total + consumable_total + investigation_total +
                          package_total)
    
    total_discounts = round2(admission.total_discounts)
    net_before_rounding = round2(gross_charges - total_discounts + gst_total)
    rounding = round0(net_before_rounding) - net_before_rounding
    final_bill = round0(net_before_rounding)
    
    balance_due = round2(max(Decimal('0'), final_bill - admission.deposits))
    refund_due = round2(max(Decimal('0'), admission.deposits - final_bill))
    
    if balance_due > Decimal('0'):
        bill_status = 'BALANCE_DUE'
        admission_status = 'DISCHARGE_PENDING_PAYMENT'
    elif refund_due > Decimal('0'):
        bill_status = 'REFUND_DUE'
        admission_status = 'DISCHARGED'
    else:
        bill_status = 'SETTLED'
        admission_status = 'DISCHARGED'
    
    planned = admission.planned_discharge if admission.planned_discharge is not None else False
    
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['section', 'item', 'value'])
        writer.writerow(['INFO', 'adm_id', admission.adm_id])
        writer.writerow(['INFO', 'admit_ts', admission.admit_ts.strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['INFO', 'discharge_ts', admission.discharge_time.strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['INFO', 'discharge_type', admission.discharge_type])
        writer.writerow(['INFO', 'planned_discharge', 'true' if planned else 'false'])
        bed_days_count = sum(1 for e in entries if e.head == 'BED'
                             and not e.description.startswith('REPRICE line'))
        writer.writerow(['INFO', 'bed_days', str(bed_days_count)])
        writer.writerow(['INFO', 'package_code', admission.package_code or ''])
        if admission.package_code:
            if admission.package_converted:
                package_status = 'CONVERTED'
            else:
                package_status = 'COMPLETED'
        else:
            package_status = 'NONE'
        writer.writerow(['INFO', 'package_status', package_status])
        writer.writerow(['HEAD', 'BED', format_decimal(bed_total)])
        writer.writerow(['HEAD', 'NURSING', format_decimal(nursing_total)])
        writer.writerow(['HEAD', 'DOCTOR', format_decimal(doctor_total)])
        writer.writerow(['HEAD', 'PROCEDURE', format_decimal(procedure_total)])
        writer.writerow(['HEAD', 'OT', format_decimal(ot_total)])
        writer.writerow(['HEAD', 'PHARMACY', format_decimal(pharmacy_total)])
        writer.writerow(['HEAD', 'CONSUMABLE', format_decimal(consumable_total)])
        writer.writerow(['HEAD', 'INVESTIGATION', format_decimal(investigation_total)])
        writer.writerow(['HEAD', 'PACKAGE', format_decimal(package_total)])
        writer.writerow(['TOTAL', 'gross_charges', format_decimal(gross_charges)])
        senior_bed_nursing = round2(sum(e.discount_amt for e in entries if e.head in ('BED', 'NURSING')))
        employee_doctor = round2(sum(e.discount_amt for e in entries if e.head == 'DOCTOR'))
        charity = round2(total_discounts - senior_bed_nursing - employee_doctor)
        writer.writerow(['DISCOUNT', 'senior_bed_nursing', format_decimal(senior_bed_nursing)])
        writer.writerow(['DISCOUNT', 'employee_doctor', format_decimal(employee_doctor)])
        writer.writerow(['DISCOUNT', 'charity', format_decimal(charity)])
        writer.writerow(['TOTAL', 'total_discounts', format_decimal(total_discounts)])
        writer.writerow(['TAX', 'gst_room', format_decimal(gst_total)])
        writer.writerow(['TOTAL', 'net_before_rounding', format_decimal(net_before_rounding)])
        writer.writerow(['ROUNDING', 'rounding', format_decimal(rounding)])
        writer.writerow(['TOTAL', 'final_bill', format_decimal(final_bill)])
        writer.writerow(['PAYMENT', 'deposits_before_discharge',
                          format_decimal(admission.deposits_before_discharge)])
        writer.writerow(['PAYMENT', 'settlement_after_discharge',
                          format_decimal(admission.settlement_after_discharge)])
        writer.writerow(['RESULT', 'balance_due', format_decimal(balance_due)])
        writer.writerow(['RESULT', 'refund_due', format_decimal(refund_due)])
        writer.writerow(['STATUS', 'bill_status', bill_status])
        writer.writerow(['STATUS', 'admission_status', admission_status])


def write_demands(path: str, demands) -> None:
    """Write demands.csv."""
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'demand_id', 'adm_id', 'seq', 'demand_ts', 'trigger_line_no',
            'running_bill', 'deposits_at_demand', 'threshold_80pct',
            'charges_last_3_days', 'days_with_charges', 'avg_daily_charge',
            'demand_amount', 'deposits_since_demand', 'outstanding',
            'status', 'status_ts', 'procedure_block_from', 'procedure_block_to'
        ])
        for d in demands:
            pb_from = d.procedure_block_from.strftime('%Y-%m-%d %H:%M:%S') if d.procedure_block_from else ''
            pb_to = d.procedure_block_to.strftime('%Y-%m-%d %H:%M:%S') if d.procedure_block_to else ''
            writer.writerow([
                d.demand_id, d.admission_id, d.seq,
                d.demand_ts.strftime('%Y-%m-%d %H:%M:%S'),
                d.trigger_line_no or '',
                format_decimal(d.running_bill),
                format_decimal(d.deposits_at_demand),
                format_decimal(d.threshold_80pct),
                format_decimal(d.charges_last_3_days),
                d.days_with_charges,
                format_decimal(d.avg_daily_charge),
                format_decimal(d.demand_amount),
                format_decimal(d.deposits_since_demand),
                format_decimal(d.outstanding),
                d.status,
                d.status_ts.strftime('%Y-%m-%d %H:%M:%S') if d.status_ts else '',
                pb_from, pb_to,
            ])


def write_rejections(path: str, rejections) -> None:
    """Write rejections.csv."""
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['line_no', 'command_ts', 'command', 'adm_id', 'code', 'detail'])
        for r in rejections:
            cmd_name = r.command.split('|')[0] if '|' in r.command else r.command
            writer.writerow([
                r.line_no,
                r.command_ts.strftime('%Y-%m-%d %H:%M:%S'),
                cmd_name,
                r.adm_id or '',
                r.code,
                r.detail or '',
            ])


def write_interim_bills(path: str, interim_bills) -> None:
    """Write interim_bills.csv."""
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'interim_id', 'adm_id', 'interim_ts', 'trigger', 'lines_locked',
            'last_line_no', 'gross_total', 'discount_total', 'gst_total',
            'running_bill', 'deposits_to_date', 'balance'
        ])
        for b in interim_bills:
            writer.writerow([
                b.interim_id, b.admission_id,
                b.interim_ts.strftime('%Y-%m-%d %H:%M:%S'),
                b.trigger, b.lines_locked, b.last_line_no,
                format_decimal(b.gross_total), format_decimal(b.discount_total),
                format_decimal(b.gst_total), format_decimal(b.running_bill),
                format_decimal(b.deposits_to_date), format_decimal(b.balance),
            ])


def write_occupancy(path: str, beds, timestamp: datetime) -> None:
    """Write bed occupancy snapshot."""
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'bed_id', 'ward_id', 'category', 'gender_restriction', 'status',
            'adm_id', 'since_ts', 'billing_category', 'hold_until'
        ])
        for bed_id in sorted(beds.keys()):
            bed = beds[bed_id]
            since_ts = bed.since_ts.strftime('%Y-%m-%d %H:%M:%S') if bed.since_ts else ''
            billing_cat = bed.billing_category.value if bed.billing_category else ''
            hold_until = bed.hold_until.strftime('%Y-%m-%d %H:%M:%S') if bed.hold_until else ''
            writer.writerow([
                bed.bed_id, bed.ward_id, bed.category.value, bed.gender_restriction,
                bed.status, bed.adm_id or '', since_ts, billing_cat, hold_until,
            ])


def read_csv(path: str) -> list:
    """Read a CSV file and return list of rows (excluding header)."""
    rows = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            rows.append(row)
    return header, rows


def compare_csvs(expected_path: str, actual_path: str, ignore_cols: list = None) -> dict:
    """Compare two CSV files field by field."""
    ignore_cols = ignore_cols or []
    
    exp_header, exp_rows = read_csv(expected_path)
    act_header, act_rows = read_csv(actual_path)
    
    result = {
        'expected_file': expected_path,
        'actual_file': actual_path,
        'headers_match': exp_header == act_header,
        'expected_header': exp_header,
        'actual_header': act_header,
        'expected_rows': len(exp_rows),
        'actual_rows': len(act_rows),
        'row_count_match': len(exp_rows) == len(act_rows),
        'field_matches': 0,
        'field_mismatches': 0,
        'mismatches': [],
    }
    
    # Compare rows
    min_rows = min(len(exp_rows), len(act_rows))
    for i in range(min_rows):
        exp_row = exp_rows[i]
        act_row = act_rows[i]
        for j in range(min(len(exp_header), len(act_header))):
            col_name = exp_header[j] if j < len(exp_header) else f'col_{j}'
            if col_name in ignore_cols:
                continue
            exp_val = exp_row[j] if j < len(exp_row) else ''
            act_val = act_row[j] if j < len(act_row) else ''
            if exp_val == act_val:
                result['field_matches'] += 1
            else:
                result['field_mismatches'] += 1
                result['mismatches'].append({
                    'row': i + 1,
                    'column': col_name,
                    'expected': exp_val,
                    'actual': act_val,
                })
    
    return result


def reconcile_outputs(output_dir: str, expected_dir: str, visible_admissions: list) -> dict:
    """Reconcile generated outputs against expected outputs."""
    report = {
        'expected_files': [],
        'actual_files': [],
        'compared': 0,
        'matching': 0,
        'mismatching': 0,
        'missing': [],
        'extra': [],
        'total_fields': 0,
        'matching_fields': 0,
        'mismatching_fields': 0,
        'file_results': [],
    }
    
    # Check ledger files
    for adm_id in visible_admissions:
        exp_path = os.path.join(expected_dir, f"ledger_{adm_id}.csv")
        act_path = os.path.join(output_dir, f"ledger_{adm_id}.csv")
        if os.path.exists(exp_path) and os.path.exists(act_path):
            result = compare_csvs(exp_path, act_path, ignore_cols=['description'])
            result['file_type'] = 'ledger'
            result['admission_id'] = adm_id
            report['file_results'].append(result)
            report['compared'] += 1
            if result['field_mismatches'] == 0 and result['row_count_match'] and result['headers_match']:
                report['matching'] += 1
            else:
                report['mismatching'] += 1
            report['total_fields'] += result['field_matches'] + result['field_mismatches']
            report['matching_fields'] += result['field_matches']
            report['mismatching_fields'] += result['field_mismatches']
        elif os.path.exists(exp_path):
            report['missing'].append(f"ledger_{adm_id}.csv")
        elif os.path.exists(act_path):
            report['extra'].append(f"ledger_{adm_id}.csv")
    
    # Check bill files
    for adm_id in visible_admissions:
        exp_path = os.path.join(expected_dir, f"bill_{adm_id}.csv")
        act_path = os.path.join(output_dir, f"bill_{adm_id}.csv")
        if os.path.exists(exp_path) and os.path.exists(act_path):
            result = compare_csvs(exp_path, act_path)
            result['file_type'] = 'bill'
            result['admission_id'] = adm_id
            report['file_results'].append(result)
            report['compared'] += 1
            if result['field_mismatches'] == 0 and result['row_count_match'] and result['headers_match']:
                report['matching'] += 1
            else:
                report['mismatching'] += 1
            report['total_fields'] += result['field_matches'] + result['field_mismatches']
            report['matching_fields'] += result['field_matches']
            report['mismatching_fields'] += result['field_mismatches']
        elif os.path.exists(exp_path):
            report['missing'].append(f"bill_{adm_id}.csv")
        elif os.path.exists(act_path):
            report['extra'].append(f"bill_{adm_id}.csv")
    
    # Check demands.csv
    exp_path = os.path.join(expected_dir, "demands.csv")
    act_path = os.path.join(output_dir, "demands.csv")
    if os.path.exists(exp_path) and os.path.exists(act_path):
        result = compare_csvs(exp_path, act_path)
        result['file_type'] = 'demands'
        report['file_results'].append(result)
        report['compared'] += 1
        if result['field_mismatches'] == 0 and result['row_count_match'] and result['headers_match']:
            report['matching'] += 1
        else:
            report['mismatching'] += 1
        report['total_fields'] += result['field_matches'] + result['field_mismatches']
        report['matching_fields'] += result['field_matches']
        report['mismatching_fields'] += result['field_mismatches']
    
    # Check rejections.csv
    exp_path = os.path.join(expected_dir, "rejections.csv")
    act_path = os.path.join(output_dir, "rejections.csv")
    if os.path.exists(exp_path) and os.path.exists(act_path):
        result = compare_csvs(exp_path, act_path, ignore_cols=['detail'])
        result['file_type'] = 'rejections'
        report['file_results'].append(result)
        report['compared'] += 1
        if result['field_mismatches'] == 0 and result['row_count_match'] and result['headers_match']:
            report['matching'] += 1
        else:
            report['mismatching'] += 1
        report['total_fields'] += result['field_matches'] + result['field_mismatches']
        report['matching_fields'] += result['field_matches']
        report['mismatching_fields'] += result['field_mismatches']
    
    # Check interim_bills.csv
    exp_path = os.path.join(expected_dir, "interim_bills.csv")
    act_path = os.path.join(output_dir, "interim_bills.csv")
    if os.path.exists(exp_path) and os.path.exists(act_path):
        result = compare_csvs(exp_path, act_path)
        result['file_type'] = 'interim_bills'
        report['file_results'].append(result)
        report['compared'] += 1
        if result['field_mismatches'] == 0 and result['row_count_match'] and result['headers_match']:
            report['matching'] += 1
        else:
            report['mismatching'] += 1
        report['total_fields'] += result['field_matches'] + result['field_mismatches']
        report['matching_fields'] += result['field_matches']
        report['mismatching_fields'] += result['field_mismatches']
    
    # Check bed occupancy files
    occupancy_files = [
        "bed_occupancy_20261012_1000.csv",
        "bed_occupancy_20261016_1200.csv",
        "bed_occupancy_20261021_1200.csv",
    ]
    for occ_file in occupancy_files:
        exp_path = os.path.join(expected_dir, occ_file)
        act_path = os.path.join(output_dir, occ_file)
        if os.path.exists(exp_path) and os.path.exists(act_path):
            result = compare_csvs(exp_path, act_path)
            result['file_type'] = 'occupancy'
            result['filename'] = occ_file
            report['file_results'].append(result)
            report['compared'] += 1
            if result['field_mismatches'] == 0 and result['row_count_match'] and result['headers_match']:
                report['matching'] += 1
            else:
                report['mismatching'] += 1
            report['total_fields'] += result['field_matches'] + result['field_mismatches']
            report['matching_fields'] += result['field_matches']
            report['mismatching_fields'] += result['field_mismatches']
    
    return report


if __name__ == '__main__':
    commands_path = 'data/official/T008-PS-064-sample-data/commands.txt'
    output_dir = 'build/official-sample-run'
    expected_dir = 'data/official/T008-PS-064-sample-data/expected_outputs'
    
    report = run_sample_execution(commands_path, output_dir, expected_dir)
    
    print("=== RECONCILIATION REPORT ===")
    print(f"Files compared: {report['compared']}")
    print(f"Matching: {report['matching']}")
    print(f"Mismatching: {report['mismatching']}")
    print(f"Missing: {report['missing']}")
    print(f"Extra: {report['extra']}")
    print(f"Total fields: {report['total_fields']}")
    print(f"Matching fields: {report['matching_fields']}")
    print(f"Mismatching fields: {report['mismatching_fields']}")
    
    print("\n--- Per-file results ---")
    for r in report['file_results']:
        status = "PASS" if r['field_mismatches'] == 0 and r['row_count_match'] and r['headers_match'] else "FAIL"
        print(f"  {r['file_type']} {r.get('admission_id', r.get('filename', ''))}: {status} "
              f"({r['field_matches']} match, {r['field_mismatches']} mismatch, "
              f"rows: {r['expected_rows']} vs {r['actual_rows']})")
        if r['mismatches'][:5]:
            for m in r['mismatches'][:5]:
                print(f"    Row {m['row']}, Col {m['column']}: expected={m['expected']}, actual={m['actual']}")
