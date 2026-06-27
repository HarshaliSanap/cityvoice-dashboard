"use client";

import { useEffect } from "react";
import { subscribeToSettings } from "@/lib/services/dataService";

type ThemeSettings = {
  darkMode?: boolean;
};

export default function ThemeSync() {
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings: ThemeSettings) => {
      document.documentElement.classList.toggle("cityvoice-dark", Boolean(settings.darkMode));
    });

    return () => {
      unsubscribe?.();
      document.documentElement.classList.remove("cityvoice-dark");
    };
  }, []);

  return null;
}
