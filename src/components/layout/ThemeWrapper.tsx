"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  
  useEffect(() => {
    const theme = userData?.selectedTheme || "Standard";
    document.documentElement.setAttribute("data-app-theme", theme);
    
    // Apply specific CSS variables based on theme
    const root = document.documentElement;
    if (theme === "Cyber") {
      root.style.setProperty("--app-primary", "79, 70, 229"); // Indigo
      root.style.setProperty("--app-bg", "248, 250, 252");
    } else if (theme === "Midnight") {
      root.style.setProperty("--app-primary", "147, 51, 234"); // Purple
      root.style.setProperty("--app-bg", "15, 23, 42");
    } else if (theme === "Matrix") {
      root.style.setProperty("--app-primary", "16, 185, 129"); // Emerald
      root.style.setProperty("--app-bg", "6, 78, 59");
    } else {
      root.style.setProperty("--app-primary", "79, 70, 229");
      root.style.setProperty("--app-bg", "248, 250, 252");
    }
  }, [userData?.selectedTheme]);

  return <>{children}</>;
};
