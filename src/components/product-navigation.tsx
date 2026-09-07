"use client";
import { useState, useSyncExternalStore } from "react";
const subscribe = (changed: () => void) => {
  const media = window.matchMedia("(min-width: 781px)");
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
export function ProductNavigation({ children }: { children: React.ReactNode }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia("(min-width: 781px)").matches, () => true);
  const [expanded, setExpanded] = useState(false);
  return <>
    <button className="navigation-toggle secondary" aria-expanded={wide || expanded} aria-controls="product-navigation" onClick={() => setExpanded(!expanded)}>Menu</button>
    <div id="product-navigation" hidden={!wide && !expanded}>{children}</div>
  </>;
}
