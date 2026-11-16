"use client";

import Link from "next/link";
import { ArrowUpRight, BedDouble, CalendarClock, Check, X } from "lucide-react";
import type { HospitalBed } from "../../types/hospital-3d";
import type { BedWardSummary } from "../../lib/bed-management";
import { BED_STATUS_STYLES, formatBedCategory, getBedManagementStatus } from "../../lib/bed-management";
import { GlassCard } from "../ui/GlassCard";

interface BedDetailsPanelProps {
  bed: HospitalBed | null;
  wards: BedWardSummary[];
  onClose: () => void;
}

export function BedDetailsPanel({ bed, wards, onClose }: BedDetailsPanelProps) {
  if (!bed) {
    return <GlassCard className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
      <span className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[#7E90A8]"><BedDouble aria-hidden="true" className="size-5" /></span>
      <h2 className="mt-3 text-sm font-semibold text-[#F3F7FC]">Bed details</h2>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#7E90A8]">Select any bed tile to see its ward, category, status, and demonstration reference.</p>
    </GlassCard>;
  }

  const ward = wards.find((item) => item.id === bed.wardId);
  const status = getBedManagementStatus(bed.status);
  const style = BED_STATUS_STYLES[status];
  const hospitalHref = `/hospital?floor=${encodeURIComponent(bed.floorId)}&ward=${encodeURIComponent(bed.wardId)}&bed=${encodeURIComponent(bed.id)}`;

  return <GlassCard className="p-5" aria-labelledby="selected-bed-title">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-widest text-[#7E90A8]">Selected bed</p><h2 id="selected-bed-title" className="mt-1 font-mono text-lg font-semibold text-[#F3F7FC]">{bed.id}</h2></div>
      <button type="button" onClick={onClose} aria-label="Close bed details" className="inline-flex size-10 items-center justify-center rounded-lg text-[#7E90A8] hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]"><X aria-hidden="true" className="size-4" /></button>
    </div>
    <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.surface} ${style.text}`}><Check aria-hidden="true" className="size-3.5" />{style.label}</span>
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
      <div><dt className="text-[#7E90A8]">Ward</dt><dd className="mt-1 font-medium text-[#F3F7FC]">{ward?.name ?? "Unknown ward"}</dd><dd className="mt-0.5 text-[10px] text-[#7E90A8]">{ward?.shortCode ?? bed.wardId}</dd></div>
      <div><dt className="text-[#7E90A8]">Floor</dt><dd className="mt-1 font-medium text-[#F3F7FC]">{ward?.floorName ?? "—"}</dd></div>
      <div><dt className="text-[#7E90A8]">Category</dt><dd className="mt-1 font-medium text-[#F3F7FC]">{formatBedCategory(bed.category)}</dd></div>
      <div><dt className="text-[#7E90A8]">Gender restriction</dt><dd className="mt-1 font-medium text-[#F3F7FC]">{ward?.genderRule === "MALE_ONLY" ? "Male only" : ward?.genderRule === "FEMALE_ONLY" ? "Female only" : "None"}</dd></div>
      <div className="col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><dt className="flex items-center gap-1.5 text-[#7E90A8]"><CalendarClock aria-hidden="true" className="size-3.5" />Last status update</dt><dd className="mt-1 font-mono text-[11px] text-[#B6C4D5]">{bed.lastStatusUpdate}</dd></div>
    </dl>
    {status === "occupied" && <div className="mt-4 rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/[0.06] p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[#7E90A8]">Illustrative admission reference</p><p className="mt-1 font-mono text-sm text-[#38BDF8]">{bed.patient?.admissionId ?? "Demo record"}</p><p className="mt-1 text-[10px] text-[#7E90A8]">Fictional demonstration data only. No real patient information.</p></div>}
    {(status === "reserved" || status === "housekeeping") && <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-xs leading-relaxed text-[#B6C4D5]">{status === "reserved" ? "Illustrative reservation status. No admission or reservation action is available in this demonstration." : bed.notes ?? "Illustrative housekeeping status. No clearance action is available in this demonstration."}</p>}
    <Link href={hospitalHref} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#38D9F5]/25 bg-[#38D9F5]/[0.08] px-4 text-xs font-semibold text-[#38D9F5] transition-colors hover:bg-[#38D9F5]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]">Inspect ward in 3D <ArrowUpRight aria-hidden="true" className="size-4" /></Link>
    <p className="mt-3 text-center text-[10px] leading-relaxed text-[#7E90A8]">All bed and operational details shown here are illustrative demo data.</p>
  </GlassCard>;
}
