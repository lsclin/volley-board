"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full px-3 py-2.5 border border-gray-300 rounded-lg",
          "text-base text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors min-h-[44px]",
          error ? "border-red-500 focus:ring-red-500" : "",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
});