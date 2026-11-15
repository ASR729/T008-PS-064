# Phase 0 — Live Repository Baseline (Read-Only)

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`  
**Audit date:** 2026-11-15  
**Auditor:** Kilo (Senior Software Quality Assurance Engineer)  
**Status:** Read-only inspection — nothing modified, nothing staged, nothing pushed.

---

## 1. Git State

| Check | Command | Actual Result |
|-------|---------|---------------|
| Working tree status | `git status` | Branch: `master`. Modified (unstaged): `docs/progress/evidence-index.md`, `docs/progress/weekly-progress-checklist.md`. Untracked: `__pycache__/`, `build/`, `debug_adm23.py`, `debug_adm23_2.py`, `debug_blocks.py`, `test_run.py`, `scripts/__pycache__/`, `src/billing_engine/**/__pycache__/`, `tests/**/__pycache__/`, and untracked `docs/week-4/*.md` files (`demo-recording-checklist.md`, `demo-script.md`, `final-execution-report.md`, `final-submission-checklist.md`, `final-submission-email.md`, `live-code-modification-practice.md`, `viva-preparation.md`, `week-4-verification-report.md`). |
| Current branch | `git branch -a` | Local: `master` (current). Remote-tracking: `remotes/origin/master`, `remotes/origin/HEAD -> origin/master`. No other branches. |
| Current HEAD (full SHA) | `git log --oneline -1 --format="%H %s"` | `4bcca54a014377529397858cc5c6760dc9129e08` fix: resolve Week 4 defects and achieve 42/42 official output reconciliation |
| HEAD short SHA | `git log --oneline -1` | `4bcca54` |
| Recent commits | `git log --oneline -10` | `4bcca54` fix: resolve Week 4 defects...<br>`5d463d8` docs: finalize PS-064 Week 4 submission and evaluator materials<br>`c1599de` feat: complete PS-064 Week 3 business rules and validation<br>`2c3b306` Add Week 2 core implementation (billing engine)<br>`7e6b375` Correct Week 0 verification report with actual file counts<br>`92ab35b` Add Week 1 design documents (domain model, business rules, edge cases)<br>`5ca4d21` Add Week 1 design package (scope and glossary)<br>`62e0d33` Add Week 0 documentation and sample data<br>`7269551` Initial commit: PS-064 Week 0 project baseline |
| Git remote URL | `git remote -v` | `origin	https://github.com/ASR729/T008-PS-064.git (fetch)`<br>`origin	https://github.com/ASR729/T008-PS-064.git (push)` |
| Remote HEAD SHA | `git ls-remote origin HEAD` | `4bcca54a014377529397858cc5c6760dc9129e08 refs/heads/master` |
| Local vs remote sync | Compare local HEAD `4bcca54...` vs remote `4bcca54...` | **SYNCED** — local and remote SHAs match. The correction commit `4bcca54` IS pushed to GitHub. |
| All commit authors | `git log --format="%an <%ae> | %h | %s"` | All 9 commits authored by `Asif <asifrahman7865@gmail.com>`. No commits by Asher Vidukumar. |

### Working tree vs committed baseline
- Modified tracked files: `docs/progress/evidence-index.md` (commit references filled in), `docs/progress/weekly-progress-checklist.md` (statuses updated). Both are working-tree modifications, uncommitted.
- Untracked working-tree clutter: `build/`, `debug_adm23.py`, `debug_adm23_2.py`, `debug_blocks.py`, `test_run.py`, `__pycache__/`, `scripts/__pycache__/`, `tests/**/__pycache__/`. These are pre-existing working-tree clutter, not part of the committed baseline.
- Untracked `docs/week-4/*.md` files (8 files) were created during the pre-correction Week 4 attempt but never committed. They represent the historical 1/42 state and are preserved as untracked evidence.

---

## 2. Project Directory Structure

```
T008-PS-064/                          (repo root, Git root)
├── .git/
├── .gitignore
├── README.md
├── test_run.py                       (untracked manual execution helper)
├── scripts/
│   ├── __pycache__/
│   ├── reconcile_outputs.py          (tracked; production entry point + comparator)
│   └── run_reconciliation.py         (tracked; thin wrapper calling run_sample_execution)
├── src/
│   └── billing_engine/
│       ├── __init__.py               (package exports)
│       ├── __pycache__/
│       ├── commands/                 (CommandProcessor + all handlers + output helpers)
│       │   ├── __init__.py
│       │   └── __pycache__/
│       ├── models/                   (Category, Bed, Doctor, Admission, ChargeEvent, ...)
│       │   ├── __init__.py
│       │   └── __pycache__/
│       ├── loaders/                  (MasterDataLoader)
│       │   ├── __init__.py
│       │   └── __pycache__/
│       ├── services/                 (BedDayCounter, PricingService, TransferService, ...)
│       │   ├── __init__.py
│       │   └── __pycache__/
│       ├── billing/                  (BillingCalculator - __init__.py only)
│       │   ├── __init__.py
│       │   └── __pycache__/
│       ├── ledger/                   (LedgerManager - __init__.py only)
│       │   ├── __init__.py
│       │   └── __pycache__/
│       └── outputs/                  (OutputGenerator - __init__.py only)
│           ├── __init__.py
│           └── __pycache__/
├── tests/
│   ├── __pycache__/
│   ├── conftest.py                   (shared fixtures)
│   ├── integration/
│   │   ├── __pycache__/
│   │   └── test_sample_workflow.py
│   ├── reconciliation/               (empty directory)
│   └── unit/
│       ├── __pycache__/
│       ├── test_bed_allocation.py
│       ├── test_bed_day_counting.py
│       ├── test_packages_demands_gst.py
│       └── test_transfers_pricing_visits.py
├── data/
│   └── official/
│       └── T008-PS-064-sample-data/
│           ├── admissions.csv        (40 records)
│           ├── beds.csv              (60 records)
│           ├── categories.csv        (5 records)
│           ├── commands.txt          (839 physical lines; 2 comments; 837 commands)
│           ├── doctors.csv           (14 records)
│           ├── packages.csv          (6 records)
│           ├── tariff.csv            (80 records)
│           ├── README.md             (official sample-data documentation)
│           └── expected_outputs/     (42 files)
│               ├── ledger_ADM-0001/0002/0003/0005/0008/0010/0013/0019/0020/0022/0023/0026/0027/0028/0030/0033/0036/0038.csv
│               ├── bill_ADM-0001/.../0038.csv (18 files)
│               ├── demands.csv
│               ├── rejections.csv
│               ├── interim_bills.csv
│               ├── bed_occupancy_20261012_1000.csv
│               ├── bed_occupancy_20261016_1200.csv
│               └── bed_occupancy_20261021_1200.csv
├── docs/
│   ├── week-0/                       (8 tracked files)
│   ├── week-1/                       (7 tracked files; 3 empty: domain-model.md, decision-log.md, business-rules-register.md)
│   ├── week-3/                       (3 tracked files)
│   ├── week-4/                       (tracked: defect-correction/7 files, diagrams/10 files, final-design-document.md, final-decision-log.md, week-4-baseline-audit.md)
│   │   └── (untracked: demo-script.md, demo-recording-checklist.md, final-execution-report.md, final-submission-checklist.md, final-submission-email.md, live-code-modification-practice.md, viva-preparation.md, week-4-verification-report.md)
│   ├── week- ile-0/                  (tracked duplicate edge-cases-register.md — misnamed folder)
│   ├── progress/                     (evidence-index.md modified, weekly-progress-checklist.md modified)
│   └── final-audit/                  (created by this audit; existing-deliverables-inventory.md + this document)
└── build/                            (untracked generated-output dir from prior runs)
```

---

## 3. Python Environment

| Check | Command | Actual Result |
|-------|---------|---------------|
| Python version | `python --version` | `Python 3.14.5` |
| pytest version | `python -m pytest --version` | `pytest 9.2.0` |
| Test config files | directory listing | No `pytest.ini`, `pyproject.toml`, or `setup.cfg`. pytest uses default discovery from repo root. |
| External dependencies | `scripts/reconcile_outputs.py` imports | Only Python standard library (`csv`, `os`, `shutil`, `datetime`, `decimal`, `pathlib`). No `pip install` required. |
| conftest import path | `tests/conftest.py` | Imports `from src.billing_engine import (...)` — tests must run from repo root. |

---

## 4. Test Configuration

| Item | Value |
|------|-------|
| Test command | `python -m pytest -q` (run from repo root) |
| Test discovery | Default pytest discovery from repo root |
| Test files | `tests/unit/test_bed_allocation.py`, `tests/unit/test_bed_day_counting.py`, `tests/unit/test_packages_demands_gst.py`, `tests/unit/test_transfers_pricing_visits.py`, `tests/integration/test_sample_workflow.py` |
| Total tests | 75 (63 unit + 12 integration) |
| Warnings | 1 (PytestDeprecationWarning: `asyncio_default_fixture_loop_scope` unset — informational only) |

---

## 5. Official Sample Data

| Item | Value |
|------|-------|
| Location | `data/official/T008-PS-064-sample-data/` |
| `categories.csv` | 5 data rows (GENERAL, SEMI_PRIVATE, PRIVATE, DELUXE, ICU) |
| `beds.csv` | 60 data rows |
| `doctors.csv` | 14 data rows |
| `tariff.csv` | 80 data rows |
| `packages.csv` | 6 data rows |
| `admissions.csv` | 40 data rows |
| `commands.txt` | 839 physical lines; 2 comment lines; 0 blank lines; **837 command lines** |
| `expected_outputs/` | **42 files** (18 ledger + 18 bill + 1 demands + 1 rejections + 1 interim_bills + 3 bed_occupancy) |
| Immutable? | Yes — `git diff -- data/official/` empty; never modified (Safety Rule 4) |

---

## 6. Existing Documentation

| Path | Tracked? | Condition | Notes |
|------|----------|-----------|-------|
| `docs/week-0/week-0-verification-report.md` | Yes | Complete | Week 0 baseline acceptance |
| `docs/week-0/business-rules-register.md` | Yes | Complete | BR-01–12 + BR-07a/b specs |
| `docs/week-0/edge-cases-register.md` | Yes | Complete | EC-01–08 specs |
| `docs/week-0/output-contract.md` | Yes | Complete | 43-file output contract (1,113 rows) |
| `docs/week-0/source-register.md` | Yes | Complete | SRC-001–SRC-010; SRC-001–005 missing |
| `docs/week-0/traceability-matrix.md` | Yes | Empty (0 bytes) | Listed deliverable, no content |
| `docs/week-0/decision-register.md` | Yes | Empty (0 bytes) | Listed deliverable, no content |
| `docs/week-0/architecture-proposal.md` | Yes | Present | Architecture proposal |
| `docs/week-1/week-1-design.md` | Yes | Complete | Full design package |
| `docs/week-1/scope-and-glossary.md` | Yes | Complete | Scope, glossary, functional requirements |
| `docs/week-1/domain-model.md` | Yes | Empty (0 bytes) | Listed deliverable, no content |
| `docs/week-1/decision-log.md` | Yes | Empty (0 bytes) | Listed deliverable, no content |
| `docs/week-1/business-rules-register.md` | Yes | Empty (0 bytes) | Listed deliverable, no content |
| `docs/week-1/edge-cases-register.md` | Yes | Present | EC-01–08 (duplicates week-0) |
| `docs/week-3/week-2-baseline-audit.md` | Yes | Complete | Week 2 baseline at c1599de |
| `docs/week-3/week-3-implementation-traceability.md` | Yes | Complete | Week 3 traceability plan |
| `docs/week-3/week-3-verification-report.md` | Yes | Complete | Week 3 status IN PROGRESS |
| `docs/week-4/defect-correction/phase-0-audit.md` | Yes | Complete | Pre-correction baseline (1/42) |
| `docs/week-4/defect-correction/baseline.md` | Yes | Complete | Pre-fix reconciliation (1/42) |
| `docs/week-4/defect-correction/defect-register.md` | Yes | Complete | Defects A–G + RESOLVED status |
| `docs/week-4/defect-correction/fix-verification-log.md` | Yes | Complete | 9 fix batches → 42/42 |
| `docs/week-4/defect-correction/business-rule-traceability.md` | Yes | Complete | BR/EC traceability via 42/42 |
| `docs/week-4/defect-correction/final-reconciliation.md` | Yes | Complete | 42/42; second clean run documented |
| `docs/week-4/defect-correction/final-acceptance-report.md` | Yes | Complete | Gates A–G all PASS; 42/42 |
| `docs/week-4/final-design-document.md` | Yes | Complete | 497 lines; §24 outdated (claims partial reconciliation) |
| `docs/week-4/final-decision-log.md` | Yes | Complete | D-01–D-15 + D-U1–D-U3 (D-U1–3 PENDING but resolved by 42/42) |
| `docs/week-4/week-4-baseline-audit.md` | Yes | Complete | Week 4 starting state at c1599de |
| `docs/week-4/week-4-verification-report.md` | No (untracked) | Pre-correction; claims 1/42 | Superseded by defect-correction reports |
| `docs/week-4/final-execution-report.md` | No (untracked) | Pre-correction; claims READY WITH LIMITATIONS | Superseded |
| `docs/week-4/final-submission-checklist.md` | No (untracked) | Pre-correction; reconciliation PARTIAL | Needs update to 42/42 |
| `docs/week-4/final-submission-email.md` | No (untracked) | Pre-correction draft; known limitations outdated | Needs update |
| `docs/week-4/demo-script.md` | No (untracked) | Complete script; video BLOCKED | Recording not possible in this env |
| `docs/week-4/demo-recording-checklist.md` | No (untracked) | Complete checklist; video BLOCKED | |
| `docs/week-4/viva-preparation.md` | No (untracked) | 60 Q+A; commit ref `5d463d8` (outdated) | Should reference `4bcca54` |
| `docs/week-4/live-code-modification-practice.md` | No (untracked) | 3 practice exercises | Complete |
| `docs/week-4/diagrams/` (8 .mmd + 1 .html) | Yes | Complete | All 8 required diagrams rendered |
| `docs/progress/evidence-index.md` | Yes | Modified (uncommitted) | 55 entries; commit refs filled in; references untracked files |
| `docs/progress/weekly-progress-checklist.md` | Yes | Modified (uncommitted) | Week 4 marked PASS; reconciliation PARTIAL (outdated) |
| `docs/week- ile-0/edge-cases-register.md` | Yes | Duplicate of week-0 edge cases | Misnamed folder; duplicate artifact |

---

## 7. Scripts Used to Run the Project and Reconcile Outputs

### Entry point: `scripts/run_reconciliation.py`
```python
import sys
sys.path.insert(0, '.')
from scripts.reconcile_outputs import run_sample_execution

report = run_sample_execution(
    'data/official/T008-PS-064-sample-data/commands.txt',
    'build/official-sample-run',
    'data/official/T008-PS-064-sample-data/expected_outputs'
)
```

### Core logic: `scripts/reconcile_outputs.py`
- `run_sample_execution(commands_path, output_dir, expected_dir)` — builds fresh `MasterDataLoader`, `CommandProcessor`; registers 3 occupancy snapshot times; processes all 837 commands; writes outputs to `output_dir`; calls `reconcile_outputs()`.
- `reconcile_outputs(output_dir, expected_dir, visible_admissions)` — pairs by exact filename; compares headers, row counts, field-level values; ignores `description` (ledgers) and `detail` (rejections) only per contract; reports missing/extra files; does NOT weaken matching.
- Outputs written to dedicated `build/official-sample-run/` (not inside `expected_outputs/`).
- Visible admissions: ADM-0001, 0002, 0003, 0005, 0008, 0010, 0013, 0019, 0020, 0022, 0023, 0026, 0027, 0028, 0030, 0033, 0036, 0038.

---

## 8. Independently Verified Results (current HEAD `4bcca54`)

| Verification | Command | Actual Result |
|--------------|---------|---------------|
| Full test suite | `python -m pytest -q` | **75 passed, 0 failed, 0 skipped** in 0.37s (Python 3.14.5, pytest 9.2.0) |
| Official reconciliation | `python scripts/run_reconciliation.py` | **Files compared: 42; Matching: 42; Mismatching: 0; Missing: []; Extra: []; Total fields: 10223; Matching fields: 10223; Mismatching fields: 0** |
| Second clean execution | `run_sample_execution(..., 'build/fresh-sample-run', ...)` | **42/42 matched, 0 mismatching, 0 missing, 0 extra, 10,223/10,223 fields** (reproducible) |
| Official inputs unchanged | `git diff -- data/official/` | Empty — no modifications (Safety Rule 4 satisfied) |
| Comparator not weakened | Source inspection of `compare_csvs`/`reconcile_outputs` | Confirmed correct; only `description`/`detail` ignored per contract |

---

## 9. Historical Claims vs Verified Reality

| Claim | Source | Verified Reality |
|-------|--------|------------------|
| 42/42 files matched | `4bcca54` commit message + `defect-correction/final-reconciliation.md` | **CONFIRMED** — independently re-verified |
| 10,223/10,223 fields matched | Same | **CONFIRMED** |
| 75 tests passed | Same + `pytest -q` | **CONFIRMED** |
| Second clean execution 42/42 | `final-reconciliation.md` | **CONFIRMED** (fresh-sample-run) |
| Commit `4bcca54` pushed to GitHub | Same | **CONFIRMED** — `git ls-remote origin HEAD` = `4bcca54...`, matches local |
| Earlier attempt: 1/42 matched, 41 mismatching, 3,333 field mismatches | `defect-correction/baseline.md`, `phase-0-audit.md` | **CONFIRMED** as the pre-correction baseline (historical, preserved) |
| README claims "Partial match" for ledgers/bills/demands/interim/occupancy | `README.md` §15 (commit `5d463d8`) | **OUTDATED** — contradicted by 42/42; must be updated |
| Week 4 overall "READY WITH DOCUMENTED LIMITATIONS" (reconciliation partial) | Untracked `week-4-verification-report.md`, `final-execution-report.md` | **OUTDATED** — superseded by defect-correction acceptance report (FULLY VERIFIED — 42/42) |

---

## 10. Phase 0 Readiness Decision

**READY.** The repository is intact, all prior work is preserved, the official sample data is present and unmodified, the baseline (1/42) and correction (42/42) are both reproducible and independently verified, and the full test suite passes (75). No destructive git operations were used. Nothing was modified or staged.

Proceed to Phase 1 — Authoritative Source Inventory.