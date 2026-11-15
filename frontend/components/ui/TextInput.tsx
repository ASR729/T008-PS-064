"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  helperText,
  error,
  icon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[#B6C4D5]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-[#7E90A8] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full bg-[#07111F]/70 border rounded-xl py-2 text-sm text-[#F3F7FC] placeholder-[#7E90A8] transition-all duration-200 outline-none backdrop-blur-md",
            icon ? "pl-9 pr-3" : "px-3",
            error
              ? "border-[#F06474]/50 focus:border-[#F06474] focus:ring-2 focus:ring-[#F06474]/20"
              : "border-white/12 hover:border-white/20 focus:border-[#38D9F5]/50 focus:ring-2 focus:ring-[#38D9F5]/20",
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] text-[#F06474]">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#7E90A8]">{helperText}</p>
      ) : null}
    </div>
  );
};

export interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  helperText,
  error,
  options,
  className,
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-[#B6C4D5]"
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
        className={cn(
          "w-full bg-[#07111F] border rounded-xl px-3 py-2 text-sm text-[#F3F7FC] transition-all duration-200 outline-none cursor-pointer",
          error
            ? "border-[#F06474]/50 focus:border-[#F06474]"
            : "border-white/12 hover:border-white/20 focus:border-[#38D9F5]/50",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0B1728] text-[#F3F7FC]">
            {opt.label}
          </option>
        ))}
      </select>

      {error ? (
        <p className="text-[11px] text-[#F06474]">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#7E90A8]">{helperText}</p>
      ) : null}
    </div>
  );
};
