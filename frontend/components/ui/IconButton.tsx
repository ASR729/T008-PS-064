"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "glass" | "ghost" | "glow" | "danger";
  size?: "sm" | "md" | "lg";
  badgeCount?: number;
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = "glass",
  size = "md",
  badgeCount,
  label,
  children,
  className,
  ...props
}) => {
  const variantStyles = {
    glass:
      "bg-white/[0.06] hover:bg-white/[0.12] text-[#B6C4D5] hover:text-[#F3F7FC] border border-white/10 hover:border-white/20",
    ghost:
      "bg-transparent hover:bg-white/[0.06] text-[#7E90A8] hover:text-[#F3F7FC]",
    glow: "bg-[#102137]/80 hover:bg-[#162c48] text-[#38D9F5] border border-[#38D9F5]/30 hover:border-[#38D9F5]/60 shadow-sm shadow-[#38D9F5]/20",
    danger:
      "bg-[#F06474]/10 hover:bg-[#F06474]/20 text-[#F06474] border border-[#F06474]/30",
  };

  const sizeStyles = {
    sm: "w-8 h-8 rounded-lg text-sm",
    md: "w-9 h-9 rounded-xl text-base",
    lg: "w-11 h-11 rounded-xl text-lg",
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38D9F5]/30 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F06474] px-1 text-[10px] font-bold text-white shadow-md shadow-[#F06474]/40 animate-pulse">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );
};
