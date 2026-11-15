# PS-064 – Hospital Inpatient Billing and Bed Management Engine — Sample Data Pack

Prepared by 10 SECONDS for Team T008.

## Files

| File | What it holds | Row count |
|---|---|---|
| `categories.csv` | 5 room categories: bed and nursing rates, BR-04 multipliers, GENERAL doctor limit | 5 data rows |
| `beds.csv` | 60 beds in 6 wards (GENERAL male/female, SEMI_PRIVATE, PRIVATE, DELUXE, ICU) | 60 data rows |
| `doctors.csv` | Doctors with visit fee and intensivist flag | 14 data rows |
| `tariff.csv` | 80 items: procedures, OT per hour, investigations, pharmacy and consumables at MRP | 80 data rows |
| `packages.csv` | 6 fixed-price packages with inclusions, exclusions and LOS | 6 data rows |
| `admissions.csv` | 40 admissions (Oct 2026): patient, requested category, doctor, package, employee flag | 40 data rows |
| `commands.txt` | All events in time order, Oct 2026 | 837 command lines (excluding comments) |
| `expected_outputs/ledger_<ADM-ID>.csv` | Expected ledger, one file per visible admission (18 files) | 450 data rows in all (per file below) |
| `expected_outputs/bill_<ADM-ID>.csv` | Expected final bill, one file per visible admission (18 files) | 576 data rows in all (32 each) |
| `expected_outputs/demands.csv` | Expected top-up demands of the visible admissions | 3 data rows |
| `expected_outputs/rejections.csv` | Expected rejected commands of the visible admissions | 7 data rows |
| `expected_outputs/interim_bills.csv` | Expected interim bills of the visible admissions | 3 data rows |
| `expected_outputs/bed_occupancy_20261012_1000.csv` | Expected bed occupancy at 2026-10-12 10:00:00 | 60 data rows |
| `expected_outputs/bed_occupancy_20261016_1200.csv` | Expected bed occupancy at 2026-10-16 12:00:00 | 60 data rows |
| `expected_outputs/bed_occupancy_20261021_1200.csv` | Expected bed occupancy at 2026-10-21 12:00:00 | 60 data rows |

Row numbers are 1-based data rows (header = row 0). Line numbers for `commands.txt` are physical line numbers including the 2 comment lines at the top.

## Column reference

Conventions: dates `YYYY-MM-DD`; timestamps `YYYY-MM-DD HH:MM:SS` (24h, IST, no timezone suffix); money in Rs as plain decimals with 2 places (no commas, no symbol); multipliers and percentages as plain numbers with 2 places (10.00 means 10%); booleans `true`/`false`; IDs uppercase with a fixed prefix. No empty cells except `admissions.csv package_code` (empty = no package).

### `categories.csv`

| Column | Type | Units / format | Allowed values | Notes |
|---|---|---|---|---|
| category | enum | — | GENERAL, SEMI_PRIVATE, PRIVATE, DELUXE, ICU | primary key |
| upgrade_rank | int | — | 0-4 | 1-4 = upgrade chain GENERAL < SEMI_PRIVATE < PRIVATE < DELUXE; 0 = ICU (never an upgrade target) |
| daily_bed_charge | decimal | Rs per bed day | — | room (bed) charge; ICU 4800.00 |
| nursing_charge | decimal | Rs per bed day | — | charged with every bed day |
| visit_multiplier | decimal | x | — | BR-04 doctor-visit multiplier |
| procedure_multiplier | decimal | x | — | BR-04 |
| ot_multiplier | decimal | x | — | BR-04 |
| investigation_multiplier | decimal | x | 1.00, 1.20 | 1.00 GENERAL, 1.20 all others |
| pharmacy_consumable_multiplier | decimal | x | 1.00 | MRP in every category |
| max_chargeable_doctors_per_day | int | — | 0, 2 | 2 for GENERAL; 0 = unlimited |

### `beds.csv`

| Column | Type | Units / format | Allowed values | Notes |
|---|---|---|---|---|
| bed_id | string | <ward prefix>-nn | GM-, GF-, SP-, PR-, DX-, IC- | primary key; allocation picks the lowest bed_id (string order) |
| ward_id | string | W-xx | — | — |
| ward_name | string | — | — | — |
| category | enum | — | categories.csv | — |
| gender_restriction | enum | — | M, F, ANY | M/F only on the two GENERAL wards |
| daily_bed_charge | decimal | Rs | — | same for every bed of a category (copied from categories.csv) |
| nursing_charge | decimal | Rs | — | same for every bed of a category |
| floor | int | — | 1-4 | informational |

### `doctors.csv`

| Column | Type | Units / format | Allowed values | Notes |
|---|---|---|---|---|
| doctor_id | string | DOC-nn | — | primary key |
| doctor_name | string | — | — | — |
| specialty | string | — | — | — |
| visit_fee | decimal | Rs | — | GENERAL-rate fee per chargeable visit |
| is_intensivist | bool | — | true, false | intensivist visits inside ICU are covered by the flat ICU rounds fee |

### `tariff.csv`

| Column | Type | Units / format | Allowed values | Notes |
|---|---|---|---|---|
| item_code | string | PRC-/OT-/INV-/PHM-/CON-/IMP-/BLD- | — | primary key |
| description | string | — | — | — |
| head | enum | — | PROCEDURE, OT, INVESTIGATION, PHARMACY, CONSUMABLE | implants (IMP-) and blood products (BLD-) are CONSUMABLE |
| base_rate | decimal | Rs | — | GENERAL-rate price; MRP for PHARMACY/CONSUMABLE; per hour for OT |
| unit | enum | — | per_procedure, per_hour, per_test, per_unit | — |

### `packages.csv`

| Column | Type | Units / format | Allowed values | Notes |
|---|---|---|---|---|
| package_code | string | PKG-xxx | — | primary key |
| package_name | string | — | — | — |
| package_category | enum | — | categories.csv | admissions on a package request this category |
| package_price | decimal | Rs | — | fixed price |
| los_days | int | bed days | — | maximum length of stay covered |
| included_procedures | list | codes separated by `;` | tariff.csv | PROCEDURE/OT codes covered |
| exclusions | list | codes separated by `;` | tariff.csv | billed itemised on top |
| covered_heads | list | heads separated by `;` | — | non-procedure heads covered for the whole stay (exclusions excepted) |

### `admissions.csv`

| Column | Type | Units / format | Allowed values | Notes |
|---|---|---|---|---|
| adm_id | string | ADM-nnnn | — | primary key; numbered in order of first ADMIT attempt |
| patient_id | string | PAT-nnnn | — | — |
| patient_name | string | — | — | — |
| gender | enum | — | M, F | drives GENERAL ward choice |
| date_of_birth | date | YYYY-MM-DD | — | senior = completed age >= 60 on the admission date |
| mobile | string | 10 digits | starts 6-9 | — |
| city | string | — | — | — |
| requested_category | enum | — | categories.csv | ICU allowed (direct ICU admission) |
| admitting_doctor_id | string | — | doctors.csv | — |
| package_code | string | — | packages.csv or empty | empty = itemised |
| employee_referral | bool | — | true, false | 15% on doctor fees |

## Command file format

`commands.txt` holds one command per line in the form `COMMAND_NAME|arg1|arg2|...`; the first argument is always the command timestamp. Commands must be processed strictly in file order. Lines starting with `#` are comments and blank lines are ignored. `event_id` (EV-nnnnn) is unique per charge event and is what CORRECTION refers to. Every command used in this pack:

| Command | Arguments (in order) | Meaning |
|---|---|---|
| `ADMIT` | `ts|adm_id|deposit|payment_mode` | Admit and allocate a bed; deposit must be >= the BR-07 admission deposit, else DEPOSIT_SHORT |
| `RESERVE_BED` | `ts|adm_id|planned_admit_ts` | Hold a bed of the requested category until planned_admit_ts + 6 h |
| `TRANSFER` | `ts|adm_id|target_category|ordered_by_doctor_id` | Move to another category (into ICU allowed; out of ICU only by STEP_DOWN) |
| `STEP_DOWN` | `ts|adm_id|target_category|doctor_id` | Doctor's step-down from ICU to a lower category |
| `VISIT` | `ts|adm_id|event_id|doctor_id` | Doctor visit |
| `PROCEDURE` | `ts|adm_id|event_id|item_code|doctor_id|emergency` | Procedure; emergency = true/false |
| `OT` | `ts|adm_id|event_id|ot_code|hours|surgeon_id|emergency` | OT time in whole hours |
| `PHARMACY` | `ts|adm_id|event_id|item_code|qty` | Pharmacy issue at MRP |
| `CONSUMABLE` | `ts|adm_id|event_id|item_code|qty` | Consumable / implant / blood product at MRP |
| `INVESTIGATION` | `ts|adm_id|event_id|item_code|qty` | Lab / imaging |
| `DEPOSIT` | `ts|adm_id|amount_or_FULL|payment_mode` | Before discharge: deposit / top-up. After discharge: settlement; FULL = the balance due |
| `INTERIM_BILL` | `ts|adm_id` | Manual interim bill (locks all lines posted so far) |
| `CORRECTION` | `ts|adm_id|event_id|new_qty|reason` | Change the quantity of a PHARMACY/CONSUMABLE/INVESTIGATION event |
| `CHARITY` | `ts|adm_id|pct|ceo_ref` | Charity discount pct (<= 50) on the final bill; ceo_ref may be empty (then rejected) |
| `DISCHARGE` | `ts|adm_id|discharge_type|order_issued_ts` | ts = actual discharge time; type NORMAL/LAMA/DAMA; planned if order issued on an earlier calendar day |
| `HOUSEKEEPING_CLEARED` | `ts|bed_id` | Discharged bed cleaned -> AVAILABLE |

Bed-day counts (12:00 noon, 08:00 for ICU), 48-hour top-up deadlines, reservation releases and 7-day automatic interim bills are NOT in the file: your engine generates them from the clock (see Interpretations).

## Planted scenarios

Every edge case in the brief, mapped to the exact record where it occurs, then the BR-07a/b ruling scenarios, then other rule scenarios and traps. IDs refer to this visible pack; the hidden set has the same scenarios at different dates and IDs.

- **EC-01 Admission at 11:59 versus 12:00 noon**
  - ADM-0001: GENERAL admission at 11:59:00 — that day's 12:00 noon IS counted (2 bed days in all) — `commands.txt line 3`
  - ADM-0002: GENERAL admission at exactly 12:00:00 — that day's noon is NOT counted (first bed day is the next noon) — `commands.txt line 10`
- **EC-02 Discharge at exactly 14:00**
  - ADM-0008: discharge at exactly 14:00:00 — NOT after 14:00, so no extra bed day (4 noon counts only) — `commands.txt line 158`
  - ADM-0010: contrast case — discharge at 15:10:00 (after 14:00) adds one extra bed day — `commands.txt line 251`
  - ADM-0019: discharge at 14:30:00 — after 14:00, extra bed day at PRIVATE rate — `commands.txt line 378`
- **EC-03 Stay of 23 hours 59 minutes across two noon counts**
  - ADM-0005: admitted 2026-10-05 12:00:00, discharged 2026-10-06 11:59:00 (23 h 59 min). The noon at admission is not counted (not before 12:00) and the next noon is not reached, so 0 noon counts; the under-24-hour 1-day minimum applies — `commands.txt lines 35 and 72`
- **EC-04 Upgrade-free window ending mid-day and the next noon count**
  - ADM-0020: PRIVATE requested at 2026-10-12 09:30:00 while all 6 PRIVATE beds are occupied / awaiting housekeeping / reserved — allocated a DELUXE bed at PRIVATE rate (UPGRADE_FREE) until 2026-10-14 09:30:00. The window ends mid-morning, so the noon that follows (same day) is billed at the DELUXE rate Rs 5,500 + 5% GST — `commands.txt line 274`
- **EC-05 Package stay where ICU is exactly 48 hours**
  - ADM-0026: package PKG-PTCA; ICU from 2026-10-15 13:00:00 to STEP_DOWN at 2026-10-17 13:00:00 = exactly 48:00:00 — NOT more than 48 h, so the package is NOT converted. Bed days 4 and 5 exceed the 3-day LOS and are billed at PRIVATE bed + nursing rate — `commands.txt lines 420 and 475`
  - ADM-0031: contrast case — package PKG-TKR with ICU from 2026-10-22 14:00:00 to 2026-10-25 11:00:00 (> 48 h): package CONVERTED at 2026-10-24 14:00:00 and every covered line re-priced — `commands.txt lines 614, 717`
- **EC-06 Running bill at exactly 80% of deposits**
  - ADM-0023: (BR-07b) running bill crosses 80% of the Rs 19,600 deposit on the NURSING line of the ICU bed day at 2026-10-14 08:00:00 — first top-up demand raised at that instant — `demands.csv ADM-0023-TD1`
  - ADM-0038: deposit Rs 12,500; after PHARMACY EV-00649 the running bill is exactly Rs 10,000.00 = 80.00% — no demand. The next charge (line 812) takes it to Rs 10,124.80 — demand raised: average of 3 days (2,850 + 4,750 + 124.80) / 3 = 2,574.93 -> Rs 2,600; a DEPOSIT of exactly Rs 2,600 closes it — `commands.txt lines 805, 812, 813`
- **EC-07 Room charge exactly Rs 5,000 per day (no GST) and Rs 5,000 after a senior discount on a Rs 5,500 room**
  - ADM-0019: PRIVATE room at exactly Rs 5,000.00 per day — not ABOVE Rs 5,000, so gst_amt = 0.00 on every bed day — `commands.txt line 257; ledger_ADM-0019.csv BED lines`
  - ADM-0020: after the upgrade-free window the DELUXE room is billed at Rs 5,500 — above Rs 5,000, so 5% GST = 275.00 per bed day — `ledger_ADM-0020.csv BED lines from the third noon`
  - ADM-0030: DELUXE Rs 5,500 room for a senior — after the 10% senior discount the room charge is Rs 4,950 (not above Rs 5,000) so no GST. NB 10% off Rs 5,500 is 4,950, not exactly 5,000 — `commands.txt line 546`
- **EC-08 Correction to an event already included in an interim bill**
  - ADM-0028: PHARMACY event EV-00435 (2026-10-20 09:20:00) is locked by the manual INTERIM_BILL at 2026-10-21 18:00:00; the CORRECTION (qty 3 -> 1) must post a signed adjustment line dated the correction time, not edit the locked line — `commands.txt lines 535, 583, 648`
- **BR-07a / BR-07b ruling scenarios** (with EC-06 above):
  - ADM-0023: partial DEPOSIT Rs 5,000 (less than the demand) — outstanding reduced, demand stays OPEN — `commands.txt line 414`
  - ADM-0023: first demand still OPEN at exactly +48:00:00 and bill still above 80% — second demand and PROCEDURE_BLOCK at that instant; the non-emergency PROCEDURE stamped exactly at the deadline is REJECTED TOPUP_BLOCK (deadline evaluated first) — `commands.txt line 433`
  - ADM-0023: during the block an emergency PROCEDURE (emergency=true) is accepted and billed; later non-emergency PROCEDURE and OT are REJECTED TOPUP_BLOCK — `commands.txt lines 442, 467, 472`
  - ADM-0023: DEPOSIT Rs 10,000 closes the first demand but not the block; DEPOSIT Rs 1,00,000 lifts the block (deposits since first demand >= sum of both demands); the same non-emergency bronchoscopy is then accepted — `commands.txt lines 449, 477, 492`
- **Other rule scenarios and traps (not in the brief, but realistic):**
  - ADM-0002: three different doctors visit a GENERAL patient on the same day; the 3rd doctor (DOC-03) is beyond the 2-doctors-per-day GENERAL limit and is not chargeable; DOC-02's second visit that day is free — `commands.txt line 25`
  - ADM-0022: planned discharge at 09:00:00 with DISCHARGE order issued the previous evening — the before-10:00 extra bed day is avoided — `commands.txt line 397`
  - ADM-0021: also upgraded to DELUXE at PRIVATE rate, then moved back to PRIVATE (the bed freed by housekeeping) inside the 48-hour window — never billed at the DELUXE rate — `commands.txt lines 279, 332`
  - ADM-0030: date of birth 1966-10-20 — the patient turns exactly 60 on the admission date and IS a senior citizen (>= 60) — `admissions.csv ADM-0030`
  - ADM-0013: TRANSFER out of ICU to SEMI_PRIVATE without a STEP_DOWN command — must be REJECTED (code STEP_DOWN_REQUIRED); the STEP_DOWN one hour later is accepted — `commands.txt line 231`
  - ADM-0027: package PKG-HERNIA; PROCEDURE PRC-002 (endoscopy) is neither included nor excluded — package CONVERTED to itemised at 2026-10-18 15:00:00, every covered line re-priced (REPRICE lines) — `commands.txt line 495`
  - ADM-0028: CORRECTION of an UNLOCKED event EV-00482 (qty 4 -> 2) — the original line is corrected in place, no adjustment line — `commands.txt line 624`
  - ADM-0028: 4th non-ICU transfer in one stay — REJECTED (TRANSFER_LIMIT); patient stays in PRIVATE — `commands.txt line 688`
  - ADM-0028: stay longer than 7 days — automatic interim bill at admission + 7 days (2026-10-25 10:00:00) in addition to the manual one — `interim_bills.csv ADM-0028-IB2`
  - ADM-0033: CHARITY 60% (over the 50% cap) REJECTED CHARITY_LIMIT; CHARITY 50% with an empty CEO reference REJECTED CHARITY_NO_CEO_REF; CHARITY 50% with CEO/2026/041 accepted — `commands.txt lines 716, 719, 728`
  - ADM-0036: LAMA discharge at 08:30:00 with the order issued 08:15 the same day — unplanned discharge before 10:00 does NOT avoid the extra bed day; billed like a normal discharge, tagged LAMA — `commands.txt line 767`
  - ADM-0009: ADMIT with deposit Rs 12,399 (required 2 x 1,200 + 10,000 = 12,400) REJECTED DEPOSIT_SHORT; the second ADMIT 30 min later with exactly Rs 12,400 is accepted (boundary) — `commands.txt lines 84, 86`
  - ADM-0029: bed reserved for planned admission at 2026-10-19 09:00:00; hold ends 2026-10-19 15:00:00 and the bed is released; ADMIT at 2026-10-19 15:30:00 gets a bed through normal allocation — `commands.txt lines 498, 521`
  - ADM-0032: DAMA discharge — billed exactly like a normal discharge, only tagged DAMA — `commands.txt line 759`
  - ADM-0007: PHARMACY event EV-00035 appears twice (identical line) — the second must be REJECTED DUPLICATE_EVENT — `commands.txt lines 46 and 47`
  - ADM-0016: INVESTIGATION line stamped 2026-10-10 07:36:00 sits after a later-stamped line (out of order) — must be REJECTED OUT_OF_ORDER, not billed — `commands.txt line 186`

## What is NOT in this pack

Expected outputs ARE provided, but only for the 18 admissions listed under "Visible vs hidden" (folder `expected_outputs/`). The other 22 admissions in this pack have no expected outputs: they are for your own self-testing — validate your engine on them with your own test suite against the rules in your brief (BR-01 … BR-12). A separate hidden input set with the same schema (different dates, IDs and volumes, same scenario types) will be used at final evaluation; outputs are compared field-for-field, so follow the column formats in this README exactly in your own output.

## Output format expected at evaluation

Produce these CSV files (header row, conventions as above). Where the brief is silent on a format detail the choice below is binding for evaluation. Only `description` and `detail` are free text and are not compared. Rejection `code` values used by the reference engine: OUT_OF_ORDER, MALFORMED, UNKNOWN_COMMAND, UNKNOWN_ADMISSION, NOT_ADMITTED, ALREADY_ADMITTED, ALREADY_RESERVED, DEPOSIT_SHORT, NO_BED, INVALID_CATEGORY, STEP_DOWN_REQUIRED, SAME_CATEGORY, TRANSFER_LIMIT, NOT_IN_ICU, DUPLICATE_EVENT, UNKNOWN_DOCTOR, UNKNOWN_ITEM, INVALID_QTY, INVALID_FLAG, TOPUP_BLOCK, INVALID_AMOUNT, NOTHING_DUE, UNKNOWN_EVENT, CORRECTION_NOT_ALLOWED, NO_CHANGE, CHARITY_NO_CEO_REF, CHARITY_LIMIT, CHARITY_ALREADY_APPLIED, INVALID_TYPE, INVALID_ORDER_TS, UNKNOWN_BED, BED_NOT_IN_HOUSEKEEPING.

### `ledger_<ADM-ID>.csv`

One file per admission, every ledger line in posting order. `description` is free text and is NOT compared; every other column is.

Columns, in order: `line_no`, `event_ts`, `counting_ts`, `head`, `item_code`, `description`, `category_at_event`, `qty`, `base_amount`, `multiplier`, `gross`, `discount_pct`, `discount_amt`, `gst_amt`, `net`, `locked_by_interim`

### `bill_<ADM-ID>.csv`

Final bill as `section,item,value` rows in exactly this order: INFO adm_id, admit_ts, discharge_ts, discharge_type, planned_discharge, bed_days, package_code, package_status (NONE/ACTIVE/CONVERTED/COMPLETED); HEAD BED, NURSING, DOCTOR, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, PACKAGE (gross per head, all nine always present); TOTAL gross_charges; DISCOUNT senior_bed_nursing, employee_doctor, charity; TOTAL total_discounts; TAX gst_room; TOTAL net_before_rounding; ROUNDING rounding; TOTAL final_bill; PAYMENT deposits_before_discharge, settlement_after_discharge; RESULT balance_due, refund_due; STATUS bill_status (BALANCE_DUE/REFUND_DUE/SETTLED), admission_status (DISCHARGE_PENDING_PAYMENT/DISCHARGED).

Columns, in order: `section`, `item`, `value`

### `demands.csv`

One row per top-up demand, ordered by adm_id then demand number. demand_id = <ADM-ID>-TD<n>; seq 1 = first demand of a cycle, 2 = the 48-hour second demand; status OPEN/CLOSED/LAPSED/CLOSED_AT_DISCHARGE; block columns filled on seq 2 only.

Columns, in order: `demand_id`, `adm_id`, `seq`, `demand_ts`, `trigger_line_no`, `running_bill`, `deposits_at_demand`, `threshold_80pct`, `charges_last_3_days`, `days_with_charges`, `avg_daily_charge`, `demand_amount`, `deposits_since_demand`, `outstanding`, `status`, `status_ts`, `procedure_block_from`, `procedure_block_to`

### `rejections.csv`

One row per rejected command, in file order. line_no = physical line in commands.txt. `detail` is free text (not compared).

Columns, in order: `line_no`, `command_ts`, `command`, `adm_id`, `code`, `detail`

### `interim_bills.csv`

One row per interim bill (manual or automatic) in the order generated. interim_id = <ADM-ID>-IB<n>; trigger MANUAL/AUTO_7D; balance = running_bill - deposits_to_date (negative = in credit).

Columns, in order: `interim_id`, `adm_id`, `interim_ts`, `trigger`, `lines_locked`, `last_line_no`, `gross_total`, `discount_total`, `gst_total`, `running_bill`, `deposits_to_date`, `balance`

### `bed_occupancy_<YYYYMMDD_HHMM>.csv`

All 60 beds sorted by bed_id, state after every command and internal event stamped at or before the snapshot time. status AVAILABLE/OCCUPIED/RESERVED/HOUSEKEEPING; adm_id = occupant / reserving admission / last occupant (HOUSEKEEPING); since_ts = when the bed entered that state; billing_category = rate category being charged (differs from category during UPGRADE_FREE); hold_until for RESERVED only.

Columns, in order: `bed_id`, `ward_id`, `category`, `gender_restriction`, `status`, `adm_id`, `since_ts`, `billing_category`, `hold_until`

Ledger values: `head` one of BED, NURSING, DOCTOR, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, PACKAGE; `item_code` = tariff code, doctor_id for visits, `BED-<CAT>` / `NUR-<CAT>` / `ICU-ROUNDS` for bed days, package code for the package line; `counting_ts` only on bed-day lines (BED, NURSING, ICU-ROUNDS, and their REPRICE lines), empty otherwise; `category_at_event` = category of the bed occupied at the event; `locked_by_interim` = interim_id or empty.

Bed occupancy is evaluated at given timestamps; for this pack: `2026-10-12 10:00:00`, `2026-10-16 12:00:00`, `2026-10-21 12:00:00`.

## Visible vs hidden

Expected outputs in `expected_outputs/` cover these 18 admissions (the reference engine run over the WHOLE command file, filtered to these IDs; occupancy files show all 60 beds):

| adm_id | Scenario | Ledger rows |
|---|---|---|
| ADM-0001 | Simple itemised GENERAL stay; admitted 11:59:00 so that day's noon counts (EC-01); 2 bed days; same doctor twice on one day (second visit free) [hand-worked example below] | 11 |
| ADM-0002 | GENERAL admission at exactly 12:00:00 (that noon NOT counted, EC-01); 3 different doctors in one day (3rd free, GENERAL 2-doctor limit) | 16 |
| ADM-0003 | Package PKG-LAPCHOLE within its 3-day LOS: inclusions covered, exclusion BLD-PRBC billed on top; balance paid after discharge (DEPOSIT FULL) | 19 |
| ADM-0005 | Stay of 23 h 59 min from 12:00:00 to 11:59:00 next day — touches two noons, counts none, billed 1-day minimum (EC-03) | 5 |
| ADM-0008 | SEMI_PRIVATE stay, discharge at exactly 14:00:00 — no extra bed day (EC-02) | 23 |
| ADM-0010 | Senior (67) AND employee referral: 10% on bed+nursing and 15% on doctor fees applied independently; discharge after 14:00 -> extra bed day | 31 |
| ADM-0013 | ICU move and step-down: ICU days counted at 08:00, flat ICU rounds, intensivist visits covered, multipliers by occupied category; TRANSFER out of ICU rejected | 38 |
| ADM-0019 | PRIVATE room at exactly Rs 5,000/day — no GST on any day (EC-07); discharge 14:30 after 14:00 -> extra bed day | 22 |
| ADM-0020 | UPGRADE_FREE: PRIVATE full, DELUXE bed at PRIVATE rate for 48 h; window ends 09:30 mid-day, next noon at DELUXE rate with 5% GST (EC-04) | 15 |
| ADM-0022 | RESERVE_BED for a planned admission (admitted inside the hold, uses the reserved bed); PLANNED discharge at 09:00 (order issued previous evening) -> no extra bed day | 17 |
| ADM-0023 | Top-up demands BR-07a/b: demand at 80%, partial deposit, second demand at exactly 48 h -> PROCEDURE_BLOCK, non-emergency procedure/OT rejected, emergency accepted, block lifted by deposit | 46 |
| ADM-0026 | Package PKG-PTCA: ICU exactly 48:00:00 (no conversion, EC-05); stent excluded; LOS 3 exceeded -> 2 extra days at package category rate | 37 |
| ADM-0027 | Package PKG-HERNIA CONVERTED to itemised by a non-included procedure (endoscopy); all covered lines re-priced at conversion time | 26 |
| ADM-0028 | 9-day stay: manual + automatic 7-day interim bills, CORRECTION to a locked event (signed adjustment, EC-08) and to an unlocked one (in place), 4th transfer rejected, employee referral | 65 |
| ADM-0030 | Senior turning exactly 60 on the admission date; DELUXE Rs 5,500 less 10% = Rs 4,950 -> no GST (EC-07) | 21 |
| ADM-0033 | CHARITY 50% with CEO reference (after a 60% attempt and a no-CEO-ref attempt are rejected); dialysis procedures; charity excludes pharmacy/consumables | 31 |
| ADM-0036 | LAMA discharge at 08:30, order issued the same morning (unplanned before 10:00) -> extra bed day; LAMA bills identically, only tagged | 14 |
| ADM-0038 | Running bill exactly 80% of deposits (no demand, EC-06); next charge raises a demand rounded up to Rs 100; closed by a deposit exactly equal to it | 13 |

The remaining 22 admissions (including further planted scenarios: deposit-short re-admission, reservation expiry, upgrade then move-back, ICU-over-48-h package conversion, duplicate and out-of-order lines, DAMA) have no published outputs. The hidden evaluation set uses the same files and formats with different dates, IDs and a denser command stream (~1,100 lines; this visible stream is kept smaller so the pack stays e-mailable).

## Interpretations used in the expected outputs

The brief is silent or ambiguous on the points below; the expected outputs (visible and hidden) follow these choices exactly. BR-07a and BR-07b are the binding rulings already issued to your team and are implemented as written.

1. **Processing order.** Commands are processed strictly in file order. A command stamped earlier than the previous accepted command is rejected OUT_OF_ORDER and has no effect. Internal timed events fire before any command stamped at or after them; among internal events at the same instant the order is: 48-hour demand deadline, reservation release, bed-day count, 7-day interim bill. The package ICU-over-48-h check fires only once the clock moves strictly past the 48-hour instant. A command rejected for any other reason still advances the clock. Validation stops at the first failing check, in this order: out of order, admission known/admitted, duplicate event_id, item/doctor valid, quantity/flag valid, TOPUP_BLOCK.
2. **Bed-day counting (BR-01).** At most one bed day per calendar day. A patient occupies a bed at instant t if admitted strictly before t and not yet discharged (admission at exactly 12:00:00 does NOT count that noon; discharge at exactly 12:00:00 DOES). If the patient is in ICU at 08:00 the day is counted at 08:00 as an ICU day; otherwise it is counted at 12:00 at the category occupied at noon (an ICU entered after 08:00 is counted at noon as ICU). Each bed day posts separate lines in this order: BED, NURSING, and ICU-ROUNDS (Rs 2,500, head DOCTOR) when the day is an ICU day.
3. **Discharge-day rules.** Discharge time after 14:00:00 (strictly) adds one extra bed day. Discharge before 10:00:00 adds one extra bed day unless it is planned; planned = order_issued_ts on an earlier calendar day than the discharge. Exactly 14:00:00 or exactly 10:00:00 adds nothing. If the stay is under 24 h and no bed day was counted, one bed day is posted at discharge (1-day minimum; it is a minimum, not a cap). Extra/minimum days use the category (and UPGRADE_FREE rate, if still inside the window) at discharge; their event_ts and counting_ts are the discharge time. LAMA and DAMA are billed identically to NORMAL.
4. **Bed allocation.** Lowest bed_id that is AVAILABLE in the category; GENERAL only in the gender-matching ward. RESERVED and HOUSEKEEPING beds are not free. Upgrade happens only at ADMIT: the lowest higher category (GENERAL < SEMI_PRIVATE < PRIVATE < DELUXE) with a free bed; ICU is never upgraded or used as an upgrade. No bed -> NO_BED. TRANSFER/STEP_DOWN never upgrade (NO_BED if the target is full). A bed vacated by a transfer is AVAILABLE at once; a bed vacated by DISCHARGE stays HOUSEKEEPING until HOUSEKEEPING_CLEARED.
5. **UPGRADE_FREE.** Bed and nursing are charged at the requested category's rates for every counting instant up to and including admit + 48:00:00; later instants use the occupied category's rates. The window ends as soon as the patient leaves the upgraded bed (e.g. moved back). Visit/procedure/OT/investigation multipliers always follow the OCCUPIED category (BR-04 literal), also during UPGRADE_FREE. GST is judged on the rate actually charged.
6. **Reservations.** RESERVE_BED takes the lowest AVAILABLE bed of the requested category (no upgrade). The bed is RESERVED until the patient's ADMIT (which uses it) or until planned + 6:00:00, when it is released (a release at exactly the ADMIT time happens first).
7. **Transfers.** TRANSFER into ICU is allowed and not counted. Leaving ICU needs STEP_DOWN; TRANSFER from ICU -> STEP_DOWN_REQUIRED. Every other accepted TRANSFER (including moving back from an upgrade) counts; the 4th -> TRANSFER_LIMIT. Same category -> SAME_CATEGORY.
8. **Multipliers (BR-04).** Taken from categories.csv for the category occupied at the event time. Bed, nursing, ICU rounds, package price, pharmacy and consumables use 1.00 (base_amount is the rate itself).
9. **Doctor visits (BR-05).** Per calendar day: (a) any later visit by a doctor already seen that day is free; (b) an intensivist visit while the patient is in ICU is free (covered by ICU rounds); (c) GENERAL: once 2 different doctors have been charged that day further doctors are free; (d) otherwise fee x visit multiplier. Free visits are ledger lines with base_amount 0.00. The 2-doctor limit uses the category at the visit time.
10. **Packages (BR-06).** Covered for the whole stay: lines of heads in covered_heads unless the item is in exclusions, and PROCEDURE/OT codes in included_procedures. Exclusions are itemised on top. Any other PROCEDURE/OT converts the package at that command (then billed itemised). Covered lines show base_amount/gross/net 0.00 and description prefix `[PKG-...]`. Bed days are numbered from 1; day numbers above los_days are billed at the package category's bed + nursing rate (ICU rounds stay covered; senior discount and GST apply as usual). The package price is ONE `PACKAGE` line posted at discharge (not at admission), so it is never part of the running bill for BR-07. ICU time is cumulative; the package converts when ICU time exceeds 48:00:00 while the patient is still in ICU, stamped at the instant 48:00:00 was reached; exactly 48:00:00 does not convert. On conversion every covered line gets a REPRICE line (event_ts = conversion time; counting_ts, category, qty, multiplier, discount and GST of the original event, priced as if itemised); the covered originals stay at 0.00 and no package line is posted. Beyond-LOS bed-day lines already billed at the package-category rate are not re-priced (does not occur in the data).
11. **Deposits and running bill (BR-07).** Admission deposit: 25% of package price for package admissions, else 2 x the requested category's bed charge + Rs 10,000 (bed charge only, not nursing). Running bill = sum of `net` of all ledger lines posted so far (after line discounts, including GST, excluding charity and the package price). The 80% test runs after every posted line (including bed-day and REPRICE lines, and quantity-increasing corrections) except lines posted by DISCHARGE. DEPOSIT after discharge is a settlement, not a deposit.
12. **BR-07a details.** `charges posted` on a day = sum of `net` of lines whose event_ts falls on that date; a day `has a charge line` if it has at least one line with net not 0.00 (covered and free lines do not count). Rounding up uses the exact average; avg_daily_charge is shown rounded to 2 dp.
13. **BR-07b details.** Deposits count towards a demand only if posted after it was raised. If at the 48-hour deadline the bill is no longer above 80%, the first demand becomes LAPSED and no block starts. While a block is active no new demand is raised. At DISCHARGE every open demand becomes CLOSED_AT_DISCHARGE and any block ends. After a cycle ends, the next charge above 80% starts a new cycle (seq 1 again).
14. **Discounts (BR-08).** Senior = completed age >= 60 on the admission date (60th birthday on the admission date counts): 10% on BED and NURSING lines. Employee referral: 15% on DOCTOR lines (visits and ICU rounds). Both are line-level, rounded per line, each on its own head. CHARITY: 0 < pct <= 50 with a non-empty CEO reference, at most one per admission; amount = pct x sum(gross - line discount) over all heads except PHARMACY and CONSUMABLE (PACKAGE included, GST excluded), rounded to 2 dp, applied on the final bill only; it does not change GST.
15. **GST (BR-11).** 5% on a BED line when (gross - discount) > 5,000.00 for that bed day; never on nursing or other heads. The ICU bed rate is 4,800.00, so ICU days carry no GST. Note: the brief's EC-07 says Rs 5,500 less senior discount is Rs 5,000 - 10% of 5,500 is actually 4,950.00; either way it is not above 5,000, so no GST.
16. **Interim bills and corrections (BR-09).** Automatic interim bills at admit + 7 days, + 14 days ... while admitted (independent of manual ones). An interim bill locks every line not yet locked; locked_by_interim = the first interim that locked it. CORRECTION is allowed for PHARMACY, CONSUMABLE and INVESTIGATION events. Unlocked event: corrected in place (qty and amounts change, event_ts unchanged). Locked event: a signed `ADJ` line dated the correction time with qty = new - current, and the original category, multiplier and discount %.
17. **Final bill (BR-10).** gross per head; minus senior, employee and charity discounts; plus GST; rounded half-up to the rupee with the difference as `rounding`; minus deposits received before discharge -> balance_due or refund_due. With a balance due the admission is DISCHARGE_PENDING_PAYMENT until settled (DEPOSIT ... FULL); a refund-due admission is DISCHARGED at once.
18. **Rounding.** Every money value is a Decimal rounded half-up to 2 dp per line: gross = base_amount x qty x multiplier; discount_amt = gross x pct / 100; gst_amt = (gross - discount_amt) x 5 / 100; net = gross - discount_amt + gst_amt.

## Hand-worked example — ADM-0001

ADM-0001 (Prakash Naik, male, GENERAL, admitting doctor DOC-01, no package, not senior, no employee referral) is admitted at `2026-10-02 11:59:00` with a Rs 15,000 deposit and discharged at `2026-10-04 11:00:00` (order issued the previous evening).

**Bed-day count.**
- 2026-10-02 12:00 — admitted at 11:59:00, i.e. before noon, so the patient occupies a bed at this noon: bed day 1.
- 2026-10-03 12:00 — in bed: bed day 2.
- 2026-10-04 12:00 — not reached (discharged at 11:00). Discharge at 11:00 is not after 14:00 and not before 10:00, so no extra day; stay is over 24 h, so the minimum rule does not apply. **Total 2 bed days.**

**Every ledger line** (GENERAL multipliers: visit 1.00, investigation 1.00; no discounts; no GST since the room is Rs 1,200):

| line | event_ts | head | item | qty | base | mult | gross | net | why |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-02 12:00:00 | BED | BED-GENERAL | 1 | 1200.00 | 1.00 | 1200.00 | 1200.00 | noon count, bed day 1 |
| 2 | 2026-10-02 12:00:00 | NURSING | NUR-GENERAL | 1 | 400.00 | 1.00 | 400.00 | 400.00 | nursing for bed day 1 |
| 3 | 2026-10-02 14:10:00 | INVESTIGATION | INV-CBC | 1 | 450.00 | 1.00 | 450.00 | 450.00 | CBC 450 x 1 x 1.00 |
| 4 | 2026-10-02 15:00:00 | DOCTOR | DOC-01 | 1 | 800.00 | 1.00 | 800.00 | 800.00 | first visit of DOC-01 that day: 800 x 1.00 |
| 5 | 2026-10-02 16:30:00 | PHARMACY | PHM-001 | 2 | 62.40 | 1.00 | 124.80 | 124.80 | 2 x MRP 62.40 |
| 6 | 2026-10-03 09:00:00 | PHARMACY | PHM-001 | 2 | 62.40 | 1.00 | 124.80 | 124.80 | 2 x MRP 62.40 |
| 7 | 2026-10-03 09:05:00 | CONSUMABLE | CON-002 | 1 | 120.00 | 1.00 | 120.00 | 120.00 | IV set MRP 120.00 |
| 8 | 2026-10-03 10:30:00 | DOCTOR | DOC-01 | 1 | 800.00 | 1.00 | 800.00 | 800.00 | first visit of DOC-01 that day |
| 9 | 2026-10-03 12:00:00 | BED | BED-GENERAL | 1 | 1200.00 | 1.00 | 1200.00 | 1200.00 | noon count, bed day 2 |
| 10 | 2026-10-03 12:00:00 | NURSING | NUR-GENERAL | 1 | 400.00 | 1.00 | 400.00 | 400.00 | nursing for bed day 2 |
| 11 | 2026-10-03 17:00:00 | DOCTOR | DOC-01 | 1 | 0.00 | 1.00 | 0.00 | 0.00 | 2nd visit by DOC-01 the same day: free (base 0.00) |

**Bill.** BED 2,400.00 + NURSING 800.00 + DOCTOR 1,600.00 + PHARMACY 249.60 + CONSUMABLE 120.00 + INVESTIGATION 450.00 = 5,619.60; no discounts, no GST; rounded to 5,620.00 (rounding +0.40); deposits 15,000.00 -> refund_due 9,380.00, bill_status REFUND_DUE, admission_status DISCHARGED. The running bill never exceeds 80% of 15,000 (12,000), so no demand.
