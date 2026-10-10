import type { NavigationIconName } from "./navigation-icons";
import type { ProductPathName } from "./product-icons";
import type { ShellShapeName } from "./shell-icon";
import type { IconName as MyWorkIconName } from "../activities/components/client/my-work-ui";
import type { SecondaryGlyphName } from "../shell/secondary-menu";
import type { IconName as JobPackIconName } from "../documents/components/client/job-pack-ui";
import type { IconName as MaterialsIconName } from "../engineering/materials/components/client/materials-ui";
import type { OutlineName as ChangesOutlineName } from "../engineering/changes/components/client/changes-ui";
import type { ToneIcon } from "../engineering/changes/model";
import type { OutlineName as CommissioningOutlineName, MarkName as CommissioningMarkName } from "../engineering/commissioning/components/client/commissioning-ui";
import type { AdditionalIconName as AcceptanceIconName } from "../projects/acceptance/icon";
import type { LeadsIconName } from "./leads-workspace";
import type { GanttIconName } from "./projects-gantt";

// ADR-0050: each semantic icon name maps to one Font Awesome Pro icon, drawn in Classic Light,
// and in Classic Solid where the app marks a selected item. Every catalogue keeps its own names
// and meanings, so each map is typed against its catalogue: a new name with no Font Awesome
// counterpart fails the type check. The values are Font Awesome icon names without the "fa-"
// prefix. Until the Kit has loaded, and wherever it is not configured, the local drawings remain.
type FontAwesomeIcon = string;

// src/components/navigation-icons.tsx: department rails, More and the shared destinations.
export const navigationFontAwesome = {
  "nav-pulse": "heart-pulse",
  "nav-leads": "crosshairs",
  "nav-deals": "circle-dollar",
  "nav-activities": "calendar-days",
  "nav-tasks": "clipboard-check",
  "nav-mail": "envelope",
  "nav-contacts": "address-card",
  "nav-products": "cube",
  "nav-insights": "chart-line",
  "nav-work": "clipboard-list",
  "nav-inbox": "inbox",
  "nav-wizard": "wand-magic-sparkles",
  "nav-estimates": "calculator",
  "nav-configurations": "sliders",
  "nav-pricing": "tags",
  "nav-quotation": "file-invoice-dollar",
  "nav-approval": "badge-check",
  "nav-workload": "bars-progress",
  "nav-interfaces": "sitemap",
  "nav-drawings": "pen-ruler",
  "nav-materials": "layer-group",
  "nav-changes": "code-pull-request",
  "nav-commissioning": "gauge",
  "nav-projects": "diagram-project",
  "nav-programme": "chart-gantt",
  "nav-readiness": "list-check",
  "nav-risks": "triangle-exclamation",
  "nav-variations": "file-plus-minus",
  "nav-assurance": "shield-check",
  "nav-acceptance": "flag-checkered",
  "nav-requests": "headset",
  "nav-orders": "file-pen",
  "nav-schedule": "calendar-week",
  "nav-team": "users",
  "nav-packs": "folder-open",
  "nav-service-review": "file-check",
  "nav-equipment": "gears",
  "nav-demand": "list-ol",
  "nav-purchasing": "cart-shopping",
  "nav-inbound": "ship",
  "nav-receiving": "box-check",
  "nav-stock": "warehouse",
  "nav-dispatch": "truck",
  "nav-returns": "rotate-left",
  "nav-accounts": "book-user",
  "nav-performance": "chart-column",
  "nav-claims": "receipt",
  "nav-cash": "wallet",
  "nav-reconciliation": "scale-balanced",
  "nav-exceptions": "circle-exclamation",
  "nav-people": "user",
  "nav-organisations": "building",
  "nav-sites": "location-dot",
  "nav-facilities": "seedling",
  "nav-documents": "files",
  "nav-screen": "blinds",
  "nav-fertigation": "droplet",
  "nav-service": "wrench",
  "nav-agreements": "file-contract",
  "nav-maintenance": "screwdriver-wrench",
  "nav-engineering": "compass-drafting",
  "nav-sales": "briefcase",
  "nav-handover": "arrow-right-arrow-left",
  "nav-recovery": "plug-circle-bolt",
} satisfies Record<NavigationIconName, FontAwesomeIcon>;

// src/components/shell-icon.tsx: header, panels, workspace entries and the Sales phone bar.
export const shellFontAwesome = {
  info: "circle-info",
  search: "magnifying-glass",
  plus: "plus",
  help: "circle-question",
  bell: "bell",
  close: "xmark",
  more: "ellipsis",
  sales: "briefcase",
  estimate: "calculator",
  engineering: "compass-drafting",
  projects: "diagram-project",
  service: "wrench",
  supply: "boxes-stacked",
  finance: "receipt",
  work: "clipboard-list",
  customers: "building",
  contacts: "user",
  sites: "location-dot",
  equipment: "gears",
  products: "cube",
  documents: "file-lines",
  reports: "chart-column",
  settings: "gear",
  recovery: "triangle-exclamation",
  overview: "house",
  mail: "envelope",
  calendar: "calendar",
  "bar-work": "clipboard-list",
  "bar-opportunities": "circle-dollar",
  "bar-activities": "calendar-day",
  "bar-contacts": "user",
  "bar-more": "ellipsis",
  down: "chevron-down",
  check: "check",
  "chevron-right": "chevron-right",
} satisfies Record<ShellShapeName, FontAwesomeIcon>;

// src/components/product-icons.tsx: Sales, CRM, Leads and Service controls.
export const productFontAwesome = {
  eye: "eye",
  archive: "box-archive",
  chevron: "chevron-down",
  collapse: "chevron-left",
  expand: "chevron-right",
  changes: "arrow-right-arrow-left",
  download: "download",
  flag: "flag",
  trash: "trash-can",
  check: "check",
  info: "circle-info",
  search: "magnifying-glass",
  mail: "envelope",
  edit: "pen",
  home: "house",
  work: "clipboard-list",
  sales: "briefcase",
  leads: "filter",
  pulse: "wave-pulse",
  deals: "dollar-sign",
  calendar: "calendar-days",
  products: "cube",
  insights: "chart-column",
  estimate: "calculator",
  engineering: "compass-drafting",
  projects: "diagram-project",
  service: "wrench",
  supply: "boxes-stacked",
  finance: "receipt",
  customers: "users",
  person: "user",
  settings: "sliders",
  board: "square-kanban",
  list: "list",
  plus: "plus",
  filter: "bars-filter",
  clock: "clock",
  warning: "triangle-exclamation",
  menu: "bars",
  close: "xmark",
  more: "ellipsis",
  help: "circle-question",
  bell: "bell",
  sites: "location-dot",
  documents: "file-lines",
  inbox: "inbox",
  caret: "caret-down",
  sort: "arrow-down-wide-short",
  disqualified: "ban",
  converted: "circle-check",
  gear: "gear",
} satisfies Record<ProductPathName, FontAwesomeIcon>;

// src/activities/components/client/my-work-ui.tsx: My Work and the modules that reuse its Icon.
export const myWorkFontAwesome = {
  plus: "plus",
  check: "check",
  close: "xmark",
  calendar: "calendar",
  "calendar-alert": "calendar-exclamation",
  clock: "clock",
  mail: "envelope",
  phone: "phone",
  video: "video",
  pin: "location-dot",
  task: "square-check",
  alert: "circle-exclamation",
  bookmark: "bookmark",
  filter: "bars-filter",
  sliders: "sliders",
  user: "user",
  users: "users",
  review: "user-check",
  dots: "ellipsis",
  "chevron-right": "chevron-right",
  "chevron-left": "chevron-left",
  "chevron-down": "chevron-down",
  "arrow-right": "arrow-right",
  document: "file-lines",
  grid: "grid-2",
  list: "list",
  settings: "gear",
  panel: "sidebar",
  refresh: "arrows-rotate",
  bell: "bell",
  link: "link",
  menu: "bars",
  "calendar-check": "calendar-check",
  dollar: "circle-dollar",
  insights: "chart-line",
  lock: "lock",
  target: "bullseye",
  camera: "camera",
  building: "building",
  chat: "message",
  sun: "sun",
  cloud: "cloud",
  "cloud-sun": "cloud-sun",
  rain: "cloud-rain",
  "cloud-off": "cloud-slash",
} satisfies Record<MyWorkIconName, FontAwesomeIcon>;

// src/shell/secondary-menu.tsx: the shared secondary menu's own frame.
export const secondaryMenuFontAwesome = {
  panel: "sidebar",
  menu: "bars",
  close: "xmark",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
} satisfies Record<SecondaryGlyphName, FontAwesomeIcon>;

// Module icon sets (second increment). Each keeps its own names; the local drawings remain the fallback.

// src/documents/components/client/job-pack-ui.tsx: the Job Pack r03 set.
export const jobPackFontAwesome = {
  check: "check",
  circle: "circle-check",
  warning: "triangle-exclamation",
  info: "circle-info",
  minus: "circle-minus",
  document: "file-lines",
  source: "link",
  edit: "pen",
  close: "xmark",
  print: "print",
  arrow: "arrow-right",
  refresh: "arrows-rotate",
} satisfies Record<JobPackIconName, FontAwesomeIcon>;

// src/engineering/materials/components/client/materials-ui.tsx: Released Materials, reused by Change
// review, Commissioning and Acceptance.
export const materialsFontAwesome = {
  register: "file-lines",
  mapping: "cube",
  swap: "arrow-right-arrow-left",
  review: "circle-check",
  truck: "truck",
  history: "clock-rotate-left",
  plus: "plus",
  check: "check",
  close: "xmark",
  search: "magnifying-glass",
  filter: "filter",
  columns: "grid-2",
  dots: "ellipsis",
  warning: "triangle-exclamation",
  calendar: "calendar",
  document: "file",
  "arrow-right": "arrow-right",
  "chevron-down": "chevron-down",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  lock: "lock",
  download: "download",
  link: "link",
  cycle: "arrows-rotate",
  info: "circle-info",
} satisfies Record<MaterialsIconName, FontAwesomeIcon>;

// src/engineering/changes/components/client/changes-ui.tsx: Change review's menu glyphs and tone marks.
// The dot is the one filled mark, so it is drawn in Solid.
export const changesOutlineFontAwesome = {
  people: "users",
  nodes: "circle-nodes",
  flask: "flask",
  clock: "clock",
} satisfies Record<ChangesOutlineName, FontAwesomeIcon>;
export const changesToneFontAwesome = {
  dot: "circle-small",
  info: "circle-info",
  warning: "triangle-exclamation",
  error: "circle-exclamation",
  check: "circle-check",
  tick: "check",
  document: "file-lines",
  progress: "circle-arrow-up",
  clock: "clock",
} satisfies Record<ToneIcon, FontAwesomeIcon>;

// src/engineering/commissioning/components/client/commissioning-ui.tsx: Commissioning's menu glyphs and
// r22 status-tag marks. "unsent" stays a dashed ring: it is not a tick.
export const commissioningOutlineFontAwesome = {
  basis: "clipboard-check",
  results: "circle-check",
  redline: "pen",
  release: "file-export",
  history: "clock",
} satisfies Record<CommissioningOutlineName, FontAwesomeIcon>;
export const commissioningMarkFontAwesome = {
  tick: "check",
  "tick-circle": "circle-check",
  clock: "clock",
  alert: "triangle-exclamation",
  error: "circle-exclamation",
  document: "file",
  step: "file-lines",
  target: "circle-dot",
  unsent: "circle-dashed",
} satisfies Record<CommissioningMarkName, FontAwesomeIcon>;

// src/projects/acceptance/icon.tsx: the glyphs Acceptance adds to the Materials set.
export const acceptanceFontAwesome = {
  info: "circle-dot",
  clock: "clock",
  users: "users",
  refresh: "arrows-rotate",
} satisfies Record<AcceptanceIconName, FontAwesomeIcon>;

// src/components/fertigation-frame.tsx: the conflict mark on fertigation chips and view badges.
export const fertigationFontAwesome = {
  conflict: "triangle-exclamation",
} satisfies Record<"conflict", FontAwesomeIcon>;

// src/components/leads-workspace.tsx: Leads' own back, sort and search glyphs.
export const leadsFontAwesome = {
  back: "arrow-left",
  sort: "arrow-down-wide-short",
  search: "magnifying-glass",
} satisfies Record<LeadsIconName, FontAwesomeIcon>;

// src/components/projects-gantt.tsx: the Programme Gantt toolbar and rows.
export const ganttFontAwesome = {
  plus: "plus",
  gantt: "chart-gantt",
  list: "list",
  search: "magnifying-glass",
  calendar: "calendar",
  chev: "chevron-right",
  down: "chevron-down",
  sliders: "sliders",
  fit: "expand",
} satisfies Record<GanttIconName, FontAwesomeIcon>;
