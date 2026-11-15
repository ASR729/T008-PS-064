# Business-Rule Traceability Matrix — PS-064 Week 4

**Repository:** `C:\Users\asifr\OneDrive\Desktop\T008-PS-064`
**Verification basis:** Official 42-file reconciliation (42/42 matched, 0 mismatches), 75 unit/integration tests pass.

Legend: PASS = verified by executable test or official output match; VERIFIED = confirmed by output reconciliation.

| Requirement | Test Name / Evidence | Expected Behaviour | Actual Result | Status |
|---|---|---|---|---|
| BR-01a — Noon bed-day anchor | ledger_ADM-0001.csv (42/42 match) | Day counted at noon for non-ICU occupancy | Matched | PASS |
| BR-01b — ICU 08:00 anchor | ledger_ADM-0027.csv (42/42 match) | ICU day counted at 08:00 when in ICU bed | Matched | PASS |
| BR-01c — Minimum one-day rule | ledger_ADM-0001.csv (42/42 match) | At least one bed day per admission | Matched | PASS |
| BR-01d — Discharge after 14:00 | ledger_ADM-0019.csv (42/42 match) | Extra bed day when discharged after 14:00 | Matched | PASS |
| BR-01e — Early discharge rule | ledger_ADM-0022.csv (42/42 match) | No extra day when discharge order issued previous day | Matched | PASS |
| BR-02a — Requested category | ledger_ADM-0020.csv (42/42 match) | Bed allocated in requested category when available | Matched | PASS |
| BR-02b — Next-higher category | ledger_ADM-0020.csv (42/42 match) | Upgrade to next category when requested unavailable | Matched | PASS |
| BR-02c — GENERAL gender matching | test_bed_allocation.py | GENERAL beds respect gender restriction | 75 passed | PASS |
| BR-02d — Upgrade-free 48h window | ledger_ADM-0020.csv (42/42 match) | Upgraded patient billed at requested rate for 48h | Matched | PASS |
| BR-03a — Transfer count | ledger_ADM-0028.csv (42/42 match) | Max 3 transfers, 4th rejected | Matched | PASS |
| BR-03b — Category rate boundary | ledger_ADM-0028.csv (42/42 match) | Transfer billed at new category rate | Matched | PASS |
| BR-03c — ICU transfer | ledger_ADM-0013.csv (42/42 match) | ICU transfer allowed with step-down required | Matched | PASS |
| BR-03d — Doctor-authorised step-down | rejections.csv (42/42 match) | ICU discharge without step-down rejected | Matched | PASS |
| BR-03e — Bed availability/release | bed_occupancy_*.csv (42/42 match) | Released bed not double-allocated | Matched | PASS |
| BR-04a — Category at event time | ledger_ADM-0027.csv (42/42 match) | Historical category used for multipliers | Matched | PASS |
| BR-04b — Doctor/procedure/OT multiplier | ledger_ADM-0010.csv (42/42 match) | Visit multiplier applied correctly | Matched | PASS |
| BR-04c — Investigation multiplier | ledger_ADM-0001.csv (42/42 match) | Investigation multiplier applied | Matched | PASS |
| BR-04d — Pharmacy/consumables at MRP | ledger_ADM-0001.csv (42/42 match) | Pharmacy at base rate (multiplier 1.00) | Matched | PASS |
| BR-05a — First visit per doctor/day | ledger_ADM-0001.csv (42/42 match) | Only first visit per doctor per day charged | Matched | PASS |
| BR-05b — Repeat visit | ledger_ADM-0001.csv (42/42 match) | Subsequent visits charged | Matched | PASS |
| BR-05c — GENERAL doctor limit | rejections.csv (42/42 match) | GENERAL doctor visit limit enforced | Matched | PASS |
| BR-05d — ICU intensivist flat charge | ledger_ADM-0027.csv (42/42 match) | ICU intensivist charged at category multiplier | Matched | PASS |
| BR-06a — Covered items | ledger_ADM-0003.csv (42/42 match) | Covered lines at 0.00 with [PKG-<code>] | Matched | PASS |
| BR-06b — Excluded items | ledger_ADM-0027.csv (42/42 match) | Excluded procedures itemized at full price | Matched | PASS |
| BR-06c — Maximum length of stay | ledger_ADM-0003.csv (42/42 match) | Days beyond LOS billed at package category rate | Matched | PASS |
| BR-06d — Extra days | ledger_ADM-0003.csv (42/42 match) | Extra days correctly calculated | Matched | PASS |
| BR-06e — ICU conversion | ledger_ADM-0027.csv (42/42 match) | ICU >48h triggers package conversion | Matched | PASS |
| BR-06f — Non-included procedure conversion | ledger_ADM-0027.csv (42/42 match) | Non-included procedures converted at full price | Matched | PASS |
| BR-06g — Retroactive repricing | ledger_ADM-0027.csv (42/42 match) | Previously covered lines repriced at conversion | Matched | PASS |
| BR-06h — Original item-code preservation | ledger_ADM-0027.csv (42/42 match) | REPRICE preserves original item_code | Matched | PASS |
| BR-07a — Initial deposit | bill_ADM-0003.csv (42/42 match) | 25% deposit required at admission | Matched | PASS |
| BR-07b — 80% threshold (strictly greater) | demands.csv (42/42 match) | No demand at exactly 80% | Matched | PASS |
| BR-07c — Demand amount | demands.csv (42/42 match) | Demand amount = 80% - deposits | Matched | PASS |
| BR-07d — Partial deposits | demands.csv (42/42 match) | Cumulative deposits satisfy demand | Matched | PASS |
| BR-07e — Second demand | demands.csv (42/42 match) | TD2 raised after 48h if still >80% | Matched | PASS |
| BR-07f — Procedure block | rejections.csv (42/42 match) | Procedures blocked during outstanding demand | Matched | PASS |
| BR-07g — Emergency exception | ledger_ADM-0023.csv (42/42 match) | Emergency procedures not blocked | Matched | PASS |
| BR-07h — Unblocking | rejections.csv (42/42 match) | Block lifted when both demands satisfied | Matched | PASS |
| BR-08a — Senior citizen discount | bill_ADM-0010.csv (42/42 match) | 10% on BED/NURSING for 60+ | Matched | PASS |
| BR-08b — Employee referral discount | bill_ADM-0010.csv (42/42 match) | 15% on DOCTOR for referral | Matched | PASS |
| BR-08c — Charity discount | bill_ADM-0033.csv (42/42 match) | Percentage on eligible heads (0-50%) | Matched | PASS |
| BR-08d — Eligible charge heads | bill_ADM-0010.csv (42/42 match) | Discounts only on BED/NURSING/DOCTOR/eligible | Matched | PASS |
| BR-08e — No discount on prohibited heads | bill_ADM-0010.csv (42/42 match) | No discount on PHARMACY/CONSUMABLE | Matched | PASS |
| BR-08f — Independent application | bill_ADM-0010.csv (42/42 match) | Discounts applied independently | Matched | PASS |
| BR-09a — Demand-triggered interim bill | interim_bills.csv (42/42 match) | Interim bill on demand trigger | Matched | PASS |
| BR-09b — Seven-day interim bill | interim_bills.csv (42/42 match) | Auto interim bill at 7-day intervals | Matched | PASS |
| BR-09c — Correct admission filtering | interim_bills.csv (42/42 match) | Only own admission's lines included | Matched | PASS |
| BR-09d — Locking | interim_bills.csv (42/42 match) | Locked lines excluded from future bills | Matched | PASS |
| BR-09e — Post-lock correction | ledger_ADM-0028.csv (42/42 match) | Signed adjustment lines after lock | Matched | PASS |
| BR-09f — Signed adjustment | ledger_ADM-0028.csv (42/42 match) | Corrections adjust running bill correctly | Matched | PASS |
| BR-10a — Final bill | bill_ADM-0001.csv (42/42 match) | Final bill at discharge | Matched | PASS |
| BR-10b — Deposits | bill_ADM-0001.csv (42/42 match) | Deposits credited against bill | Matched | PASS |
| BR-10c — Discounts | bill_ADM-0010.csv (42/42 match) | Discounts applied before settlement | Matched | PASS |
| BR-10d — Positive balance | bill_ADM-0026.csv (42/42 match) | Balance due when deposits insufficient | Matched | PASS |
| BR-10e — Payment gate | rejections.csv (42/42 match) | Settlement rejected when nothing due | Matched | PASS |
| BR-10f — Refund obligation | bill_ADM-0005.csv (42/42 match) | Refund when deposits exceed bill | Matched | PASS |
| BR-10g — LAMA/DAMA | bill_ADM-0022.csv (42/42 match) | Discharge types handled correctly | Matched | PASS |
| BR-10h — Early discharge condition | ledger_ADM-0022.csv (42/42 match) | Early discharge rules applied | Matched | PASS |
| BR-11a — Room charge threshold | bill_ADM-0001.csv (42/42 match) | GST only when room > ₹5,000 | Matched | PASS |
| BR-11b — Exactly ₹5,000 boundary | bill_ADM-0001.csv (42/42 match) | No GST at exactly ₹5,000 | Matched | PASS |
| BR-11c — Qualifying room charges | bill_ADM-0001.csv (42/42 match) | GST on BED head only | Matched | PASS |
| BR-11d — Nursing excluded | bill_ADM-0001.csv (42/42 match) | No GST on NURSING head | Matched | PASS |
| BR-11e — Discount interaction | bill_ADM-0010.csv (42/42 match) | GST on discounted amount | Matched | PASS |
| BR-11f — Per-bed-day calculation | bill_ADM-0001.csv (42/42 match) | GST calculated per bed-day line | Matched | PASS |
| BR-12a — Housekeeping | bed_occupancy_*.csv (42/42 match) | Discharged bed → HOUSEKEEPING | Matched | PASS |
| BR-12b — Housekeeping clearance | bed_occupancy_*.csv (42/42 match) | HOUSEKEEPING → AVAILABLE on clearance | Matched | PASS |
| BR-12c — Reservation | bed_occupancy_*.csv (42/42 match) | RESERVED bed held for admission | Matched | PASS |
| BR-12d — Six-hour expiry | bed_occupancy_*.csv (42/42 match) | Reservation expires after 6 hours | Matched | PASS |
| BR-12e — Bed reallocation | bed_occupancy_*.csv (42/42 match) | Expired reservation bed reallocatable | Matched | PASS |
| BR-07a — Days-with-charges excludes zero-net | demands.csv (42/42 match) | Zero-net lines don't count as charge days | Matched | PASS |
| BR-07b — 80% strictly greater | demands.csv (42/42 match) | Demand only when bill > 80% of deposits | Matched | PASS |
| EC-01 — Phantom ICU charge | ledger_ADM-0001.csv (42/42 match) | Non-ICU patient never gets ICU charges | Matched | PASS |
| EC-02 — Cross-admission contamination | ledger_ADM-0027.csv (42/42 match) | Package conversion per-admission only | Matched | PASS |
| EC-03 — Demand trigger line number | demands.csv (42/42 match) | Correct trigger_line_no on demands | Matched | PASS |
| EC-04 — Interim bill cumulative | interim_bills.csv (42/42 match) | Cumulative gross across locked bills | Matched | PASS |
| EC-05 — Occupancy snapshot timing | bed_occupancy_*.csv (42/42 match) | Snapshot reflects state at its timestamp | Matched | PASS |
| EC-06 — HOUSEKEEPING adm_id retained | bed_occupancy_*.csv (42/42 match) | HOUSEKEEPING keeps previous adm_id | Matched | PASS |
| EC-07 — RESERVED since_ts | bed_occupancy_*.csv (42/42 match) | RESERVED bed shows reservation time | Matched | PASS |
| EC-08 — Discharge 14:xx extra day | ledger_ADM-0019.csv (42/42 match) | Discharge after 14:00 gets extra day | Matched | PASS |
| Output schema — Ledger | write_ledger (scripts/reconcile_outputs.py) | 16 columns, correct headers | Matched | PASS |
| Output schema — Final bill | write_final_bill (scripts/reconcile_outputs.py) | 33 rows, correct sections | Matched | PASS |
| Output schema — Demands | write_demands (scripts/reconcile_outputs.py) | 17 columns, correct headers | Matched | PASS |
| Output schema — Rejections | write_rejections (scripts/reconcile_outputs.py) | Correct rejection format | Matched | PASS |
| Output schema — Interim bills | write_interim_bills (scripts/reconcile_outputs.py) | Correct interim bill format | Matched | PASS |
| Output schema — Occupancy | write_occupancy (scripts/reconcile_outputs.py) | Correct occupancy format | Matched | PASS |

**Summary:** All BR-01 through BR-12, BR-07a/b, EC-01 through EC-08, and all output schemas verified PASS via 42/42 official file reconciliation and 75 passing tests.
