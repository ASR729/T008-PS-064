"use client";

import React from "react";
import { cn } from "../../lib/utils";
import {
  HospitalFloor,
  HospitalWard,
  HospitalBed,
  BedStatus,
} from "../../types/hospital-3d";
import { STATUS_CONFIG } from "../../lib/hospital-3d-data";
import { AlertCircle } from "lucide-react";

interface WebGLFallbackViewProps {
  floors: HospitalFloor[];
  allBeds: HospitalBed[];
  selectedFloorId: string | null;
  selectedWardId: string | null;
  selectedBedId: string | null;
  statusFilter: BedStatus | "all";
  onSelectFloor: (floorId: string | null) => void;
  onSelectWard: (ward: HospitalWard | null) => void;
  onSelectBed: (bed: HospitalBed | null) => void;
  onSetStatusFilter: (status: BedStatus | "all") => void;
}

export const WebGLFallbackView: React.FC<WebGLFallbackViewProps> = ({
  floors,
  allBeds,
  selectedFloorId,
  selectedWardId,
  selectedBedId,
  statusFilter,
  onSelectFloor,
  onSelectWard,
  onSelectBed,
  onSetStatusFilter,
}) => {
  const currentFloorId = selectedFloorId || "floor-1";
  const activeFloor = floors.find((f) => f.id === currentFloorId) || floors[1];
  const floorBeds = allBeds.filter((b) => b.floorId === activeFloor.id);

  return (
    <div className="w-full rounded-2xl bg-[#091728] border border-white/10 p-5 shadow-2xl space-y-5">
      {/* Fallback Notice Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#5685FF]/10 border border-[#5685FF]/30 text-xs">
        <div className="flex items-center gap-2 text-[#38D9F5]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            2D Architectural Schematic Mode Active (Accessible Floorplan & Bed Grid)
          </span>
        </div>
        <span className="text-[11px] text-[#7E90A8] hidden sm:inline">
          Full Interactive Bed Inspection Enabled
        </span>
      </div>

      {/* Floor Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[...floors].reverse().map((floor) => {
            const isSelected = activeFloor.id === floor.id;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => onSelectFloor(floor.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
                  isSelected
                    ? "bg-[#38D9F5]/20 text-[#38D9F5] border border-[#38D9F5]/40 shadow-sm"
                    : "text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.06] border border-transparent"
                )}
              >
                <span>{floor.shortName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[#7E90A8]">
                  {floor.totalBeds} Beds
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          {(["all", "available", "occupied", "reserved", "housekeeping"] as const).map(
            (st) => {
              const isCurrent = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onSetStatusFilter(st)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer",
                    isCurrent
                      ? "bg-white/20 text-white font-semibold"
                      : "text-[#7E90A8] hover:text-white"
                  )}
                >
                  {st}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Floor Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold font-heading text-[#F3F7FC]">
            {activeFloor.name}
          </h3>
          <p className="text-xs text-[#7E90A8] mt-0.5">{activeFloor.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[#38BDF8]">{activeFloor.occupiedBeds} Occupied</span>
          <span className="text-[#7E90A8]">•</span>
          <span className="text-[#22C58B]">{activeFloor.availableBeds} Available</span>
          <span className="text-[#7E90A8]">•</span>
          <span className="text-[#F5B942]">{activeFloor.reservedBeds} Reserved</span>
        </div>
      </div>

      {/* Wards and Bed Grid */}
      {activeFloor.wards.length === 0 ? (
        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-2">
          <p className="text-sm font-semibold text-[#B6C4D5]">
            Ground Floor — Outpatient & Diagnostics Hub
          </p>
          <p className="text-xs text-[#7E90A8] max-w-lg mx-auto">
            Emergency trauma intake, radiology, automated laboratory, and central cashier services. Inpatient beds are situated on Levels 1, 2, and 3.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeFloor.wards.map((ward) => {
            const wardBeds = floorBeds.filter((b) => b.wardId === ward.id);
            const isWardSelected = selectedWardId === ward.id;

            return (
              <div
                key={ward.id}
                onClick={() => onSelectWard(ward)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer",
                  isWardSelected
                    ? "bg-[#10253F] border-[#38D9F5]/50 shadow-lg shadow-[#38D9F5]/10"
                    : "bg-[#0E1D31]/70 border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ward.color }}
                    />
                    <span className="text-xs font-bold text-[#F3F7FC]">
                      {ward.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.06] text-[#38D9F5]">
                    ₹{ward.dailyRate.toLocaleString("en-IN")}/day
                  </span>
                </div>

                {/* Bed Matrix Pills */}
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 pt-2">
                  {wardBeds.map((bed) => {
                    const isSelected = selectedBedId === bed.id;
                    const config = STATUS_CONFIG[bed.status];
                    const isFiltered =
                      statusFilter !== "all" && bed.status !== statusFilter;

                    return (
                      <button
                        key={bed.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBed(bed);
                        }}
                        className={cn(
                          "p-1 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                          isSelected
                            ? "bg-[#38D9F5]/30 border-[#38D9F5] text-white shadow-md"
                            : isFiltered
                            ? "opacity-25 border-transparent bg-white/[0.02] text-[#7E90A8]"
                            : "hover:scale-105 border-white/10 hover:border-white/25 text-[#F3F7FC]"
                        )}
                        style={{
                          backgroundColor: isSelected
                            ? undefined
                            : `${config.color}15`,
                          borderColor: isSelected ? undefined : `${config.color}40`,
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
            );
          })}
        </div>
      )}
    </div>
  );
};
