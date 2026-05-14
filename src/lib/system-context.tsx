"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";

interface SystemSettings {
  maintenanceMode: boolean;
  announcementsEnabled: boolean;
  announcements: Array<{
    text: string;
    enabled: boolean;
    type: "info" | "warning" | "error" | "success";
  }>;
  announcementCloseable: boolean;
}

interface SystemContextType {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SystemContext = createContext<SystemContextType>({
  settings: {
    maintenanceMode: false,
    announcementsEnabled: true,
    announcements: [],
    announcementCloseable: true
  },
  loading: true,
  refreshSettings: async () => {}
});

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    announcementsEnabled: true,
    announcements: [],
    announcementCloseable: true
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("System settings fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Maintenance Mode Overlay
  if (!loading && settings.maintenanceMode && !isAdmin) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
          <span className="text-4xl">🛠️</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Under Maintenance</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">
          We are currently updating our platform to bring you new features. We will be back online shortly!
        </p>
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
          Platform Owner: yatishydv@gmail.com
        </div>
      </div>
    );
  }

  return (
    <SystemContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
