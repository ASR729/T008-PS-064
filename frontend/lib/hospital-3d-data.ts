import {
  HospitalFloor,
  HospitalWard,
  HospitalBed,
  HospitalStats,
  DemoPatientRecord,
} from "../types/hospital-3d";

export const HOSPITAL_3D_DISCLAIMER =
  "SIMULATION ENVIRONMENT — All hospital 3D architectures, floor elevations, bed statuses, and patient demographics are illustrative demonstration data for PS-064 Capstone evaluation.";

// Generate 35 General Male Beds
const generateGeneralMaleBeds = (wardId: string, floorId: string): HospitalBed[] => {
  const beds: HospitalBed[] = [];
  const startX = -13;
  const startZ = -9;
  const colSpacing = 2.4;
  const rowSpacing = 2.6;

  // 35 beds in 5 rows of 7 beds
  let count = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      count++;
      const id = `B-GWM-${String(count).padStart(3, "0")}`;
      let status: HospitalBed["status"] = "occupied";
      if (count === 4 || count === 9 || count === 14 || count === 19 || count === 24 || count === 29 || count === 32 || count === 35) {
        status = "available";
      } else if (count === 12) {
        status = "reserved";
      } else if (count === 22 || count === 28) {
        status = "housekeeping";
      }

      const patient: DemoPatientRecord | undefined =
        status === "occupied"
          ? {
              admissionId: `ADM-2026-M${String(count).padStart(3, "0")}`,
              patientName: `Patient M${count} (Demo)`,
              age: 28 + ((count * 7) % 45),
              gender: "M",
              admitTimestamp: `2026-11-${String(10 + (count % 5)).padStart(2, "0")} 10:30:00`,
              dailyRate: 1200,
              depositStatus: count % 5 === 0 ? "Threshold_80_Alert" : "Healthy",
              depositAmount: 15000,
              currentCharges: count % 5 === 0 ? 12800 : 7400,
              nextBillingAnchor: "12:00:00 Noon",
              primaryDiagnosis: count % 3 === 0 ? "Post-Operative Appendectomy" : "Orthopedic Fracture Care",
            }
          : undefined;

      beds.push({
        id,
        bedNumber: count,
        wardId,
        floorId,
        category: "GENERAL_MALE",
        status,
        position: [startX + c * colSpacing, 0.45, startZ + r * rowSpacing],
        rotation: r % 2 === 0 ? 0 : Math.PI,
        patient,
        lastStatusUpdate: "2026-11-16 09:30:00",
        notes: status === "housekeeping" ? "Under sanitization. BR-03 clearance pending." : undefined,
      });
    }
  }
  return beds;
};

// Generate 35 General Female Beds
const generateGeneralFemaleBeds = (wardId: string, floorId: string): HospitalBed[] => {
  const beds: HospitalBed[] = [];
  const startX = 2.5;
  const startZ = -9;
  const colSpacing = 2.4;
  const rowSpacing = 2.6;

  let count = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      count++;
      const id = `B-GWF-${String(count).padStart(3, "0")}`;
      let status: HospitalBed["status"] = "occupied";
      if (count === 3 || count === 8 || count === 13 || count === 18 || count === 23 || count === 27 || count === 31 || count === 33 || count === 35) {
        status = "available";
      } else if (count === 15 || count === 21) {
        status = "reserved";
      } else if (count === 10) {
        status = "housekeeping";
      }

      const patient: DemoPatientRecord | undefined =
        status === "occupied"
          ? {
              admissionId: `ADM-2026-F${String(count).padStart(3, "0")}`,
              patientName: `Patient F${count} (Demo)`,
              age: 24 + ((count * 9) % 48),
              gender: "F",
              admitTimestamp: `2026-11-${String(9 + (count % 6)).padStart(2, "0")} 11:15:00`,
              dailyRate: 1200,
              depositStatus: count % 6 === 0 ? "Threshold_80_Alert" : "Healthy",
              depositAmount: 15000,
              currentCharges: count % 6 === 0 ? 13400 : 6800,
              nextBillingAnchor: "12:00:00 Noon",
              primaryDiagnosis: count % 2 === 0 ? "Elective Cholecystectomy" : "Acute Gastroenteritis",
            }
          : undefined;

      beds.push({
        id,
        bedNumber: count,
        wardId,
        floorId,
        category: "GENERAL_FEMALE",
        status,
        position: [startX + c * colSpacing, 0.45, startZ + r * rowSpacing],
        rotation: r % 2 === 0 ? 0 : Math.PI,
        patient,
        lastStatusUpdate: "2026-11-16 09:45:00",
        notes: status === "reserved" ? "Scheduled admission for gynecological procedure." : undefined,
      });
    }
  }
  return beds;
};

// Generate 24 Semi-Private Beds (Floor 2: 12 dual-bed cubicles)
const generateSemiPrivateBeds = (wardId: string, floorId: string): HospitalBed[] => {
  const beds: HospitalBed[] = [];
  const startX = -12;
  const startZ = -7;
  const cubicleSpacingX = 4.8;
  const cubicleSpacingZ = 3.6;

  let count = 0;
  // 6 cubicles per row, 2 rows = 12 cubicles = 24 beds
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      // 2 beds per cubicle (left and right)
      for (let b = 0; b < 2; b++) {
        count++;
        const id = `B-SP-${String(count).padStart(3, "0")}`;
        let status: HospitalBed["status"] = "occupied";
        if (count === 5 || count === 11 || count === 17 || count === 21 || count === 24) {
          status = "available";
        } else if (count === 14) {
          status = "reserved";
        } else if (count === 8) {
          status = "housekeeping";
        }

        const patient: DemoPatientRecord | undefined =
          status === "occupied"
            ? {
                admissionId: `ADM-2026-SP${String(count).padStart(3, "0")}`,
                patientName: `Patient SP${count} (Demo)`,
                age: 35 + ((count * 5) % 40),
                gender: count % 2 === 0 ? "F" : "M",
                admitTimestamp: `2026-11-${String(8 + (count % 7)).padStart(2, "0")} 14:00:00`,
                dailyRate: 2800,
                depositStatus: count % 4 === 0 ? "Threshold_80_Alert" : "Healthy",
                depositAmount: 35000,
                currentCharges: count % 4 === 0 ? 29800 : 18500,
                nextBillingAnchor: "12:00:00 Noon",
                stepDownEligible: count === 3,
                primaryDiagnosis: "Orthopedic Joint Replacement",
              }
            : undefined;

        const posX = startX + c * cubicleSpacingX + (b === 0 ? -1.0 : 1.0);
        const posZ = startZ + r * cubicleSpacingZ * 2.8;

        beds.push({
          id,
          bedNumber: count,
          wardId,
          floorId,
          category: "SEMI_PRIVATE",
          status,
          position: [posX, 0.45, posZ],
          rotation: b === 0 ? -Math.PI / 2 : Math.PI / 2,
          patient,
          lastStatusUpdate: "2026-11-16 10:10:00",
        });
      }
    }
  }
  return beds;
};

// Generate 16 Private Suites (Floor 3 East)
const generatePrivateBeds = (wardId: string, floorId: string): HospitalBed[] => {
  const beds: HospitalBed[] = [];
  const startX = -12.5;
  const startZ = -7;
  const roomSpacingX = 3.6;
  const roomSpacingZ = 6.2;

  let count = 0;
  // 8 rooms north row, 8 rooms south row = 16 private suites
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      count++;
      const id = `B-PVT-${String(count).padStart(3, "0")}`;
      let status: HospitalBed["status"] = "occupied";
      if (count === 4 || count === 8 || count === 12 || count === 15) {
        status = "available";
      } else if (count === 10) {
        status = "reserved";
      } else if (count === 6) {
        status = "housekeeping";
      }

      const patient: DemoPatientRecord | undefined =
        status === "occupied"
          ? {
              admissionId: `ADM-2026-PVT${String(count).padStart(3, "0")}`,
              patientName: `Executive Patient P${count} (Demo)`,
              age: 42 + ((count * 3) % 36),
              gender: count % 2 === 0 ? "M" : "F",
              admitTimestamp: `2026-11-${String(7 + (count % 8)).padStart(2, "0")} 15:45:00`,
              dailyRate: 5500, // BR-11 5% GST applicable (>₹5k)
              depositStatus: count === 7 ? "Threshold_80_Alert" : "Healthy",
              depositAmount: 60000,
              currentCharges: count === 7 ? 54000 : 32500,
              nextBillingAnchor: "12:00:00 Noon",
              primaryDiagnosis: "Cardiology Angioplasty Observation",
            }
          : undefined;

      const posX = startX + c * roomSpacingX;
      const posZ = startZ + r * roomSpacingZ;

      beds.push({
        id,
        bedNumber: count,
        wardId,
        floorId,
        category: "PRIVATE",
        status,
        position: [posX, 0.45, posZ],
        rotation: r === 0 ? 0 : Math.PI,
        patient,
        lastStatusUpdate: "2026-11-16 10:20:00",
        notes: "BR-11 5% GST Room Threshold active for rate > ₹5,000.",
      });
    }
  }
  return beds;
};

// Generate 10 ICU Beds (Floor 3 West)
const generateICUBeds = (wardId: string, floorId: string): HospitalBed[] => {
  const beds: HospitalBed[] = [];
  const startX = -10.5;
  const startZ = 2;
  const spacingX = 4.6;

  // 10 beds in 2 banks of 5 facing central nurse telemetry console
  let count = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      count++;
      const id = `B-ICU-${String(count).padStart(3, "0")}`;
      let status: HospitalBed["status"] = "occupied";
      if (count === 3 || count === 6 || count === 8 || count === 9 || count === 10) {
        status = "available";
      }

      const patient: DemoPatientRecord | undefined =
        status === "occupied"
          ? {
              admissionId: `ADM-2026-ICU${String(count).padStart(3, "0")}`,
              patientName: `Critical Patient ICU${count} (Demo)`,
              age: 50 + ((count * 4) % 32),
              gender: count % 2 === 0 ? "M" : "F",
              admitTimestamp: `2026-11-14 02:20:00`,
              dailyRate: 8500, // BR-11 5% GST applicable (>₹5k)
              depositStatus: count === 2 ? "Threshold_80_Alert" : "Healthy",
              depositAmount: 100000,
              currentCharges: count === 2 ? 88500 : 51000,
              nextBillingAnchor: "08:00:00 AM (BR-01 ICU Anchor)",
              stepDownEligible: count === 4,
              primaryDiagnosis: count === 1 ? "Acute Coronary Syndrome" : "Septic Shock Protocol",
            }
          : undefined;

      const posX = startX + c * spacingX;
      const posZ = startZ + (r === 0 ? -1.8 : 1.8);

      beds.push({
        id,
        bedNumber: count,
        wardId,
        floorId,
        category: "ICU",
        status,
        position: [posX, 0.45, posZ],
        rotation: r === 0 ? Math.PI : 0,
        patient,
        lastStatusUpdate: "2026-11-16 10:30:00",
        notes: "BR-01 08:00:00 AM Anchor applies. Critical telemetry connected.",
      });
    }
  }
  return beds;
};

// All Wards
export const HOSPITAL_WARDS: HospitalWard[] = [
  {
    id: "ward-gwm",
    floorId: "floor-1",
    name: "General Ward (Male)",
    shortCode: "GW-M",
    category: "GENERAL_MALE",
    color: "#38BDF8",
    genderRule: "MALE_ONLY",
    dailyRate: 1200,
    description: "Dedicated male inpatient ward with shared sanitation and nursing corridor. BR-02 gender separation enforced.",
    bounds: { x: -14, z: -10, width: 13, depth: 14 },
    totalBeds: 35,
    occupiedBeds: 26,
    availableBeds: 8,
    reservedBeds: 1,
    housekeepingBeds: 2,
    criticalBeds: 0,
    nursingStationPosition: [-1, 0, 0],
  },
  {
    id: "ward-gwf",
    floorId: "floor-1",
    name: "General Ward (Female)",
    shortCode: "GW-F",
    category: "GENERAL_FEMALE",
    color: "#22C7A9",
    genderRule: "FEMALE_ONLY",
    dailyRate: 1200,
    description: "Dedicated female inpatient ward with maternity/general partition. BR-02 gender separation enforced.",
    bounds: { x: 1, z: -10, width: 13, depth: 14 },
    totalBeds: 35,
    occupiedBeds: 24,
    availableBeds: 9,
    reservedBeds: 2,
    housekeepingBeds: 1,
    criticalBeds: 0,
    nursingStationPosition: [1, 0, 0],
  },
  {
    id: "ward-sp",
    floorId: "floor-2",
    name: "Semi-Private Ward",
    shortCode: "SP",
    category: "SEMI_PRIVATE",
    color: "#5685FF",
    genderRule: "ANY",
    dailyRate: 2800,
    description: "Twin-sharing rooms with acoustic privacy curtains, ensuite washrooms, and dual telemetry monitors.",
    bounds: { x: -14, z: -10, width: 28, depth: 15 },
    totalBeds: 24,
    occupiedBeds: 18,
    availableBeds: 5,
    reservedBeds: 1,
    housekeepingBeds: 1,
    criticalBeds: 0,
    nursingStationPosition: [0, 0, 0],
  },
  {
    id: "ward-pvt",
    floorId: "floor-3",
    name: "Private Executive Suites",
    shortCode: "PVT",
    category: "PRIVATE",
    color: "#9B87FF",
    genderRule: "ANY",
    dailyRate: 5500,
    description: "Single-occupancy suites with motorized beds, attendant couches, and smart entertainment systems. BR-11 GST applies.",
    bounds: { x: -14, z: -9, width: 28, depth: 8 },
    totalBeds: 16,
    occupiedBeds: 11,
    availableBeds: 4,
    reservedBeds: 1,
    housekeepingBeds: 1,
    criticalBeds: 0,
    nursingStationPosition: [5, 0, -2],
  },
  {
    id: "ward-icu",
    floorId: "floor-3",
    name: "Intensive Care Unit",
    shortCode: "ICU",
    category: "ICU",
    color: "#F06474",
    genderRule: "ANY",
    dailyRate: 8500,
    description: "High-acuity 1:1 nursing ward with HEPA laminar air flow, ventilator telemetry, and 08:00 AM billing anchor under BR-01.",
    bounds: { x: -12, z: 0, width: 24, depth: 7 },
    totalBeds: 10,
    occupiedBeds: 5,
    availableBeds: 5,
    reservedBeds: 0,
    housekeepingBeds: 0,
    criticalBeds: 5,
    nursingStationPosition: [-0.5, 0, 2],
  },
];

// All Beds by Ward
export const ALL_HOSPITAL_BEDS: HospitalBed[] = [
  ...generateGeneralMaleBeds("ward-gwm", "floor-1"),
  ...generateGeneralFemaleBeds("ward-gwf", "floor-1"),
  ...generateSemiPrivateBeds("ward-sp", "floor-2"),
  ...generatePrivateBeds("ward-pvt", "floor-3"),
  ...generateICUBeds("ward-icu", "floor-3"),
];

// All Floors Definition
export const HOSPITAL_FLOORS: HospitalFloor[] = [
  {
    id: "floor-g",
    level: 0,
    name: "Ground Floor — Emergency & Diagnostic Pavilion",
    shortName: "Level G",
    elevation: 0,
    height: 3.2,
    dimensions: { width: 32, depth: 22, height: 3.2 },
    wards: [],
    totalBeds: 0, // Outpatient & triage hub
    occupiedBeds: 0,
    availableBeds: 0,
    reservedBeds: 0,
    housekeepingBeds: 0,
    description: "Emergency reception, 24/7 triage trauma bays, radiology (CT/MRI), pathology laboratories, pharmacy dispensing, and ambulance dispatch.",
    specialties: [
      "24/7 Emergency & Trauma",
      "Diagnostic Imaging (MRI / 128-Slice CT)",
      "Automated Pathology Lab",
      "Ambulance Receiving Bay",
      "Central Billing & Cashier Desk",
    ],
  },
  {
    id: "floor-1",
    level: 1,
    name: "First Floor — General Inpatient Wards",
    shortName: "Level 1",
    elevation: 4.2,
    height: 3.2,
    dimensions: { width: 30, depth: 20, height: 3.2 },
    wards: [HOSPITAL_WARDS[0], HOSPITAL_WARDS[1]],
    totalBeds: 70,
    occupiedBeds: 50,
    availableBeds: 17,
    reservedBeds: 3,
    housekeepingBeds: 3,
    description: "General Ward Male (35 beds) and General Ward Female (35 beds). Strictly segregated by gender under BR-02 allocation rules.",
    specialties: [
      "General Medical Male Ward (35 Beds)",
      "General Medical Female Ward (35 Beds)",
      "Central Nursing Station 1",
      "Sterilization & Utility Hub",
    ],
  },
  {
    id: "floor-2",
    level: 2,
    name: "Second Floor — Intermediate Care & Semi-Private",
    shortName: "Level 2",
    elevation: 8.4,
    height: 3.2,
    dimensions: { width: 30, depth: 20, height: 3.2 },
    wards: [HOSPITAL_WARDS[2]],
    totalBeds: 24,
    occupiedBeds: 18,
    availableBeds: 5,
    reservedBeds: 1,
    housekeepingBeds: 1,
    description: "24 Semi-Private beds in 12 partitioned twin suites. Features patient recovery lounge, physical therapy bay, and dedicated nurse station.",
    specialties: [
      "Twin Semi-Private Suites (24 Beds)",
      "Post-Surgical Stepdown Monitoring",
      "Physiotherapy & Mobility Bay",
      "Central Nursing Station 2",
    ],
  },
  {
    id: "floor-3",
    level: 3,
    name: "Third Floor — Intensive Care Unit & Executive Suites",
    shortName: "Level 3",
    elevation: 12.6,
    height: 3.4,
    dimensions: { width: 30, depth: 20, height: 3.4 },
    wards: [HOSPITAL_WARDS[3], HOSPITAL_WARDS[4]],
    totalBeds: 26,
    occupiedBeds: 16,
    availableBeds: 9,
    reservedBeds: 1,
    housekeepingBeds: 1,
    description: "10 high-acuity ICU beds with dedicated vitals telemetry and 16 executive private suites. Enforces 08:00 AM ICU anchor and BR-11 GST rules.",
    specialties: [
      "Intensive Care Unit (10 ICU Beds)",
      "Private Deluxe Suites (16 Suites)",
      "Telemetry Monitoring Hub",
      "Air Ambulance Helipad Access (Roof)",
    ],
  },
];

// Summary Statistics
export const HOSPITAL_STATS: HospitalStats = {
  totalFloors: 4,
  totalWards: 5,
  totalBeds: 120,
  occupiedBeds: 84,
  availableBeds: 31,
  reservedBeds: 5,
  housekeepingBeds: 5,
  occupancyRate: 70.0,
};

// Helper lookup functions
export const getBedById = (bedId: string): HospitalBed | undefined => {
  return ALL_HOSPITAL_BEDS.find((b) => b.id === bedId);
};

export const getWardById = (wardId: string): HospitalWard | undefined => {
  return HOSPITAL_WARDS.find((w) => w.id === wardId);
};

export const getFloorById = (floorId: string): HospitalFloor | undefined => {
  return HOSPITAL_FLOORS.find((f) => f.id === floorId);
};

export const getBedsByWard = (wardId: string): HospitalBed[] => {
  return ALL_HOSPITAL_BEDS.filter((b) => b.wardId === wardId);
};

export const getBedsByFloor = (floorId: string): HospitalBed[] => {
  return ALL_HOSPITAL_BEDS.filter((b) => b.floorId === floorId);
};

export const STATUS_CONFIG: Record<
  HospitalBed["status"],
  {
    label: string;
    color: string;
    badgeClass: string;
    description: string;
  }
> = {
  available: {
    label: "Available",
    color: "#22C58B",
    badgeClass: "bg-[#22C58B]/15 text-[#22C58B] border-[#22C58B]/30",
    description: "Sanitized and immediately allocable for incoming admissions",
  },
  occupied: {
    label: "Occupied",
    color: "#38BDF8",
    badgeClass: "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30",
    description: "Active inpatient admitted. Hourly tariff and anchor billing active",
  },
  reserved: {
    label: "Reserved",
    color: "#F5B942",
    badgeClass: "bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30",
    description: "Bed held for scheduled procedure, OT transfer, or approved admission",
  },
  housekeeping: {
    label: "Housekeeping",
    color: "#9B87FF",
    badgeClass: "bg-[#9B87FF]/15 text-[#9B87FF] border-[#9B87FF]/30",
    description: "Post-discharge terminal sterilization. Awaiting clearance signal",
  },
  critical: {
    label: "Critical (ICU)",
    color: "#F06474",
    badgeClass: "bg-[#F06474]/15 text-[#F06474] border-[#F06474]/30",
    description: "High-dependency patient requiring continuous telemetry and 1:1 care",
  },
};
