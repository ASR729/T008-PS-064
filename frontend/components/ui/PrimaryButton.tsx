"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "blue" | "teal" | "violet" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  variant = "cyan",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    cyan: "bg-gradient-to-r from-[#38D9F5] to-[#22C7A9] text-[#07111F] font-semibold hover:shadow-lg hover:shadow-[#38D9F5]/25 hover:brightness-105 active:brightness-95 border border-[#38D9F5]/40",
    blue: "bg-gradient-to-r from-[#5685FF] to-[#38D9F5] text-white font-semibold hover:shadow-lg hover:shadow-[#5685FF]/25 hover:brightness-105 active:brightness-95 border border-[#5685FF]/40",
    teal: "bg-gradient-to-r from-[#22C7A9] to-[#22C58B] text-[#07111F] font-semibold hover:shadow-lg hover:shadow-[#22C7A9]/25 hover:brightness-105 active:brightness-95 border border-[#22C7A9]/40",
    violet:
      "bg-gradient-to-r from-[#9B87FF] to-[#5685FF] text-white font-semibold hover:shadow-lg hover:shadow-[#9B87FF]/25 hover:brightness-105 active:brightness-95 border border-[#9B87FF]/40",
    danger:
      "bg-gradient-to-r from-[#F06474] to-[#EF4444] text-white font-semibold hover:shadow-lg hover:shadow-[#F06474]/25 hover:brightness-105 active:brightness-95 border border-[#F06474]/40",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2 rounded-xl gap-2",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-[#38D9F5]/40",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2 rounded-xl gap-2",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium bg-white/[0.06] hover:bg-white/[0.1] text-[#F3F7FC] border border-white/15 backdrop-blur-md transition-all duration-200 hover:border-white/25 active:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20",
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
