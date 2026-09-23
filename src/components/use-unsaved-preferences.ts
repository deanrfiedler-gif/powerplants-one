"use client";
import { useEffect } from "react";
import { registerNavigationReview } from "./navigation-intent";
export function useUnsavedPreferences(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const confirm = () =>
      window.confirm(
        "Discard unsaved preferences and continue? Choose Cancel to keep editing.",
      );
    const release = registerNavigationReview((run) => {
      if (confirm()) run();
    });
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[href]");
      if (link && !confirm()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      release();
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
