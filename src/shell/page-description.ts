"use client";
import { useEffect, useSyncExternalStore } from "react";

// A register's identity now lives in the shared breadcrumb, so its duplicated title band gives up the
// room it took. The generic description that sat under that title is not discarded: the page publishes
// it here and the shell's existing page-information panel shows it. One page owns the value at a time
// and clears it when it unmounts, so a later page never inherits an earlier page's description.
type Published = { page: string; description: string };
let current: Published | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const emit = () => listeners.forEach((listener) => listener());

export function usePublishPageDescription(page: string | null, description?: string) {
  useEffect(() => {
    if (!page || !description) return;
    current = { page, description };
    emit();
    return () => {
      if (current?.page === page) {
        current = null;
        emit();
      }
    };
  }, [page, description]);
}
export const usePageDescription = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
