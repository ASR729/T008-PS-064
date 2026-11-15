# Business Rules Register - PS-064

This register documents all 12 official business rules (BR-01 through BR-12) as specified in the official assignment, along with the official BR-07a and BR-07b clarifications. Each rule includes complete requirements without interpretation or simplification.

## BR-01: Bed-day counting
- **Rule ID**: BR-01
- **Rule name**: Bed-day counting
- **Complete requirement**: 
  - Bed-day counting uses noon anchor (12:00) for GENERAL beds
  - Bed-day counting uses ICU anchor (08:00) for ICU beds
  - Admission before noon counts that day's noon as bed day
  - Admission at exactly 12:00:00 does NOT count that noon
  - Discharge after 14:00:00 adds one extra bed day
  - Discharge at exactly 14:00:00 or 10:00:00 adds nothing
  - Discharge before 10:00:00 adds one extra bed day unless planned
  - Minimum stay of 24 hours, if stay under 24h and no bed day counted, one bed day posted at discharge
  - Only one bed day per calendar day
  - If patient in ICU at 08:00, day counted at 08:00 as ICU day
  - Otherwise counted at 12:00 at category occupied at noon
  - ICU entered after 08:00 counted at noon as ICU
- **Trigger**: Every admission, discharge, and internal bed-day count events
- **Required system behavior**: 
  - Track patient bed occupancy per day based on noon/ICU anchors
  - Apply admission/discharge boundary conditions precisely
  - Generate BED lines for each counted bed day
- **Boundary conditions**: 12:00:00 admission, 14:00:00 discharge, 10:00:00 planned discharge
- **Relevant sample-data evidence**: EC-01, EC-02, EC-03
- **Planned test evidence**: Week 0 baseline, Week 2 unit tests, Week 3 rule verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 281-288, SRC-007 categories.csv

## BR-02: Requested-category allocation
- **Rule ID**: BR-02
- **Rule name**: Requested-category allocation
- **Complete requirement**:
  - Allocate bed of requested category if available
  - GENERAL: prefer gender-matching ward
  - If no bed in requested category, allocate next higher category (GENERAL < SEMI_PRIVATE < PRIVATE < DELUXE)
  - ICU never used as upgrade target
  - UPGRADE_FREE window: bed days charged at requested category rates for 48 hours
  - No bed -> NO_BED
- **Trigger**: ADMIT command
- **Required system behavior**:
  - Search for available bed in requested category
  - Apply gender restriction for GENERAL ward
  - Implement upgrade allocation fallback
  - Charge at requested rate during upgrade window
- **Boundary conditions**: Full bed in requested category, no available higher category, ICU bed full
- **Relevant sample-data evidence**: EC-04
- **Planned test evidence**: Week 0 baseline, Week 2 allocation logic, Week  APAC-064 edge case verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 94-95, EC-04

## BR-03: Category transfer billing
- **Rule ID**: BR-03
- **Rule name**: Category transfer billing boundary
- **Complete requirement**:
  - TRANSFER into ICU allowed without step-down
  - TRANSFER out of ICU requires STEP_DOWN command (STEP_DOWN_REQUIRED rejection if missing)
  - TRANSFER to same category rejected (SAME_CATEGORY)
  - 4th TRANSFER (including back from upgrade) rejected (TRANSFER_LIMIT)
  - Bed vacated by transfer is AVAILABLE at once
  - ICU time cumulative, package converts when ICU > 48 hours (ICU time counted at 08:00 anchor)
- **Trigger**: TRANSFER command
- **Required system behavior**:
  - Validate target category availability
  - Check ICU transfer rules and step-down requirement
  - Track transfer count per stay
  GATA-064 implementation, Week 3 validation
- **Boundary conditions**: First transfer allowed, fourth transfer rejected, exact 48:00:00 ICU time
- **Relevant sample-data evidence**: EC-05
- **Planned test evidence**: Week 0 baseline, Week 2 transfer logic, Week 3 rule verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 263-268, EC-05

## BR-04: Category-at-event tariff multipliers
- **Rule ID**: BR-04
- **Rule name**: Category-at-event tariff multipliers
- **Complete requirement**:
  - All tariff multipliers (doctor visit, procedure, OT, investigation, pharmacy, consumable) taken from categories.csv for category occupied at event time
  - Multiplier applied to base_amount for each charged line
  - Bed, nursing, ICU rounds, pharmacy, consumables use 1.00 multiplier (base_amount is the rate itself)
  - General visit multiplier: 1.00 (GENERAL), 1.25 (SEMI_PRIVATE), 1.50 (PRIVATE/DELUXE), 1.50 (ICU)
  - Investigation multiplier: 1.00 (GENERAL), 1.20 (others)
- **Trigger**: Every charge event that uses multipliers (doctor visit, procedure, OT, investigation, pharmacy, consumable)
- **Required system behavior**:
  - Look up current category at event time
  - Apply appropriate multipliers from categories.csv
  - Calculate gross = base_amount x qty x multiplier
- **Boundary conditions**: Category change during UPGRADE_FREE (use occupied category, not requested), ICU category at noon after 08:00 entry
- **Relevant sample-data evidence**: See categories.csv multipliers, all tariff lines
- **Planned test evidence**: Week 0 baseline, Week 2 multiplier verification, Week 3 tariff pricing
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 269, categories.csv

## BR-05: Doctor visit charging
- **Rule ID**: BR-05
- **Rule name**: Doctor visit charging
- **Complete requirement**:
  - Later visit by same doctor on same calendar day is free (base_amount 0.00)
  - Intensivist visit while patient in ICU is free (covered by ICU rounds)
  - For category occupied at visit time: GENERAL max 2 different doctors per day, further doctors free
  - Otherwise: fee x visit multiplier from categories.csv
  - Free visits: ledger lines with base_amount 0.00
  - 2-doctor limit applies per day per category
- **Trigger**: VISIT command
- **Required system behavior**:
  - Track doctors visited per patient per calendar day
  - Apply FREE rules in priority order: same doctor later visit, intensivist visit in ICU, category limit
  - Charge based on visit multiplier for first-time doctors within limit
- **Boundary conditions**: Visit at same timestamp as previous visit, visit at midnight boundary, category change during day
- **Relevant sample-data evidence**: EC-04, See commands.txt visit patterns
- **Planned test evidence**: Week 0 baseline, Week 2 visit charging, Week 3 doctor visit verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 270-271, categories.csv

## BR-06: Package fixed price
- **Rule ID**: BR-06
- **Rule name**: Package fixed price
- **Complete requirement**:
  - Fixed price for package duration (los_days)
  - Package price posted at DISCHARGE as PACKAGE line (not in running bill)
  - Covered heads: list of heads in covered_heads except exclusions
  - Exclusions: itemised on top, item in exclusions billed itemised even if in covered_heads
  - Package converts when non-included PROCEDURE/OT command occurs
  - Conversion: every covered line gets REPRICE line at conversion time
  - Beyond-LOS bed days (above los_days) billed at package category's bed + nursing rate
  - Package not active during UPGRADE_FREE (ICU multipliers follow occupied category)
  - Package converts when ICU time exceeds 48:00:00 (ICU time counted at 08:00 anchor)
  - Exactly 48:00:00 does NOT convert
- **Trigger**: ADMISSION with package_code, non-included procedure/OT during stay, ICU time threshold, DISCHARGE
- **Required system behavior**:
  - Track package coverage for stay duration
  - Generate PACKAGE line at discharge (separate from running bill)
  - Handle package conversion and repricing
  - Bill beyond-LOS at package category rates
- **Boundary conditions**: Non-included procedure/OT, exact 48:00:00 ICU time, beyond-LOS calculation
- **Relevant sample-data evidence**: EC-05, packages.csv, all package admissions
- **Planned test evidence**: Week 0 baseline, Week 2 package coverage, Week 3 package conversion
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 269-277, packages.csv

## BR-07: Deposit threshold, top-up demands and procedure blocking
- **Rule ID**: BR-07
- **Rule name**: Deposit threshold, top-up demands and procedure blocking
- **Complete requirement**:
  - Admission deposit: 25% of package price for package admissions, else 2 x requested category's bed charge + Rs 10,000
  - Running bill: sum of net of all ledger lines posted (after discounts, including GST, excluding charity and package price)
  - 80% test: after every posted line (except DISCHARGE lines) except package price
  - Average daily charge: BR-07a (see detailed requirements below)
  - First demand at 80% threshold, raised at charge event timestamp
  - Only one OPEN demand at a time
  - 48-hour deadline for first demand
  - DEPOSIT satisfies demand when cumulative deposits after demand timestamp >= demand amount
  - If first demand still OPEN at exactly 48 hours and bill still above 80%, second demand and PROCEDURE_BLOCK
  - Non-emergency PROCEDURE/OT rejected with TOPUP_BLOCK during block
  - Emergency procedures (emergency=true) accepted and billed during block
  - Block lifts when both open demands closed, deposits since first demand >= sum of both demands
- **Trigger**: Every charge event (except DISCHARGE, package price), every DEPOSIT command
- **Required system behavior**:
 �ือด-064 implementation, Week 3 demand lifecycle
- **Boundary conditions**: exactly 80% (no demand), exactly 48 hours (block condition), partial deposits, emergency vs non-emergency
- **Relevant sample-data evidence**: EC-06, demands.csv, admissions with package vs itemised
- **Planned test evidence**: Week 0 baseline, Week 2 demand logic, Week 3 BR-07a/b verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 152-164, BR-07a, BR-07b

## BR-07a: Average daily charge calculation
- **Rule ID**: BR-07a
- **Rule name**: Average daily charge calculation
- **Complete requirement**:
  - Average daily charge = total charges posted in last three calendar days (including current day)
  - Divide by number of those days that have at least one charge line
  - Do not wait for three days: one or two charge-bearing days sufficient
  - Current partial day counts as full day in denominator if it has any charge
  - Round demand amount upward to nearest Rs 100
- **Trigger**: When demand raised (BR-07)
- **Required system behavior**:
  - Track charges posted per calendar day
  - Calculate average across available charge-bearing days
  - Round up to nearest 100
- **Boundary conditions**: One charge-bearing day, two charge-bearing days, current day with no charges
- **Relevant sample-data evidence**: EC-06 ADM-0038
- **Planned test evidence**: Week 0 baseline, Week 3 BR-07a implementation
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 152, BR-07a official clarification

## BR-07b: Top-up demand and procedure block lifecycle
- **Rule ID**: BR-07b
- **Rule name**: Top-up demand and procedure block lifecycle
- **Complete requirement**:
  - Point 1: A demand is raised at the charge event that takes the running bill strictly above 80% of total deposits. The demand timestamp is the charge-event timestamp.
  - Point 2: Only one OPEN demand exists at a time. Re-evaluate the 80% threshold after the open demand closes or 48 hours have elapsed.
  - Point 3: A DEPOSIT command satisfies a demand when cumulative deposits received after its timestamp are at least the demand amount. Partial deposits reduce the outstanding amount but do not close it.
  - Point 4: If the first demand is still OPEN at exactly 48 hours or later, and the running bill remains above 80%, raise the second demand and enter PROCEDURE_BLOCK.
  - Point 5: While blocked, non-emergency PROCEDURE and OT commands are rejected with TOPUP_BLOCK and recorded in the rejection log. Emergency procedures are accepted and billed. Bed, nursing, doctor, pharmacy, consumables and investigation charges continue.
  - Point 6: The block lifts when both open demands are closed, with cumulative deposits since the first demand timestamp at least equal to the sum of both demand amounts.
  - Point 7: Exactly 80% does not raise a demand. Exactly 48 hours triggers the block condition.
- **Trigger**: Running bill crosses 80% threshold, first demand closes, 48-hour deadline, deposits sufficient
- **Required system behavior**:
  - Raise first demand on crossing 80% threshold
  - Track single OPEN demand lifecycle
  - Raise second demand at 48-hour deadline if still above 80%
  - Block non-emergency procedures/OT during block
  - Allow emergency procedures during block
  - Lift block when both demands closed and sufficient deposits
- **Boundary conditions**: Exactly 80% (no demand), exactly 48 hours (block condition), partial deposits, emergency vs non-emergency
- **Relevant sample-data evidence**: EC-06, demands.csv ADM-0023
- **Planned test evidence**: Week 0 baseline, Week 3 BR-07b implementation
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 152, BR-07b official clarification

## BR-08: Senior citizen, employee referral and charity discounts
- **Rule ID**: BR-08
- **Rule name**: Senior citizen, employee referral and charity discounts
- **Complete requirement**:
  - Senior: completed age >= 60 on admission date (60th birthday on admission date counts). 10% on BED and NURSING lines only.
  - Employee referral: 15% on DOCTOR lines (visits and ICU rounds) when employee_referral = true in admissions.csv.
  - Charity: at most one per admission. Charity discount pct <= 50 with non-empty CEO reference. Amount = pct x sum(gross - line discount) over all heads except PHARMACY and CONSUMABLE (PACKAGE included). Applied on final bill only. Does not change GST.
- **Trigger**: DISCHARGE (final bill calculation)
- **Required system behavior**:
  - Apply senior discount to BED and NURSING lines at discharge
  - Apply employee referral discount to DOCTOR lines during stay
  - Apply charity discount at final bill (DISCHARGE)
- **Boundary conditions**: Senior at exactly 60, employee referral flag, charity pct <= 50, CEO reference required
- **Relevant sample-data evidence**: See EC-06 ADM-0010 (employee), EC-07 ADM-0030 (senior), EC-08 charity rejection
- **Planned test evidence**: Week 0 baseline, Week 2 employee discount, Week 3 charity discount
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 275-276

## BR-09: Interim billing, seven-day cycle, event locking and corrections
- **Rule ID**: BR-09
- **Rule name**: Interim billing, seven-day cycle, event locking and corrections
- **Complete requirement**:
  - Manual interim bill: INTERIM_BILL command locks all lines posted so far
  - Automatic interim bills: at admit + 7 days, + 14 days, ... while admitted (7-day cycle)
  - CORRECTION for PHARMACY/CONSUMABLE/INVESTIGATION events only
  - Unlocked event: corrected in place (qty and amounts change, event_ts unchanged)
  - Locked event: ADJ line with qty = new - current, description = "ADJUSTMENT"
  - Event can be corrected if not locked by interim bill
- **Trigger**: INTERIM_BILL, CORRECTION command
- **Required system behavior**:
  - Generate automatic interim bills at 7-day intervals
  - Lock lines with manual interim bill
  - Allow correction of unlocked events
  - Create ADJ line for locked events
- **Boundary conditions**: Locked vs unlocked events, exact correction timing, interim bill timing
- **Relevant sample-data evidence**: EC-08 ADM-0028, interim_bills.csv
- **Planned test evidence**: Week 0 baseline, Week 3 interim bill verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 277-278

## BR-10: Final discharge bill, payment gate, refunds, early discharge condition and LAMA/DAMA handling
- **Rule ID**: BR-10
- **Rule name**: Final discharge bill, payment gate, refunds, early discharge condition and LAMA/DAMA handling
- **Complete requirement**:
  - Final bill: gross per head, minus senior/employee/charity discounts, plus GST, rounded half-up to rupee
  - Payment gate: DEPOSIT FULL at discharge settles bill
  - Refunds: balance_due > 0, refund_due < 0
  - Early discharge: before 10:00 with order issued previous day avoids extra bed day
  - LAMA: billed identically to NORMAL, tagged LAMA
  - DAMA: billed identically to NORMAL, tagged DAMA
- **Trigger**: DISCHARGE command
- **Required system behavior**:
  - Calculate final bill with all discounts and GST
  - Apply payment gate (DEPOSIT FULL) to settle
  - Generate balance_due or refund_due
  - Handle discharge type tagging
- **Boundary conditions**: Discharge type, payment timing, balance vs refund
- **Relevant sample-data evidence**: See EC-06 discharge payments, EC-08 LAMA DAMA
- **Planned test evidence**: Week 0 baseline, Week 3 final bill verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 278-279

## BR-11: GST threshold and eligible room-charge base, including discount interaction
- **Rule ID**: BR-11
- **Rule name**: GST threshold and eligible room-charge base, including discount interaction
- **Complete requirement**:
  - 5% GST on BED line when (gross - discount) > 5,000.00 for that bed day
  - Never on nursing or other heads
  - ICU bed rate 4,800.00, so ICU days carry no GST
  - GST calculated on (gross - discount_amt) for BED lines
  - Discount applied before GST calculation
- **Trigger**: BED line generation
- **Required system behavior**:
  - Check (gross - discount_amt) threshold for each BED line
  - Apply 5% GST if above threshold
  - No GST for nursing/consumable/procedure heads
- **Boundary conditions**: Threshold comparison, senior discount interaction, ICU rate
- **Relevant sample-data evidence**: EC-07 ADM-0019 (no GST), EC-07 ADM-0020 (GST)
- **Planned test evidence**: Week 0 baseline, Week 3 GST verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 276, BR-11 in assignment

## BR-12: Bed hold, housekeeping clearance and reservation expiry
- **Rule ID**: BR-12
- **Rule name**: Bed hold, housekeeping clearance and reservation expiry
- **Complete requirement**:
  - RESERVE_BED: hold bed of requested category until planned_admit_ts + 6:00:00
  - Bed held until ADMIT (which uses it) or planned + 6:00:00 release
  - Release at exactly ADMIT time happens first
  - After DISCHARGE: bed stays HOUSEKEEPING until HOUSEKEEPING_CLEARED
  - Available only after HOUSEKEEPING_CLEARED
- **Trigger**: RESERVE_BED, HOUSEKEEPING_CLEARED
- **Required system behavior**:
  - Hold bed during reservation period
  - Release at planned time or admission time
  - Hold bed in HOUSEKEEPING after discharge
  - Make available after housekeeping cleared
- **Boundary conditions**: Exact timing, release at admission, hold expiry
- **Relevant sample-data evidence**: See EC-04 reservation, commands.txt RESERVE_BED
- **Planned test evidence**: Week 0 baseline, Week 3 reservation verification
- **Status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 267-269

## Summary

- **Total business rules**: 12 (BR-01 through BR-12)
- **Rules with official clarifications**: BR-07a, BR-07b
- **Rules with detailed interpretation notes**: BR-07a/b, BR-11 (GST threshold)
- **Rules with edge case dependencies**: All rules have EC references
- **Status**: All NOT IMPLEMENTED — WEEK 0 (foundation phase)