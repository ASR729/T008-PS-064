# Source Register - PS-064 Hospital Inpatient Billing and Bed Management Engine

This register documents all official sources used for the PS-064 project, following the source precedence defined in the project requirements.

## Level 1 — Official assignment and official support decisions

### SRC-001 Official Capstone Project Assignment – Team T008 – PS-064
- **Source type**: Official assignment email
- **Status**: INSPECTION REQUIRED
- **Role**: Primary requirement specification
- **Missing content**: Not available locally
- **Authority**: Most authoritative source

### SRC-002 Official support email approving Week 1 design package
- **Source type**: Official support email
- **Status**: INSPECTION REQUIRED
- **Role**: Design approval and decision handling guidance
- **Missing content**: Not available locally
- **Authority**: High authority for implementation decisions

### SRC-003 Official BR-07 clarification email containing BR-07a and BR-07b
- **Source type**: Official support email
- **Status**: INSPECTION REQUIRED
- **Role**: Binding business rule clarifications
- **Missing content**: Not available locally
- **Authority**: Highest authority for BR-07 specific requirements

### SRC-004 Official capstone timeline and checkpoint emails
- **Source type**: Official support emails
- **Status**: INSPECTION REQUIRED
- **Role**: Project timeline and milestone verification
- **Missing content**: Not available locally
- **Authority**: High authority for scheduling

### SRC-005 Official sample-data delivery email dated 4 November 2026
- **Source type**: Official support email with attachments
- **Status**: INSPECTION REQUIRED
- **Role**: Sample data authorization and specification
- **Missing content**: Not available locally
- **Authority**: High authority for sample data

## Level 2 — Official sample-data pack

### SRC-006 `data/official/T008-PS-064-sample-data/README.md`
- **Source type**: Official sample data README
- **Status**: ✅ INSPECTED
- **Role**: Command syntax, schema definitions, output contracts, planted edge cases
- **Authority**: Most authoritative for data format and requirements

### SRC-007 All official master CSV files
- **Source type**: CSV data files
- **Status**: ✅ INSPECTED
- **Role**: Master data: categories, beds, doctors, tariff, packages, admissions
- **Authority**: High authority for actual data values and structure

### SRC-008 `commands.txt`
- **Source type**: Command event file
- **Status**: ✅ INSPECTED
- **Role**: Command sequence, timestamps, planted edge case references
- **Authority**: High authority for command processing order

### SRC-009 All files under `expected_outputs/`
- **Source type**: Expected output files
- **Status**: ✅ INSPECTED
- **Role**: Reference output formats, field values, reconciliation targets
- **Authority**: High authority for output specification

## Level 3 — Team-authored material

### SRC-010 Current workspace contents and existing files
- **Source type**: Local files in current workspace
- **Status**: ✅ INSPECTED
- **Role**: Historical team material, current state assessment
- **Authority**: Supplementary - not authoritative for requirements

## Source Discovery Summary

### Sources Available (Inspected)
1. **SRC-006** - README.md ✅ (200 pages, fully inspected)
2. **SRC-007-008** - Master CSV files ✅ (all 6 CSV files inspected)
3. **SRC-008** - commands.txt ✅ (839 lines, 2 comments, fully inspected)
4. **SRC-009** - Expected outputs ✅ (42 files, all 6 types present)

### Sources Not Available (Not Inspected)
1. **SRC-001-005** - All official emails/assignments
   - **Reason**: Not available in current workspace
   - **Impact**: Limited - proceeding with locally available sources

## Recommendations

- All available sources are documented and verified
- Missing official sources should be obtained for complete traceability
- Local workspace files are treated as historical, not authoritative