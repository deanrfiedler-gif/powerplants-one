// The shell allocates the viewport once; full-bleed modules own their toolbar,
// spacing and scroll surface. Other pages retain their established composition.
export const moduleWorkspaces = [
  { route: "/sales/opportunities", scope: "ppo-deals", layout: "full-bleed", navigation: "workspace", baseline: "deals-r38" },
] as const;

export function moduleWorkspaceForPath(path: string) {
  return moduleWorkspaces.find(workspace => workspace.route === path);
}
