"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "../ui/StatusBadge";
import { PrimaryButton, SecondaryButton } from "../ui/PrimaryButton";
import {
  LayoutDashboard,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { HOSPITAL_3D_DISCLAIMER } from "../../lib/hospital-3d-data";

interface HospitalHeaderProps {
  onResetAll: () => void;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({ onResetAll }) => {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Simulation Disclaimer Alert Bar */}
      <div className="flex items-center gap-2 p-2.5 px-3 rounded-xl bg-[#9B87FF]/10 border border-[#9B87FF]/25 text-xs text-[#B6C4D5]">
        <ShieldAlert className="w-4 h-4 text-[#9B87FF] shrink-0" />
        <span className="font-medium">
          {HOSPITAL_3D_DISCLAIMER}
        </span>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#F3F7FC] tracking-tight">
              3D Hospital Inpatient Visualisation
            </h1>
            <StatusBadge
              status="available"
              label="120 Beds Mapped"
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-[#7E90A8] mt-1 leading-relaxed max-w-2xl">
            Explore 4 modular floors, inspect ward compartments, and monitor real-time bed availability across all 5 PS-064 clinical categories.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <SecondaryButton
            size="sm"
            onClick={() => router.push("/")}
            icon={<LayoutDashboard className="w-3.5 h-3.5" />}
          >
            Dashboard
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={onResetAll}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset View
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
