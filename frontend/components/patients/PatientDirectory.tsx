"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ClipboardList, FilePlus2, Search, UserRound, Users, X } from "lucide-react";
import { AppShell } from "../layout/AppShell";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { StatusBadge } from "../ui/StatusBadge";
import { usePatientRecords } from "./PatientRecordsProvider";
import { PatientRegistrationForm } from "./PatientRegistrationForm";
import { DEMO_REFERENCE_DATE, getPatientAge } from "../../lib/patient-data";
import type { Patient, PatientGender, PatientRecordStatus } from "../../types/patient";

const ageGroups = ["All ages", "0–17", "18–34", "35–54", "55+"] as const;
type AgeGroup = (typeof ageGroups)[number];

function activeAdmission(patient: Patient) {
  return patient.admissions.find((admission) => admission.status !== "Discharged");
}

function matchesAge(age: number, group: AgeGroup) {
  if (group === "All ages") return true;
  if (group === "0–17") return age < 18;
  if (group === "18–34") return age >= 18 && age <= 34;
  if (group === "35–54") return age >= 35 && age <= 54;
  return age >= 55;
}

export function PatientDirectory() {
  const { patients } = usePatientRecords();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PatientRecordStatus | "all">("all");
  const [admission, setAdmission] = useState<"all" | "yes" | "no">("all");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("All ages");
  const [gender, setGender] = useState<PatientGender | "all">("all");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const activeCount = patients.filter((patient) => patient.status === "active").length;
  const inactiveCount = patients.length - activeCount;
  const admissionCount = patients.filter((patient) => Boolean(activeAdmission(patient))).length;
  const recentCount = patients.filter((patient) => {
    const registered = new Date(`${patient.registeredAt}T00:00:00`);
    const threshold = new Date(DEMO_REFERENCE_DATE);
    threshold.setDate(threshold.getDate() - 30);
    return registered >= threshold && registered <= DEMO_REFERENCE_DATE;
  }).length;
  const reviewCount = patients.filter((patient) => !patient.contact.email || !patient.medical.historySummary).length;

  const filteredPatients = useMemo(() => {
    const search = query.trim().toLowerCase();
    return patients.filter((patient) => {
      const age = getPatientAge(patient.dateOfBirth);
      const hasAdmission = Boolean(activeAdmission(patient));
      const searchable = [patient.id, patient.name, patient.contact.phone, patient.contact.email].some((value) => value?.toLowerCase().includes(search));
      return (!search || searchable)
        && (status === "all" || patient.status === status)
        && (admission === "all" || (admission === "yes") === hasAdmission)
        && matchesAge(age, ageGroup)
        && (gender === "all" || patient.gender === gender);
    });
  }, [patients, query, status, admission, ageGroup, gender]);

  const clearFilters = () => { setQuery(""); setStatus("all"); setAdmission("all"); setAgeGroup("All ages"); setGender("all"); };
  const filtersApplied = Boolean(query || status !== "all" || admission !== "all" || ageGroup !== "All ages" || gender !== "all");
  const genderCounts = ["Female", "Male", "Non-binary", "Prefer not to say"].map((label) => ({ label, count: patients.filter((patient) => patient.gender === label).length }));
  const maxGender = Math.max(1, ...genderCounts.map((item) => item.count));

  return <AppShell currentPageTitle="Patient Management" breadcrumbs={[{ label: "Operations" }, { label: "Patients" }]} initialActiveNav="patients">
    {() => <div className="flex flex-col gap-6 pb-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#22C7A9]/20 bg-[#22C7A9]/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#22C7A9]">Patient records</div><h1 className="text-2xl font-semibold tracking-tight text-[#F3F7FC] sm:text-3xl">Patient Management</h1><p className="mt-2 text-sm text-[#B6C4D5]">Patient records, demographics and patient information.</p></div>
        <PrimaryButton onClick={() => setRegistrationOpen(true)} icon={<FilePlus2 className="size-4" />}>Register patient</PrimaryButton>
      </header>
      <div role="note" className="rounded-2xl border border-[#5685FF]/20 bg-[#5685FF]/[0.06] px-4 py-3 text-xs leading-relaxed text-[#B6C4D5]"><span className="font-semibold text-[#F3F7FC]">Fictional demonstration data.</span> Records are illustrative and not clinically verified. New patient registration remains in frontend session state only; no permanent record, admission, bed, or billing action is created.</div>
      <section aria-label="Patient record summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric icon={<Users />} label="Registered" value={patients.length} color="cyan" />
        <Metric icon={<UserRound />} label="Active records" value={activeCount} color="teal" />
        <Metric icon={<UserRound />} label="Inactive records" value={inactiveCount} color="violet" />
        <Metric icon={<Activity />} label="Active admissions" value={admissionCount} color="blue" />
        <Metric icon={<FilePlus2 />} label="New · 30 days" value={recentCount} color="teal" />
        <Metric icon={<ClipboardList />} label="Review suggested" value={reviewCount} color="warning" />
      </section>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <GlassCard className="p-4 sm:p-5" glowColor="cyan"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-semibold text-[#F3F7FC]">Patient directory</h2><p className="mt-1 text-xs text-[#7E90A8]">Search and combine filters to find a demonstration record.</p></div><span aria-live="polite" className="text-xs tabular-nums text-[#7E90A8]">{filteredPatients.length} of {patients.length} records</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">Search by patient ID, name, phone, or email</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7E90A8]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patients" className="min-h-11 w-full rounded-xl border border-white/10 bg-[#07111F]/80 pl-9 pr-9 text-sm text-[#F3F7FC] outline-none focus:border-[#38D9F5]/60 focus:ring-2 focus:ring-[#38D9F5]/15"/>{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#7E90A8] hover:text-white"><X className="size-4"/></button>}</label>
            <select aria-label="Filter by record status" value={status} onChange={(event) => setStatus(event.target.value as PatientRecordStatus | "all")} className="min-h-11 rounded-xl border border-white/10 bg-[#07111F] px-3 text-xs text-[#D4DEEA] focus:border-[#38D9F5]/50 focus:outline-none"><option value="all">All record statuses</option><option value="active">Active records</option><option value="inactive">Inactive records</option></select>
            <select aria-label="Filter by admission" value={admission} onChange={(event) => setAdmission(event.target.value as "all" | "yes" | "no")} className="min-h-11 rounded-xl border border-white/10 bg-[#07111F] px-3 text-xs text-[#D4DEEA] focus:border-[#38D9F5]/50 focus:outline-none"><option value="all">Any admission</option><option value="yes">Active admission</option><option value="no">No active admission</option></select>
            <select aria-label="Filter by age group" value={ageGroup} onChange={(event) => setAgeGroup(event.target.value as AgeGroup)} className="min-h-11 rounded-xl border border-white/10 bg-[#07111F] px-3 text-xs text-[#D4DEEA] focus:border-[#38D9F5]/50 focus:outline-none">{ageGroups.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Filter by gender" value={gender} onChange={(event) => setGender(event.target.value as PatientGender | "all")} className="min-h-11 rounded-xl border border-white/10 bg-[#07111F] px-3 text-xs text-[#D4DEEA] focus:border-[#38D9F5]/50 focus:outline-none"><option value="all">All genders</option>{genderCounts.map(({ label }) => <option key={label}>{label}</option>)}</select>
          </div>
          {filtersApplied && <div className="mt-3 flex justify-end"><button type="button" onClick={clearFilters} className="rounded-lg px-2 py-1 text-xs font-medium text-[#38D9F5] hover:bg-[#38D9F5]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]">Clear filters</button></div>}
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-white/[0.08] md:block">
            <table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-white/[0.035] text-[10px] uppercase tracking-wider text-[#7E90A8]"><tr><th className="px-4 py-3 font-medium">Patient</th><th className="px-4 py-3 font-medium">Age / gender</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Record</th><th className="px-4 py-3 font-medium">Admission</th><th className="px-4 py-3 font-medium">Registered</th><th><span className="sr-only">Action</span></th></tr></thead><tbody className="divide-y divide-white/[0.06]">{filteredPatients.map((patient) => {
              const current = activeAdmission(patient);
              return <tr key={patient.id} className="transition-colors hover:bg-white/[0.025]"><td className="px-4 py-3"><Link href={`/patients/${encodeURIComponent(patient.id)}`} className="font-semibold text-[#F3F7FC] hover:text-[#38D9F5] focus-visible:outline-none focus-visible:underline">{patient.name}</Link><div className="mt-1 font-mono text-[10px] tabular-nums text-[#7E90A8]">{patient.id}</div></td><td className="px-4 py-3 tabular-nums text-[#B6C4D5]">{getPatientAge(patient.dateOfBirth)} · {patient.gender}</td><td className="px-4 py-3"><div className="tabular-nums text-[#B6C4D5]">{patient.contact.phone}</div><div className="mt-1 max-w-40 truncate text-[#7E90A8]">{patient.contact.email || "No email provided"}</div></td><td className="px-4 py-3"><StatusBadge status={patient.status === "active" ? "success" : "neutral"} label={patient.status === "active" ? "Active" : "Inactive"} size="sm" /></td><td className="px-4 py-3">{current ? <span className="inline-flex items-center gap-1.5 text-[#22C7A9]"><span className="size-1.5 rounded-full bg-current"/>Active</span> : <span className="text-[#7E90A8]">None</span>}</td><td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-[#7E90A8]">{patient.registeredAt}</td><td className="px-3 py-3"><Link href={`/patients/${encodeURIComponent(patient.id)}`} aria-label={`View ${patient.name} profile`} className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#7E90A8] hover:border-[#38D9F5]/40 hover:text-[#38D9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]"><ArrowRight className="size-4"/></Link></td></tr>;
            })}</tbody></table>
            {filteredPatients.length === 0 && <div className="p-8 text-center"><div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-white/[0.05] text-[#7E90A8]"><Search className="size-5"/></div><h3 className="text-sm font-semibold text-[#F3F7FC]">No matching patients</h3><p className="mt-1 text-xs text-[#7E90A8]">Try another search or clear your filters.</p>{filtersApplied && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-medium text-[#38D9F5] hover:underline">Clear filters</button>}</div>}
          </div>
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {filteredPatients.map((patient) => {
              const current = activeAdmission(patient);
              return <article key={patient.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link href={`/patients/${encodeURIComponent(patient.id)}`} className="break-words text-sm font-semibold text-[#F3F7FC] hover:text-[#38D9F5]">{patient.name}</Link><p className="mt-1 font-mono text-[10px] tabular-nums text-[#7E90A8]">{patient.id}</p></div><StatusBadge status={patient.status === "active" ? "success" : "neutral"} label={patient.status === "active" ? "Active" : "Inactive"} size="sm" /></div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><p className="text-[10px] uppercase tracking-wider text-[#7E90A8]">Age · gender</p><p className="mt-1 tabular-nums text-[#B6C4D5]">{getPatientAge(patient.dateOfBirth)} · {patient.gender}</p></div><div><p className="text-[10px] uppercase tracking-wider text-[#7E90A8]">Admission</p><p className="mt-1 text-[#B6C4D5]">{current ? "Active" : "None"}</p></div></div>
                <p className="mt-3 break-all text-xs tabular-nums text-[#B6C4D5]">{patient.contact.phone}</p><p className="mt-1 break-all text-xs text-[#7E90A8]">{patient.contact.email || "No email provided"}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="font-mono text-[10px] tabular-nums text-[#7E90A8]">Registered {patient.registeredAt}</span><Link href={`/patients/${encodeURIComponent(patient.id)}`} aria-label={`View ${patient.name} profile`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-[#B6C4D5] hover:border-[#38D9F5]/40 hover:text-[#38D9F5]"><span>Profile</span><ArrowRight className="size-3.5"/></Link></div>
              </article>;
            })}
            {filteredPatients.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-6 text-center"><h3 className="text-sm font-semibold text-[#F3F7FC]">No matching patients</h3><p className="mt-1 text-xs text-[#7E90A8]">Try another search or clear your filters.</p>{filtersApplied && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-medium text-[#38D9F5] hover:underline">Clear filters</button>}</div>}
          </div>
        </GlassCard>
        <GlassCard className="p-4 sm:p-5" glowColor="violet"><div className="mb-4"><h2 className="text-sm font-semibold text-[#F3F7FC]">Gender distribution</h2><p className="mt-1 text-xs text-[#7E90A8]">Calculated from all {patients.length} records</p></div><div className="flex flex-col gap-4">{genderCounts.map(({ label, count }) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span className="text-[#B6C4D5]">{label}</span><span className="font-mono tabular-nums text-[#7E90A8]">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-[#38D9F5] to-[#9B87FF]" style={{ width: `${(count / maxGender) * 100}%` }} /></div></div>)}</div><Link href="/beds" className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-xs text-[#B6C4D5] transition-colors hover:border-[#38D9F5]/40 hover:text-[#38D9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]">Bed management <ArrowRight className="size-3.5"/></Link></GlassCard>
      </div>
      <PatientRegistrationForm isOpen={registrationOpen} onClose={() => setRegistrationOpen(false)} />
    </div>}
  </AppShell>;
}

function Metric({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: "cyan" | "teal" | "blue" | "violet" | "warning" }) {
  const tones = {
    cyan: "bg-[#38D9F5]/10 text-[#38D9F5]",
    teal: "bg-[#22C7A9]/10 text-[#22C7A9]",
    blue: "bg-[#5685FF]/10 text-[#5685FF]",
    violet: "bg-[#9B87FF]/10 text-[#9B87FF]",
    warning: "bg-[#F5B942]/10 text-[#F5B942]",
  };
  return <GlassCard className="min-w-0 p-3 sm:p-4"><div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${tones[color]}`}>{icon}</div><div className="font-heading text-2xl font-semibold tabular-nums text-[#F3F7FC]">{value}</div><div className="mt-1 text-[10px] leading-tight text-[#7E90A8] sm:text-xs">{label}</div></GlassCard>;
}
