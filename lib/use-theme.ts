"use client";

import { useEffect, useState } from "react";

export type DashboardTheme = "clasico" | "nocturno";

const STORAGE_KEY = "orbyx-dashboard-theme";

export function useTheme() {
  const [theme, setTheme] = useState<DashboardTheme>("clasico");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem(STORAGE_KEY) as DashboardTheme | null)
        : null;

    const nextTheme =
      stored === "nocturno" || stored === "clasico" ? stored : "clasico";

    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    setMounted(true);
  }, []);

  function changeTheme(nextTheme: DashboardTheme) {
    setTheme(nextTheme);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    }

    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  function toggleTheme() {
    changeTheme(theme === "clasico" ? "nocturno" : "clasico");
  }

  return {
    theme,
    changeTheme,
    toggleTheme,
    mounted,
  };
}