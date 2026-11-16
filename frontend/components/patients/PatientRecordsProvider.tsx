"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { INITIAL_PATIENTS } from "../../lib/patient-data";
import type { Patient } from "../../types/patient";

interface PatientRecordsContextValue {
  patients: Patient[];
  registerPatient: (patient: Patient) => void;
}

const PatientRecordsContext = createContext<PatientRecordsContextValue | null>(null);

export function PatientRecordsProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const value = useMemo(() => ({
    patients,
    registerPatient: (patient: Patient) => setPatients((records) => [patient, ...records]),
  }), [patients]);
  return <PatientRecordsContext.Provider value={value}>{children}</PatientRecordsContext.Provider>;
}

export function usePatientRecords() {
  const context = useContext(PatientRecordsContext);
  if (!context) throw new Error("usePatientRecords must be used within PatientRecordsProvider");
  return context;
}
