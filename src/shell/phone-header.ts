"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { ShellIconName } from "../components/shell-icon";

// Phone header amendment (PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC, rules P1–P9): one compact 56 px row on phone
// pages. The shell draws the row; a page that has views, a page action, a filter or record navigation hands
// them over here, and a page that hands nothing over shows its title alone (P2). Desktop and tablet ignore it.
export type PhoneHeaderAction = { label: string; onSelect: (opener: HTMLElement) => void };
export type PhoneHeaderConfig = {
  // The current view's name, in place of the page's own name.
  title?: string;
  count?: number | string;
  // P2/P5: the page's Choose view sheet; the chevron shows only when a page offers one.
  chooseView?: { open: (opener: HTMLElement) => void; expanded?: boolean; controls?: string };
  // P2: at most one page action, drawn as an icon.
  pageAction?: PhoneHeaderAction & { icon: ShellIconName; search?: boolean };
  // P5: the full-screen filter panel; `applied` draws the dot. P7: when the page action is search, the two
  // combine into one "Search and filter" control at 320 px, opening `searchAndFilter` (or the filter panel).
  filter?: { open: (opener: HTMLElement) => void; applied?: boolean; searchAndFilter?: (opener: HTMLElement) => void };
  // P3: a record page. Without it, a page whose breadcrumb ends in a loaded record shows back and its reference.
  record?: {
    position?: string;
    previous?: PhoneHeaderAction & { disabled?: boolean };
    next?: PhoneHeaderAction & { disabled?: boolean };
    more?: PhoneHeaderAction[];
  };
};
type Entry = { path: string; config: PhoneHeaderConfig; shape: string };

const entries = new Map<object, Entry>(), listeners = new Set<() => void>();
const none: Entry[] = [];
let snapshot = none;
const emit = () => {
  snapshot = [...entries.values()];
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
// What the header draws from a configuration. Callbacks are read from the latest render, so a page's
// re-render with new handlers but the same labels does not redraw the header.
const shapeOf = (config: PhoneHeaderConfig) =>
  JSON.stringify(config, (_key, value) => (typeof value === "function" ? true : value));

export function usePhoneHeader(config: PhoneHeaderConfig | null) {
  const path = usePathname();
  const key = useRef<object>({});
  useEffect(() => {
    const owner = key.current;
    if (!config) {
      if (entries.delete(owner)) emit();
      return;
    }
    const shape = shapeOf(config), entry = entries.get(owner);
    // The entry is updated in place so the header's next click reads this render's callbacks.
    if (entry && entry.shape === shape && entry.path === path) entry.config = config;
    else {
      entries.set(owner, { path, config, shape });
      emit();
    }
  });
  useEffect(() => {
    const owner = key.current;
    return () => {
      if (entries.delete(owner)) emit();
    };
  }, []);
}

export function usePhoneHeaderConfig(): PhoneHeaderConfig | null {
  const path = usePathname();
  const list = useSyncExternalStore(subscribe, () => snapshot, () => none);
  return list.findLast((entry) => entry.path === path)?.config ?? null;
}
