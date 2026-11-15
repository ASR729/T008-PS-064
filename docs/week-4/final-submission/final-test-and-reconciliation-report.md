# Final Test and Reconciliation Evidence — PS-064 Team T008

**Project:** PS-064 Hospital Inpatient Billing and Bed Management Engine  
**Date:** 2026-11-15  
**Repository:** https://github.com/ASR729/T008-PS-064.git  
**Branch:** master  
**Commit:** `4bcca54` — "fix: resolve Week 4 defects and achieve 42/42 official output reconciliation"  
**Python:** 3.14.5 | **pytest:** 9.2.0

---

## 1. Environment

| Item | Value |
|------|-------|
| Operating system | Windows (PowerShell 5.1) |
| Python version | 3.14.5 |
| pytest version | 9.2.0 |
| Working directory | `C:\Users\asifr\OneDrive\Desktop\T008-PS-064` |
| Test command | `python -m pytest -q` (run from repo root) |
| Test configuration | No `pytest.ini`/`pyproject.toml`/`setup.cfg`; default discovery from repo root |
| External dependencies | None (Python standard library only) |
| Reconciliation command | `python scripts/run_reconciliation.py` |
| Entry point | `scripts/run_reconciliation.py` → `scripts.reconcile_outputs.run_sample_execution(...)` |

---

## 2. Full Test Suite Results

### Test counts

| Metric | Value |
|--------|-------|
| Tests collected | 75 |
| Passed | 75 |
| Failed | 0 |
| Skipped | 0 |
| Errors | 0 |
| Runtime | ~0.37s |
| Exit code | 0 |
| Warnings | 1 (PytestDeprecationWarning: `asyncio_default_fixture_loop_scope` unset — informational only) |

### Test file breakdown

| Test File | Focus | Business Rules / Edge Cases |
|-----------|-------|------------------------------|
| `tests/unit/test_bed_day_counting.py` | Bed-day counting | BR-01, EC-01/02/03 |
| `tests/unit/test_bed_allocation.py` | Bed allocation | BR-02, EC-04 |
| `tests/unit/test_transfers_pricing_visits.py` | Transfers, pricing, doctor visits | BR-03/04/05 |
| `tests/unit/test_packages_demands_gst.py` | Packages, demands, GST, discounts | BR-06/07/07a/07b/08/11, EC-05/06/07 |
| `tests/integration/test_sample_workflow.py` | End-to-end workflows | Integration |

### Verified command output

```
$ python -m pytest -q
75 passed in 0.37s
```
(Plus one informational PytestDeprecationWarning.)

**Independently re-verified at the start of Prompt 2.** Not copied from historical claims.

---

## 3. Official Sample-Data Workflow — First Execution

| Item | Value |
|------|-------|
| Commands file | `data/official/T008-PS-064-sample-data/commands.txt` |
| Command lines | 837 (839 physical lines − 2 comment lines − 0 blank lines) |
| Generated-output directory | `build/official-sample-run/` (dedicated, clean, not inside `expected_outputs/`) |
| Expected-output directory | `data/official/T008-PS-064-sample-data/expected_outputs/` (42 files) |
| Visible admissions | 18 (ADM-0001, 0002, 0003, 0005, 0008, 0010, 0013, 0019, 0020, 0022, 0023, 0026, 0027, 0028, 0030, 0033, 0036, 0038) |

### Reconciliation result (first execution)

```
=== RECONCILIATION REPORT ===
Files compared: 42
Matching: 42
Mismatching: 0
Missing: []
Extra: []
Total fields: 10223
Matching fields: 10223
Mismatching fields: 0
```

### Per-file results — all 42 MATCHED

| File Type | Count | Expected Rows | Actual Rows | Field Mismatches | Status |
|-----------|-------|---------------|-------------|------------------|--------|
| Patient ledgers (`ledger_ADM-XXXX.csv`) | 18 | 5–65 each | 5–65 each | 0 each | MATCHED |
| Final bills (`bill_ADM-XXXX.csv`) | 18 | 32 each | 32 each | 0 each | MATCHED |
| Top-up demands (`demands.csv`) | 1 | 3 | 3 | 0 | MATCHED |
| Rejections (`rejections.csv`) | 1 | 7 | 7 | 0 | MATCHED |
| Interim bills (`interim_bills.csv`) | 1 | 3 | 3 | 0 | MATCHED |
| Bed occupancy snapshots | 3 | 60 each | 60 each | 0 each | MATCHED |
| **Total** | **42** | — | — | **0** | **42/42 MATCHED** |

**Totals:** 42 expected, 42 generated, 42 matched, 0 mismatched, 0 missing, 0 extra, 0 field mismatches (10,223/10,223 fields).

### Comparator verification

The comparator (`scripts/reconcile_outputs.py`, functions `compare_csvs` and `reconcile_outputs`) was inspected:
- Pairs files by exact filename ✓
- Compares headers, row counts, and field-level values ✓
- Ignores only `description` (ledgers) and `detail` (rejections), per the output contract ✓
- Reports missing and extra files ✓
- Reports row-count differences ✓
- Does NOT weaken matching ✓
- No changes made to comparator matching rules ✓

**Independently re-verified.** Not copied from historical claims.

---

## 4. Official Sample-Data Workflow — Second Clean Execution

A second clean reconciliation was performed in a fresh, never-used output directory to confirm reproducibility.

| Item | Value |
|------|-------|
| Generated-output directory | `build/fresh-sample-run/` (fresh) |
| Expected-output directory | `data/official/T008-PS-064-sample-data/expected_outputs/` |

### Second execution result

```
Files compared: 42
Matching: 42
Mismatching: 0
Missing: []
Extra: []
Total fields: 10223
Matching fields: 10223
Mismatching fields: 0
```

**Result:** 42/42 matched, 0 mismatching, 0 missing, 0 extra, 10,223/10,223 fields — identical to the first execution. Reproducibility confirmed.

---

## 5. Official Inputs — Immutability Verified

| Check | Command | Result |
|-------|---------|--------|
| Official input files unchanged | `git diff -- data/official/` | Empty (no modifications) |
| Official expected outputs unchanged | `git diff -- data/official/expected_outputs/` | Empty (no modifications) |
| Expected outputs not generated from implementation | Source inspection | Generator writes to `build/` only; reads `expected_outputs/` as read-only |

Safety Rules 4 and 5 satisfied: official input/expected files never modified; expected outputs never generated from the implementation.

---

## 6. Historical Claims vs Independently Verified Reality

| Historical Claim | Source | Independently Verified Reality |
|------------------|--------|-------------------------------|
| 42 expected files | `docs/week-4/defect-correction/final-reconciliation.md` | **CONFIRMED** — 42 files in `expected_outputs/` |
| 42 generated files | Same | **CONFIRMED** — 42 files generated |
| 42 matched, 0 mismatched | Same | **CONFIRMED** — reconciliation output |
| 0 missing, 0 extra | Same | **CONFIRMED** — reconciliation output |
| 10,223 fields matched | Same | **CONFIRMED** — reconciliation output |
| 0 field mismatches | Same | **CONFIRMED** — reconciliation output |
| 75 tests pass | Same + `pytest -q` | **CONFIRMED** — 75 passed, 0 failed |
| Second clean execution 42/42 | `final-reconciliation.md` §Repeatability | **CONFIRMED** — fresh-sample-run produced 42/42 |

---

## 7. Financial Integrity Spot-Checks (via reconciliation)

All 18 final bills match expected exactly, confirming:
- `balance_due` / `refund_due` mutually exclusive (branching logic)
- GST 5% on BED head only, strictly above ₹5,000
- Senior (10% bed/nursing), employee (15% doctor), charity (≤50%) discounts
- `package_status` real (NONE/ACTIVE/COMPLETED/CONVERTED), not hardcoded
- `deposits_before_discharge` / `settlement_after_discharge` split real, not hardcoded

All 18 ledgers match, confirming:
- Category-at-event pricing
- Package-covered lines at 0.00 with `[PKG-<code>]`
- No cross-admission contamination

Demands (3/3), interim bills (3/3), and occupancy (3 × 60 beds) all match.

---

## 8. Acceptance Statement

| Criterion | Required | Actual | Status |
|-----------|----------|--------|--------|
| Tests passed | 75 | 75 | PASS |
| Expected files | 42 | 42 | PASS |
| Generated files | 42 | 42 | PASS |
| Matched files | 42 | 42 | PASS |
| Mismatched files | 0 | 0 | PASS |
| Missing files | 0 | 0 | PASS |
| Extra files | 0 | 0 | PASS |
| Total fields | 10,223 | 10,223 | PASS |
| Matching fields | 10,223 | 10,223 | PASS |
| Mismatching fields | 0 | 0 | PASS |
| Clean second execution | 42/42 | 42/42 | PASS |

**All criteria met.** The implementation produces verified, reproducible results matching the official expected outputs exactly.

---