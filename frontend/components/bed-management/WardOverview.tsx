"use client";

import Link from "next/link";
import { ArrowUpRight, BedDouble, CircleCheck, LockKeyhole, Brush } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import type { BedWardSummary } from "../../lib/bed-management";
import { getWardCategoryLabel } from "../../lib/bed-management";

interface WardOverviewProps {
  wards: BedWardSummary[];
  selectedWardId: string;
  onViewBeds: (ward: BedWardSummary) => void;
}

export function WardOverview({ wards, selectedWardId, onViewBeds }: WardOverviewProps) {
  return (
    <section aria-labelledby="ward-overview-title">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="ward-overview-title" className="text-base font-semibold text-[#F3F7FC]">Ward overview</h2>
          <p className="mt-1 text-xs text-[#7E90A8]">Capacity and status are calculated from the shared bed records.</p>
        </div>
        <span className="text-[11px] text-[#7E90A8]">{wards.length} wards · {wards.reduce((sum, ward) => sum + ward.total, 0)} beds</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {wards.map((ward) => (
          <GlassCard key={ward.id} className={`p-4 transition-colors ${selectedWardId === ward.id ? "border-[#38D9F5]/50 bg-[#102137]/85" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ward.color }} />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[#F3F7FC]">{ward.name}</h3>
                  <p className="mt-1 text-[11px] text-[#7E90A8]">{ward.shortCode} <span aria-hidden="true">·</span> {ward.floorName}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-[#B6C4D5]">{getWardCategoryLabel(ward)}</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div><span className="text-2xl font-semibold tabular-nums text-[#F3F7FC]">{ward.occupied}</span><span className="text-xs text-[#7E90A8]"> / {ward.total} occupied</span></div>
              <div className="text-right"><span className="text-lg font-semibold tabular-nums text-[#38D9F5]">{ward.occupancy}%</span><p className="text-[10px] text-[#7E90A8]">occupancy</p></div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${ward.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ward.occupancy}>
              <div className="h-full rounded-full" style={{ width: `${ward.occupancy}%`, backgroundColor: ward.color }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-[#B6C4D5] sm:grid-cols-4">
              <span className="inline-flex items-center gap-1.5"><CircleCheck aria-hidden="true" className="size-3 text-[#22C58B]" />{ward.available} available</span>
              <span className="inline-flex items-center gap-1.5"><LockKeyhole aria-hidden="true" className="size-3 text-[#F5B942]" />{ward.reserved} reserved</span>
              <span className="inline-flex items-center gap-1.5"><Brush aria-hidden="true" className="size-3 text-[#9B87FF]" />{ward.housekeeping} cleaning</span>
              <span className="inline-flex items-center gap-1.5"><BedDouble aria-hidden="true" className="size-3 text-[#F06474]" />{ward.blocked} blocked</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#7E90A8]">{ward.occupancy >= 85 ? "High occupancy" : ward.occupancy >= 65 ? "Moderate occupancy" : "Capacity available"}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onViewBeds(ward)} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-[#38D9F5] transition-colors hover:bg-[#38D9F5]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]">View beds</button>
                <Link href={`/hospital?floor=${encodeURIComponent(ward.floorId)}&ward=${encodeURIComponent(ward.id)}`} aria-label={`Inspect ${ward.name} in the 3D hospital`} title="Inspect in 3D" className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 text-[#B6C4D5] transition-colors hover:border-[#38D9F5]/40 hover:text-[#38D9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]"><ArrowUpRight aria-hidden="true" className="size-4" /></Link>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
