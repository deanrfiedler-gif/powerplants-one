// The shell allocates the viewport once; full-bleed modules own their toolbar,
// spacing and scroll surface. Other pages retain their established composition.
// One line per route, sorted by route, so a new page lands in its own place instead of beside
// every other new page (PPO-MERGE-CONFLICT-DEC, 27 October 2026 amendment).
export const moduleWorkspaces = [
  { route: "/admin/access", moduleId: "AD-01", scope: "ppo-access-register", layout: "full-bleed", navigation: "workspace", baseline: "ad01-identity-register" },
  { route: "/customers", moduleId: "CS-01", scope: "ppo-organisations", layout: "full-bleed", navigation: "workspace", baseline: "cs01-organisations-register" },
  { route: "/customers/[id]", moduleId: "CS-01", scope: "ppo-customer-360", layout: "full-bleed", navigation: "workspace", baseline: "cs01-native-r01" },
  { route: "/customers/[id]/development", moduleId: "CS-07", scope: "ppo-account-development", layout: "padded", navigation: "workspace", baseline: "cs07-native-r01" },
  { route: "/customers/[id]/stakeholders", moduleId: "CS-03", scope: "ppo-stakeholders", layout: "padded", navigation: "workspace", baseline: "cs03-native-r01" },
  {route:"/documents",moduleId:"DK-01",scope:"ppo-library",layout:"full-bleed",navigation:"workspace",baseline:"dk01-accepted-library"},
  {route:"/documents/issues",moduleId:"DK-03",scope:"ppo-outputs",layout:"full-bleed",navigation:"workspace",baseline:"dk03-accepted-output-issue"},
  {route:"/documents/issues/job-packs/[id]",moduleId:"DK-03",scope:"ppo-outputs",layout:"full-bleed",navigation:"workspace",baseline:"dk03-accepted-job-pack-record"},
  {route:"/documents/issues/service-reports/[id]",moduleId:"DK-03",scope:"ppo-outputs",layout:"full-bleed",navigation:"workspace",baseline:"dk03-accepted-service-report-record"},
  {route:"/documents/library/[id]",moduleId:"DK-02",scope:"ppo-library",layout:"full-bleed",navigation:"workspace",baseline:"dk02-accepted-library-record"},
  { route: "/equipment", moduleId: "EQ-01", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq01-register-native-r01" },
  { route: "/equipment/[id]", moduleId: "EQ-01", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq01-record-native-r01" },
  { route: "/equipment/backups", moduleId: "EQ-08", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq08-native-r01" },
  { route: "/equipment/bulletins", moduleId: "EQ-06", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq06-native-r01" },
  { route: "/equipment/instruments", moduleId: "EQ-09", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq09-native-r01" },
  { route: "/equipment/lifecycle", moduleId: "EQ-07", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq07-native-r01" },
  { route: "/equipment/lookup", moduleId: "EQ-02", scope: "ppo-equipment", layout: "padded", navigation: "workspace", baseline: "eq02-native-r01" },
  { route: "/estimating/configurations", scope: "ppo-specialist", layout: "full-bleed", navigation: "workspace", baseline: "es08-native-r01" },
  {route:"/estimating/cpq",moduleId:"ES-02",scope:"ppo-cpq",layout:"full-bleed",navigation:"workspace",baseline:"cpq-configure-implementation"},
  { route: "/estimating/discovery/[id]", scope: "ppo-estimate-wizard", layout: "full-bleed", navigation: "workspace", baseline: "es02-r01" },
  { route: "/estimating/discovery/[id]/costing", scope: "ppo-estimate-wizard", layout: "full-bleed", navigation: "workspace", baseline: "es02-costing-figma" },
  { route: "/estimating/fertigation", scope: "ppo-fertigation", layout: "full-bleed", navigation: "workspace", baseline: "fertigation-native-r01" },
  { route: "/estimating/reviews", moduleId: "ES-04", scope: "ppo-estimate-reviews", layout: "full-bleed", navigation: "workspace", baseline: "estimate-reviews-figma-register" },
  {route:"/estimating/rules",moduleId:"ES-03",scope:"ppo-cpq",layout:"full-bleed",navigation:"workspace",baseline:"cpq-rules-implementation"},
  { route: "/facilities", moduleId: "CS-05", scope: "ppo-facilities", layout: "full-bleed", navigation: "workspace", baseline: "cs05-native-r01" },
  {route:"/maintenance/agreements",moduleId:"MA-01",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma01-native-r01"},
  {route:"/maintenance/agreements/[id]",moduleId:"MA-01",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma01-record-native-r01"},
  {route:"/maintenance/coverage",moduleId:"MA-02",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma02-native-r01"},
  {route:"/maintenance/coverage/[id]",moduleId:"MA-02",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma02-record-native-r01"},
  {route:"/maintenance/due",moduleId:"MA-04",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma04-native-r01"},
  {route:"/maintenance/due/[id]",moduleId:"MA-04",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma04-record-native-r01"},
  {route:"/maintenance/plans",moduleId:"MA-03",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma03-native-r01"},
  {route:"/maintenance/plans/[id]",moduleId:"MA-03",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma03-record-native-r01"},
  {route:"/maintenance/renewals",moduleId:"MA-05",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma05-native-r01"},
  {route:"/maintenance/renewals/[id]",moduleId:"MA-05",scope:"ppo-maintenance",layout:"padded",navigation:"workspace",baseline:"ma05-record-native-r01"},
  { route: "/my-jobs/[id]", moduleId: "FI-01", scope: "ppo-work-timer", layout: "padded", navigation: "workspace", baseline: "fi01-timer-native" },
  { route: "/my-jobs/inspections", moduleId: "FI-03", scope: "ppo-service-inspections", layout: "full-bleed", navigation: "workspace", baseline: "fi03-inspections-native" },
  { route: "/people/[id]", moduleId: "CS-02", scope: "ppo-contact", layout: "padded", navigation: "workspace", baseline: "cs02-native-r01" },
  { route: "/products", moduleId: "PD-01", scope: "ppo-products", layout: "full-bleed", navigation: "workspace", baseline: "products-discovery-catalogue" },
  { route: "/products/[id]", moduleId: "PD-01", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-detail" },
  { route: "/products/compatibility", moduleId: "PD-04", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-compatibility" },
  { route: "/products/import", moduleId: "PD-05", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-import" },
  { route: "/products/pricing", moduleId: "PD-03", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-pricing" },
  { route: "/products/publication", moduleId: "PD-02", scope: "ppo-products", layout: "padded", navigation: "workspace", baseline: "products-native-publication" },
  { route: "/projects", scope: "ppo-projects", layout: "full-bleed", navigation: "workspace", baseline: "projects-figma-register" },
  { route: "/projects/acceptance", moduleId: "PJ-09", scope: "ppo-acceptance", layout: "full-bleed", navigation: "workspace", baseline: "pj09-r01" },
  { route: "/sales/opportunities", scope: "ppo-deals", layout: "full-bleed", navigation: "workspace", baseline: "deals-r38" },
  { route: "/service/incidents", moduleId: "FI-06", scope: "ppo-incidents", layout: "full-bleed", navigation: "workspace", baseline: "fi06-incidents-register" },
  { route: "/service/incidents/[id]", moduleId: "FI-06", scope: "ppo-incidents", layout: "full-bleed", navigation: "workspace", baseline: "fi06-incidents-record" },
  { route: "/service/incidents/new", moduleId: "FI-06", scope: "ppo-incidents", layout: "full-bleed", navigation: "workspace", baseline: "fi06-incidents-capture" },
  { route: "/service/inspections", moduleId: "FI-04", scope: "ppo-service-inspections", layout: "full-bleed", navigation: "workspace", baseline: "fi04-inspections-native" },
  { route: "/service/packs", moduleId: "SV-05", scope: "ppo-pack-register", layout: "full-bleed", navigation: "workspace", baseline: "job-pack-figma-register" },
  { route: "/service/packs/[id]", moduleId: "SV-05", scope: "ppo-job-pack", layout: "full-bleed", navigation: "workspace", baseline: "job-pack-figma-record" },
  { route: "/service/packs/new", moduleId: "SV-05", scope: "ppo-job-pack", layout: "full-bleed", navigation: "workspace", baseline: "job-pack-figma-preparation" },
  { route: "/service/reports", moduleId: "SV-06", scope: "ppo-reports", layout: "full-bleed", navigation: "workspace", baseline: "fi07-reports-register" },
  { route: "/service/reports/[id]", moduleId: "SV-06", scope: "ppo-reports", layout: "full-bleed", navigation: "workspace", baseline: "fi07-reports-record" },
  { route: "/service/tickets", moduleId: "SV-01", scope: "ppo-service-requests", layout: "full-bleed", navigation: "workspace", baseline: "sv01-native-r01" },
  { route: "/service/tickets/[id]", moduleId: "SV-02", scope: "ppo-service-record", layout: "full-bleed", navigation: "workspace", baseline: "sv02-record-native-r01" },
  { route: "/service/tickets/new", moduleId: "SV-01", scope: "ppo-service-create", layout: "full-bleed", navigation: "workspace", baseline: "sv01-create-native-r01" },
  { route: "/sites/[id]", moduleId: "CS-04", scope: "ppo-site", layout: "padded", navigation: "workspace", baseline: "cs04-native-r01" },
  { route: "/sites/[id]/readiness", moduleId: "CS-06", scope: "ppo-readiness", layout: "padded", navigation: "workspace", baseline: "cs06-native-r01" },
  { route: "/surveys", moduleId: "CS-08", scope: "ppo-survey", layout: "padded", navigation: "workspace", baseline: "cs08-native-r01" },
  {route:"/warranty/cases",moduleId:"MA-06",scope:"ppo-warranty",layout:"padded",navigation:"workspace",baseline:"ma06-native-r01"},
  {route:"/warranty/cases/[id]",moduleId:"MA-06",scope:"ppo-warranty",layout:"padded",navigation:"workspace",baseline:"ma06-record-native-r01"},
  {route:"/warranty/supplier-recovery",moduleId:"MA-07",scope:"ppo-warranty",layout:"padded",navigation:"workspace",baseline:"ma07-native-r01"},
  {route:"/warranty/supplier-recovery/[id]",moduleId:"MA-07",scope:"ppo-warranty",layout:"padded",navigation:"workspace",baseline:"ma07-record-native-r01"},
] as const;

export function moduleWorkspaceForPath(path: string) {
  // An exact route wins, then a record pattern, then the module rules; entry order never decides.
  const record = (route: string) =>
    route.includes("[id]") && new RegExp("^" + route.replace("[id]", "[0-9a-f-]{36}") + "$").test(path);
  return moduleWorkspaces.find(workspace => workspace.route === path)
    ?? moduleWorkspaces.find(workspace => workspace.scope.startsWith("ppo-") && record(workspace.route))
    ?? moduleWorkspaces.find(workspace => (workspace.scope === "ppo-survey" && /^\/surveys\/[0-9a-f-]{36}$/.test(path))
      || (["ppo-fertigation", "ppo-specialist", "ppo-acceptance", "ppo-facilities", "ppo-cpq"].includes(workspace.scope) && path.startsWith(workspace.route + "/"))
      || (workspace.scope === "ppo-estimate-wizard" && /^\/estimating\/discovery\/[0-9a-f-]{36}$/.test(path)));
}
