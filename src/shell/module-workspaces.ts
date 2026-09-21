// The shell allocates the viewport once; full-bleed modules own their toolbar,
// spacing and scroll surface. Other pages retain their established composition.
export const moduleWorkspaces = [
  { route: "/estimating/configurations", scope: "ppo-specialist", layout: "full-bleed", navigation: "workspace", baseline: "es08-native-r01" },
  { route: "/sales/opportunities", scope: "ppo-deals", layout: "full-bleed", navigation: "workspace", baseline: "deals-r38" },
  { route: "/estimating/discovery/[id]", scope: "ppo-estimate-wizard", layout: "full-bleed", navigation: "workspace", baseline: "es02-r01" },
] as const;

export function moduleWorkspaceForPath(path: string) {
  return moduleWorkspaces.find(workspace => workspace.route === path || workspace.scope === "ppo-specialist" && path.startsWith("/estimating/configurations/") || workspace.scope === "ppo-estimate-wizard" && /^\/estimating\/discovery\/[0-9a-f-]{36}$/.test(path));
}
