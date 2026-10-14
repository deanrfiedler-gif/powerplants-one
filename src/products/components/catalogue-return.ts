"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useIdentity } from "../../components/business-session";
import { useShell } from "../../components/shell-provider";
import {
  readCatalogueReturn,
  type CatalogueReturn,
} from "../catalogue-navigation";

const key = "ppo:products:catalogue-return";
let memory: string | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => {
  try {
    return sessionStorage.getItem(key) ?? memory;
  } catch {
    return memory;
  }
};
function save(value: CatalogueReturn | null) {
  memory = value ? JSON.stringify(value) : null;
  try {
    if (memory) sessionStorage.setItem(key, memory);
    else sessionStorage.removeItem(key);
  } catch {
    /* Navigation still works when storage is unavailable. */
  }
  listeners.forEach((listener) => listener());
}
export function useCatalogueReturn() {
  const identity = useIdentity(),
    shell = useShell();
  const scope = `${identity.workspace_id}:${identity.actor_id}:${shell.context?.working_company_id ?? "all"}`;
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const value = readCatalogueReturn(raw, scope);
  useEffect(() => {
    if (raw && !readCatalogueReturn(raw, scope)) save(null);
  }, [raw, scope]);
  return {
    value,
    remember: (entry: Omit<CatalogueReturn, "scope">) =>
      save({ ...entry, scope }),
  };
}
