"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./business-ui";

// Background checks retain confirmed controls and focus. A failed read discards
// its data permanently; a pending retry must never revive an obsolete snapshot.
export function useEstimatingRegisterRead<T>(path: string) {
  const [state, setState] = useState<{
    path: string;
    data: T | null;
    error: unknown;
    loading: boolean;
    observedAt: string | null;
  }>({ path: "", data: null, error: null, loading: true, observedAt: null });
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    let live = true,
      pending = false;
    async function read(manual = false) {
      if (!live || pending) return;
      pending = true;
      if (manual) setState((previous) => ({ ...previous, loading: true }));
      try {
        const data = await api<T>(path);
        if (live)
          setState({
            path,
            data,
            error: null,
            loading: false,
            observedAt: new Date().toISOString(),
          });
      } catch (error) {
        if (live)
          setState({
            path,
            data: null,
            error,
            loading: false,
            observedAt: null,
          });
      } finally {
        pending = false;
      }
    }
    refresh.current = () => void read(true);
    const check = () => void read();
    check();
    const timer = setInterval(check, 15000);
    window.addEventListener("focus", check);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [path]);
  const current = state.path === path;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current || state.loading,
    observedAt: current ? state.observedAt : null,
    reload: () => refresh.current(),
  };
}
