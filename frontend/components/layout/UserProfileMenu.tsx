"use client";

import React, { useState } from "react";
import { DropdownMenu, DropdownMenuItem } from "../ui/DropdownMenu";
import {
  User,
  Shield,
  Stethoscope,
  Receipt,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useToast } from "../ui/Toast";

export const UserProfileMenu: React.FC = () => {
  const { addToast } = useToast();
  const [activeRole, setActiveRole] = useState<string>("Chief Medical Officer / Admin");

  const items: DropdownMenuItem[] = [
    {
      id: "role-header",
      label: "Simulated Role: " + activeRole,
      disabled: true,
      icon: <Shield className="w-3.5 h-3.5 text-[#22C58B]" />,
    },
    { id: "div-1", label: "", divider: true },
    {
      id: "role-admin",
      label: "Switch to Simulation Lead",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#38D9F5]" />,
      badge: "Full Ops",
      onClick: () => {
        setActiveRole("Simulation Lead");
        addToast({
          title: "Role Switched",
          description: "Active context set to Simulation Lead (Command Operator).",
          type: "info",
        });
      },
    },
    {
      id: "role-billing",
      label: "Switch to Billing Officer",
      icon: <Receipt className="w-3.5 h-3.5 text-[#F5B942]" />,
      badge: "Ledger Gate",
      onClick: () => {
        setActiveRole("Chief Billing Officer");
        addToast({
          title: "Role Switched",
          description: "Active context set to Chief Billing Officer (BR-07 / BR-10 gates).",
          type: "info",
        });
      },
    },
    {
      id: "role-clinical",
      label: "Switch to Inpatient Nurse",
      icon: <Stethoscope className="w-3.5 h-3.5 text-[#22C7A9]" />,
      badge: "Beds & Wards",
      onClick: () => {
        setActiveRole("Inpatient Ward In-Charge");
        addToast({
          title: "Role Switched",
          description: "Active context set to Ward In-Charge (BR-01 noon anchors).",
          type: "info",
        });
      },
    },
    { id: "div-2", label: "", divider: true },
    {
      id: "engine-pref",
      label: "Engine Preferences",
      icon: <Settings className="w-3.5 h-3.5" />,
      onClick: () => {
        addToast({
          title: "Engine Preferences",
          description: "Round mode: Decimal ROUND_HALF_UP. Anchor anchor: 12:00 noon.",
          type: "info",
        });
      },
    },
    {
      id: "reset-state",
      label: "Reset Session Cache",
      icon: <LogOut className="w-3.5 h-3.5" />,
      danger: true,
      onClick: () => {
        addToast({
          title: "Cache Cleared",
          description: "Local visual simulation session reset to baseline.",
          type: "warning",
        });
      },
    },
  ];

  return (
    <DropdownMenu
      trigger={
        <div className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all select-none">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#38D9F5]/30 to-[#9B87FF]/30 border border-[#38D9F5]/40 flex items-center justify-center text-xs font-bold text-[#F3F7FC] shadow-sm">
            <User className="w-4 h-4 text-[#38D9F5]" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#F3F7FC] leading-none">
              Dr. A. Sen Gupta
            </span>
            <span className="text-[10px] text-[#7E90A8] leading-tight mt-0.5 max-w-[130px] truncate">
              {activeRole}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#7E90A8] hidden sm:block" />
        </div>
      }
      items={items}
      align="right"
    />
  );
};
