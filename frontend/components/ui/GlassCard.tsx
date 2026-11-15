"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle" | "interactive" | "highlight";
  glowColor?: "cyan" | "violet" | "teal" | "blue" | "none";
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = "default",
  glowColor = "none",
  children,
  className,
  ...props
}) => {
  const variantStyles = {
    default: "bg-[#102137]/65 border border-white/10 shadow-lg shadow-black/40",
    elevated: "bg-[#102137]/80 border border-white/15 shadow-xl shadow-black/60",
    subtle: "bg-white/[0.035] border border-white/[0.08] shadow-md",
    interactive:
      "bg-[#102137]/60 border border-white/10 shadow-lg hover:bg-[#162c48]/75 hover:border-[#38D9F5]/35 hover:shadow-[#38D9F5]/10 hover:-translate-y-0.5 cursor-pointer transition-all duration-200",
    highlight:
      "bg-gradient-to-br from-[#102137]/90 to-[#0B1728]/90 border border-[#38D9F5]/30 shadow-xl shadow-[#38D9F5]/10",
  };

  const glowStyles = {
    none: "",
    cyan: "before:absolute before:-top-px before:left-10 before:right-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#38D9F5]/50 before:to-transparent",
    violet:
      "before:absolute before:-top-px before:left-10 before:right-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#9B87FF]/50 before:to-transparent",
    teal: "before:absolute before:-top-px before:left-10 before:right-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#22C7A9]/50 before:to-transparent",
    blue: "before:absolute before:-top-px before:left-10 before:right-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#5685FF]/50 before:to-transparent",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl backdrop-blur-xl overflow-hidden",
        variantStyles[variant],
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {/* Subtle top edge specular highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {children}
    </div>
  );
};
