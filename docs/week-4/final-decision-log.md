# Final Decision Log — PS-064

**Team:** T008  
**Version:** 1.0 (Week 4 Final)  
**Date:** 2026-11-15  

---

## Decision Categories

| Category | Description |
|----------|-------------|
| Official Support Decision | Decision confirmed by official assignment or support clarification |
| Team Design Decision | Decision made by the team during design phase |
| Technical Implementation Decision | Decision made during implementation |
| Week 4 Release Decision | Decision made during final submission preparation |

---

## D-01: In-Memory Storage

| Field | Value |
|-------|-------|
| Decision ID | D-01 |
| Date/Phase | Week 0 — Baseline |
| Requirement | Data persistence approach |
| Decision Taken | Use in-memory storage (no database) |
| Reasoning | Assignment specifies command-file-driven backend engine; no database requirement; simplifies implementation and testing |
| Source/Authority | Team design decision |
| Affected Business Rules | All BR-01 through BR-12 |
| Affected Code Modules | src/billing_engine/loaders/, src/billing_engine/commands/ |
| Related Tests | tests/unit/, tests/integration/ |
| Current Status | IMPLEMENTED |

---

## D-02: Decimal Arithmetic with ROUND_HALF_UP

| Field | Value |
|-------|-------|
| Decision ID | D-02 |
| Date/Phase | Week 0 — Baseline |
| Requirement | Monetary calculation rounding |
| Decision Taken | Use Python `Decimal` with `ROUND_HALF_UP` for all money calculations |
| Reasoning | Financial calculations require deterministic rounding; Python's built-in `round()` uses banker's rounding which is unsuitable for financial applications |
| Source/Authority | Official assignment requirement (BR-07a upward rounding, BR-10 half-up rounding) |
| Affected Business Rules | BR-07a, BR-10, all monetary calculations |
| Affected Code Modules | src/billing_engine/commands/__init__.py (round2, round0 functions) |
| Related Tests | tests/unit/test_packages_demands_gst.py |
| Current Status | IMPLEMENTED |

---

## D-03: Command-File-Driven Input

| Field | Value |
|-------|-------|
| Decision ID | D-03 |
| Date/Phase | Week 0 — Baseline |
| Requirement | Input format |
| Decision Taken | Use pipe-delimited command text file (`COMMAND\|timestamp\|args`) |
| Reasoning | Assignment specifies command-file-driven backend engine; simple and auditable |
| Source/Authority | Official assignment specification |
| Affected Business Rules | All BR-01 through BR-12 |
| Affected Code Modules | src/billing_engine/commands/__init__.py (parse_command method) |
| Related Tests | tests/integration/test_sample_workflow.py |
| Current Status | IMPLEMENTED |

---

## D-04: Per-Admission Line Numbering

| Field | Value |
|-------|-------|
| Decision ID | D-04 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Ledger line_no numbering |
| Decision Taken | Use per-admission line numbering (starts at 1 for each admission) |
| Reasoning | Expected output ledgers (ledger_ADM-XXXX.csv) start line_no at 1 for each admission |
| Source/Authority | Observed from official expected_outputs/ledger_ADM-XXXX.csv files |
| Affected Business Rules | BR-09 (ledger entries) |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_add_ledger_entry method) |
| Related Tests | tests/unit/ |
| Current Status | IMPLEMENTED |

---

## D-05: Bed-Day Counting Per Command

| Field | Value |
|-------|-------|
| Decision ID | D-05 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Bed-day line interleaving with charge events |
| Decision Taken | Check bed days for the current command's admission before processing each command |
| Reasoning | Bed-day lines must be interleaved with charge events by timestamp; checking per-admission ensures correct ordering relative to charge events for that admission |
| Source/Authority | Team implementation decision based on output schema analysis |
| Affected Business Rules | BR-01 |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_process_admission_bed_days, process_command) |
| Related Tests | tests/unit/test_bed_day_counting.py |
| Current Status | IMPLEMENTED |

---

## D-06: UPGRADE-FREE Category-at-Event for Bed/Nursing

| Field | Value |
|-------|-------|
| Decision ID | D-06 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Category used for bed/nursing charge during UPGRADE-FREE window |
| Decision Taken | Use requested category (rate category) as category_at_event for BED/NURSING lines during UPGRADE-FREE window |
| Reasoning | Expected output shows BED-PRIVATE item_code during UPGRADE-FREE even when bed is DELUXE |
| Source/Authority | Observed from official expected_outputs/ledger_ADM-XXXX.csv |
| Affected Business Rules | BR-02, BR-04 |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_post_bed_day_lines method) |
| Related Tests | tests/unit/test_bed_allocation.py |
| Current Status | IMPLEMENTED |

---

## D-07: Interim Bill Locking Per-Admission

| Field | Value |
|-------|-------|
| Decision ID | D-07 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Scope of ledger entry locking during interim bill |
| Decision Taken | Lock only entries for the specific admission, not all entries globally |
| Reasoning | Each admission has independent interim bills; locking all entries globally would incorrectly lock other admissions' entries |
| Source/Authority | Team implementation decision based on expected output analysis |
| Affected Business Rules | BR-09 |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_create_interim_bill method) |
| Related Tests | tests/unit/ |
| Current Status | IMPLEMENTED |

---

## D-08: Rejection Command Column Format

| Field | Value |
|-------|-------|
| Decision ID | D-08 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Format of `command` column in rejections.csv |
| Decision Taken | Output just the command type name (e.g., "TRANSFER") not the full command line |
| Reasoning | Expected output rejections.csv shows just "TRANSFER" not the full command string |
| Source/Authority | Observed from official expected_outputs/rejections.csv |
| Affected Business Rules | BR-09 (rejection tracking) |
| Affected Code Modules | scripts/reconcile_outputs.py (write_rejections function) |
| Related Tests | tests/integration/ |
| Current Status | IMPLEMENTED |

---

## D-09: Python Version Target

| Field | Value |
|-------|-------|
| Decision ID | D-09 |
| Date/Phase | Week 4 — Release |
| Requirement | Python version compatibility |
| Decision Taken | Target Python 3.10+ (assignment minimum) |
| Reasoning | Assignment requires Python 3.10+; tested on Python 3.14.5 |
| Source/Authority | Official assignment specification |
| Affected Business Rules | None (infrastructure) |
| Affected Code Modules | All source files |
| Related Tests | All tests |
| Current Status | VERIFIED |

---

## D-10: No External Dependencies

| Field | Value |
|-------|-------|
| Decision ID | D-10 |
| Date/Phase | Week 0 — Baseline |
| Requirement | Package dependencies |
| Decision Taken | Use only Python standard library; no pip install required |
| Reasoning | Simplifies deployment and ensures reproducibility |
| Source/Authority | Team design decision |
| Affected Business Rules | None (infrastructure) |
| Affected Code Modules | All source files |
| Related Tests | All tests |
| Current Status | IMPLEMENTED |

---

## D-11: Demand Check Exclusion for Bed-Day Lines

| Field | Value |
|-------|-------|
| Decision ID | D-11 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Whether bed-day lines trigger demand checks |
| Decision Taken | Skip demand check for BED/NURSING/DOCTOR head lines (skip_demand_check=True) |
| Reasoning | Bed-day and nursing charges are posted at noon anchor and should not trigger top-up demands; demand checks should be triggered by charge events (procedures, pharmacy, etc.) |
| Source/Authority | Team implementation decision based on demand lifecycle logic |
| Affected Business Rules | BR-07b |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_add_ledger_entry skip_demand_check parameter) |
| Related Tests | tests/unit/test_packages_demands_gst.py |
| Current Status | IMPLEMENTED |

---

## D-12: Discharge Bed-Day Skip Demand Check

| Field | Value |
|-------|-------|
| Decision ID | D-12 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Whether discharge bed-day lines trigger demand checks |
| Decision Taken | Skip demand check for discharge BED/NURSING lines |
| Reasoning | Discharge is a terminal event; demand checks should not be triggered at discharge |
| Source/Authority | Team implementation decision |
| Affected Business Rules | BR-07b, BR-10 |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_post_discharge_bed_day method) |
| Related Tests | tests/unit/ |
| Current Status | IMPLEMENTED |

---

## D-13: Occupancy Snapshot Timing

| Field | Value |
|-------|-------|
| Decision ID | D-13 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Bed occupancy snapshot timestamps |
| Decision Taken | Capture snapshots at 2026-10-12 10:00, 2026-10-16 12:00, 2026-10-21 12:00 |
| Reasoning | Matches official expected_outputs/bed_occupancy_*.csv filenames |
| Source/Authority | Official expected_outputs/ directory |
| Affected Business Rules | BR-12 |
| Affected Code Modules | src/billing_engine/commands/__init__.py (_capture_occupancy_snapshot), scripts/reconcile_outputs.py |
| Related Tests | tests/integration/ |
| Current Status | IMPLEMENTED |

---

## D-14: Week 3 Commit Preservation

| Field | Value |
|-------|-------|
| Decision ID | D-14 |
| Date/Phase | Week 4 — Release |
| Requirement | Git history preservation |
| Decision Taken | Preserve Week 2 commit (2c3b306) and Week 3 commit (c1599de); do not rewrite history |
| Reasoning | Assignment requires week-by-week commit history; force push and history rewriting prohibited |
| Source/Authority | Week 4 execution rules (Section 3.1, Section 10.2) |
| Affected Business Rules | None (process) |
| Affected Code Modules | .git/ |
| Related Tests | None |
| Current Status | VERIFIED |

---

## D-15: Output Directory Location

| Field | Value |
|-------|-------|
| Decision ID | D-15 |
| Date/Phase | Week 4 — Implementation |
| Requirement | Generated output directory |
| Decision Taken | Write generated outputs to `build/official-sample-run/` |
| Reasoning | Separates generated outputs from official expected_outputs/; follows suggested directory structure |
| Source/Authority | Week 4 execution instructions (Phase 9.2) |
| Affected Business Rules | None (output) |
| Affected Code Modules | scripts/reconcile_outputs.py |
| Related Tests | None |
| Current Status | IMPLEMENTED |

---

## Superseded Decisions

No decisions have been superseded. All Week 0 and Week 1 decision registers were empty, so no historical decisions needed to be marked as superseded.

---

## Unresolved Decisions

| Decision ID | Requirement | Status | Reason |
|-------------|-------------|--------|--------|
| D-U1 | Exact bed-day line ordering with cross-admission commands | PENDING | Bed-day lines may not perfectly interleave with charge events from other admissions |
| D-U2 | Package conversion detection edge cases | PENDING | Simultaneous ICU stay and non-included procedure triggers may need refinement |
| D-U3 | Interim bill timing (manual vs automatic) | PENDING | Timing of automatic 7-day bills relative to manual bills needs verification |
