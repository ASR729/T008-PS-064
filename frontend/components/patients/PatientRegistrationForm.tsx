"use client";

import { FormEvent, useState } from "react";
import { Modal } from "../ui/Modal";
import { PrimaryButton, SecondaryButton } from "../ui/PrimaryButton";
import { useToast } from "../ui/Toast";
import { usePatientRecords } from "./PatientRecordsProvider";
import { getPatientAge } from "../../lib/patient-data";
import type { Patient, PatientGender } from "../../types/patient";

interface Props { isOpen: boolean; onClose: () => void }
type FormValues = Record<string, string>;
const initialValues: FormValues = { name: "", dob: "", gender: "", bloodGroup: "", identityReference: "", phone: "", email: "", address: "", city: "", postalCode: "", emergencyName: "", relationship: "", emergencyPhone: "", allergies: "", conditions: "", notes: "" };

export function PatientRegistrationForm({ isOpen, onClose }: Props) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormValues>({});
  const { registerPatient, patients } = usePatientRecords();
  const { addToast } = useToast();
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormValues = {};
    if (!values.name.trim()) nextErrors.name = "Enter the patient name.";
    const dobParts = values.dob.split("-").map(Number);
    const [year, month, day] = dobParts;
    const dob = new Date(year, month - 1, day);
    const isValidDob = dobParts.length === 3
      && Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
      && dob.getFullYear() === year && dob.getMonth() === month - 1 && dob.getDate() === day;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!values.dob || !isValidDob) nextErrors.dob = "Enter a valid date of birth.";
    else if (dob > today) nextErrors.dob = "Date of birth cannot be in the future.";
    if (!values.gender) nextErrors.gender = "Select a gender.";
    if (!/^\+?[\d\s().-]{7,20}$/.test(values.phone.trim())) nextErrors.phone = "Enter a valid phone number.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (!values.address.trim()) nextErrors.address = "Enter a street address.";
    if (!values.city.trim()) nextErrors.city = "Enter a city.";
    if (!values.emergencyName.trim()) nextErrors.emergencyName = "Enter an emergency contact name.";
    if (!values.relationship.trim()) nextErrors.relationship = "Enter the contact relationship.";
    if (!/^\+?[\d\s().-]{7,20}$/.test(values.emergencyPhone.trim())) nextErrors.emergencyPhone = "Enter a valid emergency contact number.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      addToast({ title: "Registration needs attention", description: "Review the highlighted fields before adding this demonstration record.", type: "error" });
      return;
    }

    const patient: Patient = {
      id: `DEMO-P${String(Math.max(0, ...patients.map((item) => Number(item.id.slice(-3)) || 0)) + 1).padStart(3, "0")}`,
      name: values.name.trim(), dateOfBirth: values.dob, gender: values.gender as PatientGender,
      bloodGroup: values.bloodGroup || undefined, identityReference: values.identityReference.trim() || undefined, status: "active", registeredAt: new Date().toISOString().slice(0, 10),
      contact: { phone: values.phone.trim(), email: values.email.trim() || undefined, address: values.address.trim(), city: values.city.trim(), postalCode: values.postalCode.trim() },
      emergencyContact: { name: values.emergencyName.trim(), relationship: values.relationship.trim(), phone: values.emergencyPhone.trim() },
      medical: { allergies: values.allergies.split(",").map((item) => item.trim()).filter(Boolean), conditions: values.conditions.split(",").map((item) => item.trim()).filter(Boolean), notes: values.notes.trim() || undefined },
      admissions: [],
    };
    registerPatient(patient);
    setValues(initialValues);
    setErrors({});
    onClose();
    addToast({ title: "Demonstration record added", description: "This record exists only in the current frontend session. No admission, bed, or billing action was created.", type: "success" });
  };

  const field = (key: keyof FormValues, label: string, required = false, type = "text", hint?: string) => (
    <label className="flex flex-col gap-1.5 text-xs text-[#B6C4D5]" key={key}>
      <span>{label}{required && <span className="text-[#22C7A9]"> *</span>}</span>
      <input type={type} value={values[key] ?? ""} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} className="min-h-11 rounded-xl border border-white/10 bg-[#07111F]/80 px-3 text-sm text-[#F3F7FC] outline-none transition focus:border-[#38D9F5]/60 focus:ring-2 focus:ring-[#38D9F5]/15 aria-[invalid=true]:border-[#F06474]/60" />
      {hint && <span className="text-[11px] text-[#7E90A8]">{hint}</span>}
      {errors[key] && <span id={`${key}-error`} role="alert" className="text-[11px] text-[#F28A96]">{errors[key]}</span>}
    </label>
  );

  return <Modal isOpen={isOpen} onClose={onClose} title="Register patient" subtitle="Local demonstration record only" maxWidth="2xl" className="max-h-[92vh]">
    <form onSubmit={submit} noValidate>
      <div className="mb-4 rounded-xl border border-[#F5B942]/20 bg-[#F5B942]/[0.06] p-3 text-[11px] leading-relaxed text-[#D8C58F]">Registration updates this browser session only. It does not save to a permanent medical record or trigger admission, bed allocation, or billing.</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 border-b border-white/10 pb-2 text-sm font-semibold text-[#F3F7FC]">Personal information</h3>
        {field("name", "Patient name", true)}{field("dob", "Date of birth", true, "date", values.dob ? `Age at registration: ${getPatientAge(values.dob)} years` : undefined)}
        <label className="flex flex-col gap-1.5 text-xs text-[#B6C4D5]">Gender <select id="patient-gender" value={values.gender} onChange={(event) => update("gender", event.target.value)} aria-invalid={Boolean(errors.gender)} aria-describedby={errors.gender ? "gender-error" : undefined} className="min-h-11 rounded-xl border border-white/10 bg-[#07111F] px-3 text-sm text-[#F3F7FC] focus:border-[#38D9F5]/60 focus:outline-none"><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select>{errors.gender && <span id="gender-error" role="alert" className="text-[11px] text-[#F28A96]">{errors.gender}</span>}</label>
        {field("bloodGroup", "Blood group (optional)")}{field("identityReference", "Patient reference (optional)")}{field("phone", "Phone number", true, "tel")}{field("email", "Email (optional)", false, "email")}
        <h3 className="sm:col-span-2 mt-2 border-b border-white/10 pb-2 text-sm font-semibold text-[#F3F7FC]">Contact information</h3>
        {field("address", "Street address", true)}{field("city", "City", true)}{field("postalCode", "Postal code")}
        <h3 className="sm:col-span-2 mt-2 border-b border-white/10 pb-2 text-sm font-semibold text-[#F3F7FC]">Emergency contact</h3>
        {field("emergencyName", "Contact name", true)}{field("relationship", "Relationship", true)}{field("emergencyPhone", "Contact phone", true, "tel")}
        <h3 className="sm:col-span-2 mt-2 border-b border-white/10 pb-2 text-sm font-semibold text-[#F3F7FC]">Medical summary <span className="font-normal text-[#7E90A8]">(illustrative, not clinically verified)</span></h3>
        <label className="flex flex-col gap-1.5 text-xs text-[#B6C4D5]">Known allergies (comma-separated)<textarea value={values.allergies} onChange={(event) => update("allergies", event.target.value)} rows={2} className="rounded-xl border border-white/10 bg-[#07111F]/80 p-3 text-sm text-[#F3F7FC] focus:border-[#38D9F5]/60 focus:outline-none" /></label>
        <label className="flex flex-col gap-1.5 text-xs text-[#B6C4D5]">Existing conditions (comma-separated)<textarea value={values.conditions} onChange={(event) => update("conditions", event.target.value)} rows={2} className="rounded-xl border border-white/10 bg-[#07111F]/80 p-3 text-sm text-[#F3F7FC] focus:border-[#38D9F5]/60 focus:outline-none" /></label>
        <label className="sm:col-span-2 flex flex-col gap-1.5 text-xs text-[#B6C4D5]">Notes <textarea value={values.notes} onChange={(event) => update("notes", event.target.value)} rows={3} className="rounded-xl border border-white/10 bg-[#07111F]/80 p-3 text-sm text-[#F3F7FC] focus:border-[#38D9F5]/60 focus:outline-none" /><span className="text-[11px] text-[#7E90A8]">Demonstration notes only; not clinically verified.</span></label>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end"><SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton><PrimaryButton type="submit">Add demonstration record</PrimaryButton></div>
    </form>
  </Modal>;
}
