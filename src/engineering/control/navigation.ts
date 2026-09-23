import { basisViews, type ControlKind } from "./model";
export const controlModules = {
  basis: {
    title: "Design basis & interfaces",
    kind: "basis",
    views: basisViews,
  },
  drawings: {
    title: "Drawings & controlled documents",
    kind: "document",
    views: [
      ["register", "Document register"],
      ["deliverables", "Accountable deliverables"],
    ],
  },
  queries: {
    title: "Technical queries & submittals",
    kind: "query",
    views: [
      ["register", "Technical queries"],
      ["submittals", "Supplier submittals"],
    ],
  },
  reviews: {
    title: "Technical reviews & issues",
    kind: "review",
    views: [
      ["register", "Technical review queue"],
      ["issues", "Formal issues & transmittals"],
    ],
  },
} as const;
export type ControlModule = keyof typeof controlModules;
export const controlKind = (
  module: ControlModule,
  view: string,
): ControlKind =>
  view === "deliverables"
    ? "deliverable"
    : view === "submittals"
      ? "submittal"
      : view === "issues"
        ? "issue"
        : controlModules[module].kind;
export function controlHref(
  packageId: string,
  module: ControlModule,
  view?: string,
  recordId?: string,
) {
  const first = controlModules[module].views[0][0];
  return `/engineering/${packageId}/${module}${view && view !== first ? `/${view}` : ""}${recordId ? `?record=${recordId}` : ""}`;
}
export function controlPath(path: string) {
  const match =
    /^\/engineering\/(?:([^/]+)\/)?(basis|drawings|queries|reviews)(?:\/([a-z]+))?\/?$/.exec(
      path,
    );
  if (!match) return undefined;
  const moduleKey = match[2] as ControlModule,
    definition = controlModules[moduleKey];
  const view = definition.views.find(
    ([key]) => key === (match[3] ?? definition.views[0][0]),
  );
  return view
    ? {
        packageId: match[1] ?? null,
        module: moduleKey,
        view: view[0],
        title: definition.title,
      }
    : undefined;
}
