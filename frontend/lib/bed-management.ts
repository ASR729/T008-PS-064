import {
  ALL_HOSPITAL_BEDS,
  HOSPITAL_FLOORS,
  HOSPITAL_WARDS,
} from "./hospital-3d-data";
import type { BedCategory } from "../types";
import type { HospitalBed, HospitalWard } from "../types/hospital-3d";

export type BedManagementStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "housekeeping"
  | "blocked";

export type BedManagementCategory =
  | "GENERAL"
  | "SEMI_PRIVATE"
  | "PRIVATE"
  | "DELUXE"
  | "ICU";

export type BedStatusFilter = "all" | BedManagementStatus;

export interface BedCounts {
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  housekeeping: number;
  blocked: number;
  occupancy: number;
}

export interface BedWardSummary extends HospitalWard, BedCounts {
  floorName: string;
}

export const BED_STATUSES: BedManagementStatus[] = [
  "available",
  "occupied",
  "reserved",
  "housekeeping",
  "blocked",
];

export const BED_CATEGORIES: BedManagementCategory[] = [
  "GENERAL",
  "SEMI_PRIVATE",
  "PRIVATE",
  "DELUXE",
  "ICU",
];

export const BED_STATUS_STYLES: Record<
  BedManagementStatus,
  { label: string; color: string; text: string; surface: string }
> = {
  available: {
    label: "Available",
    color: "#22C58B",
    text: "text-[#22C58B]",
    surface: "bg-[#22C58B]/10 border-[#22C58B]/30",
  },
  occupied: {
    label: "Occupied",
    color: "#38BDF8",
    text: "text-[#38BDF8]",
    surface: "bg-[#38BDF8]/10 border-[#38BDF8]/30",
  },
  reserved: {
    label: "Reserved",
    color: "#F5B942",
    text: "text-[#F5B942]",
    surface: "bg-[#F5B942]/10 border-[#F5B942]/30",
  },
  housekeeping: {
    label: "Housekeeping",
    color: "#9B87FF",
    text: "text-[#9B87FF]",
    surface: "bg-[#9B87FF]/10 border-[#9B87FF]/30",
  },
  blocked: {
    label: "Blocked",
    color: "#F06474",
    text: "text-[#F06474]",
    surface: "bg-[#F06474]/10 border-[#F06474]/30",
  },
};

const countBeds = (beds: HospitalBed[]): BedCounts => {
  const counts = {
    total: beds.length,
    occupied: 0,
    available: 0,
    reserved: 0,
    housekeeping: 0,
    blocked: 0,
    occupancy: 0,
  };

  for (const bed of beds) {
    const status = bed.status === "critical" ? "occupied" : bed.status;
    if (
      status === "occupied" ||
      status === "available" ||
      status === "reserved" ||
      status === "housekeeping"
    ) {
      counts[status] += 1;
    }
  }

  counts.occupancy = counts.total
    ? Math.round((counts.occupied / counts.total) * 1000) / 10
    : 0;
  return counts;
};

export const getBedManagementSnapshot = () => {
  const wards: BedWardSummary[] = HOSPITAL_WARDS.map((ward) => {
    const beds = ALL_HOSPITAL_BEDS.filter((bed) => bed.wardId === ward.id);
    const floor = HOSPITAL_FLOORS.find((item) => item.id === ward.floorId);
    return {
      ...ward,
      ...countBeds(beds),
      floorName: floor?.shortName ?? "Unknown floor",
    };
  });

  const counts = countBeds(ALL_HOSPITAL_BEDS);
  const categories = BED_CATEGORIES.map((category) => {
    const beds = ALL_HOSPITAL_BEDS.filter(
      (bed) => getManagementCategory(bed.category) === category,
    );
    return { category, ...countBeds(beds) };
  });

  return { beds: ALL_HOSPITAL_BEDS, wards, categories, counts };
};

export const getManagementCategory = (
  category: BedCategory,
): BedManagementCategory => {
  if (category === "GENERAL_MALE" || category === "GENERAL_FEMALE") {
    return "GENERAL";
  }
  return category;
};

export const getBedManagementStatus = (
  status: HospitalBed["status"],
): BedManagementStatus => (status === "critical" ? "occupied" : status);

export const getWardCategoryLabel = (ward: HospitalWard) => {
  if (ward.category === "GENERAL_MALE") return "General · Male";
  if (ward.category === "GENERAL_FEMALE") return "General · Female";
  if (ward.category === "PRIVATE") return "Private / Deluxe";
  return ward.category.replaceAll("_", " ");
};

export const formatBedCategory = (category: BedCategory) => {
  if (category === "GENERAL_MALE") return "General · Male";
  if (category === "GENERAL_FEMALE") return "General · Female";
  if (category === "SEMI_PRIVATE") return "Semi-private";
  if (category === "PRIVATE") return "Private / Deluxe";
  return "ICU";
};
