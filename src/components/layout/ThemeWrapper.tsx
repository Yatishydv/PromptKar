"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useThemePreview } from "@/lib/theme-preview-context";

const THEME_CONFIGS: Record<string, Record<string, string>> = {
  Standard: {
    "--app-primary": "79, 70, 229",
    "--app-bg": "248, 250, 252",
    "--app-card": "255, 255, 255",
    "--app-text": "15, 23, 42",
    "--app-text-secondary": "148, 163, 184",
    "--app-border": "226, 232, 240",
    "--app-sidebar": "255, 255, 255",
    "--app-sidebar-text": "15, 23, 42",
  },
  Cyber: {
    "--app-primary": "79, 70, 229",
    "--app-bg": "238, 242, 255",
    "--app-card": "255, 255, 255",
    "--app-text": "30, 27, 75",
    "--app-text-secondary": "99, 102, 241",
    "--app-border": "199, 210, 254",
    "--app-sidebar": "79, 70, 229",
    "--app-sidebar-text": "255, 255, 255",
  },
  Midnight: {
    "--app-primary": "167, 139, 250",
    "--app-bg": "15, 23, 42",
    "--app-card": "30, 41, 59",
    "--app-text": "241, 245, 249",
    "--app-text-secondary": "148, 163, 184",
    "--app-border": "51, 65, 85",
    "--app-sidebar": "30, 41, 59",
    "--app-sidebar-text": "241, 245, 249",
  },
  Matrix: {
    "--app-primary": "52, 211, 153",
    "--app-bg": "2, 44, 34",
    "--app-card": "6, 78, 59",
    "--app-text": "236, 253, 245",
    "--app-text-secondary": "110, 231, 183",
    "--app-border": "6, 95, 70",
    "--app-sidebar": "6, 78, 59",
    "--app-sidebar-text": "236, 253, 245",
  },
};

function applyTheme(themeName: string) {
  const root = document.documentElement;
  const config = THEME_CONFIGS[themeName] || THEME_CONFIGS.Standard;
  
  // Remove all theme classes
  root.classList.remove("theme-standard", "theme-cyber", "theme-midnight", "theme-matrix");
  
  // Set CSS variables
  for (const [key, value] of Object.entries(config)) {
    root.style.setProperty(key, value);
  }
  
  // Set data attribute and class
  root.setAttribute("data-app-theme", themeName);
  root.classList.add(`theme-${themeName.toLowerCase()}`);
}

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  const { previewTheme } = useThemePreview();
  
  useEffect(() => {
    // Preview theme takes priority over saved theme
    const activeTheme = previewTheme || userData?.selectedTheme || "Standard";
    applyTheme(activeTheme);
  }, [userData?.selectedTheme, previewTheme]);

  return <>{children}</>;
};
