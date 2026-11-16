"use client";

import { X, Search, BedDouble } from "lucide-react";
import type { HospitalBed } from "../../types/hospital-3d";
import type { BedManagementCategory, BedManagementStatus, BedStatusFilter, BedWardSummary } from "../../lib/bed-management";
import { BED_CATEGORIES, BED_STATUS_STYLES, BED_STATUSES, formatBedCategory, getBedManagementStatus } from "../../lib/bed-management";
import { GlassCard } from "../ui/GlassCard";

interface BedGridProps {
  beds: HospitalBed[];
  wards: BedWardSummary[];
  selectedBedId: string | null;
  status: BedStatusFilter;
  category: BedManagementCategory | "all";
  wardId: string;
  floorId: string;
  search: string;
  onStatusChange: (status: BedStatusFilter) => void;
  onCategoryChange: (category: BedManagementCategory | "all") => void;
  onWardChange: (wardId: string) => void;
  onFloorChange: (floorId: string) => void;
  onSearchChange: (value: string) => void;
  onSelectBed: (bed: HospitalBed) => void;
  onReset: () => void;
}

const statusFilters: BedStatusFilter[] = ["all", ...BED_STATUSES];

export function BedGrid({ beds, wards, selectedBedId, status, category, wardId, floorId, search, onStatusChange, onCategoryChange, onWardChange, onFloorChange, onSearchChange, onSelectBed, onReset }: BedGridProps) {
  const grouped = wards.map((ward) => ({
    ward,
    beds: beds.filter((bed) => bed.wardId === ward.id),
  })).filter((group) => group.beds.length > 0);

  return (
    <section aria-labelledby="bed-grid-title">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="bed-grid-title" className="text-base font-semibold text-[#F3F7FC]">Bed directory</h2>
          <p className="mt-1 text-xs text-[#7E90A8]">Select a bed to inspect its illustrative status details.</p>
        </div>
        <p className="text-xs tabular-nums text-[#B6C4D5]" aria-live="polite">{beds.length} {beds.length === 1 ? "bed" : "beds"} shown</p>
      </div>

      <GlassCard className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search beds, wards, or categories</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7E90A8]" />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search bed, ward, category…" className="min-h-11 w-full rounded-xl border border-white/10 bg-[#07111F]/70 py-2 pl-9 pr-9 text-sm text-[#F3F7FC] outline-none placeholder:text-[#7E90A8] focus:border-[#38D9F5]/50 focus:ring-2 focus:ring-[#38D9F5]/15" />
            {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search" className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7E90A8] hover:bg-white/10 hover:text-white"><X aria-hidden="true" className="size-4" /></button>}
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-[#7E90A8]">Ward
            <select id="bed-filter-ward" value={wardId} onChange={(event) => onWardChange(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0B1728] px-3 text-sm normal-case tracking-normal text-[#F3F7FC] outline-none focus:border-[#38D9F5]/50">
              <option value="all">All wards</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-[#7E90A8]">Floor
            <select id="bed-filter-floor" value={floorId} onChange={(event) => onFloorChange(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0B1728] px-3 text-sm normal-case tracking-normal text-[#F3F7FC] outline-none focus:border-[#38D9F5]/50">
              <option value="all">All floors</option><option value="floor-1">Level 1</option><option value="floor-2">Level 2</option><option value="floor-3">Level 3</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-[#7E90A8]">Category
            <select id="bed-filter-category" value={category} onChange={(event) => onCategoryChange(event.target.value as BedManagementCategory | "all")} className="min-h-11 rounded-xl border border-white/10 bg-[#0B1728] px-3 text-sm normal-case tracking-normal text-[#F3F7FC] outline-none focus:border-[#38D9F5]/50">
              <option value="all">All categories</option>{BED_CATEGORIES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filter by bed status">
          <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-[#7E90A8]">Status</span>
          {statusFilters.map((item) => {
            const active = status === item;
            const style = item === "all" ? null : BED_STATUS_STYLES[item as BedManagementStatus];
            return <button key={item} type="button" aria-pressed={active} onClick={() => onStatusChange(item)} className={`min-h-9 rounded-full border px-3 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5] ${active ? style ? `${style.surface} ${style.text}` : "border-[#38D9F5]/40 bg-[#38D9F5]/10 text-[#38D9F5]" : "border-white/10 bg-white/[0.025] text-[#B6C4D5] hover:bg-white/[0.07]"}`}>{item === "all" ? "All" : style?.label}</button>;
          })}
          <button type="button" onClick={onReset} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-[#7E90A8] hover:text-[#F3F7FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]"><X aria-hidden="true" className="size-3.5" />Clear filters</button>
        </div>
      </GlassCard>

      {grouped.length === 0 ? (
        <GlassCard className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
          <span className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[#7E90A8]"><BedDouble aria-hidden="true" className="size-5" /></span>
          <h3 className="mt-3 text-sm font-semibold text-[#F3F7FC]">No beds match these filters</h3>
          <p className="mt-1 max-w-sm text-xs text-[#7E90A8]">Try another bed ID, ward, category, floor, or status.</p>
          <button type="button" onClick={onReset} className="mt-3 min-h-10 rounded-lg px-3 text-xs font-semibold text-[#38D9F5] hover:bg-[#38D9F5]/10">Clear all filters</button>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(({ ward, beds: wardBeds }) => (
            <GlassCard key={ward.id} className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-sm font-semibold text-[#F3F7FC]">{ward.name}</h3><p className="mt-0.5 text-[11px] text-[#7E90A8]">{ward.shortCode} · {ward.floorName} · {wardBeds.length} shown</p></div>
                <span className="text-[11px] text-[#7E90A8]">{formatBedCategory(ward.category)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-8">
                {wardBeds.map((bed) => {
                  const bedStatus = getBedManagementStatus(bed.status);
                  const style = BED_STATUS_STYLES[bedStatus];
                  const selected = selectedBedId === bed.id;
                  return <button key={bed.id} type="button" aria-pressed={selected} onClick={() => onSelectBed(bed)} title={`${bed.id} · ${ward.name} · ${style.label}`} className={`flex min-h-[76px] min-w-0 flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5] ${selected ? "border-[#38D9F5] bg-[#38D9F5]/10 ring-1 ring-[#38D9F5]/30" : `${style.surface} hover:border-white/30`}`}>
                    <span className="flex max-w-full items-center gap-1.5"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: style.color }} /><span className="truncate font-mono text-[10px] text-[#F3F7FC]">{bed.id}</span></span>
                    <span className={`text-[10px] font-medium ${style.text}`}>{style.label}</span>
                  </button>;
                })}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </section>
  );
}
