# Demo Recording Checklist — PS-064 Team T008

**Team:** T008  
**Recording status:** BLOCKED (environment cannot record video)  
**Script:** `docs/week-4/final-submission/demo-script.md`  
**Suggested video path:** `docs/week-4/final-submission/demo/PS-064-final-demo.mp4` (create only after team records)

---

## Pre-Recording Checks

- [ ] Python 3.10+ installed and working
- [ ] Project cloned to clean directory
- [ ] `tests/` directory present with 75 tests
- [ ] `data/official/T008-PS-064-sample-data/` present
- [ ] `scripts/reconcile_outputs.py` present
- [ ] Terminal font size large enough (14pt+)
- [ ] Terminal background high contrast
- [ ] No personal files, tokens, or secrets visible
- [ ] Microphone tested and working
- [ ] Recording software configured (OBS, Loom, etc.)
- [ ] Output directory set (MP4, ~5 minutes)

---

## Recording Sequence

### 1. Project Introduction (0:00–0:30)
- [ ] Show project root directory
- [ ] Open README.md
- [ ] Explain purpose, technology, architecture, team

### 2. Architecture and Technology (0:30–1:00)
- [ ] Show layered architecture (README)
- [ ] Show source tree (src/billing_engine modules)
- [ ] Explain Decimal arithmetic and determinism

### 3. Master Data Loading (1:00–1:15)
- [ ] Run Python to load master data
- [ ] Show category, bed, doctor, tariff, package, admission counts

### 4. Admission and Bed Allocation (1:15–2:00)
- [ ] Process ADMIT command
- [ ] Show bed allocation result
- [ ] Edge case: Show 11:59 vs 12:00 noon admission (EC-01)

### 5. Charges, Transfers, ICU (2:00–3:00)
- [ ] Process PHARMACY command
- [ ] Process PROCEDURE command
- [ ] Process TRANSFER command
- [ ] Process STEP_DOWN command
- [ ] Show ICU step-down requirement
- [ ] Show category-at-event pricing difference

### 6. Billing, Deposits, Demands, Settlement (3:00–4:00)
- [ ] Show demand creation
- [ ] Edge case: Show TOPUP_BLOCK rejection
- [ ] Edge case: Show emergency procedure accepted
- [ ] Process DISCHARGE command
- [ ] Show final bill calculation
- [ ] Show balance due / refund due

### 7. Official Sample Execution and Reconciliation (4:00–4:40)
- [ ] Run `python -m pytest tests/ -q`
- [ ] Run `python scripts/run_reconciliation.py`
- [ ] Show `git log --oneline -5`
- [ ] Show clean Git status

### 8. Tests and Conclusion (4:40–5:00)
- [ ] Show test summary
- [ ] Show reconciliation summary (42/42, 10,223/10,223 fields)
- [ ] Conclude with project status and limitations

---

## Edge Cases to Demonstrate

| Edge Case | Command | Expected Result |
|-----------|---------|-----------------|
| Noon boundary | ADMIT at 11:59 vs 12:00 | Bed-day counting differs |
| TOPUP_BLOCK | PROCEDURE during open demand | Rejected with TOPUP_BLOCK |
| Emergency exception | PROCEDURE with emergency=true | Accepted despite block |

---

## Post-Recording Checks

- [ ] Video is approximately 5 minutes
- [ ] Terminal text is readable
- [ ] Narration is understandable
- [ ] Real application behavior shown
- [ ] Two edge cases included
- [ ] Tests and reconciliation shown at end
- [ ] No personal credentials exposed

---

## Video Storage

**Do not invent a video URL.** After recording:
1. Save as MP4
2. Upload to shareable location
3. Add link to `docs/week-4/final-submission/submission-email.md`
4. Update this checklist with the actual link

**Status:** BLOCKED — environment cannot record video. Team must record externally.