# Phase 9 — Financial and Data Integrity Audit

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`  
**Audit date:** 2026-11-15  
**Current HEAD:** `4bcca54` (correction commit, verified)  
**Python:** 3.14.5  
**Verification basis:** Source code inspection + independently verified 42/42 official-output reconciliation (all 18 bills, 18 ledgers, demands, interim bills match exactly).  
**Status:** All accounting invariants verified through source inspection and exact output match. No defects found.

---

## 9.1 Calculation and Rounding Verification

### Decimal arithmetic with ROUND_HALF_UP
| Location | Code | Verified |
|----------|------|----------|
| `src/billing_engine/commands/__init__.py:77-84` | `round2` quantizes to 2dp with `ROUND_HALF_UP`; `round0` quantates to 1dp (rupee) with `ROUND_HALF_UP` | ✓ Decimal used throughout |
| `scripts/reconcile_outputs.py:19-24` | Same `round2`/`round0` in output writer | ✓ Consistent |

**No floating-point arithmetic** used for monetary values. `from decimal import Decimal, ROUND_HALF_UP` at `commands/__init__.py:12`.

### Final bill calculation (`_calculate_final_bill`, commands/__init__.py:2618)
Verified formula:
```
total_charges = round2(sum of gross for admission)
total_discounts = round2(senior + employee + charity)
net_before_rounding = round2(total_charges - total_discounts + gst_total)
rounding = round0(net_before_rounding) - net_before_rounding
final_bill = round0(net_before_rounding)
balance_due = round2(max(0, final_bill - deposits))
refund_due = round2(max(0, deposits - final_bill))
```

**Mutual exclusivity confirmed:** `balance_due > 0` → BALANCE_DUE; `refund_due > 0` → REFUND_DUE; else SETTLED. Balance due and refund due are never simultaneously asserted (verified by code branching).

### GST calculation (`GSTService.calculate_gst`, services/__init__.py:593)
| Rule | Code | Verified |
|------|------|----------|
| 5% GST on qualifying room charges | `GST_RATE = Decimal('5.00')` | ✓ |
| Strictly above ₹5,000 threshold | `GST_THRESHOLD = Decimal('5000.00')`; comparison `>` | ✓ |
| Exactly ₹5,000 exempt | Threshold is strictly greater | ✓ |
| BED head only, nursing excluded | Code checks BED head; NURSING not GST-eligible | ✓ |
| GST on (gross - discount) after discount | Discount applied before GST threshold | ✓ (BR-11e) |

### Discounts (`DiscountService`, services/__init__.py:491)
| Discount | Rate | Eligible heads | Conditions | Verified |
|----------|------|---------------|------------|----------|
| Senior citizen | 10% | BED, NURSING only | patient_age >= 60 | ✓ |
| Employee referral | 15% | DOCTOR_VISIT only | employee_referral flag | ✓ |
| Charity | up to 50% | All heads except PHARMACY/CONSUMABLE | CEO reference required; `min(charity_pct, 50)` | ✓ |

### Package pricing and conversion
| Aspect | Implementation | Verified |
|--------|---------------|----------|
| Covered items at 0.00 with `[PKG-<code>]` | `_package_covered` (commands/__init__.py:2535); zeroes covered lines at posting | ✓ (Defect B fix) |
| Excluded items itemised at full price | Package coverage excludes exclusion heads | ✓ |
| Beyond-LOS bed days at package category rate | Package beyond-LOS billing | ✓ |
| ICU > 48h triggers conversion | `check_package_conversion` | ✓ |
| Exactly 48h does NOT convert | Threshold strictly greater than 48h | ✓ |
| Retroactive repricing with REPRICE lines | `_convert_package` — per-admission, event_id-keyed, original fields preserved | ✓ (Defect B fix; no cross-admission contamination) |
| PACKAGE line at discharge | Posted at discharge; `package_status` tracked | ✓ |
| `package_status`: NONE/ACTIVE/COMPLETED/CONVERTED | `write_final_bill` (reconcile_outputs.py:221-227) | ✓ (Defect F fix — was hardcoded NONE) |

---

## 9.2 Deposit and Top-Up Demand Verification

### Deposit calculation
| Component | Rule | Verified |
|-----------|------|----------|
| Package admission | 25% of package price | ✓ |
| Non-package | 2 × requested category bed charge + ₹10,000 | ✓ |
| `deposits_before_discharge` / `settlement_after_discharge` split | Tracked on Admission model (models/__init__.py:203-204); written by `write_final_bill` (reconcile_outputs.py:249-252) | ✓ (Defect F fix — was hardcoded 0) |

### Top-up demands (`DemandService`, services/__init__.py:704)
| Rule | Verification |
|------|--------------|
| Demand raised when running bill strictly > 80% of deposits | `check_demand_trigger` — strictly greater; exactly 80% no demand | ✓ (EC-06 verified) |
| Demand amount = avg daily charge rounded up to ₹100 | `calculate_demand_amount` — last 3 calendar days / charge-bearing days, round up | ✓ (BR-07a) |
| `trigger_line_no` populated | `_line_counter` incremented (Defect C fix) | ✓ |
| Zero-net lines excluded from charge days | `record_charge_event` skips net=0 | ✓ (Defect C fix) |
| Procedure block after 48h if still > 80% | `check_procedure_block` — 48-hour deadline | ✓ (BR-07b) |
| Emergency procedures allowed during block | `is_emergency` flag accepted | ✓ (EC-06 / BR-07g) |
| Block lifted when both demands closed | Block-lift logic | ✓ |

### Demands output verified: `demands.csv` 3/3 rows matched (42/42 reconciliation).

---

## 9.3 Interim Bill Verification

| Aspect | Implementation | Verified |
|--------|---------------|----------|
| Manual interim bill (INTERIM_BILL command) | `_handle_interim_bill` — locks prior entries | ✓ |
| Automatic 7-day interim bill | Auto interim at 7-day intervals | ✓ |
| Per-admission locking | `_create_interim_bill` filters `e.admission_id == adm_id` (D-07) | ✓ |
| Cumulative gross/discount across locked bills | `gross_total`/`discount_total` cumulative over all locked entries (Defect D fix) | ✓ |
| `running_bill` from admission.running_bill | Not per-bill sum | ✓ (Defect D fix) |
| Locked lines excluded from future bills | `locked_by_interim` flag | ✓ |
| Post-lock corrections via ADJ lines | `_handle_correction` — signed adjustment | ✓ (BR-09e/f) |

**Interim bills verified: `interim_bills.csv` 3/3 rows matched (42/42 reconciliation).**

---

## 9.4 Ledger-to-Final-Bill Consistency

| Invariant | Verification method | Result |
|-----------|-------------------|--------|
| No duplicate charge posting | Each charge event → one ledger entry; corrections add ADJ lines (not edits) | ✓ (42/42 ledger match) |
| No cross-admission charges | All ledger queries filter `e.admission_id == adm_id`; `_convert_package` is per-admission (Defect B fix) | ✓ |
| Correct deposit attribution | `deposits_before_discharge` / `settlement_after_discharge` tracked separately; credited against bill | ✓ |
| Correct final balance | `balance_due` / `refund_due` computed from `final_bill - deposits` | ✓ (42/42 bill match) |
| Balance due and refund due mutually exclusive | Branching logic: balance > 0 OR refund > 0 OR settled | ✓ |
| Package-covered lines at 0.00 with `[PKG-<code>]` | Zeroed at posting with prefix | ✓ |
| Correct locked-event adjustments | ADJ lines with signed net; original entry preserved | ✓ |
| Correct occupancy ownership | Bed status reflects occupying admission; snapshots at correct timestamps (Defect E fix) | ✓ |

---

## 9.5 Admission-Level Isolation

All financial queries filter by `admission_id`:
- Ledger entries: `e.admission_id == adm_id`
- Discounts: accumulated per admission
- GST: accumulated per admission
- Final bill: per admission (`_calculate_final_bill(admission)`)
- Interim bills: per admission (D-07)
- Demands: per admission (`d.admission_id`)
- Package conversion: per-admission (Defect B fix — was cross-admission, now fixed)

**Verified:** No cross-admission contamination in any financial output (42/42 match across all 18 admissions).

---

## 9.6 Occupancy-to-Bed Allocation Consistency

| Aspect | Verification |
|--------|--------------|
| Bed status reflects occupying admission | `bed.adm_id` set on admission; cleared on discharge/housekeeping |
| Occupancy snapshots at correct timestamps | `_capture_occupancy_snapshot` — captured at command timestamp after handler (Defect E fix); same-timestamp commands included |
| HOUSEKEEPING retains adm_id/since_ts | Fixed (Defect E — was clearing adm_id/since_ts) |
| RESERVED sets since_ts | Fixed (Defect E) |
| No double allocation | `_allocate_bed` checks bed status AVAILABLE/RESERVED-for-patient |
| 3 occupancy snapshots (60 beds each) matched | `bed_occupancy_*.csv` 42/42 match |

---

## 9.7 Financial Integrity — Invariants Summary

| Accounting invariant | Source | Status |
|---------------------|--------|--------|
| No duplicate charge posting | Ledger entry model; ADJ lines for corrections | ✓ VERIFIED |
| No cross-admission charges | Per-admission filtering everywhere | ✓ VERIFIED |
| Correct deposit attribution | `deposits_before_discharge` / `settlement_after_discharge` split | ✓ VERIFIED |
| Correct final balance | `final_bill - deposits` → balance_due / refund_due | ✓ VERIFIED |
| Balance due and refund due mutually exclusive | Branching logic | ✓ VERIFIED |
| Package-covered lines at 0.00 with `[PKG-<code>]` | `_package_covered` at posting | ✓ VERIFIED |
| Correct locked-event adjustments | ADJ signed lines; original preserved | ✓ VERIFIED |
| Correct occupancy ownership | Bed status + snapshot timing | ✓ VERIFIED |
| Decimal ROUND_HALF_UP rounding | `round2`/`round0` throughout | ✓ VERIFIED |
| GST 5% strictly above ₹5,000 on BED only | `GSTService.calculate_gst` | ✓ VERIFIED |
| Senior 10% bed/nursing; employee 15% doctor; charity ≤50% | `DiscountService` | ✓ VERIFIED |

---

## 9.8 Phase 9 Readiness Decision

**VERIFIED.** All financial and data integrity invariants are confirmed through source-code inspection and the independently verified 42/42 official-output reconciliation. All 18 bills match exactly (confirming final balances, discounts, GST, package_status, deposits/settlement split), all 18 ledgers match (confirming charge calculations, category-at-event, package coverage), demands match (3/3), interim bills match (3/3), and occupancy matches (3×60 beds). No accounting defects found.

Proceed to Phase 10 — Documentation and Evidence Audit.