// The header breadcrumb and the browser-tab title, built from route metadata, never from URL slugs.
// The trail is the full path: the department, the destination, the module and view its own menu names, and
// a loaded record. It stays in the Page hierarchy panel and the breadcrumb's tooltip. The visible breadcrumb
// follows the shell top bar amendment (16 October 2026): the page itself and, when it sits beneath
// something, the one list to go back to (R1, R2). Never more than two items and never the department,
// which the rail already shows (R3); a record by its reference alone (R4); and no register's default view,
// which its menu already marks (R5).
import { controlHref, controlModules, controlPath } from "../engineering/control/navigation";
import { documentTitle, recordReference, recordTitle } from "./page-title";
import {
  canOpen,
  changesHref,
  changesModuleLabel,
  changesPath,
  commissioningHref,
  commissioningModuleLabel,
  commissioningPath,
  destination,
  materialsHref,
  materialsModuleLabel,
  materialsPath,
  pageForPath,
  workViewForPath,
  workspaceForLocation,
  workspaces,
  type ShellDestination,
  type WorkspaceId,
} from "./navigation";

export type Crumb = { key: string; label: string; href?: string; kind: "root" | "page" | "view" | "record" };
export type BreadcrumbInput = {
  path: string;
  query: URLSearchParams;
  // Loaded, authorized display data only, and only for a signed-in session; otherwise null.
  record: { reference: string; title: string } | null;
  signedIn: boolean;
  permitted: readonly string[];
  hosted: boolean;
  preference: WorkspaceId;
};
export type Breadcrumb = {
  // The page's own name, which also names its guide.
  label: string;
  trail: Crumb[];
  crumbs: Crumb[];
  title: string;
  // Whether the Page hierarchy button is offered.
  hierarchy: boolean;
};

export function breadcrumb({ path, query, record, signedIn, permitted, hosted, preference }: BreadcrumbInput): Breadcrumb {
  // PJ-05 G3: no invented record number. Use the permitted kind as the record label.
  const commercialRecord = /^\/projects\/([^/]+)\/commercial\/[^/]+$/.exec(path);
  if (path === "/projects/commercial" || commercialRecord) {
    const kind = signedIn && record ? record.reference : "Commercial record";
    const crumbs: Crumb[] = [
      {key:"root",label:"Projects",href:signedIn?"/projects":undefined,kind:"root"},
      {key:"page",label:"Variations & obligations",href:commercialRecord?`/projects/commercial?project=${commercialRecord[1]}`:undefined,kind:"page"},
      ...(commercialRecord?[{key:"record",label:kind,kind:"record" as const}]:[]),
    ];
    return {label:"Variations & obligations",trail:crumbs,crumbs,title:documentTitle({page:commercialRecord?kind:"Variations & obligations",department:"Projects"}),hierarchy:false};
  }
  const page = pageForPath(path);
  const reachable = (item: ShellDestination | undefined) => (item && canOpen(item, permitted, hosted) ? item.href : undefined);
  // An Engineering module with its own secondary menu: its name, the address of its register and the
  // destination its menu names. Its register is the module's default view.
  const materials = page?.workspace === "engineering" ? materialsPath(path) : undefined;
  const changes = page?.workspace === "engineering" ? changesPath(path) : undefined;
  const commissioning = page?.workspace === "engineering" ? commissioningPath(path) : undefined;
  const control = materials || changes || commissioning ? undefined : controlPath(path);
  const engineering = materials
    ? { label: materialsModuleLabel, href: materials.package_id ? materialsHref(materials.package_id) : "/engineering/materials", view: materials.view?.label, index: materials.view?.id === "register" }
    : changes
      ? { label: changesModuleLabel, href: changes.package_id ? changesHref(changes.package_id) : "/engineering/changes", view: changes.view?.label, index: changes.view?.id === "register" }
      : commissioning
        ? { label: commissioningModuleLabel, href: commissioningHref("register", { package: query.get("package") }), view: commissioning.view?.label, index: commissioning.view?.id === "register" }
        : control
          ? {
              label: control.title,
              href: control.packageId ? controlHref(control.packageId, control.module) : `/engineering/${control.module}`,
              view: controlModules[control.module].views.find(([key]) => key === control.view)?.[1],
              index: control.view === controlModules[control.module].views[0][0],
            }
          : undefined;
  const label =
    path === "/"
      ? ""
      : path === "/calendar"
        ? query.get("scope") === "sales" ? "Sales Activities" : "Personal Calendar"
        : path === "/development/page-register"
          ? "Design & build"
          : path === "/development/design-system"
            ? "Component catalogue"
            : path.startsWith("/estimating/configurations")
              ? "Specialist configurations"
              : /^\/estimating\/discovery\/[^/]+$/.test(path) && !path.endsWith("/new")
                ? "Estimation Wizard"
                : engineering ? "Engineering" : (page?.label ?? "Page unavailable");
  // My Work names its subview beside itself; the overview is its index, so My Work alone is current.
  const workView = page?.id === "work" && path !== "/work" ? workViewForPath(path)?.label : undefined;
  // The module name a destination's own menu shows for its default view: dropped from the breadcrumb (R5).
  const acceptance = path.startsWith("/projects/acceptance");
  const projectsRegister = path === "/projects";
  const indexView = acceptance ? "Staged Acceptance & Closeout" : projectsRegister ? "Project register" : undefined;
  const moduleRoute = !!engineering || !!indexView;
  const view = workView ?? engineering?.label ?? indexView;
  const subview = engineering?.view;
  const workspaceRoot = workspaces.find((w) => w.id === (page?.id === "work" && path === "/work" ? workspaceForLocation(path, query, preference, permitted) : page?.workspace));
  // The overview carries its selected department; Service keeps its established short name.
  const department = page?.workspace === "service" ? "Service" : workspaceRoot?.label;
  // A page that names a kind of page under a destination, such as Saved estimate under Intake & workload.
  const parent = page && !moduleRoute && destination(page.id)?.label !== page.label && page.id !== "search" ? destination(page.id) : undefined;
  const fertigation = /^\/estimating\/fertigation\/[^/]+$/.test(path) && !path.endsWith("/new");
  const screenWorkbench = /^\/estimating\/configurations\/[^/]+\/(configure|drawings|parts|pricing|compare|definition|history)$/.test(path);
  const loaded = record && signedIn ? record : null;

  const trail: Crumb[] = [];
  if (label) {
    if (department && department !== label && !moduleRoute)
      trail.push({ key: "root", label: department, href: reachable(workspaceRoot ? destination(workspaceRoot.primary) : undefined), kind: "root" });
    if (parent) trail.push({ key: "module", label: parent.label, kind: "page", href: reachable(parent) });
    trail.push({ key: "page", label, kind: moduleRoute ? "root" : "page", href: parent ? undefined : reachable(page) });
    if (view) trail.push({ key: "view", label: view, kind: moduleRoute ? "page" : "view", href: engineering?.href });
    if (subview) trail.push({ key: "subview", label: subview, kind: "view" });
  }
  if (screenWorkbench) {
    const configurations = trail.find((crumb) => crumb.key === "page");
    if (configurations) configurations.href = "/estimating/configurations";
    trail.push({ key: "workbench", label: "Screen Configurator Workbench", kind: "page" });
  }
  if (loaded && !screenWorkbench) trail.push({ key: "record", label: recordTitle(loaded.reference, loaded.title), kind: "record" });
  if (fertigation) {
    trail.splice(0, trail.length, { key: "page", label: "Scope register", kind: "page", href: signedIn ? "/estimating/fertigation" : undefined });
    if (loaded) trail.push({ key: "record", label: recordReference(loaded.reference), kind: "record" });
  }

  const find = (key: string) => trail.find((crumb) => crumb.key === key);
  const pageCrumb = find("page"), viewCrumb = find("view"), subviewCrumb = find("subview"), moduleCrumb = find("module");
  const recordCrumb = find("record"), workbench = find("workbench");
  // The nearest list the current item belongs to.
  const owner = engineering ? viewCrumb : workView ? viewCrumb : parent ? moduleCrumb : pageCrumb;
  const shown: (Crumb | undefined)[] = fertigation
    ? trail
    : workbench
      ? [pageCrumb, workbench]
      : recordCrumb
        ? [owner, { ...recordCrumb, label: recordReference(loaded!.reference) }]
        : engineering
          ? subviewCrumb && !engineering.index ? [viewCrumb, subviewCrumb] : [viewCrumb]
          : workView
            ? [pageCrumb, viewCrumb]
            : parent
              ? [moduleCrumb, pageCrumb]
              : [pageCrumb];
  const crumbs = shown.filter((crumb): crumb is Crumb => !!crumb).map((crumb) => ({ ...crumb }));
  // The current item is marked as the current page and is never a link (R8).
  const current = (list: Crumb[]) => {
    if (list.length) list[list.length - 1] = { ...list[list.length - 1], href: undefined };
    return list;
  };

  // NR-17: the browser tab keeps the record, the page or view and the department.
  const title = documentTitle({
    record: loaded ? recordTitle(loaded.reference, loaded.title) : /\/new$/.test(path) ? "New record" : undefined,
    page: subview ?? view ?? (label || "Home"),
    department,
  });
  // The full path stays one click away whenever there is more than the page itself (Q3). The Projects
  // register has no Page hierarchy button in its accepted design.
  return { label, trail: current(trail), crumbs: current(crumbs), title, hierarchy: trail.length > 1 && !projectsRegister };
}
