# Viva Preparation — PS-064 Team T008

**Team Members:** Asher Vidukumar, Asifur Rahman  
**Project:** Hospital Inpatient Billing and Bed Management Engine  
**Repository:** https://github.com/ASR729/T008-PS-064.git  
**Commit:** `4bcca54` (Week 4 correction, verified 42/42)  
**Python:** 3.14.5 | **pytest:** 9.2.0

---

## How to Use This Document

Each question has a technically correct answer referencing the actual implementation. Answers are suitable for an undergraduate capstone viva. No claims are fabricated. Where a team member's individual contribution cannot be verified from git history, it is marked for team confirmation.

---

## 1. Project Overview

**Q1:** What is the PS-064 project?
**A:** The Hospital Inpatient Billing and Bed Management Engine — a command-file-driven Python backend that simulates hospital inpatient operations (admissions, bed allocation, charge events, packages, deposits, discounts, GST, interim billing, discharge settlement, bed lifecycle). It generates CSV financial outputs reconciled against official expected outputs.

**Q2:** Why is it command-file driven?
**A:** The assignment specifies a command-file-driven backend engine. It's simple, auditable, deterministic, and requires no database or external services.

**Q3:** What is the technology stack?
**A:** Python 3.10+ (tested on 3.14.5), pytest 9.2.0 for testing, CSV for all inputs/outputs, Python standard library only — no external dependencies.

---

## 2. Problem Statement and Scope

**Q4:** What problem does the system solve?
**A:** Complex inpatient billing with interdependent rules: bed-day counting with noon/ICU anchors, category-at-event pricing, package conversion, top-up demands, discounts, GST, interim/final settlement, and bed lifecycle.

**Q5:** What is in scope?
**A:** Command processing (16 command types), master data loading, all 12 business rules + BR-07a/b, 8 edge cases, output generation (42 file types), test suite (75 tests), output reconciliation.

**Q6:** What is out of scope?
**A:** Web GUI, database persistence, API server, real-time processing, OPD scheduling, insurance pre-authorisation, external integrations, mobile app.

---

## 3. Architecture

**Q7:** Describe the layered architecture.
**A:** Command Processing Layer → Business Rule Services → Domain Models → Data Access Layer. Each layer has a single responsibility; command processing orchestrates, services contain business logic, models hold state, loaders read CSVs.

**Q8:** Why separate services from command handlers?
**A:** Separation of concerns — handlers orchestrate command flow; services encapsulate reusable business logic (pricing, discounts, GST, demands) that can be tested independently.

**Q9:** Is there a database?
**A:** No. In-memory storage only, per assignment specification (D-01).

---

## 4. Python Implementation

**Q10:** How are monetary calculations handled?
**A:** All money uses `Decimal` with `ROUND_HALF_UP` via `round2` (2dp) and `round0` (1dp) functions. No floating-point for money (D-02).

**Q11:** How is determinism ensured?
**A:** Commands processed strictly in file order; same inputs produce same outputs; no randomness or wall-clock dependence in business logic.

**Q12:** What is the entry point for the official sample run?
**A:** `scripts/run_reconciliation.py` → `scripts.reconcile_outputs.run_sample_execution(...)`, which loads master data, processes `commands.txt`, writes outputs to `build/official-sample-run/`, and reconciles against `expected_outputs/`.

---

## 5. Data Models

**Q13:** What are the core domain entities?
**A:** Patient, Doctor, Bed, Admission, ChargeEvent/LedgerEntry, Deposit, Demand, InterimBill, Rejection, Package, Category, Gender.

**Q14:** How is the Admission model structured?
**A:** Tracks `adm_id`, patient info, requested/allocated category, bed, admit/discharge timestamps, running bill, deposits, balance/refund due, discounts, package code, and final bill.

**Q15:** How are ledger entries structured?
**A:** `line_no`, `event_ts`, `counting_ts`, `head`, `item_code`, `description`, `category_at_event`, `qty`, `base_amount`, `multiplier`, `gross`, `discount_pct`, `discount_amt`, `gst_amt`, `net`, `locked_by_interim`, `event_id`.

---

## 6. Command Processing

**Q16:** What is the command format?
**A:** Pipe-delimited: `COMMAND\|timestamp\|arg1\|arg2\|...`. Example: `ADMIT\|2026-01-15 10:00:00\|ADM-0001\|15000.00\|CASH`.

**Q17:** How many command types are supported?
**A:** 16: ADMIT, RESERVE_BED, TRANSFER, STEP_DOWN, VISIT, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, DEPOSIT, INTERIM_BILL, CORRECTION, CHARITY, DISCHARGE, HOUSEKEEPING_CLEARED.

**Q18:** How are rejections handled?
**A:** Validation stops at first failing check; each rejection recorded with a code (e.g., `TOPUP_BLOCK`, `STEP_DOWN_REQUIRED`, `TRANSFER_LIMIT`, `NO_BED`) and detail; rejection advances the clock.

---

## 7. Bed Allocation and Lifecycle

**Q19:** How does bed allocation work (BR-02)?
**A:** Requested category first; GENERAL prefers gender-matching ward; if unavailable, next-higher category (GENERAL < SEMI_PRIVATE < PRIVATE < DELUXE); ICU never upgrade target; UPGRADE-FREE 48h window billed at requested rate; no bed → `NO_BED`.

**Q20:** What is the bed lifecycle?
**A:** AVAILABLE → RESERVED → OCCUPIED → HOUSEKEEPING → AVAILABLE. Reservation holds for 6 hours; discharge → housekeeping → cleared → available.

**Q21:** Can ICU be used as an upgrade target?
**A:** No. ICU is never an upgrade target (BR-02).

---

## 8. Billing and Tariff Calculations

**Q22:** How is category-at-event pricing applied (BR-04)?
**A:** Charges use the category occupied at event time, not the current category. Multipliers from `categories.csv` applied to base amount: `gross = base_amount × qty × multiplier`.

**Q23:** How are doctor visits charged (BR-05)?
**A:** First visit per doctor per day chargeable; repeat same doctor same day free; GENERAL limited to 2 doctors/day; ICU intensivist flat ₹2,500 per ICU day.

**Q24:** How are pharmacy/consumables priced?
**A:** At MRP (base rate) with multiplier 1.00.

---

## 9. Package Handling (BR-06)

**Q25:** When does package conversion trigger?
**A:** ICU stay > 48:00:00 (exactly 48:00:00 does NOT convert) or a non-included procedure/OT occurs.

**Q26:** What are REPRICE lines?
**A:** Separate ledger lines generated during package conversion for previously covered events, at full price with original fields preserved; originals stay at 0.00 with `[PKG-<code>]`.

**Q27:** What is `package_status`?
**A:** NONE / ACTIVE / CONVERTED / COMPLETED, tracked per admission and shown in the final bill.

---

## 10. Deposits and Top-Up Demands (BR-07, BR-07a, BR-07b)

**Q28:** How is the admission deposit calculated?
**A:** Package: 25% of package price. Non-package: 2 × requested category bed charge + ₹10,000.

**Q29:** When is a top-up demand created?
**A:** When running bill strictly exceeds 80% of deposits. Exactly 80% does NOT raise a demand.

**Q30:** How is the demand amount calculated (BR-07a)?
**A:** Total charges in last 3 calendar days / days with at least one charge line (zero-net excluded), rounded up to nearest ₹100.

**Q31:** When is procedure blocking activated (BR-07b)?
**A:** 48 hours after first demand if bill still > 80% of deposits. Emergency procedures allowed during block. Block lifts when both demands closed with sufficient deposits.

---

## 11. Interim Billing (BR-09)

**Q32:** What is the difference between manual and automatic interim bills?
**A:** Manual via `INTERIM_BILL` command; automatic at admit + 7 days, + 14 days, … while admitted.

**Q33:** How are locked events corrected?
**A:** Locked events corrected via signed ADJ adjustment line (original preserved); unlocked events corrected in place.

**Q34:** Is interim locking per-admission?
**A:** Yes (D-07) — each admission's interim bills lock only that admission's entries.

---

## 12. Final Settlement and Refunds (BR-10)

**Q35:** How is the final bill calculated?
**A:** `total_charges − total_discounts + gst_total`, rounded half-up to rupee. `balance_due = max(0, final_bill − deposits)`; `refund_due = max(0, deposits − final_bill)` — mutually exclusive.

**Q36:** What is the payment gate?
**A:** Settlement rejected when nothing due; balance due → `DISCHARGE_PENDING_PAYMENT`; refund due → `DISCHARGED` with refund obligation.

**Q37:** How are LAMA/DAMA handled?
**A:** Billed identically to NORMAL, tagged with discharge type.

---

## 13. GST and Discounts (BR-08, BR-11)

**Q38:** How is GST calculated (BR-11)?
**A:** 5% on BED head only when `(gross − discount_amt) > 5000.00` per day. Exactly ₹5,000 exempt. Nursing excluded. Discount applied before GST threshold.

**Q39:** What discounts apply (BR-08)?
**A:** Senior 60+: 10% on BED/NURSING. Employee referral: 15% on DOCTOR. Charity: up to 50% with CEO reference, applied at final bill, excludes PHARMACY/CONSUMABLE.

---

## 14. Business Rules

**Q40:** List all business rules.
**A:** BR-01 bed-day counting, BR-02 bed allocation/UPGRADE-FREE, BR-03 transfers/ICU, BR-04 category-at-event pricing, BR-05 doctor visits, BR-06 packages, BR-07 deposits/demands, BR-07a average daily charge, BR-07b procedure blocking, BR-08 discounts, BR-09 interim billing, BR-10 final settlement, BR-11 GST, BR-12 bed lifecycle.

**Q41:** Are all rules verified?
**A:** Yes — all 14 rules verified PASS via unit tests and/or the 42/42 official-output reconciliation.

---

## 15. Edge Cases (EC-01 through EC-08)

**Q42:** What happens at exactly noon admission?
**A:** That noon is NOT counted as a bed day (EC-01).

**Q43:** What happens at discharge after 14:00?
**A:** One extra bed day added; exactly 14:00:00 adds nothing (EC-02).

**Q44:** What happens at exactly 48 hours ICU?
**A:** No package conversion — conversion triggers when ICU stay EXCEEDS 48 hours (EC-05).

**Q45:** What happens at exactly 80% of deposits?
**A:** No demand raised — strictly greater than 80% required (EC-06).

**Q46:** What happens at exactly ₹5,000 room charge?
**A:** No GST — strictly above ₹5,000 required (EC-07).

---

## 16. Testing

**Q47:** How many tests exist?
**A:** 75 tests (63 unit + 12 integration), all passing.

**Q48:** How do you run the tests?
**A:** `python -m pytest -q` from the repo root.

**Q49:** What do the tests cover?
**A:** Bed-day counting, bed allocation, transfers/pricing/visits, packages/demands/GST/discounts, and end-to-end sample workflow integration.

**Q50:** Are any tests weakened?
**A:** No. All assertions intact; comparator not weakened (Safety Rules 5–6).

---

## 17. Official Sample Reconciliation

**Q51:** What is the reconciliation result?
**A:** 42/42 files matched, 0 mismatched, 0 missing, 0 extra, 10,223/10,223 fields matched.

**Q52:** Is it reproducible?
**A:** Yes — a second clean execution in a fresh output directory also produced 42/42.

**Q53:** Were official inputs modified?
**A:** No — `git diff -- data/official/` is empty.

---

## 18. Git and GitHub

**Q54:** What is the final commit?
**A:** `4bcca54` — "fix: resolve Week 4 defects and achieve 42/42 official output reconciliation", pushed to `origin/master` (remote SHA matches local).

**Q55:** Is Week 3 history preserved?
**A:** Yes — Week 2 (`2c3b306`) and Week 3 (`c1599de`) commits intact; no force-push or history rewrite (D-14).

**Q56:** Who authored the commits?
**A:** All 9 commits authored by `Asif <asifrahman7865@gmail.com>`. No commits attributable to Asher Vidukumar in git history — requires team confirmation.

---

## 19. Limitations and Design Trade-offs

**Q57:** What are the known limitations?
**A:** Demo video not recorded (environment limitation); official sources SRC-001–SRC-005 not available locally; Asher's contributions unverifiable from git; in-memory storage only; no web interface.

**Q58:** What are the documented design trade-offs (D-U1–D-U3)?
**A:** Bed-day line ordering with cross-admission commands, package conversion edge cases, and interim bill timing — all resolved and verified by the 42/42 reconciliation.

---

## 20. Future Improvements

**Q59:** What would you add next?
**A:** Record the demo video externally, create a submission ZIP, obtain official sources SRC-001–SRC-005, confirm team contributions, address D-U1–D-U3 trade-offs if time permits.

**Q60:** Is the project evaluator-ready?
**A:** Implementation verified (42/42, 75/75 tests), documentation complete, but demo video is BLOCKED pending team recording and Asher's contributions need team confirmation — so `READY WITH DOCUMENTED LIMITATIONS`.

---

## Team-Specific Preparation

### Asher Vidukumar
**Claimed responsibilities (per responsibility matrix):** Domain models, business services, testing, documentation, demo preparation (shared with Asifur).

**Verifiable evidence:** No git commits attributable to Asher. All 9 commits are by Asif.

**Viva topics:** Asher should be prepared to explain domain models, business services, testing strategy, documentation, and the overall architecture — but individual contributions require team confirmation.

### Asifur Rahman
**Verifiable responsibilities:** All source code commits (Week 0–4), all documentation commits, defect correction (42/42), Git/GitHub push and remote sync.

**Git evidence:** Commits `7269551`, `62e0d33`, `5ca4d21`, `92ab35b`, `2c3b306`, `c1599de`, `5d463d8`, `4bcca54` — all by Asif.

**Viva topics:** Asif can explain the entire implementation, architecture, command processing, output generation, testing, reconciliation, and Git history.

### Both Members
Both must be able to explain the overall project architecture, not only their assigned files. The viva covers all 60 questions above plus live code modification.

---

## Live Code Modification Exercises

### Exercise 1: Add Deposit Maximum Validation (validation change)

**Starting file:** `src/billing_engine/commands/__init__.py`, `_handle_admit()` method  
**Requirement:** Add validation that admission deposit cannot exceed ₹1,00,000. Reject with `DEPOSIT_EXCEEDS_LIMIT`.  
**Expected modification:** After parsing deposit amount:
```python
if deposit_amount > Decimal("100000.00"):
    return self._reject(parsed_command, "DEPOSIT_EXCEEDS_LIMIT",
                        f"Deposit {deposit_amount} exceeds maximum ₹1,00,000")
```
**Test to write:** Unit test in `tests/unit/test_bed_allocation.py` for deposit exceeding limit  
**Verification command:** `python -m pytest tests/unit/test_bed_allocation.py -v`  
**Expected result:** Deposit of ₹1,50,000 rejected with `DEPOSIT_EXCEEDS_LIMIT`  
**Side effects:** None — additive validation, does not change existing behavior  
**Branch:** Use `git checkout -b practice-viva`; do not merge into master

---

### Exercise 2: Change Procedure Block Window (billing/pricing change)

**Starting file:** `src/billing_engine/services/__init__.py`, `DemandService.check_procedure_block()`  
**Requirement:** For testing, change block activation from 48 hours to 24 hours.  
**Expected modification:** Change `timedelta(hours=48)` to `timedelta(hours=24)` in the block threshold calculation  
**Test to write:** Unit test in `tests/unit/test_packages_demands_gst.py` for 24-hour block  
**Verification command:** `python -m pytest tests/unit/test_packages_demands_gst.py -v`  
**Expected result:** Block activates after 24 hours instead of 48  
**Side effects:** Changes BR-07b timing behavior — must be reverted before final submission  
**Branch:** Use `git checkout -b practice-viva`; do not merge into master

---

### Exercise 3: Fix Discharge Payment Gate (test-driven correction)

**Starting file:** `src/billing_engine/commands/__init__.py`, `_handle_discharge()` method  
**Requirement:** Reject discharge when balance due > 0 and deposits insufficient.  
**Expected modification:** After calculating final bill, add payment gate check:
```python
if admission.balance_due > Decimal("0.00") and admission.deposits < admission.final_bill:
    return self._reject(parsed_command, "INSUFFICIENT_DEPOSIT",
                        f"Insufficient deposit for discharge. Balance due: {admission.balance_due}")
```
**Test to write:** Integration test in `tests/integration/test_sample_workflow.py`  
**Verification command:** `python -m pytest tests/integration/ -v`  
**Expected result:** Discharge rejected when deposit insufficient to cover balance due  
**Side effects:** Adds a new rejection code `INSUFFICIENT_DEPOSIT`; must not break existing discharge tests  
**Branch:** Use `git checkout -b practice-viva`; do not merge into master

**General practice instructions:**
1. Create practice branch: `git checkout -b practice-viva`
2. Make the code modification
3. Write the test
4. Run the test command
5. Verify test passes
6. Explain the change to the evaluator
7. Return to master: `git checkout master` (do not merge practice branch)

Both team members must complete at least one exercise independently.

---