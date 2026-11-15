# Phase 1 — Authoritative Source Inventory

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`  
**Audit date:** 2026-11-15  
**Status:** All available sources inspected. Missing official sources documented, not invented.

---

## 1. Source Precedence Hierarchy (per docs/week-0/source-register.md)

| Level | Source | Authority | Role |
|-------|--------|-----------|------|
| Level 1 | SRC-001–SRC-005: Official assignment email, support emails, BR-07 clarification email, timeline emails, sample-data delivery email | Most authoritative | Primary requirements, design approval, binding clarifications |
| Level 2 | SRC-006–SRC-009: Official sample-data pack (README, master CSVs, commands.txt, expected_outputs) | High | Data format, output contracts, reconciliation targets |
| Level 3 | SRC-010: Current workspace contents | Supplementary | Historical team material, not authoritative for requirements |

---

## 2. Source Register — Availability and Inspection Status

| Source ID | Source | Type | Status | Inspected? | Location | Authority | Missing Content? |
|-----------|--------|------|--------|------------|----------|-----------|------------------|
| SRC-001 | Official Capstone Project Assignment – Team T008 – PS-064 | Official assignment email | NOT AVAILABLE | No | — | Most authoritative | Yes — not available locally |
| SRC-002 | Official support email approving Week 1 design package | Official support email | NOT AVAILABLE | No | — | High | Yes — not available locally |
| SRC-003 | Official BR-07 clarification email (BR-07a, BR-07b) | Official support email | NOT AVAILABLE | No | — | Highest for BR-07 | Yes — not available locally |
| SRC-004 | Official capstone timeline and checkpoint emails | Official support emails | NOT AVAILABLE | No | — | High | Yes — not available locally |
| SRC-005 | Official sample-data delivery email (4 Nov 2026) | Official support email with attachments | NOT AVAILABLE | No | — | High | Yes — not available locally |
| SRC-006 | `data/official/T008-PS-064-sample-data/README.md` | Official sample-data README | ✅ INSPECTED | Yes | `data/official/.../README.md` | Most authoritative for data format | No |
| SRC-007 | All official master CSV files (categories, beds, doctors, tariff, packages, admissions) | CSV data files | ✅ INSPECTED | Yes | `data/official/.../*.csv` | High | No |
| SRC-008 | `commands.txt` | Command event file | ✅ INSPECTED | Yes | `data/official/.../commands.txt` | High | No |
| SRC-009 | All files under `expected_outputs/` | Expected output files | ✅ INSPECTED | Yes | `data/official/.../expected_outputs/` (42 files) | High | No |
| SRC-010 | Current workspace contents | Local files | ✅ INSPECTED | Yes | Repo root | Supplementary | No |

**Sources not available:** SRC-001 through SRC-005 (all official emails/assignments). Impact: limited — proceeding with locally available Level 2 and Level 3 sources. Complete authoritative-source traceability for official emails is BLOCKED (see B2 in inventory).

---

## 3. Level 2 — Official Sample-Data Pack (Inspected)

### 3.1 Master data files
| File | Rows | Role |
|------|------|------|
| `categories.csv` | 5 | Bed categories, rates, multipliers |
| `beds.csv` | 60 | Bed registration, category, gender restriction, ward |
| `doctors.csv` | 14 | Doctor registry, fees, intensivist status |
| `tariff.csv` | 80 | Procedure, OT, investigation, pharmacy, consumable pricing |
| `packages.csv` | 6 | Package definitions, coverage, exclusions, LOS |
| `admissions.csv` | 40 | Patient admission data |

### 3.2 Command event file
- `commands.txt`: 839 physical lines; 2 comment lines; 0 blank lines; **837 command lines**
- Format: `COMMAND|timestamp|arg1|arg2|...`
- Processing: strict file order

### 3.3 Expected outputs (SRC-009)
| Type | Count | Files |
|------|-------|-------|
| ledger | 18 | ledger_ADM-0001/0002/0003/0005/0008/0010/0013/0019/0020/0022/0023/0026/0027/0028/0030/0033/0036/0038.csv |
| bill | 18 | bill_<same 18>.csv |
| demands | 1 | demands.csv |
| rejections | 1 | rejections.csv |
| interim_bills | 1 | interim_bills.csv |
| bed_occupancy | 3 | bed_occupancy_20261012_1000.csv, _20261016_1200.csv, _20261021_1200.csv |
| **Total** | **42** | |

### 3.4 Immutability
- `git diff -- data/official/` → empty. Official input and expected files are unmodified (Safety Rule 4). Never generate expected outputs from the implementation.

---

## 4. Level 3 — Team-Authored Documentation (Inspected)

### 4.1 Week 0 — Baseline (`docs/week-0/`)

| File | Tracked? | Size | Condition | Notes |
|------|----------|------|-----------|-------|
| `week-0-verification-report.md` | Yes | ~143 lines | Complete | Week 0 baseline acceptance, all gates PASS |
| `business-rules-register.md` | Yes | 322 lines | Complete | BR-01–12 + BR-07a/b specifications |
| `edge-cases-register.md` | Yes | 145 lines | Complete | EC-01–08 specifications |
| `output-contract.md` | Yes | 167 lines | Complete | 43-file output contract, 1,113 rows |
| `source-register.md` | Yes | 93 lines | Complete | SRC-001–SRC-010; SRC-001–005 missing |
| `traceability-matrix.md` | Yes | 0 bytes | **EMPTY** | Listed Week 0 deliverable, no content |
| `decision-register.md` | Yes | 0 bytes | **EMPTY** | Listed Week 0 deliverable, no content |
| `architecture-proposal.md` | Yes | Present | Present | Architecture proposal |

### 4.2 Week 1 — Design (`docs/week-1/`)

| File | Tracked? | Size | Condition | Notes |
|------|----------|------|-----------|-------|
| `week-1-design.md` | Yes | 299 lines | Complete | Full design package; all gates PASS |
| `scope-and-glossary.md` | Yes | 792 lines | Complete | Scope, glossary, functional/non-functional requirements |
| `domain-model.md` | Yes | 0 bytes | **EMPTY** | Listed Week 1 deliverable, no content |
| `decision-log.md` | Yes | 0 bytes | **EMPTY** | Listed Week 1 deliverable, no content |
| `business-rules-register.md` | Yes | 0 bytes | **EMPTY** | Listed Week 1 deliverable, no content |
| `edge-cases-register.md` | Yes | Present | Present | EC-01–08 (content duplicates week-0) |
| `diagrams/` | — | — | Referenced but not present in git listing | Referenced by week-1-design.md |

### 4.3 Week 2 — Implementation
- `docs/week-2/` directory **DOES NOT EXIST** — noted as missing in `docs/week-4/week-4-baseline-audit.md` §3.
- Week 2 evidence is carried in commit `2c3b306` ("Add Week 2 core implementation (billing engine)") and in `docs/week-3/week-2-baseline-audit.md`.
- No separate Week 2 documentation directory exists.

### 4.4 Week 3 — Implementation (`docs/week-3/`)

| File | Tracked? | Size | Condition | Notes |
|------|----------|------|-----------|-------|
| `week-2-baseline-audit.md` | Yes | 247 lines | Complete | Week 2 baseline at c1599de; defects cataloged |
| `week-3-implementation-traceability.md` | Yes | 400 lines | Complete | Week 3 traceability plan |
| `week-3-verification-report.md` | Yes | 286 lines | Complete | Week 3 status IN PROGRESS; blockers listed |

### 4.5 Week 4 — Final Submission (`docs/week-4/`)

**Tracked (committed at `5d463d8`):**
| File | Size | Condition |
|------|------|-----------|
| `defect-correction/phase-0-audit.md` | 164 lines | Complete — pre-correction baseline (1/42) |
| `defect-correction/baseline.md` | 109 lines | Complete — pre-fix reconciliation |
| `defect-correction/defect-register.md` | 153 lines | Complete — Defects A–G + RESOLVED |
| `defect-correction/fix-verification-log.md` | 134 lines | Complete — 9 fix batches → 42/42 |
| `defect-correction/business-rule-traceability.md` | 96 lines | Complete — BR/EC via 42/42 |
| `defect-correction/final-reconciliation.md` | 87 lines | Complete — 42/42; second clean run |
| `defect-correction/final-acceptance-report.md` | 111 lines | Complete — Gates A–G all PASS |
| `diagrams/*.mmd` (8 files) + `diagrams.html` | — | Complete — all 8 diagrams rendered |
| `final-design-document.md` | 497 lines | Complete; §24 outdated (claims partial reconciliation) |
| `final-decision-log.md` | 287 lines | Complete; D-U1–D-U3 PENDING but resolved by 42/42 |
| `week-4-baseline-audit.md` | 151 lines | Complete — Week 4 starting state at c1599de |

**Untracked (pre-correction Week 4 attempt, never committed/pushed):**
| File | Condition | Disposition |
|------|-----------|-------------|
| `week-4-verification-report.md` | Claims reconciliation PARTIAL (1/42) | Superseded by defect-correction reports; REPLACE |
| `final-execution-report.md` | Claims READY WITH DOCUMENTED LIMITATIONS | Superseded; REPLACE |
| `final-submission-checklist.md` | Reconciliation PARTIAL | UPDATE needed |
| `final-submission-email.md` | Known limitations outdated | UPDATE needed |
| `demo-script.md` | Complete script; video BLOCKED | KEEP |
| `demo-recording-checklist.md` | Complete checklist; video BLOCKED | KEEP |
| `viva-preparation.md` | 60 Q+A; commit ref `5d463d8` outdated | UPDATE commit ref |
| `live-code-modification-practice.md` | 3 practice exercises | KEEP |

### 4.6 Progress Tracking (`docs/progress/`)

| File | Tracked? | Modified? | Condition |
|------|----------|-----------|-----------|
| `evidence-index.md` | Yes | Yes (uncommitted) | 55 entries; commit refs filled in; references untracked files; EV-044 marks reconcile_outputs.py PARTIAL (outdated post-fix) |
| `weekly-progress-checklist.md` | Yes | Yes (uncommitted) | Week 4 marked PASS; reconciliation PARTIAL (outdated) |

### 4.7 Duplicate artifact
- `docs/week- ile-0/edge-cases-register.md` — tracked duplicate of `docs/week-0/edge-cases-register.md` in a misnamed folder. Rule 9: do not duplicate unnecessarily.

---

## 5. Authoritative Documents Present vs Missing

### Present and inspected
- Official sample-data README (SRC-006)
- All 6 master CSV files (SRC-007)
- `commands.txt` (SRC-008)
- All 42 expected_outputs files (SRC-009)
- Week 0 business rules, edge cases, output contract, source register
- Week 1 scope-and-glossary, week-1-design
- Week 3 baseline audit, traceability, verification report
- Week 4 defect-correction 7 documents (final reconciliation + acceptance)
- Week 4 final design document, final decision log, diagrams
- README.md, progress tracking files

### Missing (genuinely absent)
| Item | Reason | Action |
|------|--------|--------|
| SRC-001–SRC-005 (official emails/assignments) | Not available in workspace | BLOCKED — document as missing, do not invent |
| `docs/week-2/` directory | Never created | CREATE gap noted; Week 2 evidence carried via commit + week-3 baseline audit |
| Week 1 `domain-model.md`, `decision-log.md`, `business-rules-register.md` | Empty files (0 bytes) | UPDATE/CREATE gap noted |
| Week 0 `traceability-matrix.md`, `decision-register.md` | Empty files (0 bytes) | UPDATE gap noted |

---

## 6. Conflicting Source Claims and Resolution

| Conflict | Sources | Resolution |
|----------|---------|------------|
| Reconciliation state: 1/42 (pre-correction) vs 42/42 (correction) | `week-4-verification-report.md`/`final-execution-report.md` vs `defect-correction/final-reconciliation.md` | Current HEAD `4bcca54` verified at 42/42. Pre-correction reports are historical; superseded. Rule 6: distinguish original failed Week 4 attempt from correction phase. |
| Commit `5d463d8` as "final/pushed" vs `4bcca54` as current HEAD | Untracked reports reference `5d463d8`; `git log`/`git ls-remote` show `4bcca54` | `4bcca54` is current HEAD and origin/master. `5d463d8` is the pre-correction commit, still an ancestor but not HEAD. |
| `daily_bed_charge` vs `daily_charge` property name | Week 2 baseline audit lists as defect | Fixed in Week 3 (commit c1599de); not an active defect at 4bcca54. |
| `TransferService.MAX_TRANSFERS=4` vs `CommandProcessor.MAX_TRANSFERS=3` | defect-register.md cross-cutting note | Processor's value (3) matches README (ADM-0028 4th transfer → TRANSFER_LIMIT); not an active defect. |
| `Category` enum hardcodes rates vs reading `categories.csv` | defect-register.md | Values match CSV; fragile but not an active defect for this pack. |

### Unresolved contradictions (require external evidence)
| ID | Contradiction | Reason unresolved |
|----|---------------|-------------------|
| U1 | Official assignment requirements (SRC-001) not available locally | SRC-001 not in workspace; cannot confirm against official assignment |
| U2 | Official BR-07 clarification email (SRC-003) not available | BR-07a/b content taken from local business-rules-register.md; cannot verify against official email |
| U3 | Official Week 1 design approval email (SRC-002) not available | Cannot confirm design approval from official source |

---

## 7. Phase 1 Readiness Decision

**READY with documented gaps.** All locally available Level 2 and Level 3 sources are inspected and documented. SRC-001–SRC-005 are confirmed missing (BLOCKED for external evidence). Empty Week 0/Week 1 deliverable files and the missing `docs/week-2/` directory are documented as gaps. Conflicting claims are resolved in favor of the verified current HEAD `4bcca54` (42/42), with pre-correction claims preserved as historical evidence.

Proceed to Phase 2 — Week 0 Acceptance Audit.