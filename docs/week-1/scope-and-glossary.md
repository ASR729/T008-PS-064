# PS-064 Week 1 - Scope and Glossary

## Document Information

**Document ID:** W1-SCOPE-001
**Version:** 1.0
**Created:** Week 1 Design Phase
**Status:** COMPLETE
**Review:** PASSED

**Document Purpose:** This document defines the project scope, functional requirements, and domain glossary for the PS-064 Hospital Inpatient Billing and Bed Management Engine.

---

## 1. Project Scope

### 1.1 In-Scope Functionality

The PS-064 system must support all specified hospital inpatient billing and bed management operations as defined in the official assignment.

#### Hospital Master Data Management
- **Ward Registration:** Define and maintain hospital wards with capacity, floor, and basic characteristics
- **Bed Management:** Register individual beds with bed ID, ward association, category, and gender restrictions
- **Bed Categories:** Define five bed categories with distinct rates, capacities, and characteristics:
  - GENERAL
  - SEMI_PRIVATE
  - PRIVATE
  - DELUXE
  - ICU
- **Doctor Registry:** Maintain doctor records with ID, name, specialty, visit fees, and intensivist status
- **Tariff Management:** Define pricing for procedures, investigations, pharmacy items, consumables, OT time, and implants
- **Package Configuration:** Define fixed-price packages with inclusions, exclusions, and length-of-stay limits

#### Patient and Admission Processing
- **Patient Registration:** Register patient details (ID, name, demographics, city)
- **Admission Management:** Process patient admissions with requested category and admitting doctor
- **Bed Allocation:** Allocate beds based on category, gender, and availability rules
- **Category Transfers:** Process category upgrades/downgrades with authorization requirements
- **ICU Transitions:** Manage ICU admissions and step-down procedures
- **Package Enrollment:** Assign packages to admissions or process itemised billing

#### Billing and Financial Processing
- **Charge Event Processing:** Generate and manage charge events for bed-days, nursing, doctor visits, procedures, OT, pharmacy, consumables, and investigations
- **Pricing Rules:** Apply category-specific tariff multipliers according to BR-04
- **Discount Management:** Apply senior citizen, employee referral, and charity discounts
- **GST Calculation:** Calculate and apply GST on eligible bed charges
- **Interim Billing:** Generate manual and automatic interim bills at 7-day intervals
- **Top-up Demands:** Raise top-up demands when running bill exceeds 80% of deposits (BR-07a/b)
- **Final Settlement:** Process discharge settlements, refunds, and balance calculations
- **Deposit Management:** Handle admission deposits, top-up deposits, and discharge settlements

#### Reporting and Output
- **Patient Ledger:** Generate detailed ledger entries for each admission
- **Final Bill:** Generate structured final bill with all components
- **Demands:** Track top-up demand lifecycle
- **Rejections:** Log all rejected commands with reasons
- **Interim Bills:** Document all manual and automatic interim bills
- **Bed Occupancy:** Generate periodic bed occupancy snapshots

#### System Operations
- **Command Processing:** Process command-file in strict order with timestamp validation
- **Validation:** Validate all commands against business rules and system state
- **Error Handling:** Log rejections with detailed reasons
- **State Management:** Maintain consistent system state across operations

### 1.2 Out-of-Scope Functionality

The following functionality is explicitly out of scope:

#### System Components
- Web user interface
- Database persistence
- Insurance pre-authorisation processing
- OPD (Outpatient Department) scheduling
- Mobile application
- API server

#### External Integrations
- Hospital information system (HIS) integration
- ERP system interfaces
- Third-party payment gateways (beyond basic deposit processing)

#### Advanced Features
- Real-time bed availability checking
- Automated discharge scheduling
- Advanced analytics and reporting beyond specified outputs
- Patient self-service portals
- Telemedicine integration

### 1.3 Assumptions

#### Technical Assumptions
- **Programming Language:** Python 3.10+ will be used
- **Execution Model:** Command-file driven processing
- **Storage Model:** In-memory processing only
- **Data Format:** CSV files for all inputs and outputs
- **Monetary Precision:** Decimal arithmetic with exact precision
- **Timestamp Handling:** ISO 8601 format (YYYY-MM-DD HH:MM:SS) in IST
- **Processing Order:** Strict command-file order with internal event processing

#### Operational Assumptions
- **Hospital Size:** System designed for 300-bed facility
- **Workload:** Designed for high-volume transaction processing
- **Access Pattern:** Batch processing with no concurrent user access
- **Environment:** Windows environment with PowerShell scripting

#### Business Assumptions
- **Payment Methods:** Standard payment modes supported
- **Discount Eligibility:** Senior citizen, employee referral, and charity discounts apply as defined
- **Package Coverage:** All package rules and exclusions are properly defined
- **Regulatory Compliance:** GST calculation follows specified rules

### 1.4 Constraints

#### Technical Constraints
- **No Databases:** In-memory processing only
- **No UI:** Command-line interface only
- **No Web Framework:** Pure Python processing
- **File Format:** Strict CSV format as specified
- **Encoding:** UTF-8 for text files
- **Line Endings:** CRLF for Windows compatibility

#### Business Constraints
- **Processing Time:** Commands processed strictly in file order
- **Timestamp Rules:** All timestamps must be in IST (no timezone suffix)
- **Monetary Format:** Two decimal places, no currency symbols, no commas
- **ID Format:** Uppercase IDs with fixed prefixes (e.g., ADM-nnnn, DOC-nnnn)
- **Boolean Values:** true/false (lowercase)
- **Decimal Places:** Exactly 2 places for monetary values

#### Regulatory Constraints
- **GST Rules:** 5% GST on bed charges above Rs 5,000 (after discounts)
- **Discount Caps:** Senior (10%), employee (15%), charity (<=50%)
- **Category Multipliers:** Exact values from categories.csv
- **Anchor Times:** Noon (12:00) for GENERAL, 08:00 for ICU

### 1.5 External Inputs

#### External Data Sources
1. **Master Data Files:**
   - `categories.csv` - Bed categories, rates, and multipliers
   - `beds.csv` - Bed registration and assignments
   - `doctors.csv` - Doctor registry and fees
   - `tariff.csv` - Item pricing and rates
   - `packages.csv` - Package definitions and coverage
   - `admissions.csv` - Patient admission data

2. **Command Event File:**
   - `commands.txt` - Complete command sequence with timestamps
   - Format: `COMMAND|timestamp|arg1|arg2|...`
   - Processing: Strict order, reject out-of-order commands

#### External Systems
- **GitHub Repository:** https://github.com/ASR729/T008-PS-064.git
- **Version Control:** Git for project management
- **CI/CD: Not specified in requirements**

### 1.6 Expected Outputs

#### Required Output Files
All outputs must be CSV files with exact column order and content as specified in the official sample data README.

1. **Per-Admission Ledger:** `ledger_<ADM-ID>.csv`
   - Contains detailed ledger entries for each visible admission
   - 18 files (one per visible admission)
   - 450 total data rows across all files

2. **Per-Admission Final Bill:** `bill_<ADM-ID>.csv`
   - Contains structured final bill for each visible admission
   - 18 files (one per visible admission)
   - 576 total data rows across all files

3. **Top-up Demands:** `demands.csv`
   - Tracks all top-up demand lifecycle
   - 3 data rows for visible admissions

4. **Rejected Commands:** `rejections.csv`
   - Logs all rejected commands
   - 7 data rows for visible admissions

5. **Interim Bills:** `interim_bills.csv`
   - Documents manual and automatic interim bills
   - 3 data rows (1 manual, 2 automatic)

6. **Bed Occupancy:** `bed_occupancy_<YYYYMMDD_HHMM>.csv`
   - Three snapshots at specified timestamps
   - 60 data rows per file (all 60 beds)

### 1.7 Operational Limitations

#### Processing Limitations
- **Hidden Admissions:** 22 admissions have no expected outputs
- **Processing Speed:** Optimized for batch processing
- **Memory Usage:** Designed for in-memory processing
- **Error Recovery:** No recovery from corrupted command file

#### Format Limitations
- **Line Endings:** CRLF for Windows compatibility
- **Column Order:** Exact column order required for reconciliation
- **Data Types:** Strict format as specified in README
- **Monetary Precision:** Exactly 2 decimal places

---

## 2. Domain Glossary

### 2.1 Core Business Entities

#### Patient
- **Definition:** Individual receiving hospital services
- **Key Attributes:**
  - `patient_id` (PAT-nnnn) - Unique identifier
  - `patient_name` - Full name
  - `gender` (M/F) - Gender
  - `date_of_birth` (YYYY-MM-DD) - Date of birth
  - `city` - Hometown
  - `senior_status` - Derived from age >= 60
- **Business Rules:** BR-08 (senior discount)
- **Related Entities:** Admission, Ledger, Bill

#### Admission
- **Definition:** Individual inpatient stay episode
- **Key Attributes:**
  - `adm_id` (ADM-nnnn) - Unique identifier
  - `patient_id` - Foreign key to Patient
  - `requested_category` - Initial bed category request
  - `admitting_doctor_id` - Foreign key to Doctor
  - `package_code` - Package code (optional)
  - `employee_referral` (true/false) - Employee referral flag
  - `senior` - Derived from date of birth
  - `running_bill` - Current bill total
  - `deposits` - Total deposits received
  - `balance_due` - Amount still owed
- **States:** Registered, Admitted, BedAllocated, Active, Transferred, ICU, ProcedureBlocked, DischargePending, Settled, Discharged, LAMA, DAMA
- **Business Rules:** BR-01, BR-02, BR-03, BR-06, BR-07, BR-08, BR-09, BR-10
- **Related Entities:** Patient, Bed, Doctor, Package, Ledger, Bill, Demands

#### Bed
- **Definition:** Physical hospital bed with characteristics and status
- **Key Attributes:**
  - `bed_id` (GM-01, GM-02, etc.) - Unique identifier
  - `ward_id` - Ward identifier
  - `ward_name` - Ward description
  - `category` - Bed category (from categories.csv)
  - `gender_restriction` (M, F, ANY) - Gender restrictions
  - `daily_bed_charge` - Daily rate from categories.csv
  - `nursing_charge` - Nursing rate from categories.csv
  - `floor` - Floor number (1-4)
  - `status` (AVAILABLE, OCCUPIED, RESERVED, HOUSEKEEPING)
  - `adm_id` - Current occupant admission (if occupied)
  - `since_ts` - When bed entered current status
  - `billing_category` - Rate category being charged (may differ during UPGRADE_FREE)
  - `hold_until` - Reservation expiry time (if RESERVED)
- **Business Rules:** BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-10, BR-12
- **Related Entities:** Ward, BedCategory, Admission, BedOccupancy

#### Ward
- **Definition:** Hospital ward containing multiple beds
- **Key Attributes:**
  - `ward_id` (W-GM, W-GF, etc.) - Unique identifier
  - `ward_name` - Ward description
  - `gender` (M for male, F for female)
- **Relationships:** Contains Beds, belongs to Hospital
- **Business Rules:** BR-02, BR-04
- **Related Entities:** Bed, Hospital

#### Doctor
- **Definition:** Medical professional with visiting privileges
- **Key Attributes:**
  - `doctor_id` (DOC-nnn) - Unique identifier
  - `doctor_name` - Full name
  - `specialty` - Medical specialty
  - `visit_fee` - Standard visit fee
  - `is_intensivist` (true/false) - Intensivist status
  - `max_chargeable_doctors_per_day` - Per-category limit
- **Business Rules:** BR-03, BR-04, BR-05
- **Related Entities:** Admission, ChargeEvent, Ledger

#### Tariff Item
- **Definition:** Billable item with base rate and unit
- **Key Attributes:**
  - `item_code` (PRC-001, OT-001, etc.) - Unique identifier
  - `description` - Item description
  - `head` (PROCEDURE, OT, INVESTIGATION, PHARMACY, CONSUMABLE) - Charge category
  - `base_rate` - Base price (Rs)
  - `unit` (per_procedure, per_hour, per_test, per_unit) - Billing unit
- **Business Rules:** BR-04
- **Related Entities:** ChargeEvent, Ledger, Package

#### Package
- **Definition:** Fixed-price package covering multiple services
- **Key Attributes:**
  - `package_code` (PKG-xxx) - Unique identifier
  - `package_name` - Package description
  - `package_category` - Primary category
  - `package_price` - Fixed package price
  - `los_days` - Maximum length of stay covered
  - `included_procedures` - List of covered procedures/OT codes
  - `exclusions` - List of excluded items
  - `covered_heads` - Heads covered for whole stay
- **Business Rules:** BR-06
- **Related Entities:** Admission, ChargeEvent, Ledger, PackageConversion

### 2.2 Financial and Billing Concepts

#### Charge Event
- **Definition:** Individual billing transaction occurrence
- **Key Attributes:**
  - `event_id` (EV-nnnnn) - Unique identifier
  - `adm_id` - Associated admission
  - `event_ts` - Event timestamp
  - `head` (BED, NURSING, DOCTOR, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, PACKAGE) - Charge category
  - `item_code` - Tariff item or doctor ID or package code
  - `qty` - Quantity
  - `base_amount` - Base rate
  - `multiplier` - Category-specific multiplier
  - `gross` - Calculated gross amount
  - `discount_pct` - Applied discount percentage
  - `discount_amt` - Discount amount
  - `gst_amt` - GST amount (if applicable)
  - `net` - Net amount after discounts and GST
  - `locked_by_interim` - Interim bill ID if locked
- **Business Rules:** BR-04, BR-06, BR-08, BR-11
- **Related Entities:** Ledger, PackageConversion, InterimBill

#### Charge Line
- **Definition:** Individual line item in patient ledger
- **Key Attributes:**
  - `line_no` - Sequential line number
  - `event_ts` - Event timestamp
  - `counting_ts` - Bed-day counting timestamp (empty for non-bed-day lines)
  - `head` - Charge head
  - `item_code` - Item identifier
  - `description` - Free text (not compared)
  - `category_at_event` - Category at time of event
  - `qty` - Quantity
  - `base_amount` - Base amount
  - `multiplier` - Applied multiplier
  - `gross` - Gross amount
  - `discount_pct` - Discount percentage
  - `discount_amt` - Discount amount
  - `gst_amt` - GST amount
  - `net` - Net amount
  - `locked_by_interim` - Interim bill ID
- **Business Rules:** All business rules affecting billing
- **Related Entities:** Ledger, Admission, ChargeEvent

#### Patient Ledger
- **Definition:** Complete record of all billing events for an admission
- **Key Attributes:**
  - Per admission file: `ledger_<ADM-ID>.csv`
  - Contains all charge lines in posting order
  - `line_no`, `event_ts`, `counting_ts`, `head`, `item_code`, `description`, `category_at_event`, `qty`, `base_amount`, `multiplier`, `gross`, `discount_pct`, `discount_amt`, `gst_amt`, `net`, `locked_by_interim`
- **Business Rules:** All rules affecting ledger content
- **Related Entities:** Admission, ChargeEvent, ChargeLine, FinalBill

#### Final Bill
- **Definition:** Complete bill for admission discharge
- **Key Attributes:**
  - `section`, `item`, `value` triplets
  - INFO: admission details
  - HEAD: per head gross charges
  - TOTAL: calculated totals
  - DISCOUNT: applied discounts
  - TAX: GST amounts
  - ROUNDING: rounding difference
  - PAYMENT: deposits and settlement
  - RESULT: balance due/refund
  - STATUS: bill status and admission status
- **Business Rules:** BR-08, BR-10, BR-11
- **Related Entities:** Admission, Ledger, Payment, Settlement

### 2.3 Processing and System Concepts

#### Command
- **Definition:** System command processed from command file
- **Key Attributes:**
  - `command` - Command name (ADMIT, RESERVE_BED, etc.)
  - `timestamp` - Command timestamp
  - `arguments` - Command-specific arguments
  - `line_no` - Physical line in commands.txt
- **Types:** ADMIT, RESERVE_BED, TRANSFER, STEP_DOWN, VISIT, PROCEDURE, OT, PHARMACY, CONSUMABLE, INVESTIGATION, DEPOSIT, INTERIM_BILL, CORRECTION, CHARITY, DISCHARGE, HOUSEKEEPING_CLEARED
- **Business Rules:** All validation and rejection rules
- **Related Entities:** CommandResult, Rejection, Admission, Bed

#### Command Result
- **Definition:** Result of processing a command
- **Key Attributes:**
  - `command` - Command name
  - `success` - Success/failure flag
  - `error_code` - Rejection code if failed
  - `error_detail` - Rejection details
  - `event_id` - Generated event ID for successful commands
- **Business Rules:** All command validation rules
- **Related Entities:** Command, Rejection, Admission

#### Rejection
- **Definition:** Rejected command with reason
- **Key Attributes:**
  - `line_no` - Physical line in commands.txt
  - `command_ts` - Command timestamp
  - `command` - Full command string
  - `adm_id` - Admission ID (if applicable)
  - `code` - Rejection code
  - `detail` - Free text (not compared)
- **Rejection Codes:** OUT_OF_ORDER, MALFORMED, UNKNOWN_COMMAND, UNKNOWN_ADMISSION, NOT_ADMITTED, ALREADY_ADMITTED, ALREADY_RESERVED, DEPOSIT_SHORT, NO_BED, INVALID_CATEGORY, STEP_DOWN_REQUIRED, SAME_CATEGORY, TRANSFER_LIMIT, NOT_IN_ICU, DUPLICATE_EVENT, UNKNOWN_DOCTOR, UNKNOWN_ITEM, INVALID_QTY, INVALID_FLAG, TOPUP_BLOCK, INVALID_AMOUNT, NOTHING_DUE, UNKNOWN_EVENT, CORRECTION_NOT_ALLOWED, NO_CHANGE, CHARITY_NO_CEO_REF, CHARITY_LIMIT, CHARITY_ALREADY_APPLIED, INVALID_TYPE, INVALID_ORDER_TS, UNKNOWN_BED, BED_NOT_IN_HOUSEKEEPING
- **Business Rules:** All validation rules
- **Related Entities:** Admission, Bed, Doctor, Item

#### Interim Bill
- **Definition:** Manual or automatic interim bill
- **Key Attributes:**
  - `interim_id` - Unique identifier
  - `adm_id` - Admission ID
  - `interim_ts` - Bill timestamp
  - `trigger` (MANUAL/AUTO_7D) - Bill type
  - `lines_locked` - Number of locked lines
  - `last_line_no` - Last line included
  - `gross_total` - Sum of gross amounts
  - `discount_total` - Sum of discount amounts
  - `gst_total` - Sum of GST amounts
  - `running_bill` - Running bill at time
  - `deposits_to_date` - Total deposits received
  - `balance` - Running bill minus deposits
- **Business Rules:** BR-09
- **Related Entities:** Admission, ChargeEvent, Ledger

#### Top-up Demand
- **Definition:** Demand for additional funds to cover bill
- **Key Attributes:**
  - `demand_id` - Unique identifier
  - `adm_id` - Admission ID
  - `seq` - Sequence number (1 or 2)
  - `demand_ts` - Demand timestamp
  - `trigger_line_no` - Ledger line that triggered demand
  - `running_bill` - Running bill at demand time
 ammond
- `deposits_at_demand` - Total deposits at demand time
- `threshold_80pct` - 80% of deposits
- `charges_last_3_days` - Total charges in last 3 days
- `days_with_charges` - Days with charges
- `avg_daily_charge` - Average daily charge (BR-07a)
- `demand_amount` - Rounded demand amount
- `deposits_since_demand` - Deposits after demand
- `outstanding` - Outstanding amount
- `status` (OPEN/CLOSED/LAPSED/CLOSED_AT_DISCHARGE)
- `status_ts` - Status effective time
- `procedure_block_from` - Block start time
- `procedure_block_to` - Block end time
- **Business Rules:** BR-07a, BR-07b
- **Related Entities:** Admission, ChargeEvent, Deposit

### 2.4 Enumerations and Code Lists

#### Bed Categories
Values: GENERAL, SEMI_PRIVATE, PRIVATE, DELUXE, ICU
- **GENERAL:** 2 chargeable doctors per day
- **SEMI_PRIVATE:** 1.20 investigation multiplier
- **PRIVATE:** 1.50 all multipliers
- **DELUXE:** 2.00 all multipliers
- **ICU:** Daily rate 4800.00, special rules

#### Gender Restriction
Values: M, F, ANY
- **M:** Male-only wards
- **F:** Female-only wards
- **ANY:** Mixed gender

#### Head Types
Values: PROCEDURE, OT, INVESTIGATION, PHARMACY, CONSUMABLE
- **PROCEDURE:** Medical procedures
- **OT:** Operating theater procedures
- **INVESTIGATION:** Lab/imaging tests
- **PHARMACY:** Medications
- **CONSUMABLE:** Implants/blood products

#### Item Type Codes
Prefix patterns: PRC-, OT-, INV-, PHM-, CON-, IMP-, BLD-

#### Rejection Codes
See full list in Section 2.3

#### Package Conversion
Status: NONE, ACTIVE, CONVERTED, COMPLETED

#### Discharge Types
Values: NORMAL, LAMA, DAMA

### 2.5 Timestamps and Dates

#### Date Format
- **Format:** YYYY-MM-DD
- **Example:** 2026-10-02

#### Timestamp Format
- **Format:** YYYY-MM-DD HH:MM:SS
- **Timezone:** IST (no timezone suffix)
- **Example:** 2026-10-02 11:59:00

#### Key Time Points
- **Noon Count:** 12:00:00 (GENERAL beds)
- **ICU Count:** 08:00:00 (ICU beds)
- **Admission Count:** Before noon for same-day counting
- **Discharge Count:** After 14:00:00 adds extra bed day
- **Planning Window:** Order issued before discharge day avoids extra bed day

### 2.6 Business Rule References

#### BR-01: Bed-day counting
- Core counting rules and anchors

#### BR-02: Bed allocation
- Allocation rules and upgrade-free window

#### BR-03: Category transfer
- ICU transitions and transfer limits

#### BR-04: Tariff multipliers
- Category-specific pricing rules

#### BR-05: Doctor visits
- Visit charging and FREE rules

#### BR-06: Packages
- Package coverage and conversion

#### BR-07: Deposits and demands
- Top-up demand lifecycle

#### BR-08: Discounts
- Discount application rules

#### BR-09: Interim bills
- Interim billing and event locking

#### BR-10: Final settlement
- Discharge settlement and refunds

#### BR-11: GST
- GST calculation and thresholds

#### BR-12: Bed operations
- Bed hold, housekeeping, reservation expiry

### 2.7 Sample Data References

#### Visible Admissions
ADMs: ADM-0001 through ADM-0038 (18 total)
- ADM-0001: Simple GENERAL stay (EC-01)
- ADM-0002: GENERAL at exactly 12:00:00 (EC-01)
- ADM-0005: 23h 59m stay (EC-03)
- ADM-0008: SEMI_PRIVATE discharge at 14:00:00 (EC-02)
- ADM-0010: Senior + employee referral (EC-02)
- ADM-0013: ICU move and step-down (EC-02)
- ADM-0019: PRIVATE exact Rs 5,000 (no GST) (EC-07)
- ADM-0020: UPGRADE_FREE scenario (EC-04)
- ADM-0022: Reserved bed admission (EC-02)
- ADM-0023: Top-up demands BR-07a/b (EC-06)
- ADM-0026: Package with exactly 48h ICU (EC-05)
- ADM-0027: Package conversion (EC-05)
- ADM-0028: Interim bills, correction (EC-08)
- ADM-0030: Senior turning exactly 60 (EC-07)
- ADM-0033: Charity discount (EC-08)
- ADM-0036: LAMA discharge (EC-02)
- ADM-0038: Exact 80% threshold (no demand) (EC-06)

#### Hidden Admissions
ADMs: ADM-0039 through ADM-0060 (22 total)
- Additional edge cases not published
- Same business rules as visible admissions
- Different dates and IDs

### 2.8 System Architecture References

#### Command Processing
- Commands processed strictly in file order
- Internal events processed before commands
- Validation stops at first failing check
- Rejection for any reason advances the clock

#### Data Flow
- Master data loaded from CSV files
- Commands processed sequentially
- Ledger lines generated
- Outputs generated
- All outputs CSV format with specified headers

#### File Processing
- `commands.txt`: 837 commands (2 comments)
- Master CSV files: 6 data files
- Expected outputs: 42 files (18 ledger + 18 bill + 3 occupancy + 1 demands + 1 rejections + 1 interim)
- Total expected output rows: 1,113

---

## 3. Functional Requirements

### 3.1 System Overview

The PS-064 system processes hospital inpatient admissions, bed management, and billing operations using a command-file-driven architecture. All processing is deterministic and based solely on input commands and master data.

### 3.2 Core Functional Areas

1. **Master Data Loading**: Load all master data from official CSV files
2. **Command Processing**: Parse and execute commands in file order
3. **Validation**: Validate all commands against business rules
4. **Admission Processing**: Process admissions with bed allocation
5. **Bed Lifecycle**: Maintain bed availability and occupancy
6. **Transfer Management**: Process category and ICU transfers
7. **Billing**: Calculate and generate all charge events
8. **Discount Management**: Apply senior, employee, and charity discounts
9. **Payment Processing**: Handle deposits, top-up demands, and settlements
10. **Package Management**: Process package enrollment and conversion
11. **Interim Billing**: Generate manual and automatic interim bills
12. **Output Generation**: Create all required output files

### 3.3 Non-Fait-Functions

- **Insurance pre-authorisation**: Excluded from scope
- **OPD scheduling**: Excluded from scope
- **Web application**: Not required
- **API server**: Not required
- **Database persistence**: Not required
- **Real-time operations**: Not required

### 3.4 Key Performance Characteristics

- **Deterministic**: Same input produces same output
- **Auditable**: All actions logged and rejected commands recorded
- **Stateful**: Maintains system state across command processing
- **Deterministic Timestamp Handling**: All timestamps parsed consistently without timezone conversions
- **Monetary Precision**: Decimal arithmetic ensures exact financial calculations without floating-point errors

### 3.5 System Boundaries

**System Responsibilities:**
- Process command-file inputs
- Maintain bed inventory and occupancy
- Apply all business rules
- Generate billing and financial outputs
- Manage deposits and settlements
- Create required output files

**System Exclusions:**
- User interface design
- Network communication
- File system operations (except reading command file)
- External system integration
- Background processes

### 3.6 Data Flow

1. **Input:** Master data files and commands.txt
2. **Processing:** Sequential command execution
3. **State Updates:** System state modifications
4. **Output:** Generated output files
5. **Logging:** Command results and rejections

### 3.7 Integration Points

- **With Master Data:** CSV files provide initial system state
- **With Output Requirements:** Expected output files define processing contracts
- **With Business Rules:** BR-01 through BR-12 define processing logic
- **With Edge Cases:** EC-01 through EC-08 define special scenarios

### 3.8 Security Considerations

- **Access Control:** File-based access only
- **Data Integrity:** All inputs must be validated
- **Audit Trail:** Full command history logged
- **Error Handling:** Detailed rejection reasons recorded

---

## 4. Technology and Implementation Constraints

### 4.1 Programming Language
- **Primary:** Python 3.10+
- **Standards:** PEP 8 compliance
- **Testing:** Unit and integration tests required
- **Documentation:** Comprehensive documentation required

### 4.2 Software Libraries
- **Standard Library:** Core Python functionality only
- **External Dependencies:** Minimal, only when absolutely necessary
- **Performance:** Optimized for batch processing
- **Memory:** In-memory processing only

### 4.3 File Handling
- **Input Format:** CSV with comma delimiters
- **Output Format:** CSV with exact column order
- **Encoding:** UTF-8
- **Line Endings:** CRLF (Windows)

### 4.4 Processing Model
- **Sequential Processing:** Commands processed in file order
- **Deterministic:** Same input produces same output
- **Stateful:** Maintains system state
- **Validated:** All commands validated before execution

### 4.5 Testing Requirements
- **Unit Tests:** Test individual components
- **Integration Tests:** Test component interactions
- **Reconciliation Tests:** Compare outputs with expected results
- **Edge Case Tests:** Test all specified edge cases
- **Regression Tests:** Prevent regressions in functionality

### 4.6 Deployment Requirements
- **Installation:** Standard Python installation
- **Configuration:** Command file location
- **Logging:** Detailed error logs
- **Monitoring:** System state visibility

### 4.7 Documentation Requirements
- **Design Documents:** Comprehensive design documentation
- **Code Comments:** Inline code documentation
- **API Documentation:** Function and method documentation
- **User Guide:** System usage documentation

---

## 5. Implementation Strategy

### 5.1 Development Approach
- **Iterative Development:** Incremental development with testing
- **Test-Driven Development:** Tests drive development
- **Continuous Integration:** Automated testing
- **Code Reviews:** Peer review of all changes

### 5.2 Risk Mitigation
- **Business Rule Complexity:** Comprehensive documentation
- **Edge Case Handling:** Specific test scenarios
- **Output Accuracy:** Reconciliation against expected outputs
- **System Stability:** Thorough validation and testing

### 5.3 Quality Assurance
- **Static Analysis:** Code quality checks
- **Dynamic Analysis:** Runtime behavior validation
- **Peer Review:** Code review process
- **Testing:** Comprehensive test suite

### 5.4 Maintenance Considerations
- **Code Documentation:** Clear, comprehensive documentation
- **Error Handling:** Robust error handling
- **Logging:** Detailed logging for troubleshooting
- **Testing:** Continuous integration and testing

---

## 6. Future Enhancements

### 6.1 Additional Features
- **Insurance Integration:** Add insurance pre-authorisation
- **OPD Scheduling:** Add outpatient department scheduling
- **Web Interface:** Add web-based user interface
- **API Support:** Add REST API for external systems
- **Advanced Analytics:** Add reporting and analytics features

### 6.2 Performance Improvements
- **Optimization:** Optimize for high-volume processing
- **Caching:** Implement caching for frequently accessed data
- **Parallel Processing:** Add parallel processing capabilities
- **Distributed Processing:** Add distributed processing support

### 6.3 Technology Upgrades
- **Database Integration:** Add database support
- **Web Framework:** Add web framework support
- **Mobile Support:** Add mobile application support
- **Cloud Deployment:** Add cloud deployment capabilities

---

## 7. Conclusion

The PS-064 Hospital Inpatient Billing and Bed Management Engine requires a comprehensive design that addresses all business rules, edge cases, and functional requirements while maintaining strict adherence to specified constraints and standards.

The Week 1 design provides:
- **Complete Requirements Analysis:** All functional requirements documented
- **Detailed Domain Model:** Comprehensive entity definitions and relationships
- **Business Rule Implementation:** All BR-01 through BR-12 with official clarifications
- **Edge Case Coverage:** All EC-01 through EC-08 with specific scenarios
- **Architecture Design:** Component-based design with clear responsibilities
- **Testing Strategy:** Comprehensive test planning framework
- **Implementation Guidance:** Clear direction for Week 2 development

This design provides the foundation for building a system that meets all specified requirements while maintaining flexibility for future enhancements.

---

**Document Status:** ✅ **COMPLETE**
**Review Status:** ✅ **PASSED**
**Next Phase:** Week 2 - Core Implementation