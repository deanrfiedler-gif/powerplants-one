"use client";
// A mounted workspace may review programmatic shell navigation before the
// router starts changing its tree. Other modules retain their existing guards.
const reviewers = new Map<(run: () => void) => void, number>();
export function registerNavigationReview(review: (run: () => void) => void, priority = 100) {
  reviewers.set(review, priority);
  return () => {
    reviewers.delete(review);
  };
}
export function reviewNavigation(run: () => void) {
  const reviewer = [...reviewers].toSorted((a,b) => b[1] - a[1])[0]?.[0];
  if (!reviewer) return false;
  reviewer(run);
  return true;
}
export function navigateWithReview(run: () => void) {
  if (!reviewNavigation(run)) run();
}

// Shared forms/preferences use the same contract for pointer, touch, router and
// native history transitions. Discovery retains its stronger command journal,
// asynchronous dialog and history guards, at the higher registered priority.
export function guardBrowserNavigation(review: (run: () => void) => void, priority: number) {
  let approved = false;
  const guarded = (run: () => void) => review(() => { approved = true; run(); });
  const release = registerNavigationReview(guarded, priority);
  const owns = () => [...reviewers].toSorted((a,b) => b[1]-a[1])[0]?.[0] === guarded;
  const nav = (window as unknown as { navigation?: EventTarget & {
    navigate(url: string, options: { history: "push" | "replace" }): unknown;
    traverseTo(key: string): unknown; reload(): unknown;
  } }).navigation;
  const click = (event: MouseEvent) => {
    if (!owns() || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.download || link.href === location.href || (link.hash && link.pathname === location.pathname)) return;
    let allowed = false;
    guarded(() => { allowed = true; });
    if (!allowed) { event.preventDefault(); event.stopPropagation(); }
  };
  const navigate = (raw: Event) => {
    const event = raw as Event & { hashChange: boolean; destination: { url: string; key: string }; navigationType: "push" | "replace" | "traverse" | "reload" };
    if (!owns() || event.hashChange || event.destination.url === location.href) return;
    if (approved) { approved = false; return; }
    if (!event.cancelable) return;
    event.preventDefault();
    guarded(() => {
      if (event.navigationType === "traverse") nav!.traverseTo(event.destination.key);
      else if (event.navigationType === "reload") nav!.reload();
      else nav!.navigate(event.destination.url, { history: event.navigationType });
    });
  };
  const unload = (event: BeforeUnloadEvent) => {
    if (!owns() || approved) return;
    event.preventDefault(); event.returnValue = "";
  };
  document.addEventListener("click", click, true);
  nav?.addEventListener("navigate", navigate);
  window.addEventListener("beforeunload", unload);
  return () => {
    release(); document.removeEventListener("click", click, true);
    nav?.removeEventListener("navigate", navigate); window.removeEventListener("beforeunload", unload);
  };
}
