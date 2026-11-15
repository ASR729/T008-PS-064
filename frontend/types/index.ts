export type BedCategory =
  | "GENERAL_MALE"
  | "GENERAL_FEMALE"
  | "SEMI_PRIVATE"
  | "PRIVATE"
  | "ICU";

export type AdmissionStatus =
  | "ADMITTED"
  | "DISCHARGED"
  | "TRANSFERRED"
  | "PENDING_DISCHARGE"
  | "ICU_STEPDOWN_NEEDED";

export interface BedCategoryMetric {
  category: BedCategory;
  displayName: string;
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  dailyRate: number;
  color: string;
  genderRule?: "MALE_ONLY" | "FEMALE_ONLY" | "ANY";
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  rawValue?: number;
  subtitle: string;
  trend?: {
    value: string;
    isPositive: boolean;
    period: string;
  };
  statusColor: "cyan" | "teal" | "blue" | "violet" | "warning" | "critical";
  iconName: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  eventType:
    | "ADMIT"
    | "TRANSFER"
    | "PROCEDURE"
    | "TOP_UP_DEMAND"
    | "INTERIM_BILL"
    | "DISCHARGE"
    | "HOUSEKEEPING_CLEARED"
    | "RESERVE_BED";
  title: string;
  description: string;
  patientId: string;
  patientName: string;
  category?: BedCategory;
  bedId?: string;
  amount?: number;
  severity: "info" | "success" | "warning" | "critical";
}

export interface DemoAdmission {
  id: string;
  admissionNo: string;
  patientName: string;
  age: number;
  gender: "M" | "F";
  category: BedCategory;
  bedId: string;
  admitDate: string;
  initialDeposit: number;
  currentCharges: number;
  balance: number;
  threshold80Exceeded: boolean;
  packageEnrolled?: string;
  status: AdmissionStatus;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "DEMAND" | "BED" | "SYSTEM" | "DISCHARGE";
  severity: "critical" | "warning" | "info" | "success";
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string | number;
  badgeVariant?: "cyan" | "warning" | "critical" | "neutral" | "violet";
  isComingSoon?: boolean;
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "info" | "warning" | "error";
  duration?: number;
}
