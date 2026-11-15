# Final Technical Design Document — PS-064 Hospital Inpatient Billing and Bed Management Engine

**Team:** T008  
**Project:** PS-064  
**Version:** 1.0 (Week 4 Final Submission)  
**Date:** 2026-11-15  
**Repository:** https://github.com/ASR729/T008-PS-064.git  
**Branch:** master  
**Commit:** `4bcca54` — "fix: resolve Week 4 defects and achieve 42/42 official output reconciliation"  
**Python:** 3.10+ (tested on 3.14.5)  
**Dependencies:** Python standard library only

---

## 1. Project Overview

The PS-064 Hospital Inpatient Billing and Bed Management Engine is a command-file-driven Python backend engine that simulates hospital inpatient operations. It processes a pipe-delimited command text file (`commands.txt`) and generates financial ledgers, final bills, top-up demands, rejections, interim bills, and bed-occupancy snapshots in CSV format.

The engine models the complete inpatient financial lifecycle: admission, bed allocation, category transfers, ICU movement, charge-event processing, package management, deposits, top-up demands, discounts, GST, interim billing, discharge settlement, and bed lifecycle.

All monetary calculations use `Decimal` with `ROUND_HALF_UP`. The engine is deterministic: the same inputs produce the same outputs, and command order is preserved.

---

## 2. Scope

### In-Scope
- Command-file-driven input processing (`commands.txt`, `COMMAND\|timestamp\|args`)
- All 16 command types: ADMIT, RESERVE_BED, TRANSFER, STEP_DOWN, VISIT, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, DEPOSIT, INTERIM_BILL, CORRECTION, CHARITY, DISCHARGE, HOUSEKEEPING_CLEARED
- Domain models: Patient, Doctor, Bed, Admission, ChargeEvent, LedgerEntry, Deposit, Demand, InterimBill, Rejection, Category, Gender
- Master data loading from 6 CSV files (categories, beds, doctors, tariffs, packages, admissions)
- Business rules BR-01 through BR-12 plus BR-07a and BR-07b
- Edge cases EC-01 through EC-08
- Output generation: ledgers, final bills, demands, rejections, interim bills, bed-occupancy snapshots
- Test suite: 75 unit and integration tests
- Output reconciliation against official expected outputs (42 files, 10,223 fields)

### Out-of-Scope
- Web application, GUI, or API server
- Database persistence (in-memory only, per assignment)
- Real-time event processing
- External cloud services or integrations (HIS, ERP, payment gateways)
- OPD scheduling, insurance pre-authorisation, telemedicine, mobile application
- Advanced analytics beyond specified outputs

---

## 3. System Architecture

The engine follows a layered architecture with separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│  Command Processing Layer  (src/billing_engine/commands/)       │
│  • CommandParser, CommandProcessor                              │
│  • All 16 command handlers                                      │
│  • Output generation (ledgers, bills, demands, etc.)            │
├─────────────────────────────────────────────────────────────────┤
│  Business Rule Services  (src/billing_engine/services/)         │
│  • BedDayCounter, PricingService, TransferService,              │
│    PackageService, DiscountService, GSTService,                 │
│    DemandService, LedgerService                                 │
├─────────────────────────────────────────────────────────────────┤
│  Domain Models  (src/billing_engine/models/)                    │
│  • Patient, Doctor, Bed, Admission, ChargeEvent,                │
│    LedgerEntry, Deposit, Demand, InterimBill, Rejection,        │
│    Category, Gender                                             │
├─────────────────────────────────────────────────────────────────┤
│  Data Access Layer  (src/billing_engine/loaders/)               │
│  • MasterDataLoader (CSV loading)                               │
└─────────────────────────────────────────────────────────────────┘
```

Supporting modules:
- `src/billing_engine/billing/` — BillingCalculator
- `src/billing_engine/ledger/` — LedgerManager
- `src/billing_engine/outputs/` — OutputGenerator and output serializers
- `scripts/reconcile_outputs.py` — Sample execution + reconciliation
- `scripts/run_reconciliation.py` — Entry point wrapper

### Design Principles
- Command-file driven; strict command order; deterministic
- Decimal arithmetic with ROUND_HALF_UP for all money
- Category-at-event pricing (historical category at event time)
- In-memory storage; no external dependencies
- No silent failures — all rejections recorded with codes

---

## 4. Package and Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `commands/__init__.py` | Command parsing, validation, dispatch, all 16 command handlers, bed-day counting, output generation |
| `services/__init__.py` | Bed-day counting, category-at-event pricing, transfers, packages, discounts, GST, demands, ledger |
| `models/__init__.py` | Domain data models and enumerations |
| `loaders/__init__.py` | Master data loading and validation from 6 CSV files |
| `billing/__init__.py` | Billing calculations |
| `ledger/__init__.py` | Ledger management |
| `outputs/__init__.py` | Output serialization (ledger, bill, demands, rejections, interim bills, occupancy) |
| `scripts/reconcile_outputs.py` | Runs sample execution, writes outputs, reconciles vs expected |
| `scripts/run_reconciliation.py` | Entry point for official sample run |

---

## 5. Domain Model

### Core Entities

**Admission** — Central entity tracking a patient stay episode:
- `adm_id`, `patient_id`, `patient_name`, `gender`
- `requested_category`, `allocated_category`, `allocated_bed_id`
- `admit_ts`, `discharge_time`, `status`
- `running_bill`, `deposits`, `balance_due`, `refund_due`
- `senior`, `employee_referral`, `charity_pct`, `package_code`
- `deposits_before_discharge`, `settlement_after_discharge`
- `package_converted`, `final_bill`, `total_charges`, `total_discounts`, `gst_total`
- `planned_discharge`, `discharge_type`

**Bed** — Physical bed resource:
- `bed_id`, `ward_id`, `category`, `gender_restriction`
- `status` (AVAILABLE/OCCUPIED/RESERVED/HOUSEKEEPING)
- `adm_id`, `since_ts`, `billing_category`, `hold_until`

**Patient** — Individual receiving services:
- `patient_id`, `patient_name`, `gender`, `date_of_birth`, `city`

**Doctor** — Medical professional:
- `doctor_id`, `doctor_name`, `specialty`, `visit_fee`, `is_intensivist`

**Category** — Bed category with rates and multipliers:
- `GENERAL`, `SEMI_PRIVATE`, `PRIVATE`, `DELUXE`, `ICU`
- `daily_charge`, `nursing_charge`, `visit_multiplier`, `procedure_multiplier`, `ot_multiplier`, `investigation_multiplier`

**ChargeEvent / LedgerEntry** — Financial transaction:
- `line_no`, `event_ts`, `counting_ts`, `head`, `item_code`, `description`
- `category_at_event`, `qty`, `base_amount`, `multiplier`
- `gross`, `discount_pct`, `discount_amt`, `gst_amt`, `net`
- `locked_by_interim`, `event_id`

**Package** — Fixed-price package definition:
- `package_code`, `package_name`, `package_category`, `package_price`
- `los_days`, `included_procedures`, `exclusions`, `covered_heads`

**Deposit / Demand / InterimBill / Rejection** — Financial lifecycle records.

### Entity Relationships

- Patient 1:N Admission
- Admission 1:Bed (allocation)
- Admission 1:N ChargeEvent / LedgerEntry
- Admission 1:N Deposit / Demand / InterimBill
- Bed 1:Category
- Doctor 1:N ChargeEvent (visits)

---

## 6. Data Model

All models are Python dataclasses. Monetary fields use `Decimal`. Timestamps use `datetime`.

Key data invariants:
- `LedgerEntry.net = gross - discount_amt + gst_amt`
- `Final bill = total_charges - total_discounts + gst_total`, rounded half-up to rupee
- `balance_due = max(0, final_bill - deposits)`; `refund_due = max(0, deposits - final_bill)` (mutually exclusive)
- GST applies only to BED head lines where `(gross - discount_amt) > 5000.00`

---

## 7. Command-Processing Workflow

Commands are processed strictly in file order:

1. Parse command line (`COMMAND\|timestamp\|args`)
2. Validate command format and arguments
3. Process admission bed days (per admission, up to current time)
4. Process timed events (48h demand, reservation release, interim bills)
5. Dispatch to the appropriate command handler
6. Execute handler logic (state changes, financial effects)
7. Record result (success or rejection with code)
8. Update `running_bill` and check demand triggers

Timestamps are verified for non-decreasing order. Rejection codes include: `UNKNOWN_COMMAND`, `INVALID_COMMAND`, `UNKNOWN_ADMISSION`, `NO_BED`, `STEP_DOWN_REQUIRED`, `TRANSFER_LIMIT`, `TOPUP_BLOCK`, `DEPOSIT_SHORT`, `DUPLICATE_EVENT`, `OUT_OF_ORDER`, `CHARITY_LIMIT`, `CHARITY_NO_CEO_REF`, `BED_NOT_IN_HOUSEKEEPING`, `UNKNOWN_ITEM`, `UNKNOWN_DOCTOR`, `INVALID_QTY`, `INVALID_AMOUNT`, `NOTHING_DUE`, `UNKNOWN_EVENT`, `CORRECTION_NOT_ALLOWED`, `NO_CHANGE`, `CHARITY_ALREADY_APPLIED`, `INVALID_TYPE`, `INVALID_ORDER_TS`, `UNKNOWN_BED`.

---

## 8. Admission Lifecycle

```
PENDING → ADMITTED → (TRANSFER/STEP_DOWN) → DISCHARGED
                                  ↓
                            HOUSEKEEPING → AVAILABLE (bed)
```

State transitions:
1. **PENDING → ADMITTED**: ADMIT command with sufficient deposit
2. **ADMITTED → ADMITTED**: TRANSFER or STEP_DOWN (category change)
3. **ADMITTED → DISCHARGED**: DISCHARGE command
4. Bed: OCCUPIED → HOUSEKEEPING (after discharge) → AVAILABLE (after HOUSEKEEPING_CLEARED)

Discharge types: NORMAL, LAMA, DAMA (all billed identically, tagged differently).

---

## 9. Bed Lifecycle

```
AVAILABLE → RESERVED → OCCUPIED → HOUSEKEEPING → AVAILABLE
    ↑           ↓           ↓           ↓
RESERVE_BED  ADMIT      DISCHARGE  HOUSEKEEPING_CLEARED
    ↑           ↑
6-hour expiry Transfer/step-down
```

- RESERVE_BED holds a bed until `planned_admit_ts + 6:00:00` or admission
- Release happens at admission time or planned expiry, whichever first
- After discharge, bed stays HOUSEKEEPING until HOUSEKEEPING_CLEARED
- Available only after housekeeping cleared

---

## 10. Bed Allocation and Transfer

**Allocation (BR-02):**
1. Requested category first, if available
2. GENERAL: prefer gender-matching ward
3. If unavailable, allocate next-higher category (GENERAL < SEMI_PRIVATE < PRIVATE < DELUXE); ICU never used as upgrade target
4. UPGRADE-FREE: 48h window billed at requested category rate
5. No bed → `NO_BED` rejection

**Transfer (BR-03):**
- TRANSFER into ICU allowed without step-down
- TRANSFER out of ICU requires STEP_DOWN (else `STEP_DOWN_REQUIRED`)
- TRANSFER to same category rejected
- Max 3 transfers (4th rejected with `TRANSFER_LIMIT`)
- Bed vacated by transfer becomes AVAILABLE immediately

---

## 11. Bed-Day Calculation (BR-01)

- Noon anchor (12:00) for non-ICU beds; ICU anchor (08:00) for ICU beds
- Admission before noon counts that day's noon; admission at exactly 12:00:00 does not
- Discharge after 14:00:00 adds one extra bed day; discharge at exactly 14:00:00 or 10:00:00 adds nothing
- Discharge before 10:00:00 adds one extra bed day unless planned (order issued previous day)
- Minimum one-day rule for stays under 24 hours
- Only one bed day per calendar day
- If patient in ICU at 08:00, day counted as ICU day; otherwise at noon at category occupied at noon
- ICU entered after 08:00 counted at noon as ICU

---

## 12. Charge Generation

Charge events are priced using category-at-event pricing (category occupied at event time, not current category):

| Head | Pricing Basis | Multiplier |
|------|--------------|------------|
| BED / NURSING | Daily rate (category at event) | 1.00 |
| DOCTOR | Visit fee × category multiplier | Category-specific |
| PROCEDURE / OT | Tariff base × category multiplier | Category-specific |
| PHARMACY / CONSUMABLE | MRP (base rate) | 1.00 |
| INVESTIGATION | Tariff base × investigation multiplier | Category-specific |

- First visit per doctor per day chargeable; repeat same doctor same day free
- GENERAL: max 2 different doctors/day
- ICU intensivist: flat ₹2,500 per ICU day (covered by ICU rounds)

`gross = base_amount × qty × multiplier`; `net = gross - discount_amt + gst_amt`.

---

## 13. Package Handling (BR-06)

- Fixed price for package duration (`los_days`)
- Package price posted at DISCHARGE as a `PACKAGE` line (separate from running bill)
- Covered heads charged at 0.00 with `[PKG-<code>]` prefix during active package
- Excluded items itemised at full price even if in covered heads
- Package converts when ICU stay > 48:00:00 (exactly 48:00:00 does NOT convert) or a non-included procedure/OT occurs
- On conversion, previously covered lines receive `REPRICE line N` lines at full price with original fields preserved; originals stay at 0.00
- Beyond-LOS bed days (above `los_days`) billed at package category's bed + nursing rate
- `package_status`: NONE / ACTIVE / CONVERTED / COMPLETED
- Per-admission only — no cross-admission contamination

---

## 14. Discounts (BR-08)

| Discount | Rate | Eligible Heads | Condition |
|----------|------|---------------|-----------|
| Senior citizen | 10% | BED, NURSING only | Age >= 60 on admission date |
| Employee referral | 15% | DOCTOR_VISIT only | `employee_referral = true` |
| Charity | up to 50% | All heads except PHARMACY/CONSUMABLE (PACKAGE included) | CEO reference required; applied at final bill only |

Discounts applied independently. Charity does not change GST.

---

## 15. GST (BR-11)

- 5% GST on qualifying room charges (BED head only)
- Threshold strictly greater than ₹5,000.00 per day (`(gross - discount_amt) > 5000.00`)
- Exactly ₹5,000 exempt
- Discount applied before GST threshold calculation
- Nursing, procedure, pharmacy, consumable, investigation excluded
- ICU rate ₹4,800 → no GST on ICU days

---

## 16. Deposits and Top-Up Demands (BR-07, BR-07a, BR-07b)

**Admission deposit:**
- Package admission: 25% of package price
- Non-package: 2 × requested category bed charge + ₹10,000

**Demand trigger (BR-07):**
- Demand raised when running bill strictly exceeds 80% of total deposits (exactly 80% does NOT raise demand)
- Demand timestamp = charge-event timestamp
- Only one OPEN demand at a time

**Demand amount (BR-07a):**
- Average daily charge = total charges in last 3 calendar days / days with at least one charge line (zero-net lines excluded)
- Round up to nearest ₹100

**Demand lifecycle:**
- First demand on crossing 80% threshold
- 48-hour deadline: if first demand still OPEN and bill still > 80%, raise second demand and enter PROCEDURE_BLOCK
- DEPOSIT satisfies demand when cumulative deposits after demand timestamp >= demand amount; partial deposits reduce outstanding but do not close
- Procedure blocked during block; emergency procedures allowed
- Block lifts when both demands closed and sufficient deposits since first demand

---

## 17. Interim Billing (BR-09)

- Manual interim bill: `INTERIM_BILL` command locks all lines posted so far (per admission)
- Automatic interim bills: at admit + 7 days, + 14 days, … while admitted
- Locked lines excluded from future bills
- Correction to unlocked event: corrected in place (event_ts unchanged)
- Correction to locked event: signed ADJ adjustment line (`qty = new - current`), original preserved
- `gross_total`/`discount_total` cumulative over all locked entries for the admission
- `running_bill` from admission-level running bill

---

## 18. Final Billing and Settlement (BR-10)

Final bill calculated at discharge:
```
total_charges = sum(gross for admission)
total_discounts = senior + employee + charity
net_before_rounding = total_charges - total_discounts + gst_total
rounding = round0(net_before_rounding) - net_before_rounding
final_bill = round0(net_before_rounding)
balance_due = max(0, final_bill - deposits)
refund_due = max(0, deposits - final_bill)
```

- Payment gate: settlement rejected when nothing due
- Balance due → `BALANCE_DUE`, `DISCHARGE_PENDING_PAYMENT`
- Refund due → `REFUND_DUE`, `DISCHARGED`
- Settled → `SETTLED`, `DISCHARGED`
- Early discharge before 10:00 with previous-day order avoids extra bed day
- Deposits split: `deposits_before_discharge` / `settlement_after_discharge`

---

## 19. Refund Processing

Refund obligation arises when `deposits > final_bill`. `refund_due = deposits - final_bill` (rounded). Admission status `DISCHARGED` with `REFUND_DUE`. Discharge may proceed with refund pending.

---

## 20. Occupancy and Housekeeping

- Bed status transitions: AVAILABLE → RESERVED → OCCUPIED → HOUSEKEEPING → AVAILABLE
- Occupancy snapshots captured at configured timestamps (2026-10-12 10:00, 2026-10-16 12:00, 2026-10-21 12:00)
- Snapshot reflects bed state at its timestamp (same-timestamp commands included after handler)
- HOUSEKEEPING retains `adm_id`/`since_ts` (set to discharge time); `billing_category` cleared
- RESERVED sets `since_ts` to reservation time

---

## 21. Reservation Management

- RESERVE_BED holds bed of requested category until `planned_admit_ts + 6:00:00`
- Release at admission time or planned expiry (whichever first)
- Expired reservation bed reallocatable
- `_allocate_bed` prioritizes RESERVED bed for the admitting patient; clears `hold_until`

---

## 22. Error Handling and Rejection Processing

All rejections recorded with code and detail. Rejection codes include:
`UNKNOWN_COMMAND`, `INVALID_COMMAND`, `UNKNOWN_ADMISSION`, `NO_BED`, `STEP_DOWN_REQUIRED`, `TRANSFER_LIMIT`, `TOPUP_BLOCK`, `DEPOSIT_SHORT`, `DUPLICATE_EVENT`, `OUT_OF_ORDER`, `CHARITY_LIMIT`, `CHARITY_NO_CEO_REF`, `BED_NOT_IN_HOUSEKEEPING`, `UNKNOWN_ITEM`, `UNKNOWN_DOCTOR`, `INVALID_QTY`, `INVALID_AMOUNT`, `NOTHING_DUE`, `UNKNOWN_EVENT`, `CORRECTION_NOT_ALLOWED`, `NO_CHANGE`, `CHARITY_ALREADY_APPLIED`, `INVALID_TYPE`, `INVALID_ORDER_TS`, `UNKNOWN_BED`.

Validation stops at first failing check. Rejection advances the clock.

---

## 23. Output Generation

| Output File | Count | Description |
|-------------|-------|-------------|
| `ledger_ADM-XXXX.csv` | 18 | Patient ledger per visible admission |
| `bill_ADM-XXXX.csv` | 18 | Final bill per discharged admission |
| `demands.csv` | 1 | Top-up demand records |
| `rejections.csv` | 1 | Rejected commands with codes |
| `interim_bills.csv` | 1 | Interim bill records |
| `bed_occupancy_*.csv` | 3 | Bed occupancy snapshots (60 beds each) |

Outputs written to `build/official-sample-run/` (separate from `expected_outputs/`). Column order and formats match the official output contract exactly.

---

## 24. Data Integrity

- No duplicate charge posting (corrections add ADJ lines; originals preserved)
- No cross-admission charges (all queries filter by `admission_id`; package conversion per-admission)
- Correct deposit attribution (`deposits_before_discharge` / `settlement_after_discharge` split)
- Correct final balance (`balance_due` / `refund_due`, mutually exclusive)
- Package-covered lines at 0.00 with `[PKG-<code>]`
- Correct locked-event adjustments (signed ADJ lines)
- Correct occupancy ownership (snapshots at command timestamps after handler)
- Decimal ROUND_HALF_UP rounding throughout

---

## 25. Testing Strategy

- 75 unit and integration tests (63 unit + 12 integration)
- Unit tests per business rule (bed-day counting, allocation, transfers/pricing/visits, packages/demands/GST)
- Integration tests for end-to-end sample workflow
- All tests pass: `python -m pytest -q` → 75 passed
- Reconciliation tests against official expected outputs (42/42 files, 10,223/10,223 fields)

---

## 26. Design Decisions and Constraints

| Decision | Value | Rationale |
|----------|-------|-----------|
| D-01 | In-memory storage | Assignment specifies command-file-driven backend; no database |
| D-02 | Decimal ROUND_HALF_UP | Deterministic financial rounding |
| D-03 | Pipe-delimited command file | Simple, auditable input format |
| D-04 | Per-admission line numbering | Matches expected output schema |
| D-05 | Bed-day counting per command | Correct timestamp interleaving |
| D-06 | UPGRADE-FREE rate category | Matches expected output billing |
| D-07 | Per-admission interim locking | Independent admissions |
| D-08 | Rejection command = type name | Matches expected output format |
| D-09 | Python 3.10+ target | Assignment requirement |
| D-10 | No external dependencies | Reproducibility, simple deployment |
| D-11 | Demand skip for bed-day lines | Bed days posted at anchor, not demand triggers |
| D-12 | Discharge skip demand check | Terminal event |
| D-13 | Occupancy snapshot at 3 timestamps | Matches expected output filenames |
| D-14 | Week 3 commit preserved | No history rewriting |
| D-15 | Output dir `build/official-sample-run/` | Separates generated from expected |

Previously unresolved (D-U1–D-U3) resolved by the 42/42 correction:
- D-U1 bed-day line ordering → resolved (historical category, per-admission posting)
- D-U2 package conversion edge cases → resolved (per-admission, event_id-keyed REPRICE)
- D-U3 interim bill timing → resolved (cumulative locked totals)

No feature is claimed implemented without source-code and test evidence. The verified 42/42 reconciliation and 75/75 tests constitute the evidence base.

---