"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ThemePreviewContextType {
  previewTheme: string | null;
  setPreviewTheme: (theme: string | null) => void;
}

const ThemePreviewContext = createContext<ThemePreviewContextType>({
  previewTheme: null,
  setPreviewTheme: () => {},
});

export const useThemePreview = () => useContext(ThemePreviewContext);

export const ThemePreviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  return (
    <ThemePreviewContext.Provider value={{ previewTheme, setPreviewTheme }}>
      {children}
    </ThemePreviewContext.Provider>
  );
};
