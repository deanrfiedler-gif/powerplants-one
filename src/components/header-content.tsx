"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};
const serverSnapshot = () => null;

// The root header owns these stable mounts. Route/session-owned content keeps
// its own state and unmounts with its owner, including on identity changes.
export function HeaderContent({
  slot,
  children,
}: {
  slot: "search" | "account";
  children: ReactNode;
}) {
  const mount = useSyncExternalStore(
    subscribe,
    () => document.getElementById(`header-${slot}`),
    serverSnapshot,
  );
  return mount ? createPortal(children, mount) : null;
}
