"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ShellContext } from "../shell/model";
import {
  preferenceKey, workspaceLanding,
  workspacePreference,
  type WorkspaceId,
} from "../shell/navigation";
import {
  businessViewChannel,
  sessionLockEvent,
  sessionReadyEvent,
} from "./session-signal";

const preferenceEvent = "ppo-shell-workspace";
const visitPreferences = new Map<string, WorkspaceId>();
const railPreferences = new Map<string, boolean>();
function railSnapshot(key: string | null) {
  if (!key) return false;
  if (railPreferences.has(key)) return railPreferences.get(key)!;
  try { const value = JSON.parse(localStorage.getItem(`${key}:rail`) ?? "null"); return value?.schema_version === 1 && value.expanded === true; }
  catch { return false; }
}
const subscribe = (notify: () => void) => {
  window.addEventListener(preferenceEvent, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(preferenceEvent, notify);
    window.removeEventListener("storage", notify);
  };
};
function snapshot(key: string | null): WorkspaceId {
  if (!key) return "sales";
  if (visitPreferences.has(key)) return visitPreferences.get(key)!;
  try {
    return workspacePreference(localStorage.getItem(key));
  } catch {
    return "sales";
  }
}
type State = {
  context: ShellContext | null;
  error: string;
  reload: () => void;
  hosted: boolean;
  development: boolean;
  preview: WorkspaceId;
  selectPreview: (id: WorkspaceId) => boolean;
  selectWorkspace: (id: WorkspaceId) => boolean;
  resetPreview: () => boolean;
  railExpanded: boolean;
  setRailExpanded: (expanded: boolean) => void;
};
const Shell = createContext<State | null>(null);
export function useShell() {
  const state = useContext(Shell);
  if (!state) throw Error("Shared shell provider is required");
  return state;
}
export function ShellProvider({
  children,
  hosted = false,
  development = false,
}: {
  children: ReactNode;
  hosted?: boolean;
  development?: boolean;
}) {
  const [context, setContext] = useState<ShellContext | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const userKey = context?.preference_scope ? `${preferenceKey}:${context.preference_scope}` : null;
  const preview = useSyncExternalStore(
    subscribe,
    () => snapshot(userKey),
    () => "sales" as const,
  );
  const railExpanded = useSyncExternalStore(subscribe, () => railSnapshot(userKey), () => false);
  useEffect(() => {
    let live = true,
      request: AbortController | undefined;
    // Every identity change dispatches sessionLockEvent first, and lock() clears the
    // context. A later session-ready re-read therefore revalidates the identity already
    // shown: it keeps that context until the response replaces it, so the shell does not
    // blank for a re-read of the same identity. A failed re-read still clears it.
    const load = (keep = false) => {
      const stamp = ++generation.current;
      request?.abort();
      request = new AbortController();
      const signal = request.signal;
      if (!keep) setContext(null);
      setError("");
      void fetch("/api/v1/shell/context", { cache: "no-store", signal })
        .then(async (response) => {
          if (!response.ok)
            throw Error(
              response.status === 401
                ? "Sign in or select an identity to load your permitted navigation."
                : "Unable to load your shell access. Try again.",
            );
          const value: ShellContext = await response.json();
          if (live && !signal.aborted && stamp === generation.current)
            setContext(value);
        })
        .catch((reason: Error) => {
          if (live && !signal.aborted && stamp === generation.current) {
            setContext(null);
            setError(reason.message);
          }
        });
    };
    const revalidate = () => load(true);
    const lock = () => {
      generation.current++;
      request?.abort();
      setContext(null);
      setError("Refresh your identity context to continue.");
    };
    const channel = businessViewChannel(),
      remote = (event: MessageEvent) => {
        if (event.data === "Lock") lock();
      };
    window.addEventListener(sessionLockEvent, lock);
    window.addEventListener(sessionReadyEvent, revalidate);
    channel.addEventListener("message", remote);
    load();
    return () => {
      live = false;
      request?.abort();
      window.removeEventListener(sessionLockEvent, lock);
      window.removeEventListener(sessionReadyEvent, revalidate);
      channel.removeEventListener("message", remote);
    };
  }, [retry]);
  function saveWorkspace(id: WorkspaceId) {
    if (!context || !userKey) return false;
    let saved = true;
    try {
      localStorage.setItem(
        userKey,
        JSON.stringify({ schema_version: 1, workspace: id }),
      );
      visitPreferences.delete(userKey);
    } catch {
      visitPreferences.set(userKey, id);
      saved = false;
    }
    window.dispatchEvent(new Event(preferenceEvent));
    return saved;
  }
  return (
    <Shell.Provider
      value={{
        context,
        error,
        reload: () => setRetry((n) => n + 1),
        hosted,
        development,
        preview,
        railExpanded,
        setRailExpanded: expanded => {
          if (!userKey) return;
          try { localStorage.setItem(`${userKey}:rail`, JSON.stringify({ schema_version: 1, expanded })); railPreferences.delete(userKey); }
          catch { railPreferences.set(userKey, expanded); }
          window.dispatchEvent(new Event(preferenceEvent));
        },
        selectPreview: id => context?.can_preview ? saveWorkspace(id) : false,
        selectWorkspace: id => context && workspaceLanding(id, context.navigation, hosted) ? saveWorkspace(id) : false,
        resetPreview: () => {
          if (!context?.can_preview || !userKey) return false;
          let saved = true;
          try { localStorage.removeItem(userKey); visitPreferences.delete(userKey); }
          catch { visitPreferences.set(userKey, "sales"); saved = false; }
          window.dispatchEvent(new Event(preferenceEvent));
          return saved;
        },
      }}
    >
      {children}
    </Shell.Provider>
  );
}
