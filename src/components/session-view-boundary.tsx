"use client";
import { useEffect, useRef, useState } from "react";
import { businessViewChannel } from "./session-signal";

export function SessionViewBoundary({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const channel = businessViewChannel();
    const lock = (event: MessageEvent) => {
      if (event.data === "Lock") setLocked(true);
    };
    channel.addEventListener("message", lock);
    return () => channel.removeEventListener("message", lock);
  }, []);
  useEffect(() => { if (locked) notice.current?.focus(); }, [locked]);
  if (!locked) return children;
  return <div className="empty-state" ref={notice} tabIndex={-1} role="alert">
    <h1>Identity changed in another tab</h1>
    <p>Displayed records and unsaved forms have been cleared. Saved offline originals remain with their owner.</p>
    <button onClick={() => setLocked(false)}>Reload permitted view</button>
  </div>;
}
