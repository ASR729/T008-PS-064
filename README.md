# PS-064 — Hospital Inpatient Billing and Bed Management Engine

**Team:** T008  
**Team Members:** Asher Vidukumar, Asifur Rahman  
**Organization:** 10 SECONDS  
**GitHub:** https://github.com/ASR729/T008-PS-064.git

---

## 1. Project Overview

The PS-064 Hospital Inpatient Billing and Bed Management Engine is a command-file-driven backend system that simulates hospital inpatient operations including patient admission, bed allocation, category transfers, ICU movement, charge event processing (doctor visits, procedures, OT, pharmacy, consumables, investigations), package management with conversion, deposit and top-up demand lifecycle, discounts, GST calculation, interim billing, discharge settlement, and bed lifecycle management.

The engine processes a command text file (`commands.txt`) and generates financial ledgers, final bills, top-up demands, rejections, interim bills, and bed occupancy snapshots in CSV format.

---

## 2. Problem Statement

Hospital inpatient billing involves complex business rules for:
- Bed-day counting with noon/ICU time anchors
- Bed allocation with gender restrictions and category upgrades
- Category transfers with limits and ICU step-down requirements
- Category-at-event pricing with category-specific multipliers
- Doctor visit charging with daily limits per category
- Package enrollment, ICU conversion, and retroactive repricing
- Deposit calculation and top-up demand lifecycle with procedure blocking
- Senior, employee referral, and charity discounts
- GST calculation on qualifying room charges
- Interim billing with event locking and corrections
- Final discharge settlement with refund obligations
- Bed lifecycle including reservations and housekeeping

---

## 3. Project Objectives

- Implement a complete command-file-driven billing engine
- Enforce all 12 business rules (BR-01 through BR-12) plus BR-07a and BR-07b
- Handle 8 edge cases (EC-01 through EC-08)
- Generate all required output files with exact official schemas
- Reconcile generated outputs against official expected outputs
- Provide comprehensive test coverage
- Prepare for capstone viva and live code modification

---

## 4. In-Scope and Out-of-Scope

### In-Scope
- Command parsing and validation (16 command types)
- Patient admission and bed allocation
- Category transfers and ICU step-down
- Charge event processing (BED, NURSING, DOCTOR, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION)
- Package management and conversion with retroactive repricing
- Deposit and top-up demand lifecycle with procedure blocking
- Discount application (senior, employee referral, charity)
- GST calculation on qualifying room charges
- Interim billing and locked-event corrections
- Final discharge settlement with refund calculation
- Bed lifecycle including reservations and housekeeping
- Output generation (ledgers, bills, demands, rejections, interim bills, occupancy)

### Out-of-Scope
- Web application or GUI
- Database server
- API server or payment gateway
- External cloud services
- Real-time processing

---

## 5. Implemented Capabilities

| Capability | Status | Details |
|------------|--------|---------|
| Command parsing | PASS | All 16 command types parsed and validated |
| Patient admission | PASS | ADMIT command with deposit validation and bed allocation |
| Bed allocation | PASS | Category-based, gender-restricted, with UPGRADE-FREE fallback |
| Category transfer | PASS | TRANSFER command with limits and ICU step-down |
| ICU movement | PASS | STEP_DOWN command for ICU discharge |
| Doctor visits | PASS | First-visit charging, daily limits, ICU intensivist |
| Procedures/OT | PASS | Category-at-event pricing, procedure blocking |
| Pharmacy/consumables | PASS | MRP-based pricing (1.00 multiplier) |
| Investigations | PASS | Category-specific multiplier |
| Package management | PARTIAL | Enrollment and conversion detection |
| Package conversion | PARTIAL | Retroactive repricing with REPRICE lines |
| Deposits | PASS | Admission and top-up deposits |
| Top-up demands | PASS | BR-07a averaging, BR-07b blocking, emergency exception |
| Discounts | PASS | Senior (10% bed/nursing), employee (15% doctor), charity (up to 50%) |
| GST | PASS | 5% on room charges above ₹5,000/day |
| Interim billing | PARTIAL | Manual and automatic 7-day cycles |
| Corrections | PARTIAL | Locked-event adjustments with ADJ lines |
| Discharge settlement | PARTIAL | Final bill with rounding, balance/refund |
| Bed lifecycle | PARTIAL | Reservations, housekeeping, occupancy snapshots |
| Output generation | PARTIAL | All output formats implemented |

---

## 6. Architecture Overview

The engine follows a layered architecture:

```
┌─────────────────────────────────────┐
│  Command Processor (commands/)      │
│  - Parsing, validation, execution   │
├─────────────────────────────────────┤
│  Domain Services (services/)        │
│  - Bed-day counting, pricing,       │
│  - Transfers, packages, discounts,  │
│  - GST, demands, ledger             │
├─────────────────────────────────────┤
│  Domain Models (models/)            │
│  - Patient, Doctor, Bed, Admission, │
│  - ChargeEvent, LedgerEntry, etc.   │
├─────────────────────────────────────┤
│  Master Data Loader (loaders/)      │
│  - CSV loading for categories,      │
│  - beds, doctors, tariffs, packages │
├─────────────────────────────────────┤
│  Billing (billing/), Ledger (ledger/),│
│  Outputs (outputs/)                 │
└─────────────────────────────────────┘
```

### Design Principles
- **Command-file driven**: All input via `commands.txt` with `COMMAND|timestamp|args` format
- **Decimal arithmetic**: All monetary calculations use `Decimal` with `ROUND_HALF_UP`
- **Category-at-event pricing**: Charges use the category occupied at event time, not current category
- **Deterministic**: Same inputs produce same outputs; command order preserved
- **No silent failures**: All rejected commands recorded with rejection codes

---

## 7. Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Python | 3.10+ |
| Testing | pytest | Latest |
| Data Format | CSV | UTF-8 |
| Command Format | Pipe-delimited text | - |

No external dependencies beyond Python standard library.

---

## 8. Repository Structure

```
T008-PS-064/
├── README.md
├── .gitignore
├── src/
│   └── billing_engine/
│       ├── __init__.py        # Package exports
│       ├── models/            # Domain models
│       ├── loaders/           # Master data CSV loading
│       ├── commands/          # Command parsing & processing
│       ├── services/          # Business rule services
│       ├── billing/           # Billing calculations
│       ├── ledger/            # Ledger management
│       └── outputs/           # Output serialization
├── tests/
│   ├── conftest.py            # Shared test fixtures
│   ├── unit/                  # Unit tests (63 tests)
│   └── integration/           # Integration tests (12 tests)
├── scripts/
│   └── reconcile_outputs.py   # Output reconciliation
├── data/
│   └── official/
│       └── T008-PS-064-sample-data/
│           ├── admissions.csv
│           ├── beds.csv
│           ├── categories.csv
│           ├── commands.txt
│           ├── doctors.csv
│           ├── packages.csv
│           ├── tariffs.csv
│           ├── README.md
│           └── expected_outputs/
├── docs/
│   ├── week-0/                # Week 0 baseline
│   ├── week-1/                # Week 1 design
│   ├── week-3/                # Week 3 implementation
│   ├── week-4/                # Week 4 final submission
│   └── progress/              # Progress tracking
└── build/                     # Generated outputs (gitignored)
```

---

## 9. Installation Instructions

### Prerequisites
- Python 3.10 or higher
- pip (Python package installer)

### Virtual Environment Setup

```powershell
# Create virtual environment
py -3.11 -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Verify Python version
python --version
```

### Dependency Installation

The project uses only Python standard library. No `pip install` is required.

```powershell
# Verify no external dependencies needed
python -c "import sys; print(sys.version)"
```

---

## 10. Official Sample Data

**Location:** `data/official/T008-PS-064-sample-data/`

**Files:**
- `admissions.csv` — 40 admission records
- `beds.csv` — 60 bed records across 5 categories
- `categories.csv` — 5 categories with rates and multipliers
- `commands.txt` — 837 commands for processing
- `doctors.csv` — 14 doctor records
- `packages.csv` — 6 package configurations
- `tariffs.csv` — 80 tariff items
- `README.md` — Official sample documentation (36,981 lines)
- `expected_outputs/` — Expected outputs for 18 visible admissions

---

## 11. Command-File Execution

### Format

Commands use pipe-delimited format: `COMMAND|timestamp|arg1|arg2|...`

Example:
```
ADMIT|2026-01-15 10:00:00|ADM-0001|15000.00|CASH
DISCHARGE|2026-01-16 10:00:00|ADM-0001|NORMAL|2026-01-15 10:00:00
```

### Execution

```powershell
# From the project root
python -c "
from src.billing_engine.commands import CommandProcessor
from src.billing_engine.loaders import MasterDataLoader

loader = MasterDataLoader()
loader.load_all()
processor = CommandProcessor(loader)
results = processor.process_commands_file('data/official/T008-PS-064-sample-data/commands.txt')

print(f'Successful: {results[\"successful\"]}')
print(f'Rejected: {results[\"rejected\"]}')
"
```

### Generated Outputs

Outputs are written to `build/official-sample-run/`:

| File | Description |
|------|-------------|
| `ledger_ADM-XXXX.csv` | Patient ledger for each visible admission |
| `bill_ADM-XXXX.csv` | Final bill for each discharged admission |
| `demands.csv` | Top-up demand records |
| `rejections.csv` | Rejected commands with codes |
| `interim_bills.csv` | Interim bill records |
| `bed_occupancy_*.csv` | Bed occupancy snapshots |

---

## 12. Test Execution

```powershell
# Run all tests
python -m pytest -q

# Run with verbose output
python -m pytest tests/ -v

# Run unit tests only
python -m pytest tests/unit/ -v

# Run integration tests only
python -m pytest tests/integration/ -v
```

**Expected Results:** 75 tests, all passing.

**Test Coverage:**
- BR-01: Bed-day counting (11 tests)
- BR-02: Bed allocation (12 tests)
- BR-03: Transfers and ICU (5 tests)
- BR-04: Category-at-event pricing (6 tests)
- BR-05: Doctor visits (9 tests)
- BR-06/07/08/11: Packages, demands, GST, discounts (14 tests)
- Integration: Sample workflow (12 tests)

---

## 13. Business-Rule Coverage Summary

| Rule | Description | Status | Tests |
|------|-------------|--------|-------|
| BR-01 | Bed-day counting (noon/ICU anchors) | IMPLEMENTED | 11 unit tests |
| BR-02 | Bed allocation & UPGRADE-FREE | IMPLEMENTED | 12 unit tests |
| BR-03 | Transfer & ICU movement | IMPLEMENTED | 5 unit tests |
| BR-04 | Category-at-event pricing | IMPLEMENTED | 6 unit tests |
| BR-05 | Doctor visit charging | IMPLEMENTED | 9 unit tests |
| BR-06 | Package management & conversion | PARTIAL | 4 unit tests |
| BR-07 | Deposit & top-up demands | IMPLEMENTED | 8 unit tests |
| BR-07a | Average daily charge & rounding | IMPLEMENTED | Included in BR-07 |
| BR-07b | Procedure blocking & emergency | IMPLEMENTED | Included in BR-07 |
| BR-08 | Discount rules | IMPLEMENTED | 3 unit tests |
| BR-09 | Interim billing & corrections | PARTIAL | Command handler + ledger |
| BR-10 | Final discharge settlement | PARTIAL | Command handler implemented |
| BR-11 | GST calculation | IMPLEMENTED | 4 unit tests |
| BR-12 | Bed lifecycle & housekeeping | PARTIAL | Reservation + housekeeping handlers |

---

## 14. Edge-Case Coverage Summary

| Case | Description | Status |
|------|-------------|--------|
| EC-01 | Admission timing (11:59 vs 12:00) | TESTED |
| EC-02 | Discharge timing (14:00, after) | TESTED |
| EC-03 | 23h59m stay minimum | TESTED |
| EC-04 | UPGRADE-FREE boundary | TESTED |
| EC-05 | Package ICU conversion | TESTED |
| EC-06 | Running bill 80% threshold | TESTED |
| EC-07 | GST ₹5,000 threshold | TESTED |
| EC-08 | Locked event correction | TESTED |

---

## 15. Official Sample Reconciliation Summary

The engine processes the official `commands.txt` (837 commands) and generates all required output files. Field-by-field reconciliation against official `expected_outputs/`:

- **Rejections:** 7/7 expected rejections match exactly (PASS)
- **Ledger files:** Partial match — bed-day counting and line ordering need refinement
- **Final bills:** Partial match — charge totals need verification
- **Demands:** Partial match — demand amounts need calibration
- **Interim bills:** Partial match — line locking scope needs adjustment
- **Occupancy snapshots:** Partial match — bed state tracking needs improvement

See `docs/week-4/final-test-and-reconciliation-report.md` for detailed reconciliation results.

---

## 16. Known Limitations

1. **Bed-day counting**: Bed-day lines may not be perfectly interleaved with charge events by timestamp in all cases
2. **Package conversion**: Retroactive repricing is partially implemented; REPRICE lines generated but may need refinement
3. **Interim billing**: Automatic 7-day cycle implemented; manual interim bill locking scope needs verification
4. **Discharge settlement**: Final bill calculation implemented; refund payment gate needs additional validation
5. **Bed lifecycle**: Reservation 6-hour expiry and housekeeping states implemented; occupancy snapshots need state-history tracking

---

## 17. Five-Minute Demonstration

A five-minute demonstration script is available at `docs/week-4/demo-script.md`. The demo covers:

1. Project overview and architecture (0:00–0:30)
2. Master data loading and admission/bed allocation (0:30–1:15)
3. Category transfer and ICU movement (1:15–2:00)
4. Charge events and billing (2:00–2:50)
5. Top-up demand and procedure blocking (2:50–3:40)
6. Discharge, settlement, and outputs (3:40–4:25)
7. Tests and reconciliation (4:25–5:00)

Edge cases demonstrated: admission at noon boundary, top-up procedure blocking with emergency exception.

---

## 18. Team Members and Responsibilities

| Member | Responsibility |
|--------|---------------|
| Asher Vidukumar | Domain modeling, business rules, testing |
| Asifur Rahman | Command processing, output generation, documentation |

Both members are prepared to explain the entire project during the viva.

---

## 19. GitHub Repository

**URL:** https://github.com/ASR729/T008-PS-064.git  
**Branch:** master  
**Commit History:** Week-by-week commits (Week 0 through Week 4)

---

## 20. License

Internal project — PS-064 Hospital Inpatient Billing and Bed Management Engine.
