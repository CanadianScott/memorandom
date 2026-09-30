"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full transition focus:outline-none focus:ring-2 focus:ring-warm-brown/50 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-warm-brown text-cream hover:opacity-90 shadow-sm",
    secondary: "bg-aged-paper text-ink hover:bg-aged-paper/80",
    outline: "border border-warm-brown/30 text-warm-brown hover:bg-warm-brown/10",
    ghost: "text-ink hover:bg-black/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3 text-lg",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
