"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface HeaderInfo {
  title: string;
  subtitle?: string;
}

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  headerInfo: HeaderInfo;
  setHeaderInfo: (info: HeaderInfo) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerInfo, setHeaderInfoState] = useState<HeaderInfo>({
    title: "OMAG Polomolok",
    subtitle: "Agricultural Resource & Production Management",
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const setHeaderInfo = useCallback((info: HeaderInfo) => {
    setHeaderInfoState((prev) => {
      if (prev.title === info.title && prev.subtitle === info.subtitle) {
        return prev;
      }
      return info;
    });
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        searchQuery,
        setSearchQuery,
        headerInfo,
        setHeaderInfo,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};
