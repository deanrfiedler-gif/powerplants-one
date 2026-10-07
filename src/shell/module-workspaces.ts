// The shell allocates the viewport once; full-bleed modules own their toolbar,
// spacing and scroll surface. Other pages retain their established composition.
export const moduleWorkspaces = [
  { route: "/service/reports", moduleId: "FI-07", scope: "ppo-reports", layout: "padded", navigation: "workspace", baseline: "fi07-reports-register" },
  { route: "/service/reports/[id]", moduleId: "FI-07", scope: "ppo-reports", layout: "padded", navigation: "workspace", baseline: "fi07-reports-record" },
  { route: "/service/incidents", moduleId: "FI-06", scope: "ppo-incidents", layout: "padded", navigation: "workspace", baseline: "fi06-incidents-register" },
  { route: "/service/incidents/new", moduleId: "FI-06", scope: "ppo-incidents", layout: "padded", navigation: "workspace", baseline: "fi06-incidents-capture" },
  { route: "/service/incidents/[id]", moduleId: "FI-06", scope: "ppo-incidents", layout: "padded", navigation: "workspace", baseline: "fi06-incidents-record" },

  { route: "/my-jobs/inspections", moduleId: "FI-03", scope: "ppo-service-inspections", layout: "padded", navigation: "workspace", baseline: "fi03-inspections-native" },
  { route: "/service/inspections", moduleId: "FI-04", scope: "ppo-service-inspections", layout: "padded", navigation: "workspace", baseline: "fi04-inspections-native" },
  { route: "/my-jobs/[id]", moduleId: "FI-01", scope: "ppo-work-timer", layout: "padded", navigation: "workspace", baseline: "fi01-timer-native" },
  { route: "/products", moduleId: "PD-01", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-products" },
  { route: "/products/[id]", moduleId: "PD-01", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-detail" },
  { route: "/products/publication", moduleId: "PD-02", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-publication" },
  { route: "/products/pricing", moduleId: "PD-03", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-pricing" },
  { route: "/products/compatibility", moduleId: "PD-04", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-compatibility" },
  { route: "/products/import", moduleId: "PD-05", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-import" },
  { route: "/equipment", moduleId: "EQ-01", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq01-register-native-r01" },
  { route: "/equipment/[id]", moduleId: "EQ-01", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq01-record-native-r01" },
  { route: "/equipment/lookup", moduleId: "EQ-02", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq02-native-r01" },
  { route: "/equipment/bulletins", moduleId: "EQ-06", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq06-native-r01" },
  { route: "/equipment/lifecycle", moduleId: "EQ-07", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq07-native-r01" },
  { route: "/equipment/backups", moduleId: "EQ-08", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq08-native-r01" },
  { route: "/equipment/instruments", moduleId: "EQ-09", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq09-native-r01" },
  { route: "/customers/[id]", moduleId: "CS-01", scope: "ppo-customer-360", layout: "padded", navigation: "workspace", baseline: "cs01-native-r01" },
  { route: "/people/[id]", moduleId: "CS-02", scope: "ppo-contact", layout: "padded", navigation: "workspace", baseline: "cs02-native-r01" },
  { route: "/customers/[id]/stakeholders", moduleId: "CS-03", scope: "ppo-stakeholders", layout: "padded", navigation: "workspace", baseline: "cs03-native-r01" },
  { route: "/sites/[id]", moduleId: "CS-04", scope: "ppo-site", layout: "padded", navigation: "workspace", baseline: "cs04-native-r01" },
  { route: "/sites/[id]/readiness", moduleId: "CS-06", scope: "ppo-readiness", layout: "padded", navigation: "workspace", baseline: "cs06-native-r01" },
  { route: "/customers/[id]/development", moduleId: "CS-07", scope: "ppo-account-development", layout: "padded", navigation: "workspace", baseline: "cs07-native-r01" },
  { route: "/surveys", moduleId: "CS-08", scope: "ppo-survey", layout: "padded", navigation: "workspace", baseline: "cs08-native-r01" },
  { route: "/estimating/fertigation", scope: "ppo-fertigation", layout: "full-bleed", navigation: "workspace", baseline: "fertigation-native-r01" },
  { route: "/estimating/configurations", scope: "ppo-specialist", layout: "full-bleed", navigation: "workspace", baseline: "es08-native-r01" },
  { route: "/service/tickets", moduleId: "SV-01", scope: "ppo-service-requests", layout: "full-bleed", navigation: "workspace", baseline: "sv01-native-r01" },
  { route: "/facilities", moduleId: "CS-05", scope: "ppo-facilities", layout: "full-bleed", navigation: "workspace", baseline: "cs05-native-r01" },
  { route: "/projects/acceptance", moduleId: "PJ-09", scope: "ppo-acceptance", layout: "full-bleed", navigation: "workspace", baseline: "pj09-r01" },
  { route: "/sales/opportunities", scope: "ppo-deals", layout: "full-bleed", navigation: "workspace", baseline: "deals-r38" },
  { route: "/estimating/discovery/[id]", scope: "ppo-estimate-wizard", layout: "full-bleed", navigation: "workspace", baseline: "es02-r01" },
] as const;

export function moduleWorkspaceForPath(path: string) {
  return moduleWorkspaces.find(workspace => workspace.route === path
    || (workspace.scope.startsWith("ppo-") && workspace.route.includes("[id]") && new RegExp("^"+workspace.route.replace("[id]","[0-9a-f-]{36}")+"$").test(path))
    || (workspace.scope === "ppo-survey" && /^\/surveys\/[0-9a-f-]{36}$/.test(path))
    || (["ppo-fertigation", "ppo-specialist", "ppo-acceptance", "ppo-facilities"].includes(workspace.scope) && path.startsWith(workspace.route + "/"))
    || (workspace.scope === "ppo-estimate-wizard" && /^\/estimating\/discovery\/[0-9a-f-]{36}$/.test(path)));
}
