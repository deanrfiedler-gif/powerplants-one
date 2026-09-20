"use client";
import { useEffect } from "react";

// Forms already warn on unload and on in-app links. The installed app's Reload action
// cannot rely on that alone, so dirty and in-flight forms also register here and the
// reload asks before discarding them. This is advisory: it never blocks a save.
let outstanding = 0;

export function registerPendingWork() {
  outstanding++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    outstanding--;
  };
}

export const hasPendingWork = () => outstanding > 0;

/** Register for as long as the form holds unsaved entries or a command is in flight. */
export function usePendingWork(pending: boolean) {
  useEffect(() => {
    if (!pending) return;
    return registerPendingWork();
  }, [pending]);
}
