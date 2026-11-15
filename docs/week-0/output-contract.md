# Output Contract Register - PS-064

This register documents the official output contract for the PS-064 Hospital Inpatient Billing and Bed Management Engine. It includes all expected output files, their schemas, column requirements, and verification methods as specified in the official README.

## Output Contract Overview

### Contract Authority
- **Primary source**: SRC-006 README.md (lines 187-229)
- **Secondary source**: All expected_outputs/ files
- **Contract scope**: All outputs produced by reference engine for visible admissions (18 admissions)

### Output Contract Scope
- **Visible admissions**: 18 (ADM-0001 through ADM-0038 where listed)
- **Hidden admissions**: 22 (for self-testing, not in expected_outputs/)
- **Total output files**: 43 (18 ledger files + 18 bill files + 1 demands + 1 rejections + 1 interim_bills + 3 bed_occupancy)

## Expected Output Files

### Ledger Files: `ledger_<ADM-ID>.csv`
- **ID**: OUT-LDG
- **Filename pattern**: ledger_ADM-0001.csv through ledger_ADM-0038.csv (18 files)
- **Required columns (exact order)**:
  1. `line_no` - ledger line number
  2. `event_ts` - event timestamp (YYYY-MM-DD HH:MM:SS)
  3. `counting_ts` - bed-day counting timestamp (empty for non-bed-day lines)
  4. `head` - one of: BED, NURSING, DOCTOR, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, PACKAGE
  5. `item_code` - tariff code, doctor_id for visits, BED-<CAT>/NUR-<CAT>/ICU-ROUNDS for bed days
  6. `description` - free text (not compared)
  7. `category_at_event` - category of bed occupied at event time
  8. `qty` - quantity
  9. `base_amount` - base rate (Rs)
  10. `multiplier` - category multiplier
  11. `gross` - base_amount × qty × multiplier
  12. `discount_pct` - discount percentage (0.00 for no discount)
  13. `discount_amt` - gross × discount_pct ÷ 100
  14. `gst_amt` - 5% on (gross - discount_amt) for BED lines only when > 5,000.00
  15. `net` - gross - discount_amt + gst_amt
  16. `locked_by_interim` - interim_id or empty
- **Total expected rows**: 450 data rows across all ledger files
- **Source section**: README.md line 191-196
- **Verification method**: Week 3 reconciliation of all 450+ rows against expected_outputs/

### Final Bill Files: `bill_<ADM-ID>.csv`
- **ID**: OUT-BILL
- **Filename pattern**: bill_ADM-0001.csv through bill_ADM-0038.csv (18 files)
- **Required columns (exact order)**:
  1. `section` - always "INFO" or "HEAD" or "TOTAL" or "DISCOUNT" or "TAX" or "ROUNDING"
  2. `item` - detailed item description
  3. `value` - monetary or numeric value
- **BILL structure**:
  - INFO: adm_id, admit_ts, discharge_ts, discharge_type, planned_discharge, bed_days, package_code, package_status (NONE/ACTIVE/CONVERTED/COMPLETED)
  - HEAD BED, NURSING, DOCTOR, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, PACKAGE (gross per head, all nine always present)
  - TOTAL gross_charges
  - DISCOUNT senior_bed_nursing, employee_doctor, charity
  - TOTAL total_discounts
  - TAX gst_room
  - TOTAL net_before_rounding
  - ROUNDING rounding difference
  - TOTAL final_bill
  - PAYMENT deposits_before_discharge, settlement_after_discharge
  - RESULT balance_due, refund_due
  - STATUS bill_status (BALANCE_DUE/REFUND_DUE/SETTLED), admission_status (DISCHARGE_PENDING_PAYMENT/DISCHARGED)
- **Total expected rows**: 576 data rows across all bill files (32 per file on average)
- **Source section**: README.md line 197-201
- **Verification method**: Week 3 reconciliation of all 576 rows against expected_outputs/

### Demands File: `demands.csv`
- **ID**: OUT-DEMAND
- **Filename**: demands.csv
- **Required columns (exact order)**:
  1. `demand_id` - <ADM-ID>-TD<n> (TD1 = first demand, TD2 = second demand)
  2. `adm_id` - admission ID
  3. `seq` - demand sequence (1 or 2)
  4. `demand_ts` - demand timestamp
  5. `trigger_line_no` - ledger line number that triggered demand
  6. `running_bill` - running bill at demand time
  7. `deposits_at_demand` - total deposits at demand time
  8. `threshold_80pct` - 80% of deposits (deposits_at_demand × 0.80)
  9. `charges_last_3_days` - total net charges in last 3 calendar days
  10. `days_with_charges` - number of days with charges in last 3 days
  11. `avg_daily_charge` - average charge over charge-bearing days (BR-07a calculation)
  12. `demand_amount` - demand amount (avg_daily_charge rounded up to nearest Rs 100)
  13. `deposits_since_demand` - deposits received after demand timestamp
  14. `outstanding` - demand_amount - deposits_since_demand
  15. `status` - OPEN/CLOSED/LAPSED/CLOSED_AT_DISCHARGE
  16. `status_ts` - when status became effective
  17. `procedure_block_from` - start of procedure block (TD2 only)
  18. `procedure_block_to` - end of procedure block (TD2 only)
- **Total expected rows**: 3 data rows
- **Source section**: README.md line 203-207
- **Verification method**: Week 3 reconciliation of 3 rows against expected_outputs/demands.csv

### Rejections File: `rejections.csv`
- **ID**: OUT-REJECT
- **Filename**: rejections.csv
- **Required columns (exact order)**:
  1. `line_no` - physical line number in commands.txt (including comments)
  2. `command_ts` - command timestamp
  3. `command` - full command string
  4. `adm_id` - admission ID (if command affects admission)
  5. `code` - rejection code (OUT_OF_ORDER, MALFORMED, etc.)
  6. `detail` - free text (not compared)
- **Total expected rows**: 7 data rows
- **Source section**: README.md line 209-213
- **Verification method**: Week 3 reconciliation of 7 rows against expected_outputs/rejections.csv

### Interim Bills File: `interim_bills.csv`
- **ID**: OUT-INTERIM
- **Filename**: interim_bills.csv
- **Required columns (exact order)**:
  1. `interim_id` - <ADM-ID>-IB<n> (IB1 = manual, IB2 = automatic)
  2. `adm_id` - admission ID
  3. `interim_ts` - interim bill timestamp
  4. `trigger` - MANUAL or AUTO_7D
  5. `lines_locked` - number of lines locked by this interim bill
  6. `last_line_no` - last ledger line number included
  7. `gross_total` - sum of gross of all locked lines
  8. `discount_total` - sum of discount_amt of all locked lines
  9. `gst_total` - sum of gst_amt of all locked lines
  10. `running_bill` - running bill at interim time
  11. `deposits_to_date` - total deposits received by interim time
  12. `balance` - running_bill - deposits_to_date (negative = credit)
- **Total expected rows**: 3 data rows
- **Source section**: README.md line 215-219
- **Verification method**: Week 3 reconciliation of 3 rows against expected_outputs/interim_bills.csv

### Bed Occupancy Files: `bed_occupancy_<YYYYMMDD_HHMM>.csv`
- **ID**: OUT-OCCUPANCY
- **Filename pattern**: bed_occupancy_20261012_1000.csv, bed_occupancy_20261016_1200.csv, bed_occupancy_20261021_1200.csv
- **Required columns (exact order)**:
  1. `bed_id` - bed identifier (GM-01, GM-02, etc.)
  2. `ward_id` - ward identifier (W-GM, W-GF, etc.)
  3. `category` - bed category (GENERAL, SEMI_PRIVATE, etc.)
  4. `gender_restriction` - M, F, or ANY
  5. `status` - AVAILABLE, OCCUPIED, RESERVED, HOUSEKEEPING
  6. `adm_id` - occupant admission ID (or reserving admission, or last occupant for HOUSEKEEPING)
  7. `since_ts` - when bed entered current state
  8. `billing_category` - rate category being charged (differs from category during UPGRADE_FREE)
  9. `hold_until` - only for RESERVED beds
- **Total expected rows**: 60 data rows per file (all 60 beds)
- **Source section**: README.md line 221-225
- **Verification method**: Week 3 reconciliation of 60 rows per file against expected_outputs/

## Output Contract Summary

- **Total output files**: 43
- **Total data rows**: 1,113 (450 ledger + 576 bill + 3 demands + 7 rejections + 3 interim + 180 occupancy)
- **Contract completeness**: 100% for visible admissions
- **Hidden admissions**: 22 (no expected outputs, for self-testing)
- **Verification timeline**: Week 3 output reconciliation against all expected_outputs/ files

## Contract Enforcement Notes

1. **Column order is binding** - must match exactly as specified
2. **Free text columns**: `description` (ledger) and `detail` (rejections) are not compared
3. **Monetary precision**: All monetary values are decimal with 2 places, no commas, no currency symbol
4. **Timestamp format**: YYYY-MM-DD HH:MM:SS (24-hour, no timezone suffix)
5. **Rounding**: Half-up to nearest rupee for final bill calculations
6. **Missing files**: If any expected output file is missing, reconciliation fails

## Future Implementation Requirements

1. **Output generation**: Must produce all 43 output files
2. **Field-by-field comparison**: All non-free-text fields must match expected_outputs/
3. **Visible admissions only**: Hidden admissions (22) have no expected outputs
4. **Bed occupancy snapshots**: Must capture all 60 beds at each timestamp
5. **Deterministic ordering**: Output rows must match exact order and values