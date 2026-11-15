# Evidence Index - PS-064

| Evidence ID | Week | Requirement | Evidence Filename/Path | Evidence Type | Result | Commit Hash |
|-------------|------|-------------|------------------------|---------------|--------|-------------|
| EV-001 | Week 0 | Project baseline | docs/week-0/week-0-verification-report.md | Document | PASS | 7269551 |
| EV-002 | Week 0 | Business rules | docs/week-0/business-rules-register.md | Document | PASS | 62e0d33 |
| EV-003 | Week 0 | Edge cases | docs/week-0/edge-cases-register.md | Document | PASS | 62e0d33 |
| EV-004 | Week 0 | Output contract | docs/week-0/output-contract.md | Document | PASS | 62e0d33 |
| EV-005 | Week 1 | Design documents | docs/week-1/week-1-design.md | Document | PASS | 92ab35b |
| EV-006 | Week 1 | Scope and glossary | docs/week-1/scope-and-glossary.md | Document | PASS | 5ca4d21 |
| EV-007 | Week 2 | Core implementation | src/billing_engine/commands/__init__.py | Source Code | PASS | 2c3b306 |
| EV-008 | Week 2 | Domain models | src/billing_engine/models/__init__.py | Source Code | PASS | 2c3b306 |
| EV-009 | Week 2 | Master data loader | src/billing_engine/loaders/__init__.py | Source Code | PASS | 2c3b306 |
| EV-010 | Week 3 | Baseline audit | docs/week-3/week-2-baseline-audit.md | Document | PASS | 2c3b306 |
| EV-011 | Week 3 | Traceability matrix | docs/week-3/week-3-implementation-traceability.md | Document | PASS | 2c3b306 |
| EV-012 | Week 3 | Verification report | docs/week-3/week-3-verification-report.md | Document | PASS | 2c3b306 |
| EV-013 | Week 3 | Progress checklist | docs/progress/weekly-progress-checklist.md | Document | PASS | 2c3b306 |
| EV-014 | Week 3 | BR-01 Bed-day counting | tests/unit/test_bed_day_counting.py | Test | PASS | c1599de |
| EV-015 | Week 3 | BR-02 Bed allocation | tests/unit/test_bed_allocation.py | Test | PASS | c1599de |
| EV-016 | Week 3 | BR-03 Transfers/ICU | tests/unit/test_transfers_pricing_visits.py | Test | PASS | c1599de |
| EV-017 | Week 3 | BR-04 Pricing | tests/unit/test_transfers_pricing_visits.py | Test | PASS | c1599de |
| EV-018 | Week 3 | BR-05 Doctor visits | tests/unit/test_transfers_pricing_visits.py | Test | PASS | c1599de |
| EV-019 | Week 3 | BR-06 Packages | tests/unit/test_packages_demands_gst.py | Test | PARTIAL | c1599de |
| EV-020 | Week 3 | BR-07 Deposits/demands | tests/unit/test_packages_demands_gst.py | Test | PASS | c1599de |
| EV-021 | Week 3 | BR-07a Averaging | tests/unit/test_packages_demands_gst.py | Test | PASS | c1599de |
| EV-022 | Week 3 | BR-07b Blocking | tests/unit/test_packages_demands_gst.py | Test | PASS | c1599de |
| EV-023 | Week 3 | BR-08 Discounts | tests/unit/test_packages_demands_gst.py | Test | PASS | c1599de |
| EV-024 | Week 3 | BR-11 GST | tests/unit/test_packages_demands_gst.py | Test | PASS | c1599de |
| EV-025 | Week 3 | Unit tests (63) | tests/unit/ | Test Suite | PASS | c1599de |
| EV-026 | Week 3 | Integration tests (12) | tests/integration/ | Test Suite | PASS | c1599de |
| EV-027 | Week 3 | All tests (75) | tests/ | Test Suite | PASS | c1599de |
| EV-028 | Week 3 | Services layer | src/billing_engine/services/__init__.py | Source Code | PASS | c1599de |
| EV-029 | Week 3 | Output generator | src/billing_engine/outputs/__init__.py | Source Code | PASS | c1599de |
| EV-030 | Week 3 | Billing calculator | src/billing_engine/billing/__init__.py | Source Code | PASS | c1599de |
| EV-031 | Week 3 | Ledger manager | src/billing_engine/ledger/__init__.py | Source Code | PASS | c1599de |
| EV-032 | Week 4 | Final README | README.md | Document | PASS | 5d463d8 |
| EV-033 | Week 4 | Final design document | docs/week-4/final-design-document.md | Document | PASS | 5d463d8 |
| EV-034 | Week 4 | Final decision log | docs/week-4/final-decision-log.md | Document | PASS | 5d463d8 |
| EV-035 | Week 4 | Domain/class diagram | docs/week-4/diagrams/domain_class.mmd | Diagram | PASS | 5d463d8 |
| EV-036 | Week 4 | Patient/admission lifecycle | docs/week-4/diagrams/patient_admission_lifecycle.mmd | Diagram | PASS | 5d463d8 |
| EV-037 | Week 4 | Bed lifecycle | docs/week-4/diagrams/bed_lifecycle.mmd | Diagram | PASS | 5d463d8 |
| EV-038 | Week 4 | Command-processing workflow | docs/week-4/diagrams/command_processing.mmd | Diagram | PASS | 5d463d8 |
| EV-039 | Week 4 | Billing and ledger flow | docs/week-4/diagrams/billing_ledger_flow.mmd | Diagram | PASS | 5d463d8 |
| EV-040 | Week 4 | Package conversion flow | docs/week-4/diagrams/package_conversion.mmd | Diagram | PASS | 5d463d8 |
| EV-041 | Week 4 | Deposit/top-up demand flow | docs/week-4/diagrams/demand_block_flow.mmd | Diagram | PASS | 5d463d8 |
| EV-042 | Week 4 | Discharge/settlement flow | docs/week-4/diagrams/discharge_settlement.mmd | Diagram | PASS | 5d463d8 |
| EV-043 | Week 4 | Rendered diagrams HTML | docs/week-4/diagrams/diagrams.html | Diagram | PASS | 5d463d8 |
| EV-044 | Week 4 | Output reconciliation script | scripts/reconcile_outputs.py | Script | PARTIAL | 5d463d8 |
| EV-045 | Week 4 | Demo script | docs/week-4/demo-script.md | Document | PASS | 5d463d8 |
| EV-046 | Week 4 | Demo recording checklist | docs/week-4/demo-recording-checklist.md | Document | PASS | 5d463d8 |
| EV-047 | Week 4 | Demo video | BLOCKED | Video | BLOCKED | 5d463d8 |
| EV-048 | Week 4 | Viva preparation | docs/week-4/viva-preparation.md | Document | PASS | 5d463d8 |
| EV-049 | Week 4 | Live code modification practice | docs/week-4/live-code-modification-practice.md | Document | PASS | 5d463d8 |
| EV-050 | Week 4 | Final submission checklist | docs/week-4/final-submission-checklist.md | Document | PASS | 5d463d8 |
| EV-051 | Week 4 | Submission email draft | docs/week-4/final-submission-email.md | Document | PASS | 5d463d8 |
| EV-052 | Week 4 | Week 4 baseline audit | docs/week-4/week-4-baseline-audit.md | Document | PASS | c1599de |
| EV-053 | Week 4 | Final commit verified | Git commit 5d463d8 | Git | PASS | 5d463d8 |
| EV-054 | Week 4 | Remote push verified | Git remote SHA 5d463d8 | Git | PASS | 5d463d8 |
| EV-055 | Week 4 | Test suite (75 tests) | tests/ | Test Suite | PASS | c1599de |
