// Which guides general users may see, and which guide a page shows (ADR-0065, decision 8). No Node imports here:
// the release file is read on the server, and the shell reads the same shapes in the browser.
import type { Entry } from "../development/model";
import type { CompiledGuide, GuideLibrary } from "./model";
import { guideStateFor, hasVisibleText } from "./status";

// One registered page. `guide_key` is the visible guide that covers it, or null when no visible guide does.
export type ReleasedRoute = { path: string; guide_key: string | null };

export type ReleasedLibrary = {
  guides: CompiledGuide[]; // the visible guides only
  routes: ReleasedRoute[]; // every registered route with a path, so a hidden guide still claims its page
  shell: CompiledGuide | null; // the visible guide bound to system:shell
};

export const isRouteEntry = (entry: Entry): entry is Entry & { path: string } => entry.kind === "route" && entry.path !== null;

// A guide is visible to general users in one of two ways:
//   1. it is Published and its reviewed content hash still matches the text; or
//   2. it was carried over from a TypeScript guide that users already see, it is marked shown_before_review, and it
//      is in review or reviewed. That lets the carried-over guides keep showing until their formal review.
// Draft, Superseded and Withdrawn guides are never visible, whatever their flags. The checks hold for a guide read
// back from a release file that was edited by hand, where a flag may not be a boolean.
function isVisible(guide: CompiledGuide): boolean {
  const { front } = guide;
  if (front.status === "Published") return guideStateFor(front, guide.contentHash) === "Reviewed";
  return front.shown_before_review === true && hasVisibleText(front.carried_over_from) && (front.status === "InReview" || front.status === "Reviewed");
}

export function releasedGuides(library: GuideLibrary, entries: Entry[]): ReleasedLibrary {
  const guides = library.guides.filter(isVisible);
  // The library has already refused an entry claimed by two guides, so the first claim is the only one.
  const byEntry = new Map<string, CompiledGuide>();
  for (const guide of guides) {
    for (const key of [guide.front.entry_key, ...guide.front.also_applies_to]) {
      if (!byEntry.has(key)) byEntry.set(key, guide);
    }
  }
  return {
    guides,
    routes: entries.filter(isRouteEntry).map((entry) => ({ path: entry.path, guide_key: byEntry.get(entry.key)?.front.guide_key ?? null })),
    shell: guides.find((guide) => guide.front.entry_key === "system:shell") ?? null,
  };
}

// The production server reads the release file the build wrote, and applies the visibility rule to it again, as the
// renderer checks every link again: a file changed after the build cannot show a guide the build would have hidden.
// A route whose guide is hidden keeps its place with no guide, so it never falls through to a dynamic route's guide.
export function visibleRelease(released: ReleasedLibrary): ReleasedLibrary {
  const guides = released.guides.filter(isVisible);
  const keys = new Set(guides.map((guide) => guide.front.guide_key));
  return {
    guides,
    routes: released.routes.map((route) => (route.guide_key === null || keys.has(route.guide_key) ? route : { ...route, guide_key: null })),
    shell: released.shell && isVisible(released.shell) ? released.shell : null,
  };
}

// The route that owns a pathname, with the precedence of matchEntry in src/development/model.ts: an exact path
// first; then the dynamic patterns, longest first, where [param] matches any non-empty segment of the same count.
// A test keeps the two in step against the real register.
export function routeForPath(routes: ReleasedRoute[], pathname: string): ReleasedRoute | null {
  const exact = routes.find((route) => route.path === pathname);
  if (exact) return exact;
  const actual = pathname.split("/");
  return (
    routes
      .filter((route) => route.path.includes("["))
      .sort((a, b) => b.path.length - a.path.length)
      .find((route) => {
        const pattern = route.path.split("/");
        return pattern.length === actual.length && pattern.every((part, index) => (part.startsWith("[") ? !!actual[index] : part === actual[index]));
      }) ?? null
  );
}

// The page's route is decided first, so a static route whose guide is hidden does not fall through to the visible
// guide of a dynamic route beside it.
export function guideForPath(released: ReleasedLibrary, pathname: string): CompiledGuide | null {
  const key = routeForPath(released.routes, pathname)?.guide_key;
  return key ? (released.guides.find((guide) => guide.front.guide_key === key) ?? null) : null;
}
