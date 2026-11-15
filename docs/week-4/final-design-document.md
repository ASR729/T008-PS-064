# Final Design Document — PS-064 Hospital Inpatient Billing and Bed Management Engine

**Team:** T008  
**Version:** 1.0 (Week 4 Final)  
**Date:** 2026-11-15  
**Repository:** https://github.com/ASR729/T008-PS-064.git  
**Branch:** master

---

## 1. Executive Summary

This document describes the final design and implementation of the PS-064 Hospital Inpatient Billing and Bed Management Engine. The system is a command-file-driven backend engine written in Python 3.10+ that processes hospital inpatient operations and generates financial outputs.

The design preserves the Week 1 approved architecture while incorporating verified Week 2–Week 4 implementation details. All 12 business rules (BR-01 through BR-12) plus BR-07a and BR-07b are implemented, with 8 edge cases (EC-01 through EC-08) tested.

---

## 2. Problem Definition

Hospital inpatient billing requires tracking patient stays, bed allocations, charge events, and financial transactions across multiple categories with complex pricing rules. Key challenges include:

- Bed-day counting with different time anchors for ICU (08:00) and non-ICU (noon) beds
- Category-at-event pricing (charges use the category occupied at event time)
- Package conversion with retroactive repricing when ICU stay exceeds 48 hours
- Top-up demand lifecycle with procedure blocking at 80% deposit threshold
- Interim billing with event locking and correction adjustments
- Final discharge settlement with rounding and refund obligations

---

## 3. Scope and Constraints

### In Scope
- Command-file-driven input processing (commands.txt)
- All 16 command types: ADMIT through HOUSEKEEPING_CLEARED
- Domain models: Patient, Doctor, Bed, Admission, ChargeEvent, LedgerEntry, etc.
- Business rules BR-01 through BR-12, BR-07a, BR-07b
- Edge cases EC-01 through EC-08
- Output generation: ledgers, final bills, demands, rejections, interim bills, occupancy snapshots
- Test suite: 75 unit and integration tests

### Out of Scope
- Web application, GUI, or API server
- Database persistence (in-memory only)
- Real-time event processing
- External integrations

---

## 4. Domain Glossary

| Term | Definition |
|------|-----------|
| Admission | Patient's hospital stay record |
| Bed-Day | A day for which bed and nursing charges apply |
| Noon Anchor | 12:00 counting anchor for non-ICU beds |
| ICU Anchor | 08:00 counting anchor for ICU beds |
| UPGRADE-FREE | 48-hour window where upgraded bed charges at requested rate |
| Category-at-Event | The bed category occupied when a charge event occurs |
| Top-Up Demand | Request for additional deposit when bill exceeds 80% of deposits |
| Procedure Block | Restriction on non-emergency procedures during open demand |
| Interim Bill | Periodic billing snapshot that locks prior ledger entries |
| Correction | Adjustment to a previously posted charge event |
| LAMA/DAMA | Leave Against Medical Advice / Discharge Against Medical Advice |

---

## 5. Functional Requirements

### BR-01: Bed-Day Counting
Noon anchor for non-ICU beds, 08:00 anchor for ICU beds. Admission before noon counts that day; admission at exactly noon does not. Discharge after 14:00 adds extra bed day. Minimum one-day rule for stays under 24 hours.

### BR-02: Bed Allocation & UPGRADE-FREE
Requested category first, next-higher fallback. GENERAL gender matching. No double occupancy. UPGRADE-FREE: 48-hour window at requested category rate.

### BR-03: Transfer & ICU Movement
Maximum 4 transfers. ICU entry via TRANSFER allowed. ICU exit requires STEP_DOWN. No same-category transfers.

### BR-04: Category-at-Event Pricing
Doctor/procedure/OT use category multiplier. Pharmacy/consumables use MRP (1.00). Investigations use investigation multiplier. Category at event time, not current.

### BR-05: Doctor Visit Charging
First visit per doctor per day chargeable. Repeat same day free. GENERAL: max 2 doctors/day. ICU intensivist: ₹2,500 flat per ICU day.

### BR-06: Package Management & Conversion
Package enrollment with fixed price. ICU > 48 hours triggers conversion. Non-included procedure triggers conversion. Retroactive repricing with REPRICE lines.

### BR-07: Deposit & Top-Up Demands
Admission deposit: 2 days bed charge + ₹10,000 (or 25% package price). Demand at >80% of deposits. Round up to nearest ₹100.

### BR-07a: Average Daily Charge
Total charges in last 3 calendar days / days with at least one charge line. Round up to ₹100.

### BR-07b: Demand Blocking & Emergency
Procedure blocked 48 hours after first demand if still >80%. Emergency procedures allowed. Block lifts when all demands close.

### BR-08: Discount Rules
Senior (60+): 10% on bed/nursing. Employee referral: 15% on doctor fees. Charity: up to 50% with CEO reference.

### BR-09: Interim Billing & Corrections
Manual and automatic 7-day interim bills. Lock entries before interim timestamp. Corrections to locked events create ADJ adjustment lines.

### BR-10: Final Discharge Settlement
Final Bill = Charges − Discounts − Deposits. Round half-up to rupee. Balance due or refund due. Early discharge before 10:00 with previous-day command avoids extra bed day.

### BR-11: GST Calculation
5% GST on qualifying room charges strictly above ₹5,000/day. Exactly ₹5,000 exempt. Nursing/procedure/pharmacy excluded.

### BR-12: Bed Lifecycle & Housekeeping
6-hour reservation validity. Discharge → housekeeping → cleared → available. No allocation while unavailable.

---

## 6. Non-Functional Requirements

- **Determinism:** Same inputs produce same outputs
- **Decimal Precision:** All monetary values use `Decimal` with `ROUND_HALF_UP`
- **Testability:** 75 unit and integration tests
- **Maintainability:** Layered architecture with separation of concerns
- **Auditability:** All rejections, adjustments, and demands recorded with timestamps

---

## 7. System Architecture

### Layered Architecture

```
Presentation Layer (none — CLI-driven)
    ↓
Command Processing Layer (commands/)
    ↓
Business Rule Services (services/)
    ↓
Domain Model Layer (models/)
    ↓
Data Access Layer (loaders/)
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Processor                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │   Parser    │  │  Validator  │  │   Dispatcher    │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Services                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │
│  │ Bed-Day  │  │ Pricing  │  │ Transfer │  │ Package   │   │
│  │ Counter  │  │ Service  │  │ Service  │  │ Service   │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │
│  │ Discount │  │   GST    │  │ Demand   │  │   Ledger   │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service   │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Domain Models                              │
│  Admission, Bed, Doctor, ChargeEvent, LedgerEntry, etc.       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Master Data Loader                         │
│  CSV: categories, beds, doctors, tariffs, packages, admissions│
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Domain/Class Model

### Core Entities

**Admission** — Central entity tracking patient stay:
- `adm_id`, `patient_id`, `patient_name`, `gender`
- `requested_category`, `allocated_category`, `allocated_bed_id`
- `admit_ts`, `discharge_time`, `status`
- `running_bill`, `deposits`, `balance_due`
- `senior`, `employee_referral`, `charity_pct`

**Bed** — Physical bed resource:
- `bed_id`, `ward_id`, `category`, `gender_restriction`
- `status` (AVAILABLE/OCCUPIED/RESERVED/HOUSEKEEPING)
- `adm_id`, `since_ts`, `billing_category`, `hold_until`

**ChargeEvent / LedgerEntry** — Financial transaction:
- `line_no`, `event_ts`, `counting_ts`, `head`, `item_code`
- `category_at_event`, `qty`, `base_amount`, `multiplier`
- `gross`, `discount_pct`, `discount_amt`, `gst_amt`, `net`
- `locked_by_interim`, `event_id`

**Category** — Bed category with pricing:
- `GENERAL`, `SEMI_PRIVATE`, `PRIVATE`, `DELUXE`, `ICU`
- `daily_charge`, `nursing_charge`, `visit_multiplier`
- `procedure_multiplier`, `ot_multiplier`, `investigation_multiplier`

---

## 9. Patient/Admission Lifecycle

```
PENDING → ADMITTED → DISCHARGED
   ↓         ↓           ↓
RESERVE_BED → ADMIT → TRANSFER/STEP_DOWN → DISCHARGE
                                    ↓
                              HOUSEKEEPING → AVAILABLE
```

### State Transitions
1. **PENDING → ADMITTED**: ADMIT command with sufficient deposit
2. **ADMITTED → ADMITTED**: TRANSFER or STEP_DOWN (category change)
3. **ADMITTED → DISCHARGED**: DISCHARGE command
4. **OCCUPIED → HOUSEKEEPING**: After discharge
5. **HOUSEKEEPING → AVAILABLE**: After HOUSEKEEPING_CLEARED

---

## 10. Bed Lifecycle

```
AVAILABLE → RESERVED → OCCUPIED → HOUSEKEEPING → AVAILABLE
   ↑           ↓           ↓           ↓
RESERVE_BED  ADMIT     DISCHARGE  HOUSEKEEPING_CLEARED
   ↑           ↑
6-hour expiry  Transfer/Step-down
```

---

## 11. Command-Processing Workflow

```
1. Parse command line (COMMAND|timestamp|args)
2. Validate command format and arguments
3. Process admission bed days (per admission, up to current time)
4. Process timed events (48h demand, reservation release, interim bills)
5. Dispatch to command handler
6. Execute handler logic (state changes, financial effects)
7. Record result (success or rejection with code)
8. Update running_bill and check demand triggers
```

### Processing Order
Commands are processed strictly in file order. Timestamps are verified for non-decreasing order.

---

## 12. Charge-Event Lifecycle

```
Charge Command → Validation → Category-at-Event Pricing → 
Discount Application → GST Calculation → Ledger Entry →
Running Bill Update → Demand Trigger Check → Command Result
```

---

## 13. Billing and Ledger Workflow

```
Charge Event → Ledger Entry (net amount) → Running Bill Update
                                    ↓
                            Demand Check (>80% of deposits?)
                                    ↓
                            Interim Bill (locks prior entries)
                                    ↓
                            Correction (ADJ lines for locked events)
                                    ↓
                            Final Settlement (Charges − Discounts − Deposits)
```

---

## 14. Package Lifecycle and Conversion

```
Package Enrollment → ICU Stay Tracking → Conversion Trigger (>48h ICU)
                                              ↓
                                    Non-Included Procedure → Conversion
                                              ↓
                                    Retroactive Repricing (REPRICE lines)
```

---

## 15. Deposit and Top-Up Demand Lifecycle

```
Admission Deposit → Charge Accumulation → Bill > 80% Deposits
                                                          ↓
                                                  First Demand Created
                                                          ↓
                                                  48-Hour Deadline → Second Demand
                                                          ↓
                                                  Procedure Block Activated
                                                          ↓
                                                  Deposit Payment → Demand Close
                                                          ↓
                                                  Block Lifted (all demands closed)
```

---

## 16. Interim Billing and Correction Lifecycle

```
Charge Events → Interim Bill (manual or 7-day auto) → Lock Prior Entries
                                                           ↓
                                               Correction to Locked Event
                                                           ↓
                                               Signed ADJ Adjustment Line
                                                           ↓
                                               Original Event Preserved
```

---

## 17. Discharge and Settlement Lifecycle

```
DISCHARGE Command → Bed-Day Count for Discharge Day → Release Bed (HOUSEKEEPING)
                                                            ↓
                                                    Final Bill Calculation
                                                    (Charges − Discounts − Deposits)
                                                            ↓
                                                    Balance Due / Refund Due
                                                            ↓
                                                    DISCHARGED Status
                                                            ↓
                                                    HOUSEKEEPING_CLEARED → AVAILABLE
```

---

## 18. Output Generation Design

| Output File | Description | Schema |
|-------------|-------------|--------|
| `ledger_ADM-XXXX.csv` | Patient ledger | line_no, event_ts, counting_ts, head, item_code, ..., net, locked_by_interim |
| `bill_ADM-XXXX.csv` | Final bill | section, item, value |
| `demands.csv` | Top-up demands | demand_id, adm_id, demand_ts, demand_amount, status, ... |
| `rejections.csv` | Rejected commands | line_no, command_ts, command, adm_id, code, detail |
| `interim_bills.csv` | Interim bills | interim_id, adm_id, interim_ts, trigger, gross_total, ... |
| `bed_occupancy_*.csv` | Bed snapshots | bed_id, category, status, adm_id, since_ts, ... |

---

## 19. Data Validation and Error Handling

- Command format validation (pipe-delimited, correct field count)
- Admission/bed/doctor/tariff existence checks
- Status validation (ADMITTED, PENDING, DISCHARGED)
- Business rule validation (transfer limits, ICU step-down, doctor limits)
- Monetary validation (positive amounts, valid percentages)
- Rejection codes: UNKNOWN_COMMAND, INVALID_COMMAND, UNKNOWN_ADMISSION, NO_BED, STEP_DOWN_REQUIRED, TRANSFER_LIMIT, TOPUP_BLOCK, DEPOSIT_SHORT, DUPLICATE_EVENT, OUT_OF_ORDER, CHARITY_LIMIT, CHARITY_NO_CEO_REF, BED_NOT_IN_HOUSEKEEPING, UNKNOWN_ITEM, UNKNOWN_DOCTOR, INVALID_QTY, INVALID_AMOUNT

---

## 20. Business-Rule Mapping

| BR | Module | Function/Class | Test File |
|----|--------|---------------|-----------|
| BR-01 | commands.CommandsProcessor | `_process_admission_bed_days`, `_post_bed_day_lines` | tests/unit/test_bed_day_counting.py |
| BR-02 | commands.CommandsProcessor | `_allocate_bed`, `_handle_admit` | tests/unit/test_bed_allocation.py |
| BR-03 | services.TransferService | `validate_transfer`, `record_transfer` | tests/unit/test_transfers_pricing_visits.py |
| BR-04 | services.PricingService | `calculate_charge`, `_get_multiplier` | tests/unit/test_transfers_pricing_visits.py |
| BR-05 | commands.CommandsProcessor | `_handle_visit` | tests/unit/test_transfers_pricing_visits.py |
| BR-06 | services.PackageService | `check_package_conversion`, `convert_package` | tests/unit/test_packages_demands_gst.py |
| BR-07 | services.DemandService | `check_demand_trigger`, `record_deposit` | tests/unit/test_packages_demands_gst.py |
| BR-07a | services.DemandService | `calculate_average_daily_charge`, `calculate_demand_amount` | tests/unit/test_packages_demands_gst.py |
| BR-07b | services.DemandService | `check_procedure_block`, `check_block_lift` | tests/unit/test_packages_demands_gst.py |
| BR-08 | services.DiscountService | `apply_senior_discount`, `apply_employee_referral_discount`, `apply_charity_discount` | tests/unit/test_packages_demands_gst.py |
| BR-09 | commands.CommandsProcessor | `_handle_interim_bill`, `_handle_correction` | tests/unit/ |
| BR-10 | commands.CommandsProcessor | `_handle_discharge`, `_calculate_final_bill` | tests/unit/ |
| BR-11 | services.GSTService | `calculate_gst` | tests/unit/test_packages_demands_gst.py |
| BR-12 | commands.CommandsProcessor | `_handle_reserve_bed`, `_handle_housekeeping_cleared` | tests/unit/ |

---

## 21. Edge-Case Mapping

| EC | Scenario | Implementation Location | Test |
|----|----------|------------------------|------|
| EC-01 | Admission at 11:59 vs 12:00 | `_process_admission_bed_days` | test_bed_day_counting.py |
| EC-02 | Discharge at exactly 14:00 vs after | `_post_discharge_bed_day` | test_bed_day_counting.py |
| EC-03 | 23h59m stay minimum | `_process_admission_bed_days` | test_bed_day_counting.py |
| EC-04 | UPGRADE-FREE 48-hour boundary | `_upgrade_free_start`, `_post_bed_day_lines` | test_bed_allocation.py |
| EC-05 | Package ICU conversion | `check_package_conversion`, `convert_package` | test_packages_demands_gst.py |
| EC-06 | Running bill 80% threshold | `check_demand_trigger` | test_packages_demands_gst.py |
| EC-07 | GST ₹5,000 threshold | `GSTService.calculate_gst` | test_packages_demands_gst.py |
| EC-08 | Locked event correction | `_handle_correction` (ADJ lines) | tests/unit/ |

---

## 22. Design Decisions and Assumptions

### Decision: In-Memory Storage
**Reasoning:** The assignment specifies a command-file-driven backend engine without database requirements. In-memory storage simplifies implementation and testing.

**Source:** Week 1 design decision, confirmed in Week 2 implementation.

### Decision: Per-Admission Line Numbering
**Reasoning:** Expected output ledgers start line_no at 1 for each admission, not globally.

**Source:** Observed from expected_outputs/ledger_ADM-XXXX.csv files.

### Decision: Bed-Day Counting Per Command
**Reasoning:** Bed-day lines must be interleaved with charge events by timestamp. Checking bed days for the current command's admission before processing ensures correct ordering.

**Source:** Week 4 implementation decision based on output schema analysis.

### Decision: Decimal Arithmetic with ROUND_HALF_UP
**Reasoning:** Financial calculations require deterministic rounding. Python's built-in `round()` uses banker's rounding which is unsuitable.

**Source:** Official assignment requirement (BR-07a upward rounding, BR-10 half-up rounding).

### Decision: No External Dependencies
**Reasoning:** Simplifies deployment and ensures reproducibility. Python standard library is sufficient.

**Source:** Week 1 design constraint.

---

## 23. Testing and Verification Approach

### Test Structure
- `tests/unit/` — Unit tests for individual services and rules
- `tests/integration/` — Integration tests for end-to-end workflows
- `tests/conftest.py` — Shared fixtures (loader, services, sample data)

### Test Counts
- Total: 75 tests
- Unit: 63 tests
- Integration: 12 tests
- All passing: ✅

### Verification Method
- Unit tests verify individual business rules in isolation
- Integration tests verify command processing workflows
- Sample execution verifies end-to-end processing against official commands.txt
- Output reconciliation compares generated files against expected_outputs/

---

## 24. Known Limitations

1. **Bed-Day Line Ordering**: Bed-day lines are posted per-admission before each command, which may not perfectly interleave with charge events from other admissions in timestamp order.

2. **Package Conversion**: Retroactive repricing generates REPRICE lines but the conversion detection logic may need refinement for edge cases involving simultaneous ICU stay and non-included procedures.

3. **Interim Bill Locking**: Automatic 7-day interim bills lock entries per-admission, but the timing of automatic bills relative to manual interim bills may need adjustment.

4. **Discharge Settlement**: Final bill calculation uses admission-level totals; entry-level discount tracking could be more granular.

5. **Occupancy Snapshots**: Bed state snapshots capture state at command processing time; state history between snapshots is not preserved.

6. **Output Reconciliation**: Field-by-field comparison against official expected outputs shows partial matches; remaining mismatches documented in reconciliation report.

---

## 25. Deviations from Week 1 Design

| Aspect | Week 1 Design | Week 4 Implementation | Justification |
|--------|--------------|----------------------|---------------|
| Bed-day counting | Inline during commands | Per-admission before each command | Correct timestamp interleaving |
| Line numbering | Global counter | Per-admission counter | Match expected output schema |
| Interim billing | Manual only | Manual + automatic 7-day | BR-09 requirement |
| Output format | TBD | CSV with exact headers | Match expected_outputs/ |

---

## 26. Appendix: Command Reference

| Command | Args | Description |
|---------|------|-------------|
| ADMIT | adm_id, deposit, payment_mode | Admit patient |
| RESERVE_BED | adm_id, planned_admit_ts | Reserve bed |
| TRANSFER | adm_id, target_category, doctor_id | Transfer category |
| STEP_DOWN | adm_id, target_category, doctor_id | ICU step-down |
| VISIT | adm_id, event_id, doctor_id | Doctor visit |
| PROCEDURE | adm_id, event_id, item_code, doctor_id, emergency | Procedure |
| OT | adm_id, event_id, ot_code, hours, surgeon_id, emergency | OT |
| PHARMACY | adm_id, event_id, item_code, qty | Pharmacy |
| CONSUMABLE | adm_id, event_id, item_code, qty | Consumable |
| INVESTIGATION | adm_id, event_id, item_code, qty | Investigation |
| DEPOSIT | adm_id, amount, payment_mode | Deposit payment |
| INTERIM_BILL | adm_id | Manual interim bill |
| CORRECTION | adm_id, event_id, new_qty, reason | Correct charge event |
| CHARITY | adm_id, pct, ceo_ref | Charity discount |
| DISCHARGE | adm_id, discharge_type, order_issued_ts | Discharge patient |
| HOUSEKEEPING_CLEARED | bed_id | Clear housekeeping |
