import type { Metadata } from "next";
import { PatientDirectory } from "../../components/patients/PatientDirectory";

export const metadata: Metadata = {
  title: "Patient Management | PS-064",
  description: "Patient directory, demographics and illustrative patient records for the PS-064 demonstration environment.",
};

export default function PatientsPage() {
  return <PatientDirectory />;
}
