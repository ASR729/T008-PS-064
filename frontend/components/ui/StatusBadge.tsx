"use client";

import React from "react";
import { cn } from "../../lib/utils";

export type StatusType =
  | "available"
  | "occupied"
  | "reserved"
  | "critical"
  | "pending"
  | "success"
  | "neutral"
  | "info"
  | "warning";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  dot?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; border: string; dotColor: string; defaultLabel: string }
> = {
  available: {
    bg: "bg-[#22C58B]/10",
    text: "text-[#22C58B]",
    border: "border-[#22C58B]/30",
    dotColor: "bg-[#22C58B] shadow-[#22C58B]/50",
    defaultLabel: "Available",
  },
  occupied: {
    bg: "bg-[#38BDF8]/10",
    text: "text-[#38BDF8]",
    border: "border-[#38BDF8]/30",
    dotColor: "bg-[#38BDF8] shadow-[#38BDF8]/50",
    defaultLabel: "Occupied",
  },
  reserved: {
    bg: "bg-[#F5B942]/10",
    text: "text-[#F5B942]",
    border: "border-[#F5B942]/30",
    dotColor: "bg-[#F5B942] shadow-[#F5B942]/50",
    defaultLabel: "Reserved",
  },
  critical: {
    bg: "bg-[#F06474]/10",
    text: "text-[#F06474]",
    border: "border-[#F06474]/30",
    dotColor: "bg-[#F06474] shadow-[#F06474]/50 animate-pulse",
    defaultLabel: "Critical",
  },
  pending: {
    bg: "bg-[#F5B942]/10",
    text: "text-[#F5B942]",
    border: "border-[#F5B942]/30",
    dotColor: "bg-[#F5B942]",
    defaultLabel: "Pending",
  },
  success: {
    bg: "bg-[#22C58B]/10",
    text: "text-[#22C58B]",
    border: "border-[#22C58B]/30",
    dotColor: "bg-[#22C58B]",
    defaultLabel: "Active / OK",
  },
  neutral: {
    bg: "bg-white/[0.05]",
    text: "text-[#B6C4D5]",
    border: "border-white/10",
    dotColor: "bg-[#7E90A8]",
    defaultLabel: "Neutral",
  },
  info: {
    bg: "bg-[#5685FF]/10",
    text: "text-[#5685FF]",
    border: "border-[#5685FF]/30",
    dotColor: "bg-[#5685FF]",
    defaultLabel: "Information",
  },
  warning: {
    bg: "bg-[#F5B942]/10",
    text: "text-[#F5B942]",
    border: "border-[#F5B942]/30",
    dotColor: "bg-[#F5B942]",
    defaultLabel: "Warning",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  size = "md",
  className,
}) => {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2 font-medium",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border backdrop-blur-md transition-colors",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full shadow-sm",
            config.dotColor,
            dotSizes[size]
          )}
        />
      )}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
