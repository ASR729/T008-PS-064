# Occupancy Verification Report — PS-064 Team T008

**Project:** PS-064 Hospital Inpatient Billing and Bed Management Engine  
**Date:** 2026-11-15  
**Commit:** `4bcca54` (Week 4 correction, verified 42/42)  
**Python:** 3.14.5  
**Verification basis:** Source-code inspection + independently verified 42/42 official-output reconciliation (3 occupancy snapshots × 60 beds matched exactly)

---

## 1. Occupancy Snapshot Configuration

| Snapshot | Timestamp | Expected File | Beds |
|----------|-----------|---------------|------|
| Snapshot 1 | 2026-10-12 10:00 | `bed_occupancy_20261012_1000.csv` | 60 |
| Snapshot 2 | 2026-10-16 12:00 | `bed_occupancy_20261016_1200.csv` | 60 |
| Snapshot 3 | 2026-10-21 12:00 | `bed_occupancy_20261021_1200.csv` | 60 |
| **Total** | | **3 files** | **180 rows** |

Snapshot times registered in `scripts/reconcile_outputs.py` `run_sample_execution()` and captured by `CommandProcessor._capture_occupancy_snapshot()`.

---

## 2. Occupancy Snapshot Timing (Defect E fix)

**Historical defect:** `_capture_occupancy_snapshot()` was invoked only when a command timestamp EXACTLY equaled a snapshot time, and ran BEFORE the command handler — so an admission at exactly the snapshot time was not yet reflected. Snapshots without an exact command fell back to final bed state.

**Corrected behavior:** Snapshot captured at command timestamp AFTER the handler (same-timestamp commands included). Fixed `_last_command_time` condition. HOUSEKEEPING retains `adm_id`/`since_ts` (set to discharge time); `billing_category` cleared. RESERVED sets `since_ts` to reservation time.

**Verified:** All 3 occupancy files match expected exactly (42/42 reconciliation), confirming snapshot timing is correct.

---

## 3. Bed Lifecycle Verification

### Bed status transitions

| Transition | Trigger | Verified |
|------------|---------|----------|
| AVAILABLE → RESERVED | RESERVE_BED | ✓ (`_handle_reserve_bed`) |
| RESERVED → AVAILABLE | 6-hour expiry | ✓ (reservation release) |
| RESERVED → OCCUPIED | ADMIT (uses reservation) | ✓ |
| OCCUPIED → HOUSEKEEPING | DISCHARGE | ✓ (`_handle_discharge`) |
| HOUSEKEEPING → AVAILABLE | HOUSEKEEPING_CLEARED | ✓ (`_handle_housekeeping_cleared`) |
| OCCUPIED → OCCUPIED | TRANSFER (change bed), STEP_DOWN (ICU exit) | ✓ |

### Bed ownership at snapshot time

| Aspect | Verification |
|--------|--------------|
| Bed status reflects occupying admission | `bed.adm_id` set on admission; cleared on discharge/housekeeping |
| Snapshots at correct timestamps | Captured at command timestamp after handler; same-timestamp commands included |
| HOUSEKEEPING retains `adm_id`/`since_ts` | Fixed (Defect E — was clearing adm_id/since_ts) |
| RESERVED sets `since_ts` | Fixed (Defect E) |
| No double allocation | `_allocate_bed` checks bed status AVAILABLE/RESERVED-for-patient |
| Reserved bed prioritized for admitting patient | `_allocate_bed` prioritizes RESERVED bed; clears `hold_until` |

---

## 4. Admission Allocation Verification

| Aspect | Implementation | Verified |
|--------|---------------|----------|
| Requested category first | `_allocate_bed` searches requested category | ✓ |
| Gender matching for GENERAL | `_allocate_bed` applies gender restriction | ✓ |
| Next-higher category fallback | GENERAL < SEMI_PRIVATE < PRIVATE < DELUXE; ICU never upgrade target | ✓ |
| UPGRADE-FREE 48h window | Billed at requested category rate during window | ✓ (EC-04, ADM-0020) |
| No bed → NO_BED rejection | `_allocate_bed` returns rejection | ✓ |
| 60 beds across 5 categories | `beds.csv` loaded; 60 rows per occupancy file | ✓ |

---

## 5. Transfers and ICU Verification

| Aspect | Implementation | Verified |
|--------|---------------|----------|
| TRANSFER into ICU allowed | `TransferService.validate_transfer` | ✓ |
| TRANSFER out of ICU requires STEP_DOWN | `STEP_DOWN_REQUIRED` rejection if missing | ✓ (BR-03d) |
| Max 3 transfers; 4th rejected | `MAX_TRANSFERS=3` in CommandProcessor | ✓ (BR-03a, ADM-0028) |
| Bed vacated by transfer becomes AVAILABLE | `_handle_transfer` releases bed | ✓ |
| ICU entry via TRANSFER | `_handle_transfer` moves to ICU bed | ✓ |
| ICU exit via STEP_DOWN | `_handle_step_down` moves out of ICU | ✓ |

---

## 6. Reservation Verification (BR-12)

| Aspect | Implementation | Verified |
|--------|---------------|----------|
| RESERVE_BED holds bed until planned_admit_ts + 6:00:00 | `_handle_reserve_bed` sets `hold_until` | ✓ |
| Release at admission time or planned expiry | `_allocate_bed` checks reservation expiry | ✓ |
| Expired reservation bed reallocatable | `_allocate_bed` reallocates expired reservations | ✓ |
| RESERVED bed shown in occupancy snapshots | `since_ts` set to reservation time | ✓ |

---

## 7. Occupancy Snapshot Columns

Each occupancy file has these exact columns (matching output contract):

| Column | Description |
|--------|-------------|
| `bed_id` | Bed identifier (GM-01, GM-02, etc.) |
| `ward_id` | Ward identifier (W-GM, W-GF, etc.) |
| `category` | Bed category (GENERAL, SEMI_PRIVATE, etc.) |
| `gender_restriction` | M, F, or ANY |
| `status` | AVAILABLE, OCCUPIED, RESERVED, HOUSEKEEPING |
| `adm_id` | Occupant admission ID (or reserving admission, or last occupant for HOUSEKEEPING) |
| `since_ts` | When bed entered current state |
| `billing_category` | Rate category being charged (differs during UPGRADE-FREE) |
| `hold_until` | Only for RESERVED beds |

60 rows per file (all 60 beds), sorted by bed_id. All 3 files match expected exactly.

---

## 8. Results Summary

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Occupancy files generated | 3 | 3 | PASS |
| Beds per file | 60 | 60 each | PASS |
| Total occupancy rows | 180 | 180 | PASS |
| Snapshot 1 (2026-10-12 10:00) | Matched | Matched | PASS |
| Snapshot 2 (2026-10-16 12:00) | Matched | Matched | PASS |
| Snapshot 3 (2026-10-21 12:00) | Matched | Matched | PASS |
| Bed ownership at snapshot time | Correct | Correct | PASS |
| HOUSEKEEPING retains adm_id/since_ts | Correct | Correct | PASS |
| RESERVED sets since_ts | Correct | Correct | PASS |
| No double allocation | Correct | Correct | PASS |

**All occupancy checks PASS.** Verified by the independently re-verified 42/42 official-output reconciliation (3 occupancy files × 60 beds = 180 rows, 0 mismatches).

---