import type { Metadata } from "next";
import { Suspense } from "react";
import { PatientProfile } from "../../../components/patients/PatientProfile";

export const metadata: Metadata = {
  title: "Patient Profile | PS-064",
  description: "Demonstration patient profile and admission history.",
};

export default function PatientProfilePage({ params }: { params: Promise<{ patientId: string }> }) {
  return <Suspense fallback={<main className="p-8 text-sm text-[#7E90A8]">Loading patient profile…</main>}><PatientProfileContent params={params} /></Suspense>;
}

async function PatientProfileContent({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return <PatientProfile patientId={decodeURIComponent(patientId)} />;
}
