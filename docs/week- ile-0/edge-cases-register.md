# Edge Cases Register - PS-064

This register documents all 8 official edge-case groups (EC-01 through EC-08) as specified in the official assignment and README. Each edge case includes complete requirements and evidence from the sample data.

## EC-01: Admission at 11:59 versus 12:00 noon
- **Edge Case ID**: EC-01
- **Edge Case name**: Admission at 11:59 versus 12:00 noon
- **Triggering input/condition**:
  - ADM-0001: GENERAL admission at 11:59:00 (noon counted)
  - ADM-0002: GENERAL admission at exactly 12:00:00 (noon not counted)
- **Expected behavior**:
  - Admission before noon (11:59:00) counts that day's noon as bed day
  - Admission at exactly noon (12:00:00) does NOT count that noon
  - First bed day for ADM-0001: 2026-10-02 12:00
  - First bed day for ADM-0002: 2026-10-03 12:00 (next noon)
- **Sample command reference**: commands.txt line 3 (ADM-0001), commands.txt line 10 (ADM-0002)
- **Future test**: Verify ledger_ADM-0001.csv has BED line at 2026-10-02 12:00, ledger_ADM-0002.csv has first BED line at 2026-10-03 12:00
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 137-139

## EC-02: Discharge at exactly 14:00
- **Edge Case ID**: EC-02
- **Edge Case name**: Discharge at exactly 14:00
- **Triggering input/condition**:
  - ADM-0008: discharge at exactly 14:00:00 (no extra bed day)
  - ADM-0010: discharge at 15:10:00 (after 14:00, extra bed day)
  - ADM-0019: discharge at 14:30:00 (after 14:00, extra bed day)
- **Expected behavior**:
  - Discharge after 14:00:00 strictly adds one extra bed day
  - Discharge at exactly 14:00:00 or exactly 10:00:00 adds nothing
  - Extra bed day uses category (and UPGRADE_FREE rate if still in window) at discharge
- **Sample command reference**: commands.txt line 158 (ADM-0008), commands.txt line 251 (ADM-0010), commands.txt line 378 (ADM-0019)
- **Future test**: Verify ADM-0008 has no extra bed day at discharge, ADM-0010 and ADM-0019 each have extra bed day
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 140-143

## EC-03: Stay of 23 hours 59 minutes across two noon counts
- **Edge Case ID**: EC-03
- **Edge Case name**: Stay of 23 hours 59 minutes across two noon counts
- **Triggering input/condition**:
  - ADM-0005: admitted 2026-10-05 12:00:00, discharged 2026-10-06 11:59:00 (23 h 59 min)
  - Touches two noons but counts none
  - Under-24-hour minimum applies
- **Expected behavior**:
  - Noon at admission (2026-10-05 12:00:00) not counted (not before 12:00)
  - Next noon (2026-10-06 12:00:00) not reached
  - So 0 noon counts
  - 1-day minimum applied at discharge
- **Sample command reference**: commands.txt lines 35 and 72
- **Future test**: Verify ADM-0005 has exactly 1 bed day total (the minimum at discharge)
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 144-146

## EC-04: Upgrade-free window ending mid-day and the next noon count
- **Edge Case ID**: EC-04
- **Edge Case name**: Upgrade-free window ending mid-day and the next noon count
- **Triggering input/condition**:
  - ADM-0020: PRIVATE requested at 2026-10-12 09:30:00 while all PRIVATE beds occupied
  - Allocated DELUXE bed at PRIVATE rate (UPGRADE_FREE)
  - Window ends mid-morning (admit + 48:00:00 = 2026-10-14 09:30:00)
  - Next noon (2026-10-14 12:00:00) billed at DELUXE rate with 5% GST
- **Expected behavior**:
  - UPGRADE_FREE window: bed charged at requested category rate for 48 hours
  - Next counting instant (noons) uses occupied category rate
  - DELUXE rate 5,500 with 5% GST = 275 per bed day
- **Sample command reference**: commands.txt line 274
- **Future test**: Verify ADM-0020 has BED lines at DELUXE rate with GST starting at 2026-10-14 12:00
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 147-148

## EC-05: Package stay where ICU is exactly 48 hours
- **Edge Case ID**: EC-05
- **Edge Case name**: Package stay where ICU is exactly 48 hours
- **Triggering input/condition**:
  - ADM-0026: package PKG-PTCA, ICU from 2026-10-15 13:00:00 to STEP_DOWN at 2026-10-17 13:00:00 = exactly 48:00:00
  - NOT more than 48 h, so package NOT converted
  - Bed days 4 and 5 exceed 3-day LOS and billed at PRIVATE bed + nursing rate
- **Contrast case ADM-0031**: package PKG-TKR with ICU > 48 h (converts)
- **Expected behavior**:
  - Exactly 48:00:00 ICU time does NOT convert package
  - > 48:00:00 ICU time converts package at instant 48:00:00 was reached
  - Beyond-LOS bed days billed at package category rate
- **Sample command reference**: commands.txt lines 420 and 475 (ADM-0026), commands.txt lines 614, 717 (ADM-0031)
- **Future test**: Verify ADM-0026 package stays ACTIVE, ADM-0031 package converts at 2026-10-24 14:00
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 149-151

## EC-06: Running bill at exactly 80% of deposits
- **Edge Case ID**: EC-06
- **Edge Case name**: Running bill at exactly 80% of deposits
- **Triggering input/condition**:
  - ADM-0023: running bill crosses 80% of Rs 19,600 deposit on NURSING line at 2026-10-14 08:00
  - ADM-0038: deposit Rs 12,500, after PHARMACY EV-00649 running bill = Rs 10,000.00 = 80.00%
  - No demand raised (exactly 80%)
  - Next charge (line 812) takes it to Rs 10,124.80 (above 80%) -> demand raised
- **Expected behavior**:
  - Exactly 80% threshold does NOT raise demand
  - Above 80% raises demand (BR-07a average daily charge calculation)
  - BR-07a: average of 3 days (2,850 + 4,750 + 124.80) / 3 = 2,574.93 -> Rs 2,600 (rounded up)
  - DEPOSIT of exactly Rs 2,600 closes demand
- **Sample command reference**: demands.csv ADM-0023-TD1, commands.txt lines 805, 812, 813
- **Future test**: Verify ADM-0023 first demand raised at line 8, ADM-0038 no demand at line 805, demand at line 812
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 151-153

## EC-07: Room charge exactly Rs 5,000 per day (no GST) and Rs 5,000 after a senior discount on a Rs 5,500 room
- **Edge Case ID**: EC-07
- **Edge Case name**: Room charge exactly Rs 5,000 per day (no GST) and Rs 5,000 after a senior discount on a Rs 5,500 room
- **Triggering input/condition**:
  - ADM-0019: PRIVATE room at exactly Rs 5,000.00 per day — not ABOVE 5,000, so gst_amt = 0.00
  - ADM-0020: after UPGRADE_FREE window DELUXE room billed at Rs 5,500 — above 5,000, so 5% GST = 275.00 per bed day
  - ADM-0030: DELUXE Rs 5,500 room for senior — after 10% senior discount = Rs 4,950 (not above 5,000) so no GST
- **Expected behavior**:
  - GST applies only when (gross - discount) > 5,000.00 for BED line
  - Senior discount applied before GST threshold calculation
  - 5,500 - 10% = 4,950 < 5,000, so no GST
- **Sample command reference**: commands.txt line 257 (ADM-0019), commands.txt line 547 (ADM-0030)
- **Future test**: Verify ADM-0019 BED lines have gst_amt = 0.00, ADM-0020 BED lines have gst_amt = 275.00, ADM-0030 BED lines have gst_amt = 0.00
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 154-157

## EC-08: Correction to an event already included in an interim bill
- **Edge Case ID**: EC-08
- **Edge Case name**: Correction to an event already included in an interim bill
- **Triggering input/condition**:
  - ADM-0028: PHARMACY event EV-00435 (2026-10-20 09:20:00) locked by manual INTERIM_BILL at 2026-10-21 18:00:00
  - CORRECTION (qty 3 -> 1) must post signed adjustment line dated correction time
  - Not edit locked line
  - Contrast: UNLOCKED event corrected in place
- **Expected behavior**:
  - Locked event: ADJ line with qty = new - current, event_ts = correction time
  - Unlocked event: corrected in place, event_ts unchanged
- **Sample command reference**: commands.txt lines 535, 583, 648
- **Future test**: Verify ADM-0028 has ADJ line for EV-00435, verify original line remains unchanged
- **Week 0 implementation status**: NOT IMPLEMENTED — WEEK 0
- **Source reference**: SRC-006 README.md line 158-160

## Summary

- **Total edge cases**: 8 (EC-01 through EC-08)
- **Cases with BR-07 reference**: EC-06 (BR-07a/b)
- **Cases with multiple scenarios**: EC-02 (ADM-0008, ADM-0010, ADM-0019)
- **Cases with conversion**: EC-05 (package conversion vs no conversion)
- **Cases with locked events**: EC-08 (interim bill locking)
- **Week 0 implementation status**: All NOT IMPLEMENTED — WEEK 0