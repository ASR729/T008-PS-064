import { PatientRecordsProvider } from "../../components/patients/PatientRecordsProvider";

export default function PatientsLayout({ children }: { children: React.ReactNode }) {
  return <PatientRecordsProvider>{children}</PatientRecordsProvider>;
}
