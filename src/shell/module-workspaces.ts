// The shell allocates the viewport once; full-bleed modules own their toolbar,
// spacing and scroll surface. Other pages retain their established composition.
export const moduleWorkspaces = [
  { route: "/facilities", moduleId: "CS-05", scope: "ppo-facilities", layout: "full-bleed", navigation: "workspace", baseline: "cs05-native-r01" },
  { route: "/projects/acceptance", moduleId: "PJ-09", scope: "ppo-acceptance", layout: "full-bleed", navigation: "workspace", baseline: "pj09-r01" },
  { route: "/sales/opportunities", scope: "ppo-deals", layout: "full-bleed", navigation: "workspace", baseline: "deals-r38" },
] as const;

export function moduleWorkspaceForPath(path: string) {
  return moduleWorkspaces.find(workspace => workspace.route === path || (["ppo-acceptance","ppo-facilities"].includes(workspace.scope) && path.startsWith(workspace.route + "/")));
}
