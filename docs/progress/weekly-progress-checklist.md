# Weekly Progress Checklist - PS-064

| Week | Status | Evidence Path |
|------|--------|---------------|
| Week 0 - Baseline and readiness | PASS | docs/week-0/week-0-verification-report.md |
| Week 1 - Requirements and design | PASS | docs/week-1/week-1-design.md |
| Week 2 - Core implementation | PASS | Git commit 2c3b306 |
| Week 3 - Full business rules and validation | IN PROGRESS | docs/week-3/week-3-verification-report.md |
| Week 4 - Final submission and evaluator materials | NOT STARTED | N/A |

## Week 0 - Baseline and Readiness

| Item | Status | Evidence |
|------|--------|----------|
| Project structure established | PASS | src/billing_engine/ |
| Sample data verified | PASS | data/official/T008-PS-064-sample-data/ |
| Documentation created | PASS | docs/week-0/ |
| Git repository initialized | PASS | Git commit 7269551 |

## Week 1 - Requirements and Design

| Item | Status | Evidence |
|------|--------|----------|
| Business rules documented | PASS | docs/week-0/business-rules-register.md |
| Domain model defined | PASS | docs/week-1/domain-model.md |
| Scope and glossary | PASS | docs/week-1/scope-and-glossary.md |
| Edge cases register | PASS | docs/week-0/edge-cases-register.md |

## Week 2 - Core Implementation

| Item | Status | Evidence |
|------|--------|----------|
| Domain models implemented | PASS | src/billing_engine/models/__init__.py |
| Master data loading | PASS | src/billing_engine/loaders/__init__.py |
| Command framework | PASS | src/billing_engine/commands/__init__.py |
| ADMIT command handler | PASS | src/billing_engine/commands/__init__.py:259 |
| Git commit | PASS | 2c3b306 |

## Week 3 - Full Business Rules and Validation

| Item | Status | Evidence |
|------|--------|----------|
| Week 2 baseline audit | PASS | docs/week-3/week-2-baseline-audit.md |
| Week 2 defects fixed | PASS | 13 defects fixed in models, loaders, commands |
| BR-01 Bed-day counting | PASS | tests/unit/test_bed_day_counting.py |
| BR-02 Bed allocation | PASS | tests/unit/test_bed_allocation.py |
| BR-03 Transfers and ICU | PASS | tests/unit/test_transfers_pricing_visits.py |
| BR-04 Category-at-event pricing | PASS | tests/unit/test_transfers_pricing_visits.py |
| BR-05 Doctor visits | PASS | tests/unit/test_transfers_pricing_visits.py |
| BR-06 Package conversion | PARTIAL | tests/unit/test_packages_demands_gst.py |
| BR-07 Deposits and demands | PASS | tests/unit/test_packages_demands_gst.py |
| BR-07a Averaging and rounding | PASS | tests/unit/test_packages_demands_gst.py |
| BR-07b Blocking and emergency | PASS | tests/unit/test_packages_demands_gst.py |
| BR-08 Discounts | PASS | tests/unit/test_packages_demands_gst.py |
| BR-09 Interim billing | PARTIAL | Command handler + LedgerService |
| BR-10 Discharge settlement | PARTIAL | Command handler implemented |
| BR-11 GST calculation | PASS | tests/unit/test_packages_demands_gst.py |
| BR-12 Bed lifecycle | PARTIAL | Reservation and housekeeping handlers |
| EC-01 through EC-08 | PARTIAL | Covered in unit tests |
| Unit tests (63) | PASS | tests/unit/ |
| Integration tests (12) | PASS | tests/integration/ |
| Total tests (75) | PASS | All 75 passing |
| Verification report | PASS | docs/week-3/week-3-verification-report.md |
| Traceability matrix | PASS | docs/week-3/week-3-implementation-traceability.md |

## Week 4 - Final Submission

| Item | Status | Evidence |
|------|--------|----------|
| Output reconciliation | NOT STARTED | Pending |
| Sample execution | NOT STARTED | Pending |
| Final packaging | NOT STARTED | Pending |
| Demo video | NOT STARTED | Pending |
