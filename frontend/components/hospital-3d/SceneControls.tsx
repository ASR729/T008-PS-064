"use client";

import React from "react";
import { cn } from "../../lib/utils";
import {
  CameraViewPreset,
  BedStatus,
  HospitalFloor,
} from "../../types/hospital-3d";
import { STATUS_CONFIG } from "../../lib/hospital-3d-data";
import {
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Filter,
  X,
} from "lucide-react";

interface SceneControlsProps {
  floors: HospitalFloor[];
  selectedFloorId: string | null;
  selectedWardId: string | null;
  selectedBedId: string | null;
  isExplodedView: boolean;
  viewPreset: CameraViewPreset;
  statusFilter: BedStatus | "all";
  onToggleExplodedView: () => void;
  onSetViewPreset: (preset: CameraViewPreset) => void;
  onSelectFloor: (floorId: string | null) => void;
  onSetStatusFilter: (status: BedStatus | "all") => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onClearSelection: () => void;
}

export const SceneControls: React.FC<SceneControlsProps> = ({
  floors,
  selectedFloorId,
  selectedWardId,
  selectedBedId,
  isExplodedView,
  viewPreset,
  statusFilter,
  onToggleExplodedView,
  onSetViewPreset,
  onSelectFloor,
  onSetStatusFilter,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onClearSelection,
}) => {
  const hasAnySelection =
    selectedFloorId !== null || selectedWardId !== null || selectedBedId !== null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-10">
      {/* TOP BAR OVERLAY: Floor Selector & Clear Selection */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Floor Quick Tabs */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-[#0B1728]/85 backdrop-blur-xl border border-white/10 shadow-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => onSelectFloor(null)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
              selectedFloorId === null
                ? "bg-[#38D9F5]/20 text-[#38D9F5] border border-[#38D9F5]/40 shadow-sm"
                : "text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.06]"
            )}
          >
            All Floors
          </button>

          {/* Reverse to show top floors first (Level 3 -> Level G) */}
          {[...floors].reverse().map((floor) => {
            const isSelected = selectedFloorId === floor.id;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => onSelectFloor(floor.id)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-[#38D9F5]/20 text-[#38D9F5] border border-[#38D9F5]/40 shadow-sm"
                    : "text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.06]"
                )}
              >
                <span>{floor.shortName}</span>
                {floor.totalBeds > 0 && (
                  <span className="text-[10px] font-mono px-1 rounded bg-white/[0.08] text-[#7E90A8]">
                    {floor.totalBeds}b
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Clear Selection & Exploded View Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          {hasAnySelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F06474]/20 border border-[#F06474]/40 text-[#F06474] text-xs font-semibold hover:bg-[#F06474]/30 transition-all cursor-pointer shadow-lg backdrop-blur-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Selection</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleExplodedView}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xl backdrop-blur-xl border",
              isExplodedView
                ? "bg-[#9B87FF]/25 border-[#9B87FF]/50 text-[#F3F7FC] shadow-[#9B87FF]/20"
                : "bg-[#0B1728]/85 border-white/10 text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.06]"
            )}
            title="Expand vertical floor spacing for interior inspection"
          >
            <Layers className="w-3.5 h-3.5 text-[#9B87FF]" />
            <span className="hidden sm:inline">Exploded Floors</span>
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isExplodedView ? "bg-[#22C58B] animate-pulse" : "bg-white/20"
              )}
            />
          </button>
        </div>
      </div>

      {/* BOTTOM OVERLAY: Status Filter & Camera Tools */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 pt-4">
        {/* Status Legend / Filter Bar */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1728]/90 backdrop-blur-xl border border-white/10 shadow-xl max-w-full">
          <span className="px-2 text-[10px] uppercase tracking-wider font-semibold text-[#7E90A8] flex items-center gap-1 hidden md:flex">
            <Filter className="w-3 h-3" />
            <span>Filter</span>
          </span>

          <button
            type="button"
            onClick={() => onSetStatusFilter("all")}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              statusFilter === "all"
                ? "bg-white/20 text-white font-semibold"
                : "text-[#7E90A8] hover:text-white"
            )}
          >
            All Beds
          </button>

          {(
            ["available", "occupied", "reserved", "housekeeping", "critical"] as BedStatus[]
          ).map((st) => {
            const config = STATUS_CONFIG[st];
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onSetStatusFilter(isActive ? "all" : st)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-white/15 text-white border border-white/30"
                    : "text-[#B6C4D5] hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="capitalize">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Camera Preset & Zoom HUD */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-[#0B1728]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          {/* View Presets */}
          <button
            type="button"
            onClick={() => onSetViewPreset("isometric")}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              viewPreset === "isometric"
                ? "bg-[#38D9F5]/20 text-[#38D9F5]"
                : "text-[#7E90A8] hover:text-[#F3F7FC]"
            )}
            title="Isometric 45° Perspective"
          >
            Iso
          </button>
          <button
            type="button"
            onClick={() => onSetViewPreset("front")}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              viewPreset === "front"
                ? "bg-[#38D9F5]/20 text-[#38D9F5]"
                : "text-[#7E90A8] hover:text-[#F3F7FC]"
            )}
            title="Front Elevation"
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => onSetViewPreset("top")}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              viewPreset === "top"
                ? "bg-[#38D9F5]/20 text-[#38D9F5]"
                : "text-[#7E90A8] hover:text-[#F3F7FC]"
            )}
            title="Top-Down Floorplan"
          >
            Top
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Zoom Buttons */}
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 rounded-lg text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 rounded-lg text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetCamera}
            className="p-1.5 rounded-lg text-[#38D9F5] hover:bg-[#38D9F5]/15 transition-colors cursor-pointer"
            title="Reset Camera Angle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
