# Phase 4 — Week 2 Acceptance Audit

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`  
**Audit date:** 2026-11-15  
**Week 2 commit:** `2c3b306` ("Add Week 2 core implementation (billing engine)")  
**Week 2 baseline audit:** `docs/week-3/week-2-baseline-audit.md`  
**Status:** Week 2 is a partial/core-implementation phase. Only domain models, master data loader, and ADMIT command handler were implemented. Business rules, output generation, tests, and most command handlers were intentionally deferred to Week 3.

---

## Week 2 Requirement Audit

| Req ID | Week | Requirement description | Evidence file | Verification command / method | Result | Status | Outstanding action | Responsible |
|--------|------|------------------------|---------------|-------------------------------|--------|--------|--------------------|-------------|
| W2-01 | Week 2 | Project/package setup — src/billing_engine/ package with modules | `docs/week-3/week-2-baseline-audit.md` §1; directory listing | Inspect repo at `2c3b306` | `src/billing_engine/` with `billing/`, `commands/`, `loaders/`, `models/`, `outputs/` directories; `billing/`, `ledger/`, `outputs/` empty at Week 2; `commands/__init__.py` (567 lines, partial), `loaders/__init__.py` (342 lines, complete), `models/__init__.py` (380 lines, complete) | PASS | None | — |
| W2-02 | Week 2 | Data models — Patient, Doctor, Bed, Admission, ChargeEvent, LedgerEntry, etc. | `docs/week-3/week-2-baseline-audit.md` §2; `src/billing_engine/models/__init__.py` | Inspect models at `2c3b306` | All 8+ domain entities implemented: Patient, Doctor, Bed, Admission, BedAllocation, BedOccupancyPeriod, Transfer, StepDown, PackageEnrollment, PackageConversion, ChargeEvent, Deposit, Demand, InterimBill, LedgerEntry, Rejection | PASS | None | — |
| W2-03 | Week 2 | Master-data loading — all 6 CSV files | `docs/week-3/week-2-baseline-audit.md` §2; `src/billing_engine/loaders/__init__.py` | Inspect loader at `2c3b306` | All 6 master CSV files loaded: categories (5), beds (60), doctors (14), tariff (80), packages (6), admissions (40); comprehensive validation and consistency checks | PASS | None | — |
| W2-04 | Week 2 | Ward and bed setup | `src/billing_engine/models/__init__.py`; `src/billing_engine/loaders/__init__.py` | Inspect code | Bed model with bed_id, ward_id, category, gender_restriction, status, adm_id, since_ts, billing_category, hold_until; loader reads beds.csv | PASS | None | — |
| W2-05 | Week 2 | Tariffs and packages | `src/billing_engine/models/__init__.py`; `src/billing_engine/loaders/__init__.py` | Inspect code | TariffItem and Package classes referenced; loader reads tariff.csv and packages.csv | PASS | None | — |
| W2-06 | Week 2 | Patient registration — ADMIT command | `docs/week-3/week-2-baseline-audit.md` §2; `src/billing_engine/commands/__init__.py` | Inspect ADMIT handler | ADMIT command fully implemented: parser with validation, deposit calculation, bed allocation, occupancy updates, error handling and rejection generation | PASS | None | — |
| W2-07 | Week 2 | Bed allocation | `src/billing_engine/commands/__init__.py` (ADMIT handler) | Inspect code | Bed allocation included in ADMIT handler (deposit validation, bed assignment) | PASS | None | — |
| W2-08 | Week 2 | Admission and deposits | `src/billing_engine/commands/__init__.py` (ADMIT handler) | Inspect code | Admission creation with deposit validation included in ADMIT handler | PASS | None | — |
| W2-09 | Week 2 | Timestamped charge events | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect models | ChargeEvent model exists with event_id, adm_id, event_ts, head, item_code, qty, base_amount, multiplier, gross, discount_pct, discount_amt, gst_amt, net, locked_by_interim | PASS | None | — |
| W2-10 | Week 2 | Category-at-event pricing | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect models/services | PricingService not created at Week 2 (services/ directory empty). Category-at-event pricing deferred to Week 3. | DEFERRED | Intentionally deferred to Week 3 per Week 3 plan | — |
| W2-11 | Week 2 | Pharmacy and consumable MRP | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect code | Not implemented at Week 2; deferred to Week 3 | DEFERRED | Intentionally deferred to Week 3 | — |
| W2-12 | Week 2 | Command processing — all 16 command types | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect commands/__init__.py at `2c3b306` | Only ADMIT implemented. 15 handlers NOT implemented: RESERVE_BED, TRANSFER, STEP_DOWN, VISIT, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, DEPOSIT, INTERIM_BILL, CORRECTION, CHARITY, DISCHARGE, HOUSEKEEPING_CLEARED | PARTIAL | 15/16 handlers deferred to Week 3 | — |
| W2-13 | Week 2 | Rollback and error behaviour | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect ADMIT handler | Error handling and rejection generation present in ADMIT handler; no rollback mechanism specified at Week 2 | PARTIAL | Basic error handling in ADMIT only; rollback not a Week 2 requirement | — |
| W2-14 | Week 2 | Ledger structure | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect models | LedgerEntry model exists; LedgerManager not created (ledger/ directory empty) | PARTIAL | Ledger structure defined in model; LedgerManager deferred to Week 3 | — |
| W2-15 | Week 2 | Interim bill foundations | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect models | InterimBill model exists; no interim bill generation at Week 2 | DEFERRED | Deferred to Week 3 | — |
| W2-16 | Week 2 | Billing and settlement foundations | `docs/week-3/week-2-baseline-audit.md` §2 | Inspect code | BillingCalculator not created (billing/ directory empty); no billing/settlement at Week 2 | DEFERRED | Deferred to Week 3 | — |
| W2-17 | Week 2 | Week 2 tests and benchmark evidence | `docs/week-3/week-2-baseline-audit.md` §3 | Inspect tests/ at `2c3b306` | **0 tests** — tests/unit/ and tests/integration/ empty at Week 2. Test coverage 0%. | PARTIAL (deferred) | No tests at Week 2; test suite created in Week 3 (commit c1599de, 75 tests) | — |
| W2-18 | Week 2 | Week 2 Git evidence | `git log --oneline` | Inspect commit `2c3b306` | Commit `2c3b306` "Add Week 2 core implementation (billing engine)" on master, pushed and remote-synced | PASS | None | — |
| W2-19 | Week 2 | Week 2 completion gate | `docs/week-3/week-2-baseline-audit.md` | Read baseline audit | Week 2 baseline documents actual state: models + loader + ADMIT complete; rest deferred. No claim of full Week 2 completion. | PASS | None | — |

---

## Week 2 Feature Classification

| Feature | Week 2 status | Disposition | Evidence |
|---------|--------------|-------------|----------|
| Domain models | Completed at Week 2 | Completed | `src/billing_engine/models/__init__.py` at `2c3b306` |
| Master data loading | Completed at Week 2 | Completed | `src/billing_engine/loaders/__init__.py` at `2c3b306` |
| ADMIT command handler | Completed at Week 2 | Completed | `src/billing_engine/commands/__init__.py` at `2c3b306` |
| Bed allocation | Completed at Week 2 (via ADMIT) | Completed | ADMIT handler |
| Admission and deposits | Completed at Week 2 (via ADMIT) | Completed | ADMIT handler |
| Charge event model | Defined at Week 2 | Completed (model only) | ChargeEvent dataclass |
| Category-at-event pricing | NOT implemented at Week 2 | Deferred to Week 3 | services/ empty at `2c3b306` |
| Pharmacy/consumable MRP | NOT implemented at Week 2 | Deferred to Week 3 | Not in code at `2c3b306` |
| 15 non-ADMIT command handlers | NOT implemented at Week 2 | Deferred to Week 3 | 15 handlers absent at `2c3b306` |
| Services layer | NOT implemented at Week 2 | Deferred to Week 3 | services/ directory empty |
| Billing engine | NOT implemented at Week 2 | Deferred to Week 3 | billing/ directory empty |
| Ledger system | NOT implemented at Week 2 | Deferred to Week 3 | ledger/ directory empty |
| Output generation | NOT implemented at Week 2 | Deferred to Week 3 | outputs/ directory empty |
| Test suite | NOT implemented at Week 2 | Deferred to Week 3 | 0 tests at `2c3b306` |

---

## Week 2 Defects Found (and fixed in Week 3)

Per `docs/week-3/week-3-verification-report.md` §B, 13 Week 2 defects were identified and fixed during Week 3:
1. Transfer class formatting error (stray `n        ` prefix)
2. Admission.gender type mismatch (Category instead of Gender enum)
3. Missing TariffItem class
4. ADMIT handler `command_id` typo (should be `command_type`)
5. `_handle_consumable` function name corruption (`Hanclose[`)
6. Category import path in loaders (`..models` not `.models`)
7. Category creation with keyword args (Enum doesn't accept kwargs)
8. Doctor parsing field name mismatch (`doctor_name` vs `name`)
9. Gender import missing in loaders
10. `daily_bed_charge` vs `daily_charge` property name
11. `UNKNOWN_COMMAND` undefined (added `CommandType.UNKNOWN`)
12. Argument index mismatch in `ParsedCommand.__post_init__`
13. 15 unimplemented command handlers (implemented in Week 3)

All 13 resolved by Week 3 commit `c1599de` per week-3-verification-report §C.

---

## Week 2 Acceptance Summary

| Gate | Check | Result | Evidence |
|------|-------|--------|----------|
| W2-01 | Project/package setup | PASS | `src/billing_engine/` structure at `2c3b306` |
| W2-02 | Data models | PASS | `models/__init__.py` (380 lines) |
| W2-03 | Master-data loading | PASS | `loaders/__init__.py` (342 lines) |
| W2-04 | Ward and bed setup | PASS | Bed model + loader |
| W2-05 | Tariffs and packages | PASS | Models + loader |
| W2-06 | Patient registration (ADMIT) | PASS | ADMIT handler complete |
| W2-07 | Bed allocation | PASS | Via ADMIT |
| W2-08 | Admission and deposits | PASS | Via ADMIT |
| W2-09 | Timestamped charge events | PASS | ChargeEvent model |
| W2-10 | Category-at-event pricing | DEFERRED | To Week 3 |
| W2-11 | Pharmacy/consumable MRP | DEFERRED | To Week 3 |
| W2-12 | Command processing (all 16) | PARTIAL | ADMIT only; 15 deferred |
| W2-13 | Rollback and error behaviour | PARTIAL | ADMIT error handling only |
| W2-14 | Ledger structure | PARTIAL | Model defined; manager deferred |
| W2-15 | Interim bill foundations | DEFERRED | To Week 3 |
| W2-16 | Billing/settlement foundations | DEFERRED | To Week 3 |
| W2-17 | Week 2 tests | PARTIAL (deferred) | 0 tests at Week 2 |
| W2-18 | Week 2 Git evidence | PASS | Commit `2c3b306` pushed |
| W2-19 | Week 2 completion gate | PASS | Baseline audit documents actual partial state |

**Week 2 acceptance decision: PASS (with documented deferrals).** Week 2 correctly delivered domain models, master data loading, and the ADMIT command handler. All other features (category-at-event pricing, 15 command handlers, services, billing, ledger, outputs, tests) were intentionally deferred to Week 3 — this is the approved plan, not a Week 2 failure. No retrospective claim is made that Week 2 deliverables were completed during Week 2 merely because they exist in the current codebase.

**Historical distinction:** Week 2 status is recorded at its original checkpoint (commit `2c3b306`). The baseline audit (`docs/week-3/week-2-baseline-audit.md`) accurately documents the partial state. The 13 Week 2 defects were fixed during Week 3 (commit `c1599de`), which is separately documented.