import { MOCK_ADMISSIONS } from "./mock-data";
import { getBedById } from "./hospital-3d-data";
import type { Patient, PatientGender } from "../types/patient";

const admissionDetails: Record<string, { dob: string; gender: PatientGender; phone: string; city: string }> = {
  "Vikram R. Singhania": { dob: "1968-05-14", gender: "Male", phone: "+1 (555) 010-1021", city: "Northbridge" },
  "Ananya Deshmukh": { dob: "1992-09-22", gender: "Female", phone: "+1 (555) 010-1034", city: "Northbridge" },
  "Meenakshi Pillai": { dob: "1959-02-11", gender: "Female", phone: "+1 (555) 010-1067", city: "Lakeview" },
  "Rohan V. Sharma": { dob: "1997-07-06", gender: "Male", phone: "+1 (555) 010-1029", city: "Westhaven" },
  "Sunita S. Rao": { dob: "1954-11-18", gender: "Female", phone: "+1 (555) 010-1072", city: "Northbridge" },
  "Karan Johar": { dob: "1981-03-30", gender: "Male", phone: "+1 (555) 010-1045", city: "Lakeview" },
};

const supplementalPatients: Patient[] = [
  {
    id: "DEMO-P007", name: "Mira Kapoor", dateOfBirth: "1989-10-04", gender: "Female", bloodGroup: "A+", status: "active", registeredAt: "2025-12-09",
    contact: { phone: "+1 (555) 010-1041", email: "mira.kapoor@example.test", address: "18 Harbor Walk", city: "Westhaven", postalCode: "10007" },
    emergencyContact: { name: "Arjun Kapoor", relationship: "Sibling", phone: "+1 (555) 010-2041" },
    medical: { allergies: [], conditions: [], historySummary: "No demonstration history on file." }, admissions: [],
  },
  {
    id: "DEMO-P009", name: "Dev Patel", dateOfBirth: "1976-01-25", gender: "Male", bloodGroup: "O+", status: "inactive", registeredAt: "2024-04-17",
    contact: { phone: "+1 (555) 010-1058", email: "dev.patel@example.test", address: "42 Orchard Lane", city: "Lakeview", postalCode: "10012" },
    emergencyContact: { name: "Nina Patel", relationship: "Partner", phone: "+1 (555) 010-2058" },
    medical: { allergies: ["Illustrative: pollen"], conditions: [], notes: "Demonstration note only; not clinically verified." }, admissions: [],
  },
  {
    id: "DEMO-P010", name: "Leela Menon", dateOfBirth: "2001-06-12", gender: "Female", status: "active", registeredAt: "2026-02-03",
    contact: { phone: "+1 (555) 010-1022", address: "7 Cedar Court", city: "Northbridge", postalCode: "10003" },
    emergencyContact: { name: "Ravi Menon", relationship: "Parent", phone: "+1 (555) 010-2022" },
    medical: { historySummary: "No demonstration history on file." }, admissions: [],
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  ...MOCK_ADMISSIONS.map((admission, index): Patient => {
    const details = admissionDetails[admission.patientName] ?? {
      dob: `${new Date().getFullYear() - admission.age}-06-15`,
      gender: (admission.gender === "M" ? "Male" : "Female") as PatientGender,
      phone: `+1 (555) 010-${String(1000 + index).slice(-4)}`,
      city: "Northbridge",
    };
    const status = admission.status === "DISCHARGED" ? "Discharged" as const
      : admission.status === "PENDING_DISCHARGE" ? "Pending discharge" as const
      : admission.status === "TRANSFERRED" ? "Transferred" as const : "Admitted" as const;
    const normalizedBedId = admission.bedId
      .replace(/^B-GW-M-(\d+)$/, "B-GWM-$1")
      .replace(/^B-GW-F-(\d+)$/, "B-GWF-$1");
    const referencedBed = getBedById(normalizedBedId);
    return {
      id: `DEMO-P${String(index + 1).padStart(3, "0")}`,
      name: admission.patientName,
      dateOfBirth: details.dob,
      gender: details.gender,
      bloodGroup: ["A+", "O+", "B+", "AB+", "O−", "A−"][index],
      status: "active",
      registeredAt: `2025-${String(index + 1).padStart(2, "0")}-12`,
      contact: { phone: details.phone, email: `${admission.patientName.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.test`, address: `${14 + index} Willow Street`, city: details.city, postalCode: `1000${index + 1}` },
      emergencyContact: { name: `Demo Contact ${index + 1}`, relationship: index % 2 ? "Sibling" : "Partner", phone: `+1 (555) 011-${String(2000 + index)}` },
      medical: { allergies: index % 3 === 0 ? ["Illustrative: latex"] : [], conditions: index % 2 === 0 ? ["Demonstration condition"] : [], notes: "Fictional demonstration information; not clinically verified.", historySummary: "Illustrative summary only. Refer to the clinical record in a real care setting." },
      admissions: [{ reference: admission.admissionNo, admitDate: admission.admitDate.slice(0, 10), status, category: admission.category.replaceAll("_", " "), bedId: referencedBed?.id ?? normalizedBedId, wardId: referencedBed?.wardId, floorId: referencedBed?.floorId }],
    };
  }),
  ...supplementalPatients,
];

export const DEMO_REFERENCE_DATE = new Date("2026-11-16T00:00:00");

export function getPatientAge(dateOfBirth: string, now = DEMO_REFERENCE_DATE): number {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return 0;
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
