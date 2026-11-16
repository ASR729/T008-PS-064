"use client";

import { GlassCard } from "../ui/GlassCard";
import { BED_STATUS_STYLES } from "../../lib/bed-management";
import type { BedCounts } from "../../lib/bed-management";
import type { BedWardSummary } from "../../lib/bed-management";
import type { BedManagementCategory } from "../../lib/bed-management";

interface BedOccupancyProps {
  counts: BedCounts;
  wards: BedWardSummary[];
  categories: Array<{ category: BedManagementCategory } & BedCounts>;
}

const categoryNames: Record<BedManagementCategory, string> = {
  GENERAL: "General",
  SEMI_PRIVATE: "Semi-private",
  PRIVATE: "Private",
  DELUXE: "Deluxe",
  ICU: "ICU",
};

export function BedOccupancy({ counts, wards, categories }: BedOccupancyProps) {
  const distribution = ["occupied", "available", "reserved", "housekeeping", "blocked"] as const;
  return (
    <section className="grid gap-4 xl:grid-cols-3" aria-label="Occupancy distribution">
      <GlassCard className="p-5 xl:col-span-1">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#F3F7FC]">Bed status mix</h2>
          <p className="mt-1 text-xs text-[#7E90A8]">Share of all {counts.total} demonstration beds</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${counts.occupied} occupied, ${counts.available} available, ${counts.reserved} reserved, ${counts.housekeeping} in housekeeping, ${counts.blocked} blocked`}>
          {distribution.map((status) => {
            const value = counts[status];
            return value ? <span key={status} title={`${BED_STATUS_STYLES[status].label}: ${value}`} style={{ width: `${(value / counts.total) * 100}%`, backgroundColor: BED_STATUS_STYLES[status].color }} /> : null;
          })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          {distribution.map((status) => (
            <div key={status} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-[#B6C4D5]"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: BED_STATUS_STYLES[status].color }} />{BED_STATUS_STYLES[status].label}</span>
              <span className="font-mono tabular-nums text-[#F3F7FC]">{counts[status]}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 xl:col-span-1">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#F3F7FC]">Occupancy by ward</h2>
          <p className="mt-1 text-xs text-[#7E90A8]">Occupied beds as a share of ward capacity</p>
        </div>
        <div className="flex flex-col gap-4">
          {wards.map((ward) => (
            <div key={ward.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-[#B6C4D5]">{ward.shortCode} · {ward.name}</span>
                <span className="shrink-0 font-mono tabular-nums text-[#F3F7FC]">{ward.occupancy}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${ward.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ward.occupancy}>
                <div className="h-full rounded-full" style={{ width: `${ward.occupancy}%`, backgroundColor: ward.color }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 xl:col-span-1">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#F3F7FC]">Occupancy by category</h2>
          <p className="mt-1 text-xs text-[#7E90A8]">General wards combine male and female beds</p>
        </div>
        <div className="flex flex-col gap-4">
          {categories.map(({ category, occupied, total, occupancy }) => (
            <div key={category}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="text-[#B6C4D5]">{categoryNames[category]}</span>
                <span className="font-mono tabular-nums text-[#F3F7FC]">{total ? `${occupancy}% · ${occupied}/${total}` : "No beds in demo"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${categoryNames[category]} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={occupancy}>
                <div className="h-full rounded-full bg-gradient-to-r from-[#5685FF] to-[#9B87FF]" style={{ width: `${occupancy}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}
