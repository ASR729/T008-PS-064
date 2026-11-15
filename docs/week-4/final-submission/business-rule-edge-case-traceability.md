# Business-Rule and Edge-Case Traceability Matrix — PS-064 Team T008

**Project:** PS-064 Hospital Inpatient Billing and Bed Management Engine  
**Date:** 2026-11-15  
**Commit:** `4bcca54` (Week 4 correction, verified 42/42)  
**Verification basis:** Official 42-file reconciliation (42/42 matched, 0 mismatches), 10,223/10,223 fields matched, 75 tests passed — independently re-verified.  
**Legend:** PASS = verified by executable test or official output match.

---

## Business-Rule Traceability (BR-01 through BR-12, BR-07a, BR-07b)

| ID | Requirement | Approved Interpretation | Implementation Reference | Test Reference | Official Sample Evidence | Status |
|----|-------------|------------------------|--------------------------|----------------|--------------------------|--------|
| BR-01a | Noon bed-day anchor (non-ICU) | Day counted at noon (12:00) for non-ICU occupancy | `src/billing_engine/commands/__init__.py` — `_process_admission_bed_days`, `_post_bed_day_lines` | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0001.csv` (42/42 match) | PASS |
| BR-01b | ICU 08:00 anchor | ICU day counted at 08:00 when in ICU bed | `src/billing_engine/commands/__init__.py` — `_occupied_category_at`, `_get_category_at_time` | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-01c | Minimum one-day rule | At least one bed day per admission | `src/billing_engine/commands/__init__.py` — `_post_discharge_bed_day` | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0001.csv` (42/42 match) | PASS |
| BR-01d | Discharge after 14:00 adds extra bed day | Extra bed day when discharged after 14:00 | `src/billing_engine/commands/__init__.py` — `_post_discharge_bed_day` | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0019.csv` (42/42 match) | PASS |
| BR-01e | Early discharge / planned discharge rule | No extra day when discharge order issued previous day | `src/billing_engine/commands/__init__.py` — `_handle_discharge` ordering | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0022.csv` (42/42 match) | PASS |
| BR-02a | Requested category allocation | Bed allocated in requested category when available | `src/billing_engine/commands/__init__.py` — `_allocate_bed`, `_handle_admit` | `tests/unit/test_bed_allocation.py` | `ledger_ADM-0020.csv` (42/42 match) | PASS |
| BR-02b | Next-higher category fallback | Upgrade to next category when requested unavailable | `src/billing_engine/commands/__init__.py` — `_allocate_bed` | `tests/unit/test_bed_allocation.py` | `ledger_ADM-0020.csv` (42/42 match) | PASS |
| BR-02c | GENERAL gender matching | GENERAL beds respect gender restriction | `src/billing_engine/commands/__init__.py` — `_allocate_bed` | `tests/unit/test_bed_allocation.py` | (unit test evidence) | PASS |
| BR-02d | UPGRADE-FREE 48h window | Upgraded patient billed at requested rate for 48h | `src/billing_engine/commands/__init__.py` — `_post_bed_day_lines` (D-06) | `tests/unit/test_bed_allocation.py` | `ledger_ADM-0020.csv` (42/42 match) | PASS |
| BR-03a | Transfer count limit | Max 3 transfers; 4th rejected | `src/billing_engine/commands/__init__.py` — `_handle_transfer`, `MAX_TRANSFERS=3` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0028.csv` (42/42 match) | PASS |
| BR-03b | Transfer billed at new category rate | Transfer billed at new category rate | `src/billing_engine/services/__init__.py` — `PricingService` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0028.csv` (42/42 match) | PASS |
| BR-03c | ICU transfer | ICU entry via TRANSFER allowed; exit requires STEP_DOWN | `src/billing_engine/services/__init__.py` — `TransferService` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0013.csv` (42/42 match) | PASS |
| BR-03d | Doctor-authorised step-down | ICU discharge without step-down rejected | `src/billing_engine/commands/__init__.py` — `_handle_step_down` | `tests/unit/test_transfers_pricing_visits.py` | `rejections.csv` (42/42 match) | PASS |
| BR-03e | Bed availability/release | Released bed not double-allocated | `src/billing_engine/commands/__init__.py` — `_allocate_bed` | `tests/unit/test_bed_allocation.py` | `bed_occupancy_*.csv` (42/42 match) | PASS |
| BR-04a | Category at event time | Historical category used for multipliers | `src/billing_engine/commands/__init__.py` — `_get_category_at_time`; `services.PricingService` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-04b | Doctor/procedure/OT multiplier | Category multiplier applied correctly | `src/billing_engine/services/__init__.py` — `PricingService.calculate_charge` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0010.csv` (42/42 match) | PASS |
| BR-04c | Investigation multiplier | Investigation multiplier applied | `src/billing_engine/services/__init__.py` — `PricingService` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0001.csv` (42/42 match) | PASS |
| BR-04d | Pharmacy/consumables at MRP | Pharmacy at base rate (multiplier 1.00) | `src/billing_engine/services/__init__.py` — `PricingService` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0001.csv` (42/42 match) | PASS |
| BR-05a | First visit per doctor/day | Only first visit per doctor per day charged | `src/billing_engine/commands/__init__.py` — `_handle_visit` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0001.csv` (42/42 match) | PASS |
| BR-05b | Repeat same doctor/day free | Subsequent visits free | `src/billing_engine/commands/__init__.py` — `_handle_visit` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0001.csv` (42/42 match) | PASS |
| BR-05c | GENERAL doctor limit | GENERAL max 2 doctors/day enforced | `src/billing_engine/commands/__init__.py` — `_handle_visit` | `tests/unit/test_transfers_pricing_visits.py` | `rejections.csv` (42/42 match) | PASS |
| BR-05d | ICU intensivist flat charge | ICU intensivist charged at category multiplier | `src/billing_engine/commands/__init__.py` — `_handle_visit` | `tests/unit/test_transfers_pricing_visits.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-06a | Covered items | Covered lines at 0.00 with `[PKG-<code>]` | `src/billing_engine/commands/__init__.py` — `_package_covered` | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0003.csv` (42/42 match) | PASS |
| BR-06b | Excluded items | Excluded procedures itemised at full price | `src/billing_engine/commands/__init__.py` — package coverage | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-06c | Max length of stay | Days beyond LOS billed at package category rate | `src/billing_engine/commands/__init__.py` — package beyond-LOS | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0003.csv` (42/42 match) | PASS |
| BR-06d | Extra days | Extra days correctly calculated | `src/billing_engine/commands/__init__.py` — package beyond-LOS | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0003.csv` (42/42 match) | PASS |
| BR-06e | ICU conversion | ICU > 48h triggers package conversion | `src/billing_engine/commands/__init__.py` — `check_package_conversion` | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-06f | Non-included procedure conversion | Non-included procedures converted at full price | `src/billing_engine/commands/__init__.py` — package conversion | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-06g | Retroactive repricing | Previously covered lines repriced at conversion | `src/billing_engine/commands/__init__.py` — `_convert_package` | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-06h | Original item-code preservation | REPRICE preserves original item_code | `src/billing_engine/commands/__init__.py` — `_convert_package` | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0027.csv` (42/42 match) | PASS |
| BR-06i | PACKAGE line at discharge; package_status | PACKAGE line at discharge; package_status tracked | `src/billing_engine/commands/__init__.py`; `scripts/reconcile_outputs.py` `write_final_bill` | `tests/unit/test_packages_demands_gst.py` | `bill_*.csv` package_status (42/42 match) | PASS |
| BR-07a | Initial deposit | 25% package or 2x bed + ₹10,000 at admission | `src/billing_engine/commands/__init__.py` — `_handle_admit` deposit calc | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0003.csv` (42/42 match) | PASS |
| BR-07b | 80% threshold strictly greater | No demand at exactly 80% | `src/billing_engine/services/__init__.py` — `DemandService.check_demand_trigger` | `tests/unit/test_packages_demands_gst.py` | `demands.csv` (42/42 match) | PASS |
| BR-07c | Demand amount | Demand = avg daily charge rounded up to ₹100 | `src/billing_engine/services/__init__.py` — `calculate_demand_amount` | `tests/unit/test_packages_demands_gst.py` | `demands.csv` (42/42 match) | PASS |
| BR-07d | Partial deposits | Cumulative deposits satisfy demand | `src/billing_engine/commands/__init__.py` — `deposits_since_demand` | `tests/unit/test_packages_demands_gst.py` | `demands.csv` (42/42 match) | PASS |
| BR-07e | Second demand | TD2 raised after 48h if still > 80% | `src/billing_engine/commands/__init__.py` — demand lifecycle | `tests/unit/test_packages_demands_gst.py` | `demands.csv` ADM-0023-TD2 (42/42 match) | PASS |
| BR-07f | Procedure block | Procedures blocked during outstanding demand | `src/billing_engine/services/__init__.py` — `DemandService.check_procedure_block` | `tests/unit/test_packages_demands_gst.py` | `rejections.csv` TOPUP_BLOCK (42/42 match) | PASS |
| BR-07g | Emergency exception | Emergency procedures not blocked | `src/billing_engine/commands/__init__.py` — emergency procedures accepted | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0023.csv` (42/42 match) | PASS |
| BR-07h | Unblocking | Block lifted when both demands satisfied | `src/billing_engine/commands/__init__.py` — block lift | `tests/unit/test_packages_demands_gst.py` | `rejections.csv` (42/42 match) | PASS |
| BR-08a | Senior citizen discount | 10% on BED/NURSING for 60+ | `src/billing_engine/services/__init__.py` — `DiscountService.apply_senior_discount` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-08b | Employee referral discount | 15% on DOCTOR for referral | `src/billing_engine/services/__init__.py` — `DiscountService.apply_employee_referral_discount` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-08c | Charity discount | Percentage on eligible heads (0-50%) | `src/billing_engine/commands/__init__.py` — `_handle_charity`; final bill | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0033.csv` (42/42 match) | PASS |
| BR-08d | Eligible charge heads | Discounts only on eligible heads | `src/billing_engine/services/__init__.py` — discount application | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-08e | No discount on prohibited heads | No discount on PHARMACY/CONSUMABLE | `src/billing_engine/services/__init__.py` — discount exclusion | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-08f | Independent application | Discounts applied independently | `src/billing_engine/services/__init__.py` — discount calc | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-09a | Demand-triggered interim bill | Interim bill on demand trigger | `src/billing_engine/commands/__init__.py` — `_handle_interim_bill` | `tests/unit/` | `interim_bills.csv` (42/42 match) | PASS |
| BR-09b | Seven-day interim bill | Auto interim bill at 7-day intervals | `src/billing_engine/commands/__init__.py` — auto interim | `tests/unit/` | `interim_bills.csv` (42/42 match) | PASS |
| BR-09c | Correct admission filtering | Only own admission's lines included | `src/billing_engine/commands/__init__.py` — `_create_interim_bill` (D-07) | `tests/unit/` | `interim_bills.csv` (42/42 match) | PASS |
| BR-09d | Locking | Locked lines excluded from future bills | `src/billing_engine/commands/__init__.py` — `locked_by_interim` | `tests/unit/` | `interim_bills.csv` (42/42 match) | PASS |
| BR-09e | Post-lock correction | Signed adjustment lines after lock | `src/billing_engine/commands/__init__.py` — `_handle_correction` | `tests/unit/` | `ledger_ADM-0028.csv` (42/42 match) | PASS |
| BR-09f | Signed adjustment | Corrections adjust running bill correctly | `src/billing_engine/commands/__init__.py` — ADJ net amounts | `tests/unit/` | `ledger_ADM-0028.csv` (42/42 match) | PASS |
| BR-10a | Final bill | Final bill at discharge | `src/billing_engine/commands/__init__.py` — `_handle_discharge`, `_calculate_final_bill` | `tests/unit/` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-10b | Deposits | Deposits credited against bill | `scripts/reconcile_outputs.py` — `deposits_before_discharge`, `settlement_after_discharge` | `tests/unit/` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-10c | Discounts | Discounts applied before settlement | `scripts/reconcile_outputs.py` — discount components | `tests/unit/` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-10d | Positive balance | Balance due when deposits insufficient | `scripts/reconcile_outputs.py` — balance calculation | `tests/unit/` | `bill_ADM-0026.csv` (42/42 match) | PASS |
| BR-10e | Payment gate | Settlement rejected when nothing due | `src/billing_engine/commands/__init__.py` — settlement check | `tests/unit/` | `rejections.csv` (42/42 match) | PASS |
| BR-10f | Refund obligation | Refund when deposits exceed bill | `scripts/reconcile_outputs.py` — `refund_due` | `tests/unit/` | `bill_ADM-0005.csv` (42/42 match) | PASS |
| BR-10g | LAMA/DAMA | Discharge types handled correctly | `src/billing_engine/commands/__init__.py` — `_handle_discharge` | `tests/unit/` | `bill_ADM-0022.csv` (42/42 match) | PASS |
| BR-10h | Early discharge condition | Early discharge rules applied | `src/billing_engine/commands/__init__.py` — planned discharge detection | `tests/unit/` | `ledger_ADM-0022.csv` (42/42 match) | PASS |
| BR-11a | Room charge threshold | GST only when room > ₹5,000 | `src/billing_engine/services/__init__.py` — `GSTService.calculate_gst` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-11b | Exactly ₹5,000 boundary | No GST at exactly ₹5,000 | `src/billing_engine/services/__init__.py` — `GSTService.calculate_gst` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-11c | Qualifying room charges | GST on BED head only | `src/billing_engine/services/__init__.py` — `GSTService` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-11d | Nursing excluded | No GST on NURSING head | `src/billing_engine/services/__init__.py` — `GSTService` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-11e | Discount interaction | GST on discounted amount | `src/billing_engine/services/__init__.py` — GST calculation | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0010.csv` (42/42 match) | PASS |
| BR-11f | Per-bed-day calculation | GST calculated per bed-day line | `src/billing_engine/services/__init__.py` — `GSTService` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0001.csv` (42/42 match) | PASS |
| BR-12a | Housekeeping | Discharged bed → HOUSEKEEPING | `src/billing_engine/commands/__init__.py` — `_handle_discharge` | `tests/unit/` | `bed_occupancy_*.csv` (42/42 match) | PASS |
| BR-12b | Housekeeping clearance | HOUSEKEEPING → AVAILABLE on clearance | `src/billing_engine/commands/__init__.py` — `_handle_housekeeping_cleared` | `tests/unit/` | `bed_occupancy_*.csv` (42/42 match) | PASS |
| BR-12c | Reservation | RESERVED bed held for admission | `src/billing_engine/commands/__init__.py` — `_handle_reserve_bed` | `tests/unit/` | `bed_occupancy_*.csv` (42/42 match) | PASS |
| BR-12d | Six-hour expiry | Reservation expires after 6 hours | `src/billing_engine/commands/__init__.py` — reservation release | `tests/unit/` | `bed_occupancy_*.csv` (42/42 match) | PASS |
| BR-12e | Bed reallocation | Expired reservation bed reallocatable | `src/billing_engine/commands/__init__.py` — `_allocate_bed` | `tests/unit/` | `bed_occupancy_*.csv` (42/42 match) | PASS |

**Summary:** All 14 business rules (BR-01 through BR-12, BR-07a, BR-07b) verified PASS. Each rule has executable test evidence AND/OR official-output verification (42/42 reconciliation). No rule is marked verified merely because a method exists.

---

## Edge-Case Traceability (EC-01 through EC-08)

| ID | Scenario | Implementation Reference | Test Reference | Official Sample Evidence | Status |
|----|----------|--------------------------|----------------|--------------------------|--------|
| EC-01 | Admission at 11:59 vs 12:00 noon | `src/billing_engine/commands/__init__.py` — `_process_admission_bed_days` | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0001.csv` (noon counted), `ledger_ADM-0002.csv` (noon not counted) | PASS |
| EC-02 | Discharge at exactly 14:00 vs after | `src/billing_engine/commands/__init__.py` — `_post_discharge_bed_day` | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0008.csv` (14:00, no extra day), `ledger_ADM-0010/0019.csv` (after 14:00, extra day) | PASS |
| EC-03 | 23h59m stay minimum | `src/billing_engine/commands/__init__.py` — minimum stay rule | `tests/unit/test_bed_day_counting.py` | `ledger_ADM-0005.csv` (42/42 match) | PASS |
| EC-04 | UPGRADE-FREE 48-hour boundary | `src/billing_engine/commands/__init__.py` — `_upgrade_free_start`, `_post_bed_day_lines` | `tests/unit/test_bed_allocation.py` | `ledger_ADM-0020.csv` (42/42 match) | PASS |
| EC-05 | Package ICU conversion (>48h converts; exactly 48h does not) | `src/billing_engine/commands/__init__.py` — `check_package_conversion` | `tests/unit/test_packages_demands_gst.py` | `ledger_ADM-0026.csv` (no conversion at exactly 48h), `ledger_ADM-0027.csv` (conversion) | PASS |
| EC-06 | Running bill 80% threshold (exactly 80% no demand) | `src/billing_engine/services/__init__.py` — `DemandService.check_demand_trigger` | `tests/unit/test_packages_demands_gst.py` | `demands.csv` ADM-0038 (no demand at exactly 80%), ADM-0023-TD1 | PASS |
| EC-07 | GST ₹5,000 threshold (exactly 5,000 exempt) | `src/billing_engine/services/__init__.py` — `GSTService.calculate_gst` | `tests/unit/test_packages_demands_gst.py` | `bill_ADM-0019.csv` (gst_amt=0 at exactly 5,000), `bill_ADM-0020.csv` (gst_amt=275 at 5,500) | PASS |
| EC-08 | Locked event correction — ADJ line, original preserved | `src/billing_engine/commands/__init__.py` — `_handle_correction` | `tests/unit/` | `ledger_ADM-0028.csv` (42/42 match) | PASS |

**Summary:** All 8 edge cases verified PASS via executable tests and/or official-output match.

---

## Traceability Verification Notes

1. **Every rule has executable test evidence or official-output verification.** No rule is marked verified merely because a method exists. All rule rows cite either a specific test file or a specific `expected_outputs/` file confirmed matched in the independently re-verified 42/42 reconciliation.

2. **No fictional test references.** All test files cited exist in `tests/unit/` or `tests/integration/` and were verified passing (75/75).

3. **Official output evidence** references specific files in `data/official/T008-PS-064-sample-data/expected_outputs/` confirmed matched in the re-verified reconciliation.

4. **Implementation locations** point to actual source files and functions present at commit `4bcca54`.

5. **Previously unresolved decisions (D-U1–D-U3)** are now resolved, each directly exercised by the verified 42/42 official-output reconciliation (see `docs/week-4/final-submission/final-decision-log.md`).