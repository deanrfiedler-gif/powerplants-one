import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { object, choice, invalid, optionalId } from "../shared/validation";
import { listReports, reportReviewTask } from "../reports/service";
import { listFinance, readFinance } from "../finance/reads";
import { listEngineering } from "../engineering/service";
import { changeReviewTasks } from "../engineering/changes/reads";
import { inReviewView, reviewViews, type ReviewTask } from "./model";

type SourceState = {
  module: string;
  state: "available" | "denied" | "unavailable";
  bounded: boolean;
};
export async function reviewSources(
  p: Principal,
  company: string | null = null,
) {
  const items: ReviewTask[] = [],
    sources: SourceState[] = [];
  for (const domain of ["Service", "Finance", "Engineering"]) {
    const selected: ReviewTask[] = [];
    let bounded = false;
    try {
      if (domain === "Service") {
        const page = await listReports(p);
        bounded = true; // Source reader declares a bounded window.
        for (const r of page.items)
          selected.push(await reportReviewTask(p, r.id));
      } else if (domain === "Finance") {
        let after: string | null = null;
        do {
          const page = await listFinance(p, {
            ...(after ? { after } : {}),
            ...(company ? { company_id: company } : {}),
          });
          for (const row of page.items) {
            const f = await readFinance(p, row.id),
              h = f.handoff;
            if (h.status === "Draft") continue;
            const submitted = f.events
              .filter((e) => e.kind === "Submitted")
              .at(-1);
            const returned = h.status === "Returned";
            // Finance grants establish reviewer eligibility; no named reviewer is fabricated.
            selected.push({
              id: `FinanceHandoff:${h.id}`,
              source: "FinanceHandoff",
              module: domain,
              record_id: h.id,
              company_id: h.company_id,
              reference: h.display_number,
              revision: `v${h.version}`,
              version: h.version,
              kind: "Handover",
              title: "Finance handoff",
              context: [f.work.customer, f.work.site, f.work.reference]
                .filter(Boolean)
                .join(" · "),
              submitted_at: submitted?.occurred_at
                ? new Date(String(submitted.occurred_at)).toISOString()
                : null,
              due: null,
              owner_id: returned ? h.owner_id : null,
              owner_name: returned ? row.owner : null,
              author_id: h.owner_id,
              status: h.status,
              returned,
              return_reason: returned
                ? String(f.reviews[0]?.reason ?? "See the source review")
                : null,
              current: !["Reconciled", "Cancelled"].includes(h.status),
              actionable: returned
                ? h.owner_id === p.actor_id && f.capabilities["finance.prepare"]
                : h.status === "ReadyForReview" &&
                  f.capabilities["finance.review"] &&
                  h.owner_id !== p.actor_id,
              href: `/finance/handoffs/${h.id}`,
            });
          }
          after = page.next_cursor;
          bounded = !!after && selected.length >= 500;
        } while (after && !bounded);
      } else {
        let cursor: string | null = null,
          count = 0;
        do {
          const page = await listEngineering(p, {
            limit: "50",
            ...(cursor ? { cursor } : {}),
            ...(company ? { company_id: company } : {}),
          });
          for (const row of page.items)
            selected.push(...(await changeReviewTasks(p, row.id)));
          cursor = page.next_cursor;
          count += page.items.length;
          bounded = !!cursor && count >= 200;
        } while (cursor && !bounded);
      }
      items.push(
        ...selected.filter((t) => !company || t.company_id === company),
      );
      sources.push({ module: domain, state: "available", bounded });
    } catch (e) {
      sources.push({
        module: domain,
        state:
          e instanceof AppError && e.status === 403 ? "denied" : "unavailable",
        bounded: false,
      });
    }
  }
  return { items, sources };
}
export async function reviewInbox(p: Principal, input: unknown = {}) {
  const b = object(input, [
      "view",
      "q",
      "module",
      "kind",
      "owner_id",
      "company_id",
      "page",
    ]),
    view = choice(b.view ?? "mine", "view", reviewViews),
    q = String(b.q ?? "")
      .trim()
      .toLowerCase(),
    page = Number(b.page ?? 1);
  if (q.length > 200 || !Number.isInteger(page) || page < 1 || page > 1000)
    invalid("filters", "Use valid review criteria.");
  const owner = optionalId(b.owner_id, "owner_id"),
    source = await reviewSources(p, optionalId(b.company_id, "company_id"));
  const matches = (t: ReviewTask) =>
    inReviewView(t, view, p.actor_id) ||
    (view === "mine" &&
      t.source === "FinanceHandoff" &&
      t.current &&
      t.actionable &&
      !t.owner_id);
  const counts = Object.fromEntries(
    reviewViews.map((v) => [
      v,
      source.items.filter(
        (t) =>
          inReviewView(t, v, p.actor_id) ||
          (v === "mine" &&
            t.source === "FinanceHandoff" &&
            t.current &&
            t.actionable &&
            !t.owner_id),
      ).length,
    ]),
  );
  const filtered = source.items
    .filter(
      (t) =>
        matches(t) &&
        (!b.module || t.module === b.module) &&
        (!b.kind || t.kind === b.kind) &&
        (!owner || t.owner_id === owner) &&
        (!q ||
          [t.title, t.reference, t.context, t.owner_name, t.status]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    )
    .sort(
      (a, b) =>
        (a.submitted_at ?? "z").localeCompare(b.submitted_at ?? "z") ||
        a.id.localeCompare(b.id),
    );
  const failed = source.sources.some((s) => s.state === "unavailable"),
    available = source.sources.some((s) => s.state === "available");
  return {
    items: filtered.slice((page - 1) * 30, page * 30),
    total: filtered.length,
    counts,
    page,
    has_more: filtered.length > page * 30,
    sources: source.sources,
    owners: [
      ...new Map(
        source.items
          .filter((t) => t.owner_id)
          .map((t) => [
            t.owner_id!,
            { id: t.owner_id!, name: t.owner_name ?? "Named source owner" },
          ]),
      ).values(),
    ],
    state: failed
      ? available
        ? "partial"
        : "unavailable"
      : available
        ? "complete"
        : "denied",
    observed_at: new Date().toISOString(),
    bounded: source.sources.some((s) => s.bounded),
  };
}
export async function reviewTarget(p: Principal, input: unknown) {
  const b = object(input, ["id", "version"]),
    source = await reviewSources(p),
    item = source.items.find((t) => t.id === b.id);
  if (!item) {
    if (source.sources.some((s) => s.state === "unavailable"))
      throw new AppError(
        503,
        "SourceUnavailable",
        "The source could not be checked. Retry before opening the workflow.",
      );
    throw unavailable();
  }
  return {
    item,
    stale: String(item.version) !== String(b.version),
    observed_at: new Date().toISOString(),
  };
}
