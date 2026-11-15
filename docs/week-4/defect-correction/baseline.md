# Phase 1 Baseline — Official Sample Execution

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`
**Branch/commit:** `master` @ `5d463d8`
**Date:** 2026-11-15

## 1. Exact commands used

PowerShell, run from repo root `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`:

```powershell
python -m pytest -q
python scripts/run_reconciliation.py
```

Python version: `3.14.5`; pytest `9.2.0`.

Runner/entry point: `scripts/run_reconciliation.py` → `scripts.reconcile_outputs.run_sample_execution(
    'data/official/T008-PS-064-sample-data/commands.txt',
    'build/official-sample-run',
    'data/official/T008-PS-064-sample-data/expected_outputs'
)`.

Generated-output directory: `build/official-sample-run/` (dedicated, clean, not inside `expected_outputs/`).

## 2. Command processing

- `commands.txt`: 839 physical lines, 2 comment lines, 0 blank lines → **837 command lines**.
- All 837 commands processed by `CommandProcessor.process_commands_file`.

## 3. Test results

| Suite | Result |
|---|---|
| Full `pytest -q` | **75 passed**, 0 failed |
| Unit tests | included above, all pass |
| Integration tests | included above, all pass |

## 4. Reconciliation results (baseline, pre-fix)

`python scripts/run_reconciliation.py` output:

```
=== RECONCILIATION REPORT ===
Files compared: 42
Matching: 1
Mismatching: 41
Missing: []
Extra: []
Total fields: 10223
Matching fields: 6890
Mismatching fields: 3333
```

Per-file summary (only `rejections.csv` matched):

| File | Status | Expected rows | Actual rows | Field mismatches |
|---|---|---|---|---|
| rejections.csv | MATCHED | 7 | 7 | 0 |
| demands.csv | FAIL | 3 | 19 | 45 |
| interim_bills.csv | FAIL | 3 | 3 | 18 |
| occupancy (3 files) | FAIL x3 | 60 each | 60 each | 8 / 21 / 26 |
| 18 ledgers | FAIL x18 | varies | varies | 43 .. 149+ |
| 18 bills | FAIL x18 | 32 each | 32 each | 10 .. 12 |

## 5. Baseline acceptance evidence

| Metric | Actual result |
|---|---|
| Expected output files | 42 |
| Generated output files | 42 |
| Matched files | 1 |
| Mismatched files | 41 |
| Missing files | 0 |
| Unexpected files | 0 |
| Total field differences | 3333 |
| Unit tests | 75 passed |
| Integration tests | passed |
| Command processing | 837 commands processed |

## 6. Representative mismatches (first 10 per file class)

**ledger_ADM-0001** (expected 11 rows, actual 15): phantom ICU bed-day lines `BED-ICU`/`NUR-ICU`/`ICU-ROUNDS` at `2026-10-03 08:00:00` and `2026-10-04 08:00:00` although ADM-0001 is GENERAL and never enters ICU.

**ledger_ADM-0002** (expected 16, actual 23): row 1 expected PHARMACY at `14:34:00`, actual BED-GENERAL at `12:00:00` — bed-day lines posted ahead of charge events and with wrong ordering/category.

**ledger_ADM-0027** (expected 26, actual ~340): package coverage not applied (covered lines at full price, no `[PKG-HERNIA]` prefix); `_convert_package` cross-admission contamination producing hundreds of spurious REPRICE lines with wrong categories/descriptions.

**demands.csv** (expected 3, actual 19): 19 rows across 12 admissions instead of 3; `trigger_line_no` blank/0 because `_line_counter` is never incremented; inflated by phantom ICU charges.

**interim_bills.csv** (3 rows): ADM-0023-IB1 gross expected `96934.35` actual `103634.35` (+6700, downstream of phantom charges).

**bed_occupancy_20261012_1000.csv**: DX-02 expected `OCCUPIED ADM-0021 PRIVATE`, actual `AVAILABLE` — occupancy snapshot captured before the ADMIT handler whose timestamp equals the snapshot time; 10-16 and 10-21 snapshots fall back to final bed state (no command at exactly those timestamps).

**bill_*.csv**: `package_status` hardcoded `NONE`; all discount components (`senior_bed_nursing`, `employee_doctor`, `charity`) hardcoded `0.00`; `settlement_after_discharge` hardcoded `0.00`.

## 7. Suspected root cause classification

| Problem category | Evidence |
|---|---|
| Event ordering / bed-day timing | Bed-day lines posted before charge events; phantom ICU at 08:00 anchor for non-ICU patients |
| State tracking | `_is_occupying_at` ignores actual bed category; `_get_category_at_time` returns current not historical category |
| Business logic | Package coverage not applied at posting; conversion cross-admission / item_code-deduped |
| Output generation | `write_final_bill` hardcodes package_status, discounts, settlement |
| Comparator behaviour | None — comparator is correct; `rejections.csv` already matches |

## 8. Readiness for Phase 2

Baseline is reproducible and documented. Proceed to defect-register.md and controlled fix–verify cycles, starting with bed-day counting (Defect A), which cascades into demands, interim bills, and packages.
