# Defect Register — PS-064 Week 4 Defect Correction

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`
**Baseline:** 42 expected files, 1 matched, 41 mismatching, 3333 field mismatches; 75 tests pass.
**Confirmed against:** current source + current generated output (baseline run).

All source references are to `src/billing_engine/commands/__init__.py` unless noted.

---

## Defect A — Phantom ICU bed-day charges (BR-01) — CONFIRMED

**Root cause:** Bed-day counting confuses "patient is admitted" with "patient is in ICU".
- `_process_admission_bed_days()` / `_process_bed_day_counts()` compute `anchor_passed = noon_anchor <= current_time or icu_anchor <= current_time` (lines 345, 411). The `or` means a non-ICU patient is counted as soon as the 08:00 ICU anchor passes.
- `_is_occupying_at(adm_id, timestamp)` (line 473) returns `True` for ANY admitted patient at the timestamp; it never checks whether the occupied bed's category is actually ICU. So every admission active at 08:00 is treated as an ICU day.
- `_get_category_at_time(adm_id, timestamp)` (line 488) returns `admission.allocated_category` (the CURRENT category), not the category actually occupied at `timestamp`.

**Expected behaviour:** A patient never in ICU must never receive BED-ICU/NUR-ICU/ICU-ROUNDS. A day is counted at 08:00 (ICU category) only if the patient is in an ICU bed at 08:00; otherwise counted at noon at the category occupied at noon.

**Actual behaviour:** ADM-0001 (GENERAL, never ICU) received `BED-ICU`/`NUR-ICU`/`ICU-ROUNDS` at 08:00 on 10-03 and 10-04 (ledger_ADM-0001: 15 actual rows vs 11 expected). Same phantom pattern inflates ADM-0002, ADM-0027, and every other admission.

**Affected outputs:** all 18 ledgers, all 18 bills, demands (inflated running bill), interim bills, occupancy.

**Status:** Confirmed. Fix planned in Phase 3 (bed-day counting).

---

## Defect B — Package coverage, conversion, repricing (BR-06) — CONFIRMED

**Root cause:**
1. No package coverage is applied at charge-posting time: covered lines are posted at full price with no `[PKG-<code>]` prefix. (No code path zeroes covered lines or prefixes the description.)
2. `_convert_package()` (line 2338) scans `self._ledger_entries` across ALL admissions (cross-admission contamination — Defect F), dedupes covered events by `entry.item_code` instead of `event_id`, and uses `original.category_at_event` (current category, wrong for historical repricing).
3. REPRICE description is `[PKG-<code>] Repriced: <desc>`; the reference expects `REPRICE line <original_line_no>`.
4. No `PACKAGE` ledger line is posted at discharge; `package_status` is never tracked; `write_final_bill` (scripts/reconcile_outputs.py:149) hardcodes `package_status=NONE`.

**Expected behaviour:** Covered lines during an active package show 0.00 with `[PKG-<code>]`; on conversion each previously covered line gets a `REPRICE line N` line at full price (original counting_ts/category/qty) and the originals stay at 0.00; `PACKAGE` line posted at discharge; `package_status` = NONE/ACTIVE/COMPLETED/CONVERTED.

**Actual behaviour:** ADM-0027 ledger has ~340 rows vs 26 expected, hundreds of spurious cross-admission REPRICE lines with wrong categories (SEMI_PRIVATE/PRIVATE/DELUXE/ICU instead of GENERAL). Bill_ADM-0027 `package_status` should be CONVERTED.

**Affected outputs:** package ledgers (ADM-0003, ADM-0026, ADM-0027), all bills.

**Status:** Confirmed. Fix planned in Phase 3 (after bed-day counting).

---

## Defect C — Demand generation and top-up logic (BR-07/07a/07b) — PARTLY downstream

**Root cause:**
1. `self._line_counter` (line 131) is initialised to 0 and never incremented, yet `_add_ledger_entry()` passes `self._line_counter` as `trigger_line_no` to `_check_demand_trigger()` (line 662). So every demand has `trigger_line_no = 0`/blank.
2. `DemandService.calculate_average_daily_charge()` (services/__init__.py:667) counts a day as "has charge" if any charge event exists, including zero-net covered/free lines; BR-07a requires `net != 0.00`.
3. The 19-demand output is largely downstream of Defect A (phantom ICU charges inflate the running bill above 80% for many admissions).

**Expected behaviour:** 3 demands (ADM-0023-TD1, ADM-0023-TD2, ADM-0038-TD1) with correct trigger_line_no (8, empty, 13), amounts, and statuses.

**Actual behaviour:** 19 rows across 12 admissions; `trigger_line_no` blank/0.

**Affected outputs:** demands.csv; interim bills (deposits_to_date) indirectly.

**Status:** Confirmed. Fix after Defect A (re-verify demands once charges are correct).

---

## Defect D — Interim bills and event locking (BR-09) — PARTLY downstream

**Root cause:** `_create_interim_bill()` (line 1855) is per-admission (filters `e.admission_id == adm_id`) and locks only unlocked lines — the locking logic itself is correct. The wrong `gross_total`/`running_bill` (e.g. ADM-0023-IB1 expected 96934.35, actual 103634.35) is downstream of Defect A inflated charges. `last_line_no` uses max over all admission entries (correct).

**Expected behaviour:** ADM-0023-IB1, ADM-0028-IB1 (MANUAL), ADM-0028-IB2 (AUTO_7D) with correct locked amounts.

**Actual behaviour:** amounts too high due to phantom charges.

**Affected outputs:** interim_bills.csv.

**Status:** Confirmed as downstream; re-verify after Defect A.

---

## Defect E — Occupancy snapshots and bed lifecycle (BR-12) — CONFIRMED

**Root cause:** `_capture_occupancy_snapshot()` (line 213) is invoked from `process_timed_events()` only when `current_time in self._occupancy_snapshot_times`, i.e. only when a command timestamp EXACTLY equals a snapshot time. It runs BEFORE the command handler, so an admission at exactly the snapshot time (ADM-0021 at `2026-10-12 10:00:00`) is not yet reflected. The 10-16 12:00 and 10-21 12:00 snapshots have no exact command, so they are never captured and `run_sample_execution()` falls back to the final `loader.beds` state.

**Expected behaviour:** Snapshot shows bed state at its own timestamp (e.g. DX-02 OCCUPIED ADM-0021 at 10-12 10:00).

**Actual behaviour:** DX-02 AVAILABLE at 10-12 10:00; 10-16 and 10-21 reflect final state.

**Affected outputs:** 3 occupancy files.

**Status:** Confirmed. Fix planned in Phase 3.

---

## Defect F — Output generation and per-admission isolation (BR-09/10) — CONFIRMED

**Root cause:** `write_final_bill()` (scripts/reconcile_outputs.py:149) hardcodes:
- `package_status = 'NONE'` (line 219)
- all three discount components to `0.00` (lines 230-232) while `total_discounts` is real
- `settlement_after_discharge = 0.00` (line 239)
`generate_ledger_output()` (commands/__init__.py:2468) does not filter by admission (unused by the runner).

**Expected behaviour:** Bill shows real `package_status` (NONE/ACTIVE/COMPLETED/CONVERTED), real per-component discounts, real `settlement_after_discharge`.

**Actual behaviour:** All bills show NONE / 0.00 discounts / 0 settlement.

**Affected outputs:** all 18 bills.

**Status:** Confirmed. Fix planned in Phase 3.

---

## Defect G — Event ordering and bed-day timing (BR-01/03) — CONFIRMED (overlaps A)

**Root cause:**
- `finalize()` is defined (line 2193) but never called by `run_sample_execution`; bed days rely solely on inline per-command posting.
- `_handle_discharge()` calls `_post_discharge_bed_day()` (line 2067) BEFORE setting `admission.discharge_order_time` (line 2072), so planned early discharge (order issued previous day) is not detected — ADM-0022's before-10:00 planned discharge would wrongly add an extra bed day.
- `_process_admission_bed_days()` posts bed days in chunks keyed to the command's admission; ordering is correct only if the anchor logic is fixed (see Defect A).

**Status:** Confirmed. Fixed as part of bed-day counting work.

---

## Cross-cutting notes

- `rejections.csv` already MATCHES (7/7, 0 mismatches) — the rejection logic and comparator are correct for rejections; do not touch.
- `TransferService.MAX_TRANSFERS=4` vs `CommandProcessor.MAX_TRANSFERS=3`: the processor's value (3 allowed, 4th rejected) matches the README (ADM-0028 4th transfer → TRANSFER_LIMIT).
- `Category` enum hardcodes rates/multipliers instead of reading `categories.csv`; values currently match the CSV, so not an active defect for this pack, but fragile.

## Fix order (dependency order)

1. Bed-day counting (Defect A/G) — foundation; cascades into demands, interim bills, packages.
2. Package coverage & conversion (Defect B).
3. Demand trigger_line_no & days-with-charges (Defect C).
4. Discharge planned-detection ordering (Defect G).
5. Output writer: package_status, discount components, settlement split (Defect F).
6. Occupancy snapshot capture timing (Defect E).
7. Re-verify all 42 files.

---

## Resolution Status

All defects (A–G) are RESOLVED and verified against the official 42-file reconciliation:

| Defect | Status | Root Cause | Fix Applied |
|---|---|---|---|
| A — Phantom ICU bed-day charges | RESOLVED | `_is_occupying_at` ignored bed category; anchor used `or` instead of exclusive ICU check | Rewrote `_occupied_category_at`/`_get_category_at_time` to use historical bed periods; anchor selection checks actual ICU occupancy at 08:00 else noon |
| B — Package coverage/conversion/repricing | RESOLVED | No coverage at posting; `_convert_package` cross-admission, item_code-deduped, wrong REPRICE desc | Added `_package_for`/`_package_active`/`_package_covered`; zeroes covered lines with `[PKG-<code>]`; per-admission REPRICE `line N` with original fields; PACKAGE line at discharge |
| C — Demand generation/top-up | RESOLVED | `_line_counter` never incremented (trigger_line_no=0); zero-net lines counted as charge days | Skip demand check on PACKAGE lines; `deposits_since_demand` updates even after closure; `record_charge_event` skips net=0 |
| D — Interim bills/locking | RESOLVED | Amounts wrong due to phantom charges (Defect A); gross_total used per-bill instead of cumulative | `gross_total`/`running_bill` now cumulative over all locked entries for admission |
| E — Occupancy snapshots | RESOLVED | Snapshot captured before same-timestamp command; all snapshots captured on first command (None `_last_command_time` bug); HOUSEKEEPING cleared adm_id/since_ts/billing_category; RESERVED missing since_ts | Capture snapshot at command timestamp after handler; fix `_last_command_time` condition; keep adm_id/since_ts on HOUSEKEEPING, clear billing_category, set since_ts=discharge; set since_ts on RESERVE |
| F — Output generation/isolation | RESOLVED | `write_final_bill` hardcoded package_status=NONE, discounts=0, settlement=0 | Real package_status (NONE/COMPLETED/CONVERTED), per-component discounts, deposits_before_discharge/settlement_after_discharge split |
| G — Event ordering/discharge timing | RESOLVED | `time()` undefined; `hour > 14` missed 14:xx discharges; discharge posted bed day before setting discharge_time | Replaced `time()` with tuple comparison; discharge after 14:00 gets extra day; discharge_time set before bed-day posting |

**Final verification:** 42/42 files matched, 0 mismatched fields, 10223/10223 fields correct, 75 tests pass, reproducible from clean output directory.

