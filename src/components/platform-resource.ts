"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { businessViewChannel, sessionLockEvent } from "./session-signal";
import { useShell } from "./shell-provider";
import type { Failure } from "./business-ui";

// Shared read lifecycle for SH surfaces: cancel on query change and discard on identity lock.
export function usePlatformResource<T>(
  path: string | null,
  refreshOnFocus = true,
) {
  const { context } = useShell();
  const scope = context?.preference_scope;
  const [tick, setTick] = useState(0),
    [state, setState] = useState<{ key: string; data?: T; error?: Failure }>();
  const generation = useRef(0);
  const key = `${scope}:${path}:${tick}`;
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    const lock = () => {
      generation.current++;
      setState(undefined);
    };
    const channel = businessViewChannel(),
      remote = (e: MessageEvent) => {
        if (e.data === "Lock") lock();
      };
    window.addEventListener(sessionLockEvent, lock);
    channel.addEventListener("message", remote);
    const notificationChanged = () => {
      if (
        path?.startsWith("notifications") &&
        path !== "notifications/preferences"
      )
        reload();
    };
    window.addEventListener("ppo-notifications-changed", notificationChanged);
    if (refreshOnFocus) window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(sessionLockEvent, lock);
      channel.removeEventListener("message", remote);
      window.removeEventListener(
        "ppo-notifications-changed",
        notificationChanged,
      );
      window.removeEventListener("focus", reload);
    };
  }, [reload, path, refreshOnFocus]);
  useEffect(() => {
    if (!path || !scope) return;
    const controller = new AbortController(),
      stamp = ++generation.current;
    void fetch(`/api/v1/${path}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok) throw { ...value, status: r.status };
        return value as T;
      })
      .then(
        (data) => {
          if (!controller.signal.aborted && stamp === generation.current)
            setState({ key, data });
        },
        (error) => {
          if (!controller.signal.aborted && stamp === generation.current)
            setState({
              key,
              error: {
                message: "This source could not be loaded. Try again.",
                ...error,
              },
            });
        },
      );
    return () => controller.abort();
  }, [key, path, scope]);
  return {
    data: state?.key === key ? state.data : undefined,
    error: state?.key === key ? state.error : undefined,
    loading: !!path && state?.key !== key,
    reload,
  };
}
