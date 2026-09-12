"use client";

import React, { useEffect } from "react";
import { useLayout } from "../LayoutContext";
import { UserRole } from "@/types";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  role?: UserRole;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = "Office of the Municipal Agriculturist — Municipality of Polomolok",
  children,
}) => {
  const { setHeaderInfo } = useLayout();

  useEffect(() => {
    setHeaderInfo({ title, subtitle });
  }, [title, subtitle, setHeaderInfo]);

  if (!children) {
    return null;
  }

  return (
    <div className="flex items-center justify-end px-6 py-2.5 border-b border-slate-100 bg-white/80">
      {children}
    </div>
  );
};
