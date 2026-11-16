"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { AppShell } from "../layout/AppShell";
import { BedSummary } from "./BedSummary";
import { BedOccupancy } from "./BedOccupancy";
import { WardOverview } from "./WardOverview";
import { BedGrid } from "./BedGrid";
import { BedDetailsPanel } from "./BedDetailsPanel";
import { getBedManagementSnapshot, getBedManagementStatus, getManagementCategory } from "../../lib/bed-management";
import type { BedManagementCategory, BedStatusFilter } from "../../lib/bed-management";
import type { HospitalBed } from "../../types/hospital-3d";
import { HOSPITAL_FLOORS } from "../../lib/hospital-3d-data";

export function BedManagementPage() {
  const { beds, wards, categories, counts } = useMemo(() => getBedManagementSnapshot(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BedStatusFilter>("all");
  const [category, setCategory] = useState<BedManagementCategory | "all">("all");
  const [wardId, setWardId] = useState("all");
  const [floorId, setFloorId] = useState("all");
  const [selectedBed, setSelectedBed] = useState<HospitalBed | null>(null);

  const visibleBeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return beds.filter((bed) => {
      const ward = wards.find((item) => item.id === bed.wardId);
      const floor = HOSPITAL_FLOORS.find((item) => item.id === bed.floorId);
      const matchesQuery = !query || [bed.id, ward?.name, ward?.shortCode, bed.wardId, bed.category, floor?.shortName]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesQuery
        && (status === "all" || getBedManagementStatus(bed.status) === status)
        && (category === "all" || getManagementCategory(bed.category) === category)
        && (wardId === "all" || bed.wardId === wardId)
        && (floorId === "all" || bed.floorId === floorId);
    });
  }, [beds, wards, search, status, category, wardId, floorId]);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
    setWardId("all");
    setFloorId("all");
  };

  const viewWardBeds = (ward: (typeof wards)[number]) => {
    setWardId(ward.id);
    setFloorId(ward.floorId);
    document.getElementById("bed-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppShell
      currentPageTitle="Bed Management"
      breadcrumbs={[{ label: "Operations" }, { label: "Bed Management" }]}
      initialActiveNav="bed-management"
    >
      {() => (
        <div className="flex flex-col gap-7 pb-4">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#38D9F5]/20 bg-[#38D9F5]/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#38D9F5]"><span className="size-1.5 rounded-full bg-[#22C7A9]" />Hospital operations</div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#F3F7FC] sm:text-3xl">Bed Management</h1>
              <p className="mt-2 text-sm text-[#B6C4D5]">Hospital-wide bed availability, occupancy and ward status.</p>
            </div>
            <Link href="/hospital" className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-[#38D9F5]/25 bg-[#38D9F5]/[0.08] px-4 text-xs font-semibold text-[#38D9F5] transition-colors hover:bg-[#38D9F5]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9F5]">Open 3D Hospital <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </header>

          <div role="note" className="flex items-start gap-3 rounded-2xl border border-[#5685FF]/20 bg-[#5685FF]/[0.06] px-4 py-3 text-xs leading-relaxed text-[#B6C4D5]">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#5685FF]" />
            <p><span className="font-semibold text-[#F3F7FC]">Demonstration data only.</span> Bed statuses and admission references are illustrative and are not live hospital occupancy or patient records. This view does not make reservations, admissions, transfers, or discharge changes.</p>
          </div>

          <BedSummary counts={counts} wardCount={wards.length} />
          <BedOccupancy counts={counts} wards={wards} categories={categories} />
          <WardOverview wards={wards} selectedWardId={wardId} onViewBeds={viewWardBeds} />
          <div id="bed-directory" className="grid scroll-mt-6 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
            <BedGrid
              beds={visibleBeds}
              wards={wards}
              selectedBedId={selectedBed?.id ?? null}
              status={status}
              category={category}
              wardId={wardId}
              floorId={floorId}
              search={search}
              onStatusChange={setStatus}
              onCategoryChange={setCategory}
              onWardChange={setWardId}
              onFloorChange={setFloorId}
              onSearchChange={setSearch}
              onSelectBed={setSelectedBed}
              onReset={resetFilters}
            />
            <aside className="xl:sticky xl:top-24 xl:self-start">
              <BedDetailsPanel bed={selectedBed} wards={wards} onClose={() => setSelectedBed(null)} />
            </aside>
          </div>
        </div>
      )}
    </AppShell>
  );
}
