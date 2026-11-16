"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { HospitalHeader } from "../../components/hospital-3d/HospitalHeader";
import { HospitalCanvas } from "../../components/hospital-3d/HospitalCanvas";
import { HospitalInspectorPanel } from "../../components/hospital-3d/HospitalInspectorPanel";
import {
  HOSPITAL_FLOORS,
  ALL_HOSPITAL_BEDS,
  HOSPITAL_STATS,
  HOSPITAL_WARDS,
} from "../../lib/hospital-3d-data";
import {
  HospitalWard,
  HospitalBed,
  BedStatus,
} from "../../types/hospital-3d";
import {
  Building2,
} from "lucide-react";

export default function Hospital3DPage() {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BedStatus | "all">("all");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const bed = ALL_HOSPITAL_BEDS.find((item) => item.id === params.get("bed"));
      if (bed) {
        setSelectedFloorId(bed.floorId);
        setSelectedWardId(bed.wardId);
        setSelectedBedId(bed.id);
        return;
      }

      const ward = HOSPITAL_WARDS.find((item) => item.id === params.get("ward"));
      const floorId = ward?.floorId ?? params.get("floor");
      if (floorId && HOSPITAL_FLOORS.some((item) => item.id === floorId)) {
        setSelectedFloorId(floorId);
      }
      if (ward) setSelectedWardId(ward.id);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleSelectFloor = (floorId: string | null) => {
    setSelectedFloorId(floorId);
    setSelectedWardId(null);
    setSelectedBedId(null);
  };

  const handleSelectWard = (ward: HospitalWard | null) => {
    if (!ward) {
      setSelectedWardId(null);
      return;
    }
    setSelectedWardId(ward.id);
    setSelectedFloorId(ward.floorId);
    setSelectedBedId(null);
  };

  const handleSelectBed = (bed: HospitalBed | null) => {
    if (!bed) {
      setSelectedBedId(null);
      return;
    }
    setSelectedBedId(bed.id);
    setSelectedWardId(bed.wardId);
    setSelectedFloorId(bed.floorId);
  };

  const handleClearSelection = () => {
    setSelectedFloorId(null);
    setSelectedWardId(null);
    setSelectedBedId(null);
    setStatusFilter("all");
  };

  const selectedFloor =
    HOSPITAL_FLOORS.find((f) => f.id === selectedFloorId) || null;
  const selectedWard =
    HOSPITAL_WARDS.find((w) => w.id === selectedWardId) || null;
  const selectedBed =
    ALL_HOSPITAL_BEDS.find((b) => b.id === selectedBedId) || null;

  return (
    <AppShell
      currentPageTitle="3D Hospital Overview"
      breadcrumbs={[
        { label: "Operations" },
        { label: "3D Hospital Visualisation" },
      ]}
      initialActiveNav="hospital-3d"
    >
      {() => (
        <div className="space-y-6">
          {/* Page Header & Simulation Disclaimer */}
          <HospitalHeader onResetAll={handleClearSelection} />

          {/* Main 3D Experience Grid: Canvas (Left) + Glass Inspector Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 3D Scene Viewer Column (8 cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              <HospitalCanvas
                floors={HOSPITAL_FLOORS}
                allBeds={ALL_HOSPITAL_BEDS}
                selectedFloorId={selectedFloorId}
                selectedWardId={selectedWardId}
                selectedBedId={selectedBedId}
                statusFilter={statusFilter}
                onSelectFloor={handleSelectFloor}
                onSelectWard={handleSelectWard}
                onSelectBed={handleSelectBed}
                onSetStatusFilter={setStatusFilter}
                onClearSelection={handleClearSelection}
              />

              {/* Floor Architecture Quick Cards below 3D scene */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...HOSPITAL_FLOORS].reverse().map((floor) => {
                  const isSelected = selectedFloorId === floor.id;
                  return (
                    <button
                      key={floor.id}
                      type="button"
                      onClick={() => handleSelectFloor(isSelected ? null : floor.id)}
                      className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-[#10253F] border-[#38D9F5]/60 shadow-lg shadow-[#38D9F5]/10"
                          : "bg-[#0B1728]/70 border-white/10 hover:border-white/20 hover:bg-[#0E1D31]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#38D9F5]">
                          {floor.shortName}
                        </span>
                        <span className="text-[10px] font-mono text-[#7E90A8]">
                          {floor.totalBeds > 0 ? `${floor.totalBeds} Beds` : "Outpatient"}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#F3F7FC] truncate">
                        {floor.name.split("—")[1]?.trim() || floor.name}
                      </h4>
                      <p className="text-[11px] text-[#7E90A8] truncate mt-0.5">
                        {floor.wards.map((w) => w.shortCode).join(", ") || "Diagnostics & ER"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Information & Inspector Panel Column (4 cols on desktop) */}
            <div className="lg:col-span-4 sticky top-20">
              <HospitalInspectorPanel
                stats={HOSPITAL_STATS}
                floors={HOSPITAL_FLOORS}
                allBeds={ALL_HOSPITAL_BEDS}
                selectedFloor={selectedFloor}
                selectedWard={selectedWard}
                selectedBed={selectedBed}
                onSelectFloor={handleSelectFloor}
                onSelectWard={handleSelectWard}
                onSelectBed={handleSelectBed}
                onClearSelection={handleClearSelection}
              />
            </div>
          </div>

          {/* Hospital Clinical Architecture Reference Grid */}
          <div className="p-6 rounded-2xl bg-[#0B1728]/70 border border-white/10 shadow-xl space-y-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.08] gap-2">
              <div>
                <h3 className="text-sm font-bold font-heading text-[#F3F7FC] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#38D9F5]" />
                  <span>PS-064 Capstone Hospital Clinical Layout Architecture</span>
                </h3>
                <p className="text-xs text-[#7E90A8] mt-0.5">
                  120 inpatient beds mapped across 4 architectural levels with deterministic business rule anchors
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#22C58B]/10 text-[#22C58B] border border-[#22C58B]/30 text-xs font-mono font-semibold self-start sm:self-auto">
                Deterministic Allocation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-[#B6C4D5]">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <span className="font-mono text-[#38D9F5] font-bold block">
                  Level 3: ICU & Executive
                </span>
                <p className="text-[11px] leading-relaxed">
                  10 ICU beds (08:00 AM anchor under BR-01) and 16 Private Deluxe Suites. BR-11 5% GST automatically applies for room rates &gt; ₹5,000/day.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <span className="font-mono text-[#5685FF] font-bold block">
                  Level 2: Semi-Private
                </span>
                <p className="text-[11px] leading-relaxed">
                  24 Semi-Private beds configured in 12 partitioned twin cubicles. Standard 12:00:00 noon anchor with post-surgical step-down support.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <span className="font-mono text-[#22C7A9] font-bold block">
                  Level 1: General Wards
                </span>
                <p className="text-[11px] leading-relaxed">
                  35 Male beds (BR-02 male-only) and 35 Female beds (BR-02 female-only). 48h upgrade-free protection when general beds are full.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <span className="font-mono text-[#9B87FF] font-bold block">
                  Level G: Emergency & Site
                </span>
                <p className="text-[11px] leading-relaxed">
                  24/7 emergency triage intake, ambulance bay, diagnostic imaging (128-slice CT & 3T MRI), and central cashier desk.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
