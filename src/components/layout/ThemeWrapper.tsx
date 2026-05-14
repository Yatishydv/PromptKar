"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  
  useEffect(() => {
    const theme = userData?.selectedTheme || "Standard";
    document.documentElement.setAttribute("data-nexus-theme", theme);
    
    // Apply specific CSS variables based on theme
    const root = document.documentElement;
    if (theme === "Cyber") {
      root.style.setProperty("--nexus-primary", "79, 70, 229"); // Indigo
      root.style.setProperty("--nexus-bg", "248, 250, 252");
    } else if (theme === "Midnight") {
      root.style.setProperty("--nexus-primary", "147, 51, 234"); // Purple
      root.style.setProperty("--nexus-bg", "15, 23, 42");
    } else if (theme === "Matrix") {
      root.style.setProperty("--nexus-primary", "16, 185, 129"); // Emerald
      root.style.setProperty("--nexus-bg", "6, 78, 59");
    } else {
      root.style.setProperty("--nexus-primary", "79, 70, 229");
      root.style.setProperty("--nexus-bg", "248, 250, 252");
    }
  }, [userData?.selectedTheme]);

  return <>{children}</>;
};
