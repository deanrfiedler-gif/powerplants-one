"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
type Identity = { path: string; reference: string; title: string };
const identities = new Map<object, Identity>(), listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
// Call only with loaded, authorized display data. No URL ID becomes a label.
export function usePublishRecordIdentity(reference: string | null, title: string) {
  const path = usePathname();
  useEffect(() => {
    if (!reference) return;
    const key = {};
    identities.set(key, { path, reference, title }); emit();
    return () => { identities.delete(key); emit(); };
  }, [path, reference, title]);
}
export function RecordIdentity({ reference, title }: { reference: string; title: string }) {
  usePublishRecordIdentity(reference, title); return null;
}
export function useRecordIdentity() {
  const path = usePathname();
  return useSyncExternalStore(subscribe, () => [...identities.values()].findLast(identity => identity.path === path) ?? null, () => null);
}
