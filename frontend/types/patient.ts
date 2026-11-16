export type PatientRecordStatus = "active" | "inactive";
export type PatientGender = "Female" | "Male" | "Non-binary" | "Prefer not to say";

export interface PatientContact {
  phone: string;
  email?: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientMedicalSummary {
  allergies?: string[];
  conditions?: string[];
  notes?: string;
  historySummary?: string;
}

export interface PatientAdmissionReference {
  reference: string;
  admitDate: string;
  dischargeDate?: string;
  status: "Admitted" | "Pending discharge" | "Transferred" | "Discharged";
  category: string;
  bedId?: string;
  wardId?: string;
  floorId?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: PatientGender;
  bloodGroup?: string;
  identityReference?: string;
  status: PatientRecordStatus;
  registeredAt: string;
  contact: PatientContact;
  emergencyContact: EmergencyContact;
  medical: PatientMedicalSummary;
  admissions: PatientAdmissionReference[];
}
