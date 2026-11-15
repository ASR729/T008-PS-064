# Final Reconciliation Report — PS-064 Week 4

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`
**Branch/commit:** `master` @ `5d463d8`
**Verification date:** 2026-11-15
**Reconciliation command:** `python scripts/run_reconciliation.py` (CWD = repo root)
**Python:** 3.14.5, **pytest:** 9.2.0

## Summary

| Metric | Result |
|---|---|
| Expected output files | 42 |
| Generated output files | 42 |
| Matched files | 42 |
| Mismatched files | 0 |
| Missing files | 0 |
| Unexpected/extra files | 0 |
| Total fields compared | 10,223 |
| Matching fields | 10,223 |
| Mismatching fields | 0 |
| Unit tests | 75 passed |
| Command lines processed | 837 |

## Per-File Reconciliation

| Expected File | Generated File | Expected Rows | Actual Rows | Field Mismatches | Status |
|---|---|---|---|---|---|
| ledger_ADM-0001.csv | ledger_ADM-0001.csv | 11 | 11 | 0 | MATCHED |
| ledger_ADM-0002.csv | ledger_ADM-0002.csv | 16 | 16 | 0 | MATCHED |
| ledger_ADM-0003.csv | ledger_ADM-0003.csv | 26 | 26 | 0 | MATCHED |
| ledger_ADM-0005.csv | ledger_ADM-0005.csv | 5 | 5 | 0 | MATCHED |
| ledger_ADM-0008.csv | ledger_ADM-0008.csv | 9 | 9 | 0 | MATCHED |
| ledger_ADM-0010.csv | ledger_ADM-0010.csv | 18 | 18 | 0 | MATCHED |
| ledger_ADM-0013.csv | ledger_ADM-0013.csv | 16 | 16 | 0 | MATCHED |
| ledger_ADM-0019.csv | ledger_ADM-0019.csv | 22 | 22 | 0 | MATCHED |
| ledger_ADM-0020.csv | ledger_ADM-0020.csv | 15 | 15 | 0 | MATCHED |
| ledger_ADM-0022.csv | ledger_ADM-0022.csv | 17 | 17 | 0 | MATCHED |
| ledger_ADM-0023.csv | ledger_ADM-0023.csv | 31 | 31 | 0 | MATCHED |
| ledger_ADM-0026.csv | ledger_ADM-0026.csv | 22 | 22 | 0 | MATCHED |
| ledger_ADM-0027.csv | ledger_ADM-0027.csv | 26 | 26 | 0 | MATCHED |
| ledger_ADM-0028.csv | ledger_ADM-0028.csv | 65 | 65 | 0 | MATCHED |
| ledger_ADM-0030.csv | ledger_ADM-0030.csv | 21 | 21 | 0 | MATCHED |
| ledger_ADM-0033.csv | ledger_ADM-0033.csv | 31 | 31 | 0 | MATCHED |
| ledger_ADM-0036.csv | ledger_ADM-0036.csv | 14 | 14 | 0 | MATCHED |
| ledger_ADM-0038.csv | ledger_ADM-0038.csv | 13 | 13 | 0 | MATCHED |
| bill_ADM-0001.csv | bill_ADM-0001.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0002.csv | bill_ADM-0002.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0003.csv | bill_ADM-0003.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0005.csv | bill_ADM-0005.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0008.csv | bill_ADM-0008.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0010.csv | bill_ADM-0010.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0013.csv | bill_ADM-0013.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0019.csv | bill_ADM-0019.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0020.csv | bill_ADM-0020.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0022.csv | bill_ADM-0022.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0023.csv | bill_ADM-0023.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0026.csv | bill_ADM-0026.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0027.csv | bill_ADM-0027.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0028.csv | bill_ADM-0028.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0030.csv | bill_ADM-0030.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0033.csv | bill_ADM-0033.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0036.csv | bill_ADM-0036.csv | 32 | 32 | 0 | MATCHED |
| bill_ADM-0038.csv | bill_ADM-0038.csv | 32 | 32 | 0 | MATCHED |
| demands.csv | demands.csv | 3 | 3 | 0 | MATCHED |
| rejections.csv | rejections.csv | 7 | 7 | 0 | MATCHED |
| interim_bills.csv | interim_bills.csv | 3 | 3 | 0 | MATCHED |
| bed_occupancy_20261012_1000.csv | bed_occupancy_20261012_1000.csv | 60 | 60 | 0 | MATCHED |
| bed_occupancy_20261016_1200.csv | bed_occupancy_20261016_1200.csv | 60 | 60 | 0 | MATCHED |
| bed_occupancy_20261021_1200.csv | bed_occupancy_20261021_1200.csv | 60 | 60 | 0 | MATCHED |

**Totals:** 42 expected, 42 generated, 42 matched, 0 mismatched, 0 missing, 0 extra, 0 field mismatches.

## Comparator Verification

The comparator (`scripts/reconcile_outputs.py`) was inspected and verified:
- Pairs files by exact filename ✓
- Compares headers, row counts, and field-level values ✓
- Does not silently ignore meaningful fields (only `description` in ledgers and `detail` in rejections, as per output contract) ✓
- Reports missing and extra files ✓
- Reports row-count differences ✓
- Exits unsuccessfully when genuine mismatches remain ✓
- No changes made to comparator matching rules ✓

## Repeatability

A second clean reconciliation from a fresh output directory (`build/fresh-sample-run`) also produced **42/42 matched, 0 mismatching**, confirming reproducibility.
