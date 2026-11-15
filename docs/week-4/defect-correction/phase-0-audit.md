# Phase 0 Audit — PS-064 Week 4 Defect Correction

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`
**Branch:** `master`
**Date:** 2026-11-15

## 1. Current Git state

- HEAD / branch: `master` at commit `5d463d8` ("docs: finalize PS-064 Week 4 submission and evaluator materials").
- Remote `origin`: `https://github.com/ASR729/T008-PS-064.git`, `origin/HEAD -> origin/master`, `origin/master 5d463d8`.
- The previous claim that commit `5d463d8` was pushed is **confirmed** by the live repository (local and remote SHAs match).
- Recent history:
  - `5d463d8` docs: finalize PS-064 Week 4 submission and evaluator materials (HEAD)
  - `c1599de` feat: complete PS-064 Week 3 business rules and validation
  - `2c3b306` Add Week 2 core implementation (billing engine)
  - (older Week 0/1 commits)
- `git status`: working tree has **modified** `docs/progress/evidence-index.md` and `docs/progress/weekly-progress-checklist.md`; **untracked** `build/`, `debug_adm23.py`, `debug_adm23_2.py`, `debug_blocks.py`, `test_run.py`, several `docs/week-4/*.md` files, and `__pycache__` directories.
- No destructive git operations will be used. The untracked `build/` and debug scripts are pre-existing working-tree clutter, not part of the committed baseline.

## 2. Repository structure

```
src/billing_engine/  (all logic in package __init__.py files)
  commands/__init__.py     CommandProcessor + all command handlers + output generators
  models/__init__.py       Category, Bed, Doctor, Admission, LedgerEntry, Demand, ...
  services/__init__.py     BedDayCounter, PricingService, TransferService, PackageService,
                           DiscountService, GSTService, DemandService, LedgerService
  loaders/__init__.py      MasterDataLoader (global `loader`), CSV loading
  billing/ledger/outputs/  __init__.py only (duplicative output helpers, not used by runner)
scripts/
  run_reconciliation.py    entry point: calls scripts.reconcile_outputs.run_sample_execution
  reconcile_outputs.py     runs CommandProcessor, writes all outputs, reconciles vs expected
tests/
  conftest.py
  unit/                    test_bed_allocation, test_bed_day_counting, test_packages_demands_gst, test_transfers_pricing_visits
  integration/             test_sample_workflow
  reconciliation/          (empty)
data/official/T008-PS-064-sample-data/
  categories.csv beds.csv doctors.csv tariff.csv packages.csv admissions.csv commands.txt README.md
  expected_outputs/        42 files
build/official-sample-run/ generated outputs from a prior run (untracked)
```

Entry point used for the official run: `scripts/run_reconciliation.py` (CWD = repo root), which calls `reconcile_outputs.run_sample_execution(...)`.

## 3. Python environment

- Python: `3.14.5`
- pytest: `9.2.0`
- No `pytest.ini`/`pyproject.toml`/`setup.cfg`; pytest uses default discovery from repo root.
- `tests/conftest.py` imports `from src.billing_engine import (...)` so tests run from the repo root.

## 4. Test inventory

- `pytest -q`: **75 passed** in 0.64s (no failures).
- Test files:
  - `tests/unit/test_bed_allocation.py`
  - `tests/unit/test_bed_day_counting.py`
  - `tests/unit/test_packages_demands_gst.py`
  - `tests/unit/test_transfers_pricing_visits.py`
  - `tests/integration/test_sample_workflow.py`
- The 75 tests are largely smoke/parse tests; they do NOT exercise the official sample workflow or output reconciliation. Passing tests do not imply correct outputs.

## 5. Official input inventory

All inputs present and unchanged (must be preserved):

| File | Rows |
|---|---|
| `categories.csv` | 5 data rows |
| `beds.csv` | 60 data rows |
| `doctors.csv` | 14 data rows |
| `tariff.csv` | 80 data rows |
| `packages.csv` | 6 data rows |
| `admissions.csv` | 40 data rows |
| `commands.txt` | 839 physical lines; 2 comment lines; 0 blank lines; **837 command lines** |

Note: the README states "837 command lines (excluding comments)" — confirmed (839 - 2 comments - 0 blanks = 837).

## 6. Expected-output inventory

`expected_outputs/` contains **42 files**, matching the reported inventory:

| Type | Count | Files |
|---|---|---|
| ledger | 18 | `ledger_ADM-0001/0002/0003/0005/0008/0010/0013/0019/0020/0022/0023/0026/0027/0028/0030/0033/0036/0038.csv` |
| bill | 18 | `bill_<same 18>.csv` |
| demands | 1 | `demands.csv` |
| rejections | 1 | `rejections.csv` |
| interim_bills | 1 | `interim_bills.csv` |
| bed_occupancy | 3 | `bed_occupancy_20261012_1000.csv`, `_20261016_1200.csv`, `_20261021_1200.csv` |
| **Total** | **42** | |

18 visible admissions: ADM-0001, 0002, 0003, 0005, 0008, 0010, 0013, 0019, 0020, 0022, 0023, 0026, 0027, 0028, 0030, 0033, 0036, 0038.

## 7. Existing runner and comparator

`scripts/reconcile_outputs.py`:
- `run_sample_execution()` builds a fresh `CommandProcessor`, registers 3 occupancy snapshot times, processes `commands.txt`, writes outputs via local `write_*` functions, then `reconcile_outputs()` compares.
- Outputs are written to `build/official-sample-run/` (clean, dedicated dir — good; not inside `expected_outputs/`).
- Comparator `compare_csvs()` pairs by exact filename, ignores `description` (ledger) and `detail` (rejections) only, reports headers/rows/field mismatches, missing and extra files. It does **not** weaken matching.
- `write_final_bill` hardcodes `package_status=NONE`, all three discount components to `0.00`, `settlement_after_discharge=0.00`. These are output-generation defects (Defect F), not comparator defects.

## 8. Known defects from the two historical reports (A–G)

The historical reports describe Defects A–G (phantom ICU bed-day charges, package coverage/conversion/repricing, demand generation/top-up, interim bills/locking, occupancy snapshots, output generation/isolation, event ordering/bed-day timing). These are treated as hypotheses to confirm against the current source.

## 9. Contradictions found

- README says bed-day counting anchors are noon (12:00) and ICU 08:00; `CommandProcessor.process_timed_events()` has a comment "(Bed-day counting moved to finalize() for correct discharge handling.)" but `run_sample_execution` never calls `finalize()`. Bed days are instead posted inline in `process_command` via `_process_admission_bed_days`.
- `TransferService.MAX_TRANSFERS = 4` but `CommandProcessor.MAX_TRANSFERS = 3` (the processor's value of 3 matches the README's "4th transfer rejected" for ADM-0028).
- `Category` enum hardcodes rates/multipliers rather than reading them from `categories.csv`.
- `DemandService.check_demand_trigger` generates `DEM-<id>-<n>` demand IDs, but the README requires `<ADM-ID>-TD<n>`; the processor uses its own `_check_demand_trigger` (correct format) instead.
- `write_final_bill` hardcodes discounts/package_status/settlement, contradicting the bill output contract.

## 10. Baseline reconciliation (Phase 1 evidence, pre-fix)

Run: `python scripts/run_reconciliation.py` (CWD = repo root).

| Metric | Actual result |
|---|---|
| Expected output files | 42 |
| Generated output files | 42 |
| Matched files | 1 (rejections.csv) |
| Mismatched files | 41 |
| Missing files | 0 |
| Unexpected files | 0 |
| Total field differences | 3333 (of 10223 compared) |
| Unit tests | 75 passed |
| Integration tests | included in the 75, all pass |
| Command processing | 837 commands processed |

Confirmed defects against current source (sample of field mismatches):
- **ledger_ADM-0001:** phantom `BED-ICU`/`NUR-ICU`/`ICU-ROUNDS` at `08:00` on 10-03 and 10-04 although ADM-0001 is GENERAL and never enters ICU (15 rows vs 11 expected).
- **ledger_ADM-0027:** package coverage not applied (covered lines at full price, no `[PKG-HERNIA]` prefix); `_convert_package` scans ALL ledger entries (cross-admission contamination), dedupes by `item_code`, and emits wrong REPRICE categories/descriptions (hundreds of spurious REPRICE lines).
- **demands.csv:** 19 generated rows vs 3 expected; `trigger_line_no` blank/0 because `_line_counter` is never incremented.
- **interim_bills.csv:** wrong gross/running totals (downstream of inflated charges).
- **bed_occupancy_20261012_1000.csv:** DX-02 shows AVAILABLE but expected OCCUPIED ADM-0021 (snapshot captured before the ADMIT handler whose timestamp equals the snapshot time).
- **bill_*.csv:** `package_status` hardcoded `NONE`, discount components hardcoded `0.00`, `settlement_after_discharge` hardcoded `0.00`.

## 11. Files that must be preserved

- `data/official/T008-PS-064-sample-data/` (all CSVs and `commands.txt`, including `expected_outputs/`) — **immutable**.
- `scripts/reconcile_outputs.py` comparator logic (`compare_csvs` / `reconcile_outputs`) — do not weaken matching.
- Historical reports under `docs/week-4/` (week-4-baseline-audit.md, week-4-verification-report.md, etc.) — preserve as evidence.
- `docs/week-0/` and `docs/week-1/` source documents (business rules, edge cases, output contract, decision register).

## 12. Readiness decision for Phase 1

**READY.** The repository is intact, the official sample data is present, the baseline is reproducible (42/42 generated vs expected, 1 matched, 3333 field mismatches), and the full test suite passes (75). No damage detected. Proceed to Phase 1 baseline documentation and Phase 2 defect register.

## 13. Proposed dependency-ordered correction plan

1. Bed-day counting: ICU anchor must require actual ICU occupancy; anchor selection (08:00 ICU vs noon) must be exclusive; category at anchor must be historical (track transfer timeline); discharge early/planned detection ordering.
2. Package coverage: apply at charge posting (covered lines → 0.00 + `[PKG-<code>]`); day > LOS billed at package-category rate; PACKAGE line at discharge.
3. Package conversion: per-admission, event_id-keyed REPRICE lines with original counting_ts/category/line_no (`REPRICE line N`); ICU > 48h conversion trigger.
4. Charge calculation & category-at-event (historical category for multipliers).
5. Discounts & GST (line-level already largely correct; bill writer needs components).
6. Demand & top-up: `_line_counter` increment for `trigger_line_no`; BR-07a days-with-charges excludes zero-net lines.
7. Interim bill locking & adjustments (per-admission; downstream of charges).
8. Final bill / deposits / settlement split / refunds.
9. Occupancy snapshots: capture at correct clock time (after handler for exact-timestamp commands; internal events up to snapshot time otherwise).
10. Output generation: `write_final_bill` package_status, discount components, settlement split.
11. Remaining isolated mismatches; then full 42-file reconciliation.
