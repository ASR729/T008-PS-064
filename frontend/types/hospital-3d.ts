import { BedCategory } from "./index";

export type BedStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "housekeeping"
  | "critical";

export interface DemoPatientRecord {
  admissionId: string;
  patientName: string;
  age: number;
  gender: "M" | "F";
  admitTimestamp: string;
  dailyRate: number;
  depositStatus: "Healthy" | "Threshold_80_Alert" | "Settlement_Pending";
  depositAmount: number;
  currentCharges: number;
  nextBillingAnchor: string;
  stepDownEligible?: boolean;
  packageEnrolled?: string;
  primaryDiagnosis: string;
}

export interface HospitalBed {
  id: string;
  bedNumber: number;
  wardId: string;
  floorId: string;
  category: BedCategory;
  status: BedStatus;
  position: [number, number, number]; // 3D x, y, z relative to floor
  rotation?: number; // radians
  patient?: DemoPatientRecord;
  lastStatusUpdate: string;
  notes?: string;
}

export interface HospitalWard {
  id: string;
  floorId: string;
  name: string;
  shortCode: string;
  category: BedCategory;
  color: string;
  genderRule: "MALE_ONLY" | "FEMALE_ONLY" | "ANY";
  dailyRate: number;
  description: string;
  bounds: {
    x: number;
    z: number;
    width: number;
    depth: number;
  };
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  housekeepingBeds: number;
  criticalBeds: number;
  nursingStationPosition: [number, number, number];
}

export interface HospitalFloor {
  id: string;
  level: number;
  name: string;
  shortName: string;
  elevation: number; // Y position in 3D world
  height: number;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  wards: HospitalWard[];
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  housekeepingBeds: number;
  description: string;
  specialties: string[];
}

export interface HospitalStats {
  totalFloors: number;
  totalWards: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  housekeepingBeds: number;
  occupancyRate: number;
}

export type CameraViewPreset = "isometric" | "front" | "top" | "side" | "floor-focus";

export interface SelectionState {
  selectedFloorId: string | null;
  selectedWardId: string | null;
  selectedBedId: string | null;
  hoveredBedId: string | null;
  hoveredWardId: string | null;
  statusFilter: BedStatus | "all";
  isExplodedView: boolean;
  viewPreset: CameraViewPreset;
}
