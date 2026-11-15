# Team Responsibility Matrix — PS-064 Team T008

**Project:** Hospital Inpatient Billing and Bed Management Engine  
**Date:** 2026-11-15  
**Repository:** https://github.com/ASR729/T008-PS-064.git  
**Commit:** `4bcca54` (Week 4 correction, verified 42/42)

---

## Verified Git Contributions

All 9 commits in the repository are authored by a single person:

| Commit | SHA (short) | Message | Author |
|--------|-------------|---------|--------|
| 4bcca54 | 4bcca54 | fix: resolve Week 4 defects and achieve 42/42 official output reconciliation | Asif <asifrahman7865@gmail.com> |
| 5d463d8 | 5d463d8 | docs: finalize PS-064 Week 4 submission and evaluator materials | Asif |
| c1599de | c1599de | feat: complete PS-064 Week 3 business rules and validation | Asif |
| 2c3b306 | 2c3b306 | Add Week 2 core implementation (billing engine) | Asif |
| 7e6b375 | 7e6b375 | Correct Week 0 verification report with actual file counts | Asif |
| 92ab35b | 92ab35b | Add Week 1 design documents (domain model, business rules, edge cases) | Asif |
| 5ca4d21 | 5ca4d21 | Add Week 1 design package (scope and glossary) | Asif |
| 62e0d33 | 62e0d33 | Add Week 0 documentation and sample data | Asif |
| 7269551 | 7269551 | Initial commit: PS-064 Week 0 project baseline | Asif |

**Command used:** `git log --format="%an <%ae> | %h | %s"`

**Finding:** No commits are attributable to Asher Vidukumar in the git history. All source code, documentation, defect correction, and GitHub pushes are verifiably by Asifur Rahman.

---

## Team Responsibility Matrix

| Responsibility | Asher Vidukumar | Asifur Rahman | Both | Evidence | Verification |
|---------------|----------------|---------------|------|----------|--------------|
| Domain models | Claimed | — | Claimed | `docs/week-4/viva-preparation.md` matrix; `README.md` §18 | NOT VERIFIABLE from git (0 commits by Asher) |
| Command processing | Claimed | Verified | Claimed | All 9 commits by Asif; `src/billing_engine/commands/__init__.py` | VERIFIED for Asif |
| Business services | Claimed | — | Claimed | `src/billing_engine/services/__init__.py` | NOT VERIFIABLE from git (0 commits by Asher) |
| Output generation | Claimed | Verified | Claimed | `scripts/reconcile_outputs.py`, `src/billing_engine/outputs/` | VERIFIED for Asif |
| Testing | Claimed | Verified | Claimed | `tests/` (75 tests, all passing); `conftest.py` | VERIFIED for Asif (test files in commits) |
| Documentation | Claimed | Verified | Claimed | `docs/` (all documentation commits by Asif) | VERIFIED for Asif |
| Git/GitHub | Claimed | Verified | Claimed | All commits pushed; `origin/master` = `4bcca54` SYNCED | VERIFIED for Asif |
| Demo preparation | Claimed | — | Claimed | `docs/week-4/demo-script.md`, `demo-recording-checklist.md` (untracked) | NOT VERIFIABLE from git |

### Verification key
- **VERIFIED for Asif:** Git commit history confirms Asif authored the relevant commits.
- **NOT VERIFIABLE from git (0 commits by Asher):** Asher is listed in the responsibility matrix but has no git commits; individual contributions require team confirmation.

---

## Team Member Details

| Detail | Asher Vidukumar | Asifur Rahman |
|--------|----------------|---------------|
| Git commits | 0 (none attributable) | 9 (all commits, Week 0–4) |
| Verifiable contributions | None from git | All source code, documentation, defect correction (42/42), Git/GitHub push |
| Unverifiable contributions | Domain models, business services, testing, documentation, demo prep (per matrix) | None |
| Team confirmation required? | YES | No |
| Viva readiness | Must explain full project; individual contributions unconfirmed | Can explain full implementation and Git history |
| Demo role | To be confirmed by team | To be confirmed by team |

---

## Demonstration Role

| Role | Assignee | Status |
|------|----------|--------|
| Demo recording | — | BLOCKED — environment cannot record video; team must record externally |
| Demo script | Team | Prepared (`docs/week-4/final-submission/demo-script.md`) |
| Demo presentation | To be confirmed by team | Both members prepared to explain full project |

---

## Viva Topics by Member

### Asher Vidukumar
Must be prepared to explain: domain models, business services, testing strategy, documentation, overall architecture. Individual contributions require team confirmation (no git evidence).

### Asifur Rahman
Must be prepared to explain: entire implementation (command processing, output generation, all services), architecture, testing, reconciliation (42/42), Git history, defect correction, and all 60 viva questions.

### Both Members
Both must be able to explain the overall project architecture, not only their assigned files. Live code modification exercises: both members must complete at least one independently.

---

## Gaps Requiring Team Confirmation

| Gap | Detail |
|-----|--------|
| Asher's individual contributions | No git commits attributable; responsibility matrix claims are self-reported |
| Demo recording | Not recorded (environment limitation); script and checklist prepared |
| Submission email | Draft prepared but not sent through official channel |

No individual contributions are fabricated in this document. All unverifiable claims are explicitly marked.