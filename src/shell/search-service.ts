import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { object, uuid, invalid } from "../shared/validation";
import { listShared, readShared, siteContext } from "../shared/reads";
import {
  facilityWorkspace,
  registerFacilities,
} from "../shared/facilities/reads";
import { listEngineering, readEngineering } from "../engineering/service";
import { listLeads, readLead } from "../crm/leads/reads";
import { listProjects, readSchedule } from "../projects/service";
import { listOpportunities } from "../crm/worklist";
import { readOpportunity } from "../crm/reads";
import { listActivities, readActivity } from "../activities/activities";
import { listTickets, readIntake } from "../service/intake";
import { searchQuery } from "./search";
import type { SearchItem } from "./model";
import {
  exactDocumentPreview,
  searchExactDocuments,
} from "../documents/search";

type Row = Record<string, unknown>;
type Query = { q: string; limit: string; cursor?: string };
export type SearchAdapter = {
  kind: string;
  path: string;
  label: string;
  list: (query: Query) => Promise<{ items: Row[]; next_cursor: string | null }>;
  detail: (id: string) => Promise<Row>;
  context?: (row: Row) => Promise<string>;
};
export type SearchSourceState = {
  kind: string;
  state: "available" | "denied" | "unavailable";
  has_more: boolean;
};
export type ApplicationSearch = {
  items: SearchItem[];
  sources: SearchSourceState[];
  observed_at: string;
  has_more: boolean;
  next_cursor: string | null;
  limit_per_type: number;
  state: "complete" | "partial" | "unavailable" | "denied";
};

// Registry entries always use domain readers. No stored result, cursor or preview ID is authority.
export function searchAdapters(p: Principal): SearchAdapter[] {
  return [
    {
      kind: "Issued job pack",
      path: "/documents",
      label: "title",
      list: (q) => searchExactDocuments(p, q),
      detail: (id) => exactDocumentPreview(p, id),
    },
    {
      kind: "Engineering package",
      path: "/engineering",
      label: "title",
      list: (q) => listEngineering(p, q),
      detail: async (id) => (await readEngineering(p, id)).package,
    },
    {
      kind: "Lead",
      path: "/sales/leads",
      label: "title",
      list: (q) => listLeads(p, q),
      detail: (id) => readLead(p, id),
    },
    {
      kind: "Project",
      path: "/projects",
      label: "title",
      list: (q) => listProjects(p, q),
      detail: async (id) => (await readSchedule(p, id)).project,
    },
    {
      kind: "Deal",
      path: "/sales/opportunities",
      label: "title",
      list: (q) => listOpportunities(p, q),
      detail: (id) => readOpportunity(p, id),
    },
    ...(
      [
        ["Customer", "Organisation", "/customers", "display_name"],
        ["Contact", "Person", "/people", "display_name"],
        ["Site", "Site", "/sites", "display_name"],
        ["Equipment", "Asset", "/equipment", "description"],
      ] as const
    ).map(([kind, type, path, label]) => ({
      kind,
      path,
      label,
      list: (q: Query) => listShared(p, type, q),
      detail: (id: string) => readShared(p, type, id),
    })),
    {
      kind: "Activity",
      path: "/work",
      label: "summary",
      list: (q) => listActivities(p, q),
      detail: (id) => readActivity(p, id),
    },
    {
      kind: "Service request",
      path: "/service/tickets",
      label: "summary",
      list: (q) => listTickets(p, q),
      detail: (id) => readIntake(p, id),
    },
    {
      kind: "Facility / growing area",
      path: "/facilities",
      label: "name",
      list: (q) => registerFacilities(p, q),
      detail: async (id) => {
        const f = await facilityWorkspace(p, id);
        return {
          ...f,
          name: f.details.name,
          status: f.details.lifecycle_status,
        };
      },
      context: async (row) => {
        const f = await facilityWorkspace(p, String(row.id)),
          site = await siteContext(p, f.site_id);
        const organisations = site.parties
          .filter((x) => x.is_current)
          .map((x) => x.display_name);
        return [
          ...new Set(organisations),
          f.site_name,
          ...f.path.map((x, i) => {
            const relationship =
              i === f.path.length - 1
                ? f.details.parent_relationship
                : f.path[i + 1].parent_relationship;
            return `${x.name} (${relationship === "physically_within" ? "physical parent" : "grouping"})`;
          }),
          String(f.details.name),
        ].join(" → ");
      },
    },
  ];
}
function display(source: SearchAdapter, row: Row): SearchItem {
  return {
    id: `${source.kind}:${row.id}`,
    label: String(row[source.label] ?? row.title ?? row.summary ?? "Record"),
    reference: String(row.display_number ?? row.reference ?? ""),
    kind: source.kind,
    href: `${source.path}/${encodeURIComponent(String(row.id))}`,
  };
}
export async function collectApplicationSearch(
  q: string,
  sources: SearchAdapter[],
  limit: number,
  cursor?: string,
): Promise<ApplicationSearch> {
  const result: ApplicationSearch = {
    items: [],
    sources: [],
    observed_at: new Date().toISOString(),
    has_more: false,
    next_cursor: null,
    limit_per_type: limit,
    state: "complete",
  };
  for (const source of sources) {
    try {
      const page = await source.list({
        q,
        limit: String(limit),
        ...(cursor ? { cursor } : {}),
      });
      const items: SearchItem[] = [];
      for (const row of page.items.slice(0, limit))
        items.push({
          ...display(source, row),
          ...(source.context ? { context: await source.context(row) } : {}),
        });
      result.items.push(...items);
      result.sources.push({
        kind: source.kind,
        state: "available",
        has_more: !!page.next_cursor,
      });
      result.has_more ||= !!page.next_cursor || page.items.length > limit;
      if (sources.length === 1) result.next_cursor = page.next_cursor;
    } catch (e) {
      if (e instanceof AppError && e.status === 422) throw e;
      result.sources.push({
        kind: source.kind,
        state:
          e instanceof AppError && e.status === 403 ? "denied" : "unavailable",
        has_more: false,
      });
    }
  }
  const available = result.sources.some((s) => s.state === "available"),
    failed = result.sources.some((s) => s.state === "unavailable");
  result.state = failed
    ? available
      ? "partial"
      : "unavailable"
    : available
      ? "complete"
      : "denied";
  return result;
}
export async function applicationSearch(
  p: Principal,
  input: unknown,
  compact = false,
) {
  const b = object(input, compact ? ["q"] : ["q", "kind", "cursor"]),
    q = searchQuery({ q: b.q });
  let sources = searchAdapters(p);
  if (b.kind) {
    sources = sources.filter((s) => s.kind === b.kind);
    if (!sources.length) invalid("kind", "Choose an available search type.");
  }
  if (
    b.cursor &&
    (!b.kind || typeof b.cursor !== "string" || b.cursor.length > 4000)
  )
    invalid("cursor", "Choose one type and start a fresh search.");
  return collectApplicationSearch(
    q,
    sources,
    compact ? 5 : 20,
    b.cursor as string | undefined,
  );
}
export async function searchPreview(p: Principal, input: unknown) {
  const b = object(input, ["kind", "id"]),
    source = searchAdapters(p).find((s) => s.kind === b.kind);
  if (!source) throw unavailable();
  const row = await source.detail(uuid(b.id, "id"));
  return {
    ...display(source, row),
    context: source.context
      ? await source.context(row)
      : [row.customer_name, row.site_name, row.context_title]
          .filter(Boolean)
          .join(" · "),
    status: String(
      row.status ?? row.state ?? row.lifecycle_status ?? "Status not recorded",
    ),
    version: row.version ?? null,
    updated_at: row.updated_at ?? null,
    observed_at: new Date().toISOString(),
    source: "Synthetic application record",
  };
}
