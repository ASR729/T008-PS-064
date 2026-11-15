"use client";

import React from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "../../lib/utils";
import {
  Bed,
  Activity,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  TrendingDown,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Bed,
  Activity,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  FileCheck2,
};

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: {
    value: string;
    isPositive: boolean;
    period: string;
  };
  statusColor?: "cyan" | "teal" | "blue" | "violet" | "warning" | "critical";
  iconName: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  statusColor = "cyan",
  iconName,
  onClick,
  className,
}) => {
  const IconComponent = iconMap[iconName] || Activity;

  const colorStyles = {
    cyan: {
      iconBg: "bg-[#38D9F5]/10 text-[#38D9F5] border-[#38D9F5]/25 shadow-[#38D9F5]/20",
      accent: "from-[#38D9F5]/20 to-transparent",
      glow: "cyan" as const,
    },
    teal: {
      iconBg: "bg-[#22C7A9]/10 text-[#22C7A9] border-[#22C7A9]/25 shadow-[#22C7A9]/20",
      accent: "from-[#22C7A9]/20 to-transparent",
      glow: "teal" as const,
    },
    blue: {
      iconBg: "bg-[#5685FF]/10 text-[#5685FF] border-[#5685FF]/25 shadow-[#5685FF]/20",
      accent: "from-[#5685FF]/20 to-transparent",
      glow: "blue" as const,
    },
    violet: {
      iconBg: "bg-[#9B87FF]/10 text-[#9B87FF] border-[#9B87FF]/25 shadow-[#9B87FF]/20",
      accent: "from-[#9B87FF]/20 to-transparent",
      glow: "violet" as const,
    },
    warning: {
      iconBg: "bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/25 shadow-[#F5B942]/20",
      accent: "from-[#F5B942]/20 to-transparent",
      glow: "none" as const,
    },
    critical: {
      iconBg: "bg-[#F06474]/10 text-[#F06474] border-[#F06474]/25 shadow-[#F06474]/20",
      accent: "from-[#F06474]/20 to-transparent",
      glow: "none" as const,
    },
  };

  const currentTheme = colorStyles[statusColor];

  return (
    <GlassCard
      variant="interactive"
      glowColor={currentTheme.glow}
      onClick={onClick}
      className={cn("p-5 flex flex-col justify-between group", className)}
    >
      {/* Corner Ambient Light Accent */}
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br blur-2xl opacity-40 group-hover:opacity-75 transition-opacity",
          currentTheme.accent
        )}
      />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-[#7E90A8]">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F7FC] mt-1 tabular-nums">
            {value}
          </div>
        </div>

        <div
          className={cn(
            "p-2.5 rounded-xl border backdrop-blur-md shadow-sm transition-transform duration-200 group-hover:scale-105",
            currentTheme.iconBg
          )}
        >
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#B6C4D5] relative z-10">
        <span className="truncate pr-2">{subtitle}</span>

        {trend && (
          <div
            className={cn(
              "shrink-0 inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md",
              trend.isPositive
                ? "bg-[#22C58B]/10 text-[#22C58B] border border-[#22C58B]/20"
                : "bg-[#F06474]/10 text-[#F06474] border border-[#F06474]/20"
            )}
            title={trend.period}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
