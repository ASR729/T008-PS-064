import sys
sys.path.insert(0, '.')
from scripts.reconcile_outputs import run_sample_execution

report = run_sample_execution(
    'data/official/T008-PS-064-sample-data/commands.txt',
    'build/official-sample-run',
    'data/official/T008-PS-064-sample-data/expected_outputs'
)

print("=== RECONCILIATION REPORT ===")
print(f"Files compared: {report['compared']}")
print(f"Matching: {report['matching']}")
print(f"Mismatching: {report['mismatching']}")
print(f"Missing: {report['missing']}")
print(f"Extra: {report['extra']}")
print(f"Total fields: {report['total_fields']}")
print(f"Matching fields: {report['matching_fields']}")
print(f"Mismatching fields: {report['mismatching_fields']}")

print()
print("--- Per-file results ---")
for r in report['file_results']:
    status = "PASS" if r['field_mismatches'] == 0 and r['row_count_match'] and r['headers_match'] else "FAIL"
    print(f"  {r['file_type']} {r.get('admission_id', r.get('filename', ''))}: {status} "
          f"({r['field_matches']} match, {r['field_mismatches']} mismatch, "
          f"rows: {r['expected_rows']} vs {r['actual_rows']})")
    if r['mismatches'][:5]:
        for m in r['mismatches'][:5]:
            print(f"    Row {m['row']}, Col {m['column']}: expected={m['expected']}, actual={m['actual']}")
