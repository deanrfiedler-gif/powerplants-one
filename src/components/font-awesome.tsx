"use client";
import { useEffect, useRef, useSyncExternalStore, type ReactElement } from "react";

// ADR-0050. The owner's Font Awesome Kit draws the application's icons on online pages. It loads
// only where PPO_FONT_AWESOME_KIT names a Kit, and every icon keeps its local drawing until the
// Kit's Font Awesome engine is running. CI, copies of the repository, the offline workspace and an
// unreachable Font Awesome therefore keep today's icons rather than showing blank boxes.
const readyEvent = "ppo:font-awesome-ready";
let ready = false,
  started = false;

const subscribe = (changed: () => void) => {
  window.addEventListener(readyEvent, changed);
  return () => window.removeEventListener(readyEvent, changed);
};
export function useFontAwesome() {
  return useSyncExternalStore(subscribe, () => ready, () => false);
}

type FontAwesomeWindow = Window & {
  FontAwesome?: { dom?: { i2svg?: (params?: { node?: Element }) => Promise<void> } };
  FontAwesomeConfig?: Record<string, unknown>;
};
function engineRunning() {
  if ((window as FontAwesomeWindow).FontAwesome) return true;
  let font = false;
  document.fonts.forEach((face) => {
    if (/Font Awesome/i.test(face.family) && face.status === "loaded") font = true;
  });
  return font;
}

function load(kit: string) {
  if (started) return;
  started = true;
  // SVG + JS Kits keep React's <i> element and nest their SVG inside it, so React still owns
  // every node it rendered. Without this, Font Awesome would replace elements React manages.
  const fontAwesomeWindow = window as FontAwesomeWindow;
  fontAwesomeWindow.FontAwesomeConfig = { ...fontAwesomeWindow.FontAwesomeConfig, autoReplaceSvg: "nest" };
  const script = document.createElement("script");
  script.src = `https://kit.fontawesome.com/${kit}.js`;
  script.crossOrigin = "anonymous";
  script.dataset.autoReplaceSvg = "nest";
  let attempts = 0;
  const poll = () => {
    if (engineRunning()) {
      ready = true;
      window.dispatchEvent(new Event(readyEvent));
    } else if (++attempts < 100) window.setTimeout(poll, 100);
  };
  script.addEventListener("load", poll);
  document.head.append(script);
}

export function FontAwesomeKit({ kit }: { kit: string }) {
  useEffect(() => load(kit), [kit]);
  return null;
}

// One icon: the local drawing until the Kit is running, then Font Awesome Classic Light, or
// Classic Solid where the app marks a selected item. The <i> keeps the class that sizes the local
// drawing, so it fills the same box. The key remounts it when the icon or style changes, so Font
// Awesome draws a fresh SVG rather than restyling an old one. Each icon asks Font Awesome to draw
// it: an icon that appears while the Kit is still starting is otherwise missed by its observer.
export function FontAwesomeGlyph({
  icon,
  selected = false,
  className,
  variant,
  fallback,
}: {
  icon: string;
  selected?: boolean;
  className: string;
  variant?: string;
  fallback: ReactElement;
}) {
  const on = useFontAwesome(),
    node = useRef<HTMLElement>(null);
  const style = selected ? "fa-solid" : "fa-light";
  useEffect(() => {
    const element = node.current;
    // i2svg draws the icons inside the node it is given, so it is given this icon's parent.
    if (on && element?.parentElement && !element.querySelector("svg")) void (window as FontAwesomeWindow).FontAwesome?.dom?.i2svg?.({ node: element.parentElement });
  }, [on, style, icon]);
  if (!on) return fallback;
  return <i ref={node} key={`${style} ${icon}`} className={`${className} ppo-fa ${style} fa-${icon}`} data-variant={variant} aria-hidden="true" />;
}
