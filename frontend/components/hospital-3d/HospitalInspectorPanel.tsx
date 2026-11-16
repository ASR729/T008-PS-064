"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import {
  HospitalFloor,
  HospitalWard,
  HospitalBed,
  HospitalStats,
} from "../../types/hospital-3d";
import { STATUS_CONFIG } from "../../lib/hospital-3d-data";
import {
  Building2,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

interface HospitalInspectorPanelProps {
  stats: HospitalStats;
  floors: HospitalFloor[];
  allBeds: HospitalBed[];
  selectedFloor: HospitalFloor | null;
  selectedWard: HospitalWard | null;
  selectedBed: HospitalBed | null;
  onSelectFloor: (floorId: string | null) => void;
  onSelectWard: (ward: HospitalWard | null) => void;
  onSelectBed: (bed: HospitalBed | null) => void;
  onClearSelection: () => void;
}

export const HospitalInspectorPanel: React.FC<HospitalInspectorPanelProps> = ({
  stats,
  floors,
  allBeds,
  selectedFloor,
  selectedWard,
  selectedBed,
  onSelectFloor,
  onSelectWard,
  onSelectBed,
  onClearSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Handle bed quick-search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cleanQuery = searchQuery.trim().toUpperCase();
    const foundBed = allBeds.find(
      (b) =>
        b.id.toUpperCase().includes(cleanQuery) ||
        `B-${cleanQuery}` === b.id.toUpperCase()
    );
    if (foundBed) {
      onSelectBed(foundBed);
    }
  };

  // Determine current active view level in panel
  const isViewingBed = selectedBed !== null;
  const isViewingWard = !isViewingBed && selectedWard !== null;
  const isViewingFloor = !isViewingBed && !isViewingWard && selectedFloor !== null;

  return (
    <div className="w-full flex flex-col rounded-2xl bg-[#0B1728]/85 backdrop-blur-2xl border border-white/10 shadow-2xl p-5 space-y-5">
      {/* Search Bed & Selection Breadcrumb Header */}
      <div className="space-y-3 pb-3 border-b border-white/[0.08]">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E90A8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bed (e.g. ICU-001, GWM-014)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#07111F]/80 border border-white/10 text-xs text-[#F3F7FC] placeholder-[#7E90A8] focus:outline-none focus:border-[#38D9F5]/60 focus:ring-1 focus:ring-[#38D9F5]/30 transition-all font-mono"
          />
        </form>

        {/* Selection Breadcrumbs & Reset */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#7E90A8] truncate">
            <button
              type="button"
              onClick={() => {
                onSelectFloor(null);
                onSelectWard(null);
                onSelectBed(null);
              }}
              className="hover:text-[#38D9F5] transition-colors cursor-pointer font-medium"
            >
              Hospital
            </button>
            {selectedFloor && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectWard(null);
                    onSelectBed(null);
                  }}
                  className="hover:text-[#38D9F5] transition-colors cursor-pointer font-medium text-[#B6C4D5]"
                >
                  {selectedFloor.shortName}
                </button>
              </>
            )}
            {selectedWard && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => onSelectBed(null)}
                  className="hover:text-[#38D9F5] transition-colors cursor-pointer font-medium text-[#B6C4D5]"
                >
                  {selectedWard.shortCode}
                </button>
              </>
            )}
            {selectedBed && (
              <>
                <span>/</span>
                <span className="font-mono font-bold text-[#38D9F5]">
                  {selectedBed.id}
                </span>
              </>
            )}
          </div>

          {(selectedFloor || selectedWard || selectedBed) && (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[11px] text-[#F06474] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: SELECTED BED DETAIL VIEW */}
      {isViewingBed && selectedBed && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Bed Title Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-[#F3F7FC]">
                  {selectedBed.id}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                    STATUS_CONFIG[selectedBed.status].badgeClass
                  )}
                >
                  {STATUS_CONFIG[selectedBed.status].label}
                </span>
              </div>
              <p className="text-xs text-[#7E90A8] mt-0.5">
                Bed #{selectedBed.bedNumber} • Category: {selectedBed.category.replace(/_/g, " ")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectBed(null)}
              className="p-1 rounded-lg text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.08]"
              title="Close bed view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rate & Billing Rules Banner */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#B6C4D5]">Daily Category Tariff</span>
            <div className="text-right">
              <span className="font-mono font-bold text-sm text-[#38D9F5]">
                ₹{selectedBed.patient?.dailyRate?.toLocaleString("en-IN") ||
                  (selectedBed.category === "ICU"
                    ? "8,500"
                    : selectedBed.category === "PRIVATE"
                    ? "5,500"
                    : selectedBed.category === "SEMI_PRIVATE"
                    ? "2,800"
                    : "1,200")}
              </span>
              <span className="text-[10px] text-[#7E90A8] block">/ day</span>
            </div>
          </div>

          {/* OCCUPIED BED PATIENT DETAILS */}
          {selectedBed.status === "occupied" && selectedBed.patient && (
            <div className="space-y-3 p-3.5 rounded-xl bg-[#10233B]/60 border border-white/10 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-[#F3F7FC] font-semibold">
                  <User className="w-3.5 h-3.5 text-[#38D9F5]" />
                  <span>{selectedBed.patient.patientName}</span>
                </div>
                <span className="font-mono text-[11px] text-[#7E90A8]">
                  {selectedBed.patient.gender} • Age {selectedBed.patient.age}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#7E90A8] block">Admission ID</span>
                  <span className="font-mono font-medium text-[#B6C4D5]">
                    {selectedBed.patient.admissionId}
                  </span>
                </div>
                <div>
                  <span className="text-[#7E90A8] block">Admitted At</span>
                  <span className="font-mono text-[#B6C4D5]">
                    {selectedBed.patient.admitTimestamp.split(" ")[1]}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#7E90A8] block">Diagnosis</span>
                  <span className="text-[#F3F7FC] font-medium">
                    {selectedBed.patient.primaryDiagnosis}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[#7E90A8] block">Deposit Status</span>
                    <span
                      className={cn(
                        "font-semibold font-mono",
                        selectedBed.patient.depositStatus === "Threshold_80_Alert"
                          ? "text-[#F5B942]"
                          : "text-[#22C58B]"
                      )}
                    >
                      {selectedBed.patient.depositStatus === "Threshold_80_Alert"
                        ? "80% Threshold Exceeded (BR-07)"
                        : "Deposit Healthy"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#7E90A8] block">Charges / Deposit</span>
                    <span className="font-mono text-[#F3F7FC]">
                      ₹{selectedBed.patient.currentCharges.toLocaleString("en-IN")} / ₹
                      {selectedBed.patient.depositAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 p-2 rounded-lg bg-[#07111F]/70 border border-white/5 flex items-center gap-2 text-[10px] text-[#B6C4D5]">
                  <Clock className="w-3.5 h-3.5 text-[#38D9F5] shrink-0" />
                  <span>
                    Next Tariff Anchor:{" "}
                    <strong className="text-white">
                      {selectedBed.patient.nextBillingAnchor}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AVAILABLE BED STATUS */}
          {selectedBed.status === "available" && (
            <div className="p-4 rounded-xl bg-[#22C58B]/10 border border-[#22C58B]/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#22C58B] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bed Ready for Immediate Inpatient Allocation</span>
              </div>
              <p className="text-[11px] text-[#B6C4D5] leading-relaxed">
                Terminal sterilization completed. Telemetry and oxygen lines inspected. Obey gender parity requirements under BR-02 during allocation.
              </p>
            </div>
          )}

          {/* HOUSEKEEPING STATUS */}
          {selectedBed.status === "housekeeping" && (
            <div className="p-4 rounded-xl bg-[#9B87FF]/10 border border-[#9B87FF]/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#9B87FF] font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Sanitization Hold Active</span>
              </div>
              <p className="text-[11px] text-[#B6C4D5] leading-relaxed">
                Vacated post-discharge. Bed unavailable for assignment until formal HOUSEKEEPING_CLEARED signal is received.
              </p>
            </div>
          )}

          {/* RESERVED STATUS */}
          {selectedBed.status === "reserved" && (
            <div className="p-4 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#F5B942] font-semibold">
                <Clock className="w-4 h-4" />
                <span>Bed Held for Scheduled Admission</span>
              </div>
              <p className="text-[11px] text-[#B6C4D5] leading-relaxed">
                Pre-authorized surgical or emergency hold. Deposit verification locked.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const parentWard = floors
                  .flatMap((f) => f.wards)
                  .find((w) => w.id === selectedBed.wardId);
                if (parentWard) onSelectWard(parentWard);
                onSelectBed(null);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-[#B6C4D5] hover:text-[#F3F7FC] transition-colors cursor-pointer text-center"
            >
              View Parent Ward
            </button>
            <button
              type="button"
              onClick={() => onSelectBed(null)}
              className="py-2 px-4 rounded-xl bg-[#38D9F5]/20 hover:bg-[#38D9F5]/30 border border-[#38D9F5]/40 text-xs font-semibold text-[#38D9F5] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: SELECTED WARD SUMMARY VIEW */}
      {isViewingWard && selectedWard && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedWard.color }}
                />
                <h3 className="text-base font-bold font-heading text-[#F3F7FC]">
                  {selectedWard.name}
                </h3>
              </div>
              <p className="text-xs text-[#7E90A8] mt-0.5">
                {selectedWard.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectWard(null)}
              className="p-1 rounded-lg text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.08]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key Ward Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Daily Tariff</span>
              <span className="font-mono font-bold text-sm text-[#38D9F5]">
                ₹{selectedWard.dailyRate.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Gender Rule</span>
              <span className="font-semibold text-xs text-[#F3F7FC]">
                {selectedWard.genderRule === "MALE_ONLY"
                  ? "Male Only (BR-02)"
                  : selectedWard.genderRule === "FEMALE_ONLY"
                  ? "Female Only (BR-02)"
                  : "All Genders"}
              </span>
            </div>
          </div>

          {/* Ward Bed Census Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1F36]/80 border border-white/10 space-y-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-[#F3F7FC]">
              <span>Ward Bed Census</span>
              <span className="font-mono text-[#38D9F5]">
                {selectedWard.occupiedBeds} / {selectedWard.totalBeds} Occupied (
                {Math.round((selectedWard.occupiedBeds / selectedWard.totalBeds) * 100)}%)
              </span>
            </div>

            {/* Census Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
              <div
                style={{
                  width: `${(selectedWard.occupiedBeds / selectedWard.totalBeds) * 100}%`,
                }}
                className="bg-[#38BDF8]"
                title="Occupied"
              />
              <div
                style={{
                  width: `${(selectedWard.reservedBeds / selectedWard.totalBeds) * 100}%`,
                }}
                className="bg-[#F5B942]"
                title="Reserved"
              />
              <div
                style={{
                  width: `${(selectedWard.housekeepingBeds / selectedWard.totalBeds) * 100}%`,
                }}
                className="bg-[#9B87FF]"
                title="Housekeeping"
              />
              <div
                style={{
                  width: `${(selectedWard.availableBeds / selectedWard.totalBeds) * 100}%`,
                }}
                className="bg-[#22C58B]"
                title="Available"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-mono">
              <div className="p-1 rounded bg-[#38BDF8]/10 text-[#38BDF8]">
                <strong>{selectedWard.occupiedBeds}</strong> Occ
              </div>
              <div className="p-1 rounded bg-[#22C58B]/10 text-[#22C58B]">
                <strong>{selectedWard.availableBeds}</strong> Avail
              </div>
              <div className="p-1 rounded bg-[#F5B942]/10 text-[#F5B942]">
                <strong>{selectedWard.reservedBeds}</strong> Rsv
              </div>
              <div className="p-1 rounded bg-[#9B87FF]/10 text-[#9B87FF]">
                <strong>{selectedWard.housekeepingBeds}</strong> HK
              </div>
            </div>
          </div>

          {/* Interactive Mini Bed Matrix for this Ward */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#7E90A8]">
              <span>Click any bed to inspect:</span>
              <span className="text-[10px]">
                {allBeds.filter((b) => b.wardId === selectedWard.id).length} Beds
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1.5 rounded-xl bg-white/[0.02] border border-white/10">
              {allBeds
                .filter((b) => b.wardId === selectedWard.id)
                .map((bed) => {
                  const config = STATUS_CONFIG[bed.status];
                  return (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => onSelectBed(bed)}
                      className="p-1 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer hover:scale-105 flex flex-col items-center justify-center gap-0.5"
                      style={{
                        backgroundColor: `${config.color}15`,
                        borderColor: `${config.color}40`,
                        color: "#F3F7FC",
                      }}
                      title={`${bed.id} (${config.label})`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span>{bed.bedNumber}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: SELECTED FLOOR SUMMARY VIEW */}
      {isViewingFloor && selectedFloor && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#38D9F5]/15 text-[#38D9F5] border border-[#38D9F5]/30">
                {selectedFloor.shortName}
              </span>
              <h3 className="text-base font-bold font-heading text-[#F3F7FC] mt-1.5">
                {selectedFloor.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectFloor(null)}
              className="p-1 rounded-lg text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.08]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#B6C4D5] leading-relaxed">
            {selectedFloor.description}
          </p>

          {/* Floor Stats Pill */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Wards</span>
              <span className="font-mono font-bold text-sm text-[#F3F7FC]">
                {selectedFloor.wards.length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Beds</span>
              <span className="font-mono font-bold text-sm text-[#38D9F5]">
                {selectedFloor.totalBeds}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Occupancy</span>
              <span className="font-mono font-bold text-sm text-[#22C58B]">
                {selectedFloor.totalBeds > 0
                  ? `${Math.round(
                      (selectedFloor.occupiedBeds / selectedFloor.totalBeds) * 100
                    )}%`
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Wards on this Floor */}
          {selectedFloor.wards.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#7E90A8] uppercase tracking-wider">
                Clinical Wards on this Floor
              </span>
              <div className="space-y-1.5">
                {selectedFloor.wards.map((ward) => (
                  <button
                    key={ward.id}
                    type="button"
                    onClick={() => onSelectWard(ward)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all text-xs cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: ward.color }}
                      />
                      <span className="font-medium text-[#F3F7FC]">{ward.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#7E90A8]">
                      <span>{ward.occupiedBeds}/{ward.totalBeds} Occ</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#38D9F5]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specialties List */}
          <div className="p-3 rounded-xl bg-[#07111F]/60 border border-white/10 space-y-1.5">
            <span className="text-[11px] font-semibold text-[#38D9F5] block">
              Floor Specialties & Facilities:
            </span>
            <ul className="text-xs text-[#B6C4D5] space-y-1">
              {selectedFloor.specialties.map((spec, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#38D9F5]" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODE 4: HOSPITAL OVERVIEW (DEFAULT WHEN NO SELECTION) */}
      {!isViewingBed && !isViewingWard && !isViewingFloor && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#38D9F5]" />
              <h3 className="text-base font-bold font-heading text-[#F3F7FC]">
                Hospital Facility Overview
              </h3>
            </div>
            <p className="text-xs text-[#7E90A8] mt-0.5">
              Interactive 3D building visualising 120 inpatient beds across 4 clinical levels
            </p>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Total Beds</span>
              <span className="font-mono font-bold text-lg text-[#F3F7FC]">
                {stats.totalBeds}
              </span>
              <span className="text-[10px] text-[#7E90A8] block mt-0.5">
                5 Clinical Categories
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-[#7E90A8] block">Occupancy Ratio</span>
              <span className="font-mono font-bold text-lg text-[#38D9F5]">
                {stats.occupancyRate}%
              </span>
              <span className="text-[10px] text-[#22C58B] block mt-0.5">
                {stats.occupiedBeds} Inpatients Admitted
              </span>
            </div>
          </div>

          {/* Bed Status Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1F36]/80 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#B6C4D5] font-semibold">
              <span>Bed Availability Breakdown</span>
              <span className="text-[10px] font-mono text-[#22C58B]">
                {stats.availableBeds} Ready
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {[
                {
                  label: "Occupied Beds",
                  count: stats.occupiedBeds,
                  color: "#38BDF8",
                  pct: Math.round((stats.occupiedBeds / stats.totalBeds) * 100),
                },
                {
                  label: "Available Beds",
                  count: stats.availableBeds,
                  color: "#22C58B",
                  pct: Math.round((stats.availableBeds / stats.totalBeds) * 100),
                },
                {
                  label: "Reserved Beds",
                  count: stats.reservedBeds,
                  color: "#F5B942",
                  pct: Math.round((stats.reservedBeds / stats.totalBeds) * 100),
                },
                {
                  label: "Housekeeping / Sanitization",
                  count: stats.housekeepingBeds,
                  color: "#9B87FF",
                  pct: Math.round((stats.housekeepingBeds / stats.totalBeds) * 100),
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#7E90A8]">{item.label}</span>
                    <span className="font-mono text-[#F3F7FC]">
                      {item.count} beds ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Select Floor Links */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#7E90A8] uppercase tracking-wider block">
              Jump to Specific Floor:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[...floors].reverse().map((floor) => (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => onSelectFloor(floor.id)}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-[#38D9F5]/10 border border-white/10 hover:border-[#38D9F5]/40 transition-all text-xs cursor-pointer text-left flex items-center justify-between"
                >
                  <span className="font-medium text-[#F3F7FC]">
                    {floor.shortName}
                  </span>
                  <span className="text-[10px] font-mono text-[#7E90A8]">
                    {floor.totalBeds > 0 ? `${floor.totalBeds}b` : "Triage"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deterministic Rules & Disclaimer Note at Bottom */}
      <div className="pt-3 border-t border-white/[0.08] text-[11px] text-[#7E90A8] space-y-1">
        <div className="flex items-center gap-1.5 text-[#22C58B]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold">BR-01 & BR-02 Compliant</span>
        </div>
        <p className="leading-relaxed">
          General wards enforce strict gender segregation. ICU 08:00 AM anchor synchronized. All 120 bed statuses reflect illustrative simulation.
        </p>
      </div>
    </div>
  );
};
