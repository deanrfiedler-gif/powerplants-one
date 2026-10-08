"use client";
import { useEffect } from "react";
import { guardBrowserNavigation } from "./navigation-intent";
export function useUnsavedPreferences(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    return guardBrowserNavigation(run => {
      if (window.confirm("Discard unsaved preferences and continue? Choose Cancel to keep editing.")) run();
    }, 20);
  }, [dirty]);
}
