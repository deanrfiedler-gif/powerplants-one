"use client";

import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

const changed = "ppo-location-search-changed";
const snapshot = () => window.location.search.slice(1);
const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  window.addEventListener(changed, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(changed, listener);
  };
};

// Native history updates are synchronous; the router's search-parameter render
// may be deferred. Controlled inputs must observe the completed history write
// during the same input event, before React restores their controlled value.
export function notifyLocationSearchChanged() {
  window.dispatchEvent(new Event(changed));
}

export function useCurrentLocationSearch() {
  // Keep the framework subscription for Link/router navigation and its server
  // snapshot for hydration. Client renders always read the current browser URL.
  const params = useSearchParams();
  const search = useSyncExternalStore(subscribe, snapshot, () => params.toString());
  return new URLSearchParams(search);
}
