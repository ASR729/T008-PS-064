# Five-Minute Demonstration Script — PS-064 Team T008

**Project:** Hospital Inpatient Billing and Bed Management Engine  
**Team:** T008  
**Demo duration:** Approximately 5 minutes  
**Recording status:** Script prepared — video recording BLOCKED (environment cannot record video)  
**Suggested video path:** `docs/week-4/final-submission/demo/PS-064-final-demo.mp4` (create only after team records)

---

## Demonstration Structure

| Time | Section | Demonstration |
|------|---------|---------------|
| 0:00–0:30 | Project introduction and problem statement | Purpose, technology, architecture, team |
| 0:30–1:00 | Architecture and technology | Layered architecture, modules, Decimal arithmetic, determinism |
| 1:00–2:00 | Admission and bed allocation | Load master data, ADMIT command, bed allocation, gender/upgrade-free |
| 2:00–3:00 | Charges, package or transfer behaviour | Charge events, category-at-event pricing, transfers, ICU step-down |
| 3:00–4:00 | Billing, deposits, demands and settlement | Deposits, top-up demand, procedure blocking, discharge, final bill |
| 4:00–4:40 | Official sample execution and reconciliation | Run tests, run reconciliation, show 42/42 result |
| 4:40–5:00 | Tests and conclusion | Test suite, GitHub, limitations, Q&A readiness |

---

## 0:00–0:30 — Project Introduction and Problem Statement

**Commands to run:**
```powershell
# Show project structure
Get-ChildItem -Recurse -Depth 2 | Where-Object { $_.Name -match 'src|tests|docs|data|scripts' }

# Show README introduction
Get-Content README.md -Head 40
```

**What to say:**
"PS-064 is the Hospital Inpatient Billing and Bed Management Engine, a capstone project by Team T008. It's a command-file-driven Python backend that simulates hospital inpatient operations — admissions, bed allocation, charge events, package management, deposits, discounts, GST, interim billing, and discharge settlement. All monetary calculations use Decimal with ROUND_HALF_UP, and the engine is deterministic: same inputs, same outputs."

**Edge case to note:** Admission at 11:59 vs exactly 12:00 noon — bed-day counting differs.

---

## 0:30–1:00 — Architecture and Technology

**Commands to run:**
```powershell
# Show architecture overview from README
Get-Content README.md -Head 120 | Select-Object -Last 60

# Show source tree
Get-ChildItem src/billing_engine -Recurse | Where-Object { !$_.PSIsContainer } | Select-Object Name
```

**What to say:**
"The engine uses a layered architecture: command processing, business services, domain models, and data access. It's pure Python standard library — no external dependencies. All money uses Decimal with ROUND_HALF_UP. Charges use category-at-event pricing — the category occupied at event time, not the current category."

---

## 1:00–2:00 — Admission and Bed Allocation

**Commands to run:**
```powershell
python -c "
from src.billing_engine.loaders import MasterDataLoader
from src.billing_engine.commands import CommandProcessor

loader = MasterDataLoader()
loader.load_all()
print(f'Categories: {len(loader.categories)}')
print(f'Beds: {len(loader.beds)}')
print(f'Doctors: {len(loader.doctors)}')
print(f'Tariffs: {len(loader.tariffs)}')
print(f'Packages: {len(loader.packages)}')
print(f'Admissions: {len(loader.admissions)}')
"

# Process an ADMIT command
python -c "
from src.billing_engine.commands import CommandProcessor
from src.billing_engine.loaders import MasterDataLoader

loader = MasterDataLoader()
loader.load_all()
processor = CommandProcessor(loader)

cmd = 'ADMIT\|2026-01-15 10:00:00\|ADM-0001\|15000.00\|CASH'
parsed = processor.parse_command(cmd, 1)
result = processor.process_command(parsed)
print(f'ADMIT result: success={result.success}, error={result.error_code}')
"
```

**Edge case to demonstrate:** Admission at 11:59 vs exactly 12:00 noon — show how bed-day counting differs (EC-01).

---

## 2:00–3:00 — Charges, Package or Transfer Behaviour

**Commands to run:**
```powershell
python -c "
from src.billing_engine.commands import CommandProcessor
from src.billing_engine.loaders import MasterDataLoader

loader = MasterDataLoader()
loader.load_all()
processor = CommandProcessor(loader)

# Process TRANSFER command
cmd = 'TRANSFER\|2026-01-15 14:00:00\|ADM-0001\|SEMI_PRIVATE\|DOC-03'
parsed = processor.parse_command(cmd, 2)
result = processor.process_command(cmd, 2)
print(f'TRANSFER result: success={result.success}, error={result.error_code}')

# Process STEP_DOWN command
cmd = 'STEP_DOWN\|2026-01-15 15:00:00\|ADM-0001\|GENERAL\|DOC-03'
parsed = processor.parse_command(cmd, 3)
result = processor.process_command(cmd, 3)
print(f'STEP_DOWN result: success={result.success}, error={result.error_code}')
"

# Process PHARMACY and PROCEDURE commands
python -c "
from src.billing_engine.commands import CommandProcessor
from src.billing_engine.loaders import MasterDataLoader

loader = MasterDataLoader()
loader.load_all()
processor = CommandProcessor(loader)

cmd = 'PHARMACY\|2026-01-15 10:30:00\|ADM-0001\|EV-00001\|PHM-015\|3'
parsed = processor.parse_command(cmd, 4)
result = processor.process_command(cmd, 4)
print(f'PHARMACY result: success={result.success}')

cmd = 'PROCEDURE\|2026-01-15 11:00:00\|ADM-0001\|EV-00002\|PRC-001\|DOC-11\|false'
parsed = processor.parse_command(cmd, 5)
result = processor.process_command(cmd, 5)
print(f'PROCEDURE result: success={result.success}, error={result.error_code}')
"
```

**What to show:** TRANSFER to SEMI_PRIVATE, then STEP_DOWN to GENERAL. Show that TRANSFER out of ICU without STEP_DOWN is rejected. Show category-at-event pricing — same procedure code costs different amounts depending on category at event time.

---

## 3:00–4:00 — Billing, Deposits, Demands and Settlement

**Commands to run:**
```powershell
python -c "
from src.billing_engine.commands import CommandProcessor
from src.billing_engine.loaders import MasterDataLoader

loader = MasterDataLoader()
loader.load_all()
processor = CommandProcessor(loader)

# Show demand status
for d in processor.demand_service.demands:
    if d.admission_id == 'ADM-0023':
        print(f'Demand: {d.demand_id}, status={d.status}, amount={d.demand_amount}')
"

# Process DISCHARGE command
python -c "
from src.billing_engine.commands import CommandProcessor
from src.billing_engine.loaders import MasterDataLoader

loader = MasterDataLoader()
loader.load_all()
processor = CommandProcessor(loader)

cmd = 'DISCHARGE\|2026-01-16 10:00:00\|ADM-0001\|NORMAL\|2026-01-15 10:00:00'
parsed = processor.parse_command(cmd, 6)
result = processor.process_command(cmd, 6)
print(f'DISCHARGE result: success={result.success}')

admission = loader.admissions.get('ADM-0001')
print(f'Final bill: {admission.final_bill}')
print(f'Balance due: {admission.balance_due}')
print(f'Status: {admission.admission_status}')
"
```

**Edge case to demonstrate:** Top-up procedure blocking with emergency exception:
1. Show PROCEDURE rejected with TOPUP_BLOCK code
2. Show same procedure accepted when emergency=true

---

## 4:00–4:40 — Official Sample Execution and Reconciliation

**Commands to run:**
```powershell
# Run all tests
python -m pytest tests/ -q

# Run official sample execution and reconciliation
python scripts/run_reconciliation.py

# Show GitHub status
git log --oneline -5
git status --short --branch
```

**What to show:** All 75 tests passing, reconciliation results (42/42 matched, 10,223/10,223 fields), clean Git history with week-by-week commits.

---

## 4:40–5:00 — Tests and Conclusion

**Commands to run:**
```powershell
# Show test breakdown
python -m pytest tests/ -v --tb=no 2>&1 | Select-Object -Last 10

# Show reconciliation summary
python scripts/run_reconciliation.py | Select-Object -First 8
```

**What to say:**
"The PS-064 engine achieves 42/42 official output file matches, 10,223/10,223 fields matched, and 75/75 tests passing. All 12 business rules plus BR-07a/b and all 8 edge cases are verified. The project is ready for evaluator review."

---

## Demo Recording Checklist

| Item | Status | Notes |
|------|--------|-------|
| Terminal text readable | — | Use large font, high contrast |
| Narration understandable | — | Speak clearly, explain each step |
| Real application behavior | — | No mocking, use actual commands |
| Two edge cases shown | — | Noon boundary + TOPUP_BLOCK emergency |
| Tests and reconciliation shown | — | pytest output + reconciliation script |
| ~5 minutes duration | — | Practice timing beforehand |
| No personal credentials | — | Verify no .env, tokens, or secrets |
| Backup recording plan | — | Have secondary recording method ready |

---

## Environment Cannot Record Video

The current environment does not have video recording capability. To record the demo:

1. Use OBS Studio, Loom, or similar screen recording software
2. Follow the demo script above
3. Practice the sequence twice before recording
4. Save the recording as MP4, approximately 5 minutes
5. Upload to a shareable location (YouTube unlisted, Google Drive, etc.)
6. Add the video link to `docs/week-4/final-submission/submission-email.md`

**BLOCKED:** Video recording cannot be performed in this environment. Prepare the script and provide recording instructions to the team. Do not treat the script or checklist as a recorded video. Do not invent a video URL.

---

## Fallback if a Live Command Fails

If any command fails during the live demonstration:
1. Have a pre-recorded terminal output screenshot/text ready
2. Explain what the command does and what output is expected
3. Move to the next section and return if time permits
4. The 42/42 reconciliation and 75/75 tests are reproducible and can be shown from prepared output

---