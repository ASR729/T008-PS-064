"use client";

import {
  Activity,
  BedDouble,
  Brush,
  CircleCheck,
  LockKeyhole,
  Users,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import type { BedCounts } from "../../lib/bed-management";

interface BedSummaryProps {
  counts: BedCounts;
  wardCount: number;
}

const metrics = [
  { key: "total", label: "Total beds", icon: BedDouble, color: "#38D9F5" },
  { key: "occupied", label: "Occupied", icon: Users, color: "#38BDF8" },
  { key: "available", label: "Available", icon: CircleCheck, color: "#22C58B" },
  { key: "reserved", label: "Reserved", icon: LockKeyhole, color: "#F5B942" },
  { key: "housekeeping", label: "Housekeeping", icon: Brush, color: "#9B87FF" },
] as const;

export function BedSummary({ counts, wardCount }: BedSummaryProps) {
  return (
    <section aria-label="Hospital bed summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map(({ key, label, icon: Icon, color }) => (
        <GlassCard key={key} className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#7E90A8]">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#F3F7FC]">{counts[key]}</p>
            </div>
            <span className="rounded-xl border p-2" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}>
              <Icon aria-hidden="true" className="size-4" />
            </span>
          </div>
          {key === "total" && <p className="mt-3 text-[11px] text-[#7E90A8]">Across {wardCount} wards</p>}
          {key === "occupied" && <p className="mt-3 text-[11px] text-[#7E90A8]">{counts.occupancy}% occupancy</p>}
          {key === "available" && <p className="mt-3 text-[11px] text-[#7E90A8]">Ready in demonstration data</p>}
          {key === "reserved" && <p className="mt-3 text-[11px] text-[#7E90A8]">Illustrative holds</p>}
          {key === "housekeeping" && <p className="mt-3 text-[11px] text-[#7E90A8]">Unavailable during cleaning</p>}
        </GlassCard>
      ))}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#7E90A8]">Occupancy</p>
            <p className="mt-2 flex items-baseline gap-1 text-2xl font-semibold tabular-nums text-[#F3F7FC]">{counts.occupancy}<span className="text-sm text-[#7E90A8]">%</span></p>
          </div>
          <span className="rounded-xl border border-[#5685FF]/25 bg-[#5685FF]/10 p-2 text-[#5685FF]"><Activity aria-hidden="true" className="size-4" /></span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Overall bed occupancy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={counts.occupancy}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#22C7A9] to-[#38D9F5]" style={{ width: `${counts.occupancy}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-[#7E90A8]">{counts.occupied} of {counts.total} beds</p>
      </GlassCard>
    </section>
  );
}
