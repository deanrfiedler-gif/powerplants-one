"use client";
import { useEffect, useRef, useState } from "react";
import { usePendingWork } from "./pending-work";
import { registerNavigationReview } from "./navigation-intent";
type NavigateEvent = Event & {
  navigationType: "push" | "replace" | "traverse" | "reload";
  destination: { url: string; key: string };
  hashChange: boolean;
  canIntercept: boolean;
};
type Navigation = EventTarget & {
  navigate: (url: string, options?: { history: "replace" | "push" }) => unknown;
  traverseTo: (key: string) => unknown;
  reload: () => unknown;
};
// The native navigation event covers links, router/history mutations, Back and
// Forward before the document/React tree changes. Presentation stays in memory.
export function useDiscoveryNavigation(dirty: boolean, pending: boolean) {
  const [leave, setLeave] = useState<{ run: () => void } | null>(null),
    bypass = useRef(false);
  usePendingWork(dirty || pending);
  useEffect(() => {
    const nav = (window as unknown as { navigation?: Navigation }).navigation;
    const review = (run: () => void) => {
      if (!bypass.current && (dirty || pending)) setLeave({ run });
      else run();
    };
    const unregister = registerNavigationReview(review);
    const push = history.pushState,
      replace = history.replaceState;
    const intercept = (original: History["pushState"]): History["pushState"] =>
      function (data, unused, url) {
        if (!url || new URL(url, location.href).href === location.href)
          return original.call(history, data, unused, url);
        review(() => original.call(history, data, unused, url));
      };
    const guardedPush = intercept(push),
      guardedReplace = intercept(replace);
    history.pushState = guardedPush;
    history.replaceState = guardedReplace;
    const unload = (event: BeforeUnloadEvent) => {
      if (!bypass.current && (dirty || pending)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (raw: Event) => {
      const event = raw as NavigateEvent;
      if (
        bypass.current ||
        (!dirty && !pending) ||
        event.hashChange ||
        !event.cancelable
      )
        return;
      event.preventDefault();
      setLeave({
        run: () => {
          bypass.current = true;
          if (event.navigationType === "traverse")
            nav!.traverseTo(event.destination.key);
          else if (event.navigationType === "reload") nav!.reload();
          else
            nav!.navigate(event.destination.url, {
              history: event.navigationType,
            });
        },
      });
    };
    const click = (event: MouseEvent) => {
      if (
        bypass.current ||
        (!dirty && !pending) ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const a = (event.target as Element).closest?.("a[href]");
      if (
        !(a instanceof HTMLAnchorElement) ||
        a.target === "_blank" ||
        a.download ||
        (a.hash && a.pathname === location.pathname)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setLeave({
        run: () => {
          bypass.current = true;
          location.assign(a.href);
        },
      });
    };
    window.addEventListener("beforeunload", unload);
    nav?.addEventListener("navigate", navigate);
    document.addEventListener("click", click, true);
    return () => {
      unregister();
      if (history.pushState === guardedPush) history.pushState = push;
      if (history.replaceState === guardedReplace)
        history.replaceState = replace;
      window.removeEventListener("beforeunload", unload);
      nav?.removeEventListener("navigate", navigate);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, pending]);
  return {
    leave,
    stay: () => setLeave(null),
    request: (run: () => void) => {
      if (pending) return;
      if (dirty) setLeave({ run });
      else run();
    },
    proceed: () => {
      const run = leave?.run;
      setLeave(null);
      bypass.current = true;
      run?.();
      queueMicrotask(() => {
        bypass.current = false;
      });
    },
  };
}
