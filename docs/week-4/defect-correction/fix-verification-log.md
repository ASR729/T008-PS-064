# Fix-Verification Log — PS-064 Week 4 Defect Correction

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`
**Branch/commit:** `master` @ `5d463d8`

## Correction Batch 1 — Bed-day counting (Defect A/G)

**Files changed:** `src/billing_engine/commands/__init__.py`

**Changes:**
- Added `_bed_periods` tracking (admission start/end/category per bed occupancy period)
- Added `_open_bed_period`, `_close_open_bed_period`, `_occupied_category_at` helpers
- Rewrote `_is_occupying_at` and `_get_category_at_time` to use historical category
- Fixed anchor selection: ICU at 08:00 only if actually in ICU bed; otherwise noon
- Rewrote `_process_admission_bed_days` with exclusive anchor logic
- Fixed `_post_bed_day_lines` to use occupied category (not rate category) for item_code/category_at_event
- Fixed `_process_admission_bed_days` called per-command-admission (not all admissions)
- Fixed `_handle_discharge` ordering: discharge_time set before bed-day posting
- Fixed `_post_discharge_bed_day`: since_ts set to discharge time for HOUSEKEEPING
- Fixed `time()` undefined error in discharge extra-day logic
- Fixed `hour > 14` → tuple comparison for 14:xx discharges
- Fixed `_close_open_bed_period` called on transfer/step-down/discharge

**Tests:** All 75 existing tests pass.

**Before:** 41/42 mismatched, 3333 field mismatches (phantom ICU on non-ICU patients)
**After batch 1:** 18/42 matched, ~2700 field mismatches (phantom ICU eliminated)

## Correction Batch 2 — Package coverage/conversion/repricing (Defect B)

**Files changed:** `src/billing_engine/commands/__init__.py`, `scripts/reconcile_outputs.py`

**Changes:**
- Added `_package_for`, `_package_active`, `_package_covered` helpers
- Package-covered lines zeroed with `[PKG-<code>]` prefix at posting
- `_convert_package` rewritten: per-admission, REPRICE `line N`, original fields preserved
- PACKAGE line posted at discharge for non-converted packages
- `admission.package_converted` field added to Admission model
- `write_final_bill`: real package_status (NONE/COMPLETED/CONVERTED)

**Before:** ADM-0027 had ~340 ledger rows (should be 26), hundreds of spurious REPRICE lines
**After batch 2:** Package admissions match expected output

## Correction Batch 3 — Discounts (Defect F overlap)

**Files changed:** `src/billing_engine/commands/__init__.py`, `src/billing_engine/services/__init__.py`

**Changes:**
- Fixed `_apply_senior_discount`/`_apply_employee_discount` double-subtraction bug (returned discounted amount as gross)
- Fixed employee discount head: `'DOCTOR_VISIT'` in service matches production caller
- Employee discount computed on correct charge head

**Before:** ADM-0010 senior/employee discounts swapped/doubled
**After batch 3:** Discount components correct on bills

## Correction Batch 4 — Demand trigger & deposits (Defect C/D overlap)

**Files changed:** `src/billing_engine/commands/__init__.py`

**Changes:**
- Skip demand check on PACKAGE lines
- `deposits_since_demand` updates even after demand closure
- `record_charge_event` skips net=0 lines (BR-07a)

**Before:** 19 demand rows (should be 3), trigger_line_no always 0
**After batch 4:** 3 demand rows, correct trigger_line_no

## Correction Batch 5 — Discharge extra bed day & corrections

**Files changed:** `src/billing_engine/commands/__init__.py`

**Changes:**
- Fixed `_post_discharge_bed_day`: since_ts = discharge time; `_discharge_extra_posted` flag prevents double-count
- Fixed correction handler: description updated, GST only on BED head

**Before:** ADM-0019 missing discharge-after-14:00 extra day; corrections had wrong GST/description
**After batch 5:** Discharge extra days and corrections correct

## Correction Batch 6 — Reserved bed allocation (Defect E/F overlap)

**Files changed:** `src/billing_engine/commands/__init__.py`

**Changes:**
- `_allocate_bed` prioritizes RESERVED bed for the admitting patient
- Clears `hold_until` on admission into a bed

**Before:** ADM-0022 NO_BED rejection (reserved bed not matched)
**After batch 6:** Reserved bed correctly allocated

## Correction Batch 7 — Output writer (Defect F)

**Files changed:** `scripts/reconcile_outputs.py`

**Changes:**
- `bed_days` excludes REPRICE lines
- `package_status`: NONE/COMPLETED/CONVERTED
- Per-component discounts: senior_bed_nursing, employee_doctor, charity
- `deposits_before_discharge` / `settlement_after_discharge` split
- `balance_due` clamped at 0

**Before:** All bills showed package_status=NONE, discounts=0, settlement=0
**After batch 7:** All bills match expected output

## Correction Batch 8 — Interim bills (Defect D)

**Files changed:** `src/billing_engine/commands/__init__.py`

**Changes:**
- `gross_total`/`discount_total` cumulative over all locked entries for admission
- `running_bill` from `admission.running_bill` (not per-bill sum)

**Before:** IB2 gross_total wrong (per-bill instead of cumulative)
**After batch 8:** Interim bills match expected output

## Correction Batch 9 — Occupancy snapshots (Defect E)

**Files changed:** `src/billing_engine/commands/__init__.py`

**Changes:**
- Snapshot captured at command timestamp after handler (same-timestamp commands included)
- Fixed `_last_command_time` condition: `(None or <= snap_ts) and snap_ts < current_time`
- HOUSEKEEPING: keep adm_id/since_ts (set to discharge time), clear billing_category
- RESERVED: set since_ts to reservation time

**Before:** All beds AVAILABLE at snapshots (captured too early, all at once)
**After batch 9:** All 3 occupancy files match expected output

## Final Result

- **42/42 files matched**
- **0 mismatched files, 0 missing files, 0 extra files**
- **10223/10223 fields matched**
- **75/75 tests pass**
- **Reproducible from clean output directory**
