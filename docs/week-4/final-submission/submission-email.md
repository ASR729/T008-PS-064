# Final Submission Email Draft — PS-064 Team T008

**Do not send this email.** Prepare for team review and send through the required official submission channel.

---

**To:** [Recipient email — to be confirmed by official submission instructions]

**Subject:** T008 – Final Submission: PS-064 Hospital Inpatient Billing and Bed Management Engine

**From:** Team T008 (Asher Vidukumar, Asifur Rahman)

---

Dear Evaluator,

Please find below our final submission for the PS-064 Hospital Inpatient Billing and Bed Management Engine capstone project.

## Project Details

**Project Title:** PS-064 — Hospital Inpatient Billing and Bed Management Engine  
**Project Identifier:** PS-064 | Team T008  
**Team:** T008  
**Team Members:** Asher Vidukumar, Asifur Rahman  
**Organization:** 10 SECONDS  
**GitHub Repository:** https://github.com/ASR729/T008-PS-064.git  
**Final Commit:** `4bcca54`  
**Branch:** master  
**Python Version:** 3.10+ (tested on 3.14.5)  
**Dependencies:** Python standard library only (no pip install required)

## Verification Summary (Independently Verified)

| Criterion | Result |
|-----------|--------|
| Unit + integration tests | 75 passed, 0 failed |
| Official sample files | 42 expected, 42 generated, 42 matched |
| Output fields | 10,223 compared, 10,223 matched, 0 mismatches |
| Missing / extra files | 0 missing, 0 extra |
| Clean second execution | 42/42 matched (reproducible) |
| Business rules | BR-01 through BR-12, BR-07a, BR-07b — all PASS |
| Edge cases | EC-01 through EC-08 — all PASS |
| Official inputs unmodified | `git diff -- data/official/` empty |
| Git state | HEAD `4bcca54`; origin/master `4bcca54`; SYNCED |

## Deliverables

### Source Code
Complete Python backend engine with:
- Domain models (Patient, Doctor, Bed, Admission, ChargeEvent, LedgerEntry, etc.)
- Master data loader (CSV files)
- Command processor (16 command types)
- Business services (bed-day counting, pricing, transfers, packages, discounts, GST, demands, ledger)
- Billing, ledger, and output generation modules

### Tests
75 unit and integration tests, all passing:
```
python -m pytest tests/ -q
```

### Documentation
- `README.md` — Professional project overview, setup, usage, verification
- `docs/week-0/` — Week 0 baseline and requirements
- `docs/week-1/` — Week 1 design documents
- `docs/week-3/` — Week 3 implementation and verification
- `docs/week-4/` — Week 4 final submission materials
- `docs/final-audit/` — Complete Week 0–Week 4 audit (Prompt 1, phases 0–13)

### Diagrams
8 Mermaid diagrams covering domain/class, patient/admission lifecycle, bed lifecycle, command-processing, billing/ledger flow, package conversion, deposit/demand flow, discharge/settlement — plus rendered HTML viewers.

### Official Sample Data
- Input: `data/official/T008-PS-064-sample-data/` (included for reproducibility)
- Commands: 837 commands processed
- Expected outputs: 42 files (18 admissions visible)

## Demo Video

**Status:** Not recorded in this environment (no video-recording capability available).

A five-minute demonstration script and recording checklist are prepared at:
- `docs/week-4/final-submission/demo-script.md`
- `docs/week-4/final-submission/demo-recording-checklist.md`

The team will record the video externally (OBS Studio, Loom, or similar) and share the link through the official submission channel.

## Team Responsibility Summary

- **Asifur Rahman:** All source code commits (Week 0–4), documentation, defect correction (42/42), Git/GitHub push. Verifiable via git history (all 9 commits).
- **Asher Vidukumar:** Claimed responsibilities (domain models, business services, testing, documentation, demo prep) per team responsibility matrix; requires team confirmation (no git commits attributable).

See `docs/week-4/final-submission/team-responsibility-matrix.md` for details.

## Known Limitations

1. Demo video not recorded (environment limitation) — script and checklist prepared for external recording.
2. Official sources SRC-001–SRC-005 (assignment/support emails) not available locally.
3. Asher Vidukumar's individual contributions not verifiable from git history.
4. In-memory storage only; no web interface, GUI, or API server (per scope).

## Submission Package

The submission package (`submission/PS-064-T008-Final-Submission.zip`, if created) includes:
- `README.md`, `src/`, `tests/`, `scripts/`, `data/`, `docs/`, `.gitignore`

Excluded: `.git/`, `.venv/`, `__pycache__/`, `.pytest_cache/`, debug scripts, temporary files.

## Contact

For questions about this submission, please contact Team T008 through the official course channel.

---

**Submitted by:** Team T008  
**Date:** 2026-11-15  
**Commit:** `4bcca54`