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
    back?: PhoneHeaderAction;
    position?: string;
    previous?: PhoneHeaderAction & { disabled?: boolean };
    next?: PhoneHeaderAction & { disabled?: boolean };
    more?: PhoneHeaderAction[];
  };
};
type Entry = { path: string; config: PhoneHeaderConfig; shape: string; update: (config: PhoneHeaderConfig) => void };

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

// The header can retain a configuration across page renders with the same visible shape. Its
// callbacks must still use the latest page state, including callbacks held by an open More menu.
export function createPhoneHeaderEntry(path: string, config: PhoneHeaderConfig): Entry {
  let current = config;
  const action = <T extends PhoneHeaderAction>(value: T | undefined, read: () => T | undefined): T | undefined =>
    value && { ...value, onSelect: (opener: HTMLElement) => read()?.onSelect(opener) };
  const bound: PhoneHeaderConfig = {
    ...config,
    chooseView: config.chooseView && { ...config.chooseView, open: (opener) => current.chooseView?.open(opener) },
    pageAction: action(config.pageAction, () => current.pageAction),
    filter: config.filter && {
      ...config.filter,
      open: (opener) => current.filter?.open(opener),
      searchAndFilter: config.filter.searchAndFilter && ((opener) => current.filter?.searchAndFilter?.(opener)),
    },
    record: config.record && {
      ...config.record,
      back: action(config.record.back, () => current.record?.back),
      previous: action(config.record.previous, () => current.record?.previous),
      next: action(config.record.next, () => current.record?.next),
      more: config.record.more?.map((item, index) => action(item, () => current.record?.more?.[index])!),
    },
  };
  return { path, config: bound, shape: shapeOf(config), update: (next) => { current = next; } };
}

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
    // Keep the rendered shape stable while forwarding its actions to this render's callbacks.
    if (entry && entry.shape === shape && entry.path === path) entry.update(config);
    else {
      entries.set(owner, createPhoneHeaderEntry(path, config));
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
