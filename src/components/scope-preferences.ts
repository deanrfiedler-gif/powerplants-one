"use client";
import { useMemo, useSyncExternalStore } from "react";
const event = "ppo-scope-preferences";
export const systemColumns = [
  "System",
  "Area coverage",
  "Equipment ref.",
  "Intent",
  "Evidence",
  "State",
  "Family",
];
type Preferences = {
  menu: boolean;
  hidden: string[];
  order: string[];
  widths: Record<string, number>;
};
// Same actor/module-scoped presentation storage boundary as the native Leads
// columns and My Work layout. No record or business draft enters this store.
export function useScopePreferences(scope: string) {
  const key = `ppo:${scope}:presentation:v1`;
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener(event, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(event, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const value = useMemo<Preferences>(() => {
    let v;
    try {
      v = JSON.parse(raw ?? "null");
    } catch {
      v = null;
    }
    const allowed = (x: unknown): x is string =>
      typeof x === "string" && systemColumns.slice(1).includes(x);
    const order = Array.isArray(v?.order) ? v.order.filter(allowed) : [];
    return {
      menu: v?.menu !== false,
      hidden: Array.isArray(v?.hidden) ? v.hidden.filter(allowed) : ["Family"],
      order: ["System", ...new Set([...order, ...systemColumns.slice(1)])],
      widths: Object.fromEntries(
        Object.entries(v?.widths ?? {}).filter(
          ([k, n]) =>
            systemColumns.includes(k) &&
            typeof n === "number" &&
            Number.isFinite(n) &&
            n >= 110 &&
            n <= 600,
        ),
      ) as Record<string, number>,
    };
  }, [raw]);
  return {
    value,
    save: (value: Preferences) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* A disabled preference store does not block discovery. */
      }
      window.dispatchEvent(new Event(event));
    },
  };
}
