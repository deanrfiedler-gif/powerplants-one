import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { assetHistory, visible } from "../shared/reads";
import { visibleTicket } from "../service/tickets";
import { visibleWorkOrder } from "../service/work-orders";
import { visibleAppointment } from "../scheduling/planner";
import { reportContext } from "../reports/context";
import { readPack } from "../documents/packs";
import type { PackSnapshot } from "../documents/render";
import { readFieldJob } from "../field/reads";
import { visibleActivity } from "../activities/activities";
import { equipmentChanges } from "./changes";
import { equipmentInspectionHost } from "./inspection-context";
import type { AttemptRow } from "../inspections/service";
import { uuid } from "../shared/validation";

export type EquipmentEvent = {
  key: string;
  source: string;
  reference: string;
  revision: string;
  title: string;
  summary: string;
  occurred_at: string | null;
  actor: string | null;
  site_id: string | null;
  location: string;
  state: string;
  confidence: string;
  access_class: string;
  href: string | null;
};
const stamp = (d: unknown) => (d ? new Date(String(d)).toISOString() : null);
export async function equipmentTimeline(p: Principal, id: string) {
  const c = database();
  await visible(c, p, "Asset", uuid(id, "id"));
  const items: EquipmentEvent[] = [],
    sources: {
      name: string;
      state: "available" | "unavailable";
      bounded: boolean;
    }[] = [];
  const base = (source: string, key: string): EquipmentEvent => ({
    key: `${source}:${key}`,
    source,
    reference: key,
    revision: "Not recorded",
    title: source,
    summary: "",
    occurred_at: null,
    actor: null,
    site_id: null,
    location:
      "Event-time Facility not recorded; current location is not inferred",
    state: "Recorded",
    confidence: "Source record; no additional verification inferred",
    access_class: "Source permission applies",
    href: null,
  });
  const permitted = async <T>(fn: () => Promise<T>) => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status)) return null;
      throw e;
    }
  };
  async function source(name: string, run: () => Promise<boolean>) {
    try {
      sources.push({ name, state: "available", bounded: await run() });
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status)) {
        sources.push({ name, state: "available", bounded: false });
        return;
      }
      sources.push({ name, state: "unavailable", bounded: false });
    }
  }
  await source("Technical history", async () => {
    const history = await assetHistory(p, id, { limit: 200 });
    for (const h of history.items)
      items.push({
        ...base("Technical history", h.id),
        reference: `${h.source_system ?? "Native"} · ${h.source_id ?? h.id}`,
        revision: `v${h.version}`,
        title: h.kind,
        summary: h.summary,
        confidence: h.confidence,
        state: h.verification_status,
        occurred_at: stamp(h.occurred_at),
        actor: h.author_label,
        site_id: h.site_id,
        location: `Event-time Site: ${h.site_label}; Facility not retained`,
        access_class: h.access_class ?? "Source permission applies",
      });
    return !!history.next_cursor;
  });
  await source("Equipment changes", async () => {
    const changes = await equipmentChanges(p, id);
    for (const h of changes.items)
      items.push({
        ...base("Equipment change", h.id),
        reference: h.source_reference,
        revision: h.source_revision,
        title: h.kind,
        summary: `${h.reason} — ${h.proposal.consequences}`,
        state: h.state,
        occurred_at: stamp(h.effective_at),
        actor: h.reviewed_by ?? h.created_by,
        site_id: h.site_id,
        location: `Retained source Site ${h.basis.site_id}; installed Facility ${h.basis.facility_id ?? "not recorded"}`,
        href: `/equipment/${id}?view=${h.kind === "Configuration" ? "configuration" : "lifecycle"}`,
      });
    return changes.items.length === 200;
  });
  await source("Service", async () => {
    const tickets = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.tickets WHERE workspace_id=$1 AND asset_id=$2 ORDER BY received_at DESC,id LIMIT 201",
        [p.workspace_id, id],
      )
    ).rows;
    for (const t of tickets.slice(0, 200)) {
      const r = await permitted(() => visibleTicket(c, p, t.id));
      if (r)
        items.push({
          ...base("Service request", r.id),
          reference: r.display_number,
          revision: `v${r.version}`,
          title: r.summary,
          summary: r.symptom ?? "No symptom recorded",
          occurred_at: stamp(r.received_at),
          actor: r.created_by,
          site_id: r.site_id,
          state: r.status,
          confidence: "Reported symptom; cause not established",
          href: `/service/tickets/${r.id}`,
        });
    }
    const orders = (
      await c.query<{ id: string }>(
        "SELECT DISTINCT w.id FROM ppo.work_orders w JOIN ppo.scope_revisions sr ON (sr.workspace_id,sr.work_order_id)=(w.workspace_id,w.id) JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_revision_id)=(sr.workspace_id,sr.id) WHERE w.workspace_id=$1 AND sa.asset_id=$2 ORDER BY w.id LIMIT 201",
        [p.workspace_id, id],
      )
    ).rows;
    let bounded = tickets.length > 200 || orders.length > 200;
    for (const candidate of orders.slice(0, 200)) {
      const w = await permitted(() => visibleWorkOrder(c, p, candidate.id));
      if (!w) continue;
      items.push({
        ...base("Work Order", w.id),
        reference: w.display_number,
        revision: `v${w.version}`,
        title: "Service scope and unresolved work",
        state: w.status,
        site_id: w.site_id,
        occurred_at: stamp(w.updated_at),
        summary:
          "Open the owning Work Order for exact approved scope, configuration and authority.",
        href: `/service/work-orders/${w.id}`,
      });
      const visits = (
        await c.query<{ id: string }>(
          "SELECT a.id FROM ppo.appointments a WHERE a.workspace_id=$1 AND a.work_order_id=$2 AND EXISTS(SELECT 1 FROM ppo.scope_assets sa WHERE sa.workspace_id=a.workspace_id AND sa.scope_revision_id=a.scope_revision_id AND sa.asset_id=$3) ORDER BY a.start_at DESC,a.id LIMIT 201",
          [p.workspace_id, w.id, id],
        )
      ).rows;
      bounded ||= visits.length > 200;
      for (const visit of visits.slice(0, 200)) {
        const ctx = await permitted(() => visibleAppointment(c, p, visit.id));
        if (!ctx) continue;
        const a = ctx.a;
        items.push({
          ...base("Appointment", a.id),
          reference: a.display_number,
          revision: `v${a.version}`,
          title: "Service visit",
          summary:
            "Scheduled time is separate from captured attendance and readings.",
          occurred_at: stamp(a.actual_start_at ?? a.start_at),
          site_id: a.site_id,
          state: a.status,
          href: `/service/appointments/${a.id}`,
        });
        const reports = (
          await c.query<{ id: string }>(
            "SELECT id FROM ppo.service_reports WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY created_at DESC",
            [p.workspace_id, a.id],
          )
        ).rows;
        for (const report of reports) {
          const rc = await permitted(() => reportContext(c, p, report.id));
          if (rc) {
            const r = rc.report;
            items.push({
              ...base("Service report", r.id),
              reference: r.display_number,
              revision: `r${r.revision} / v${r.version}`,
              title: "Retained report and issue history",
              summary:
                "Source-owned findings, reviewed evidence and exact issued revision.",
              occurred_at: stamp(r.created_at),
              actor: r.actor_id,
              site_id: r.site_id,
              state: r.status,
              href: `/service/reports/${r.id}`,
            });
          }
        }
        const packs = (
          await c.query<{ id: string }>(
            "SELECT id FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
            [p.workspace_id, a.id],
          )
        ).rows;
        for (const pack of packs) {
          const read = await permitted(() => readPack(p, pack.id));
          if (!read) continue;
          const r = read.items[0];
          for (const revision of r.revisions) {
            const snap = revision.snapshot as PackSnapshot;
            for (const doc of snap.sources)
              items.push({
                ...base("Document revision", `${revision.id}:${doc.id}`),
                reference: doc.item_id,
                revision: doc.version_id,
                title: doc.title,
                summary: `Retained in ${r.display_number} revision ${revision.revision}. Hash ${doc.hash}. Historical inclusion does not establish current applicability.`,
                occurred_at: stamp(revision.created_at),
                actor: revision.created_by_name ?? null,
                site_id: snap.site.id,
                location: `Snapshot Site: ${snap.site.name}; Facility not retained`,
                state: "Retained snapshot",
                access_class: "RestrictedService",
                href: `/service/packs/${r.id}`,
              });
          }
        }
        const field = await permitted(() => readFieldJob(p, a.id));
        if (field) {
          for (const e of field.items[0].entries.filter(
            (e) => e.asset_id === id,
          ))
            items.push({
              ...base("Field evidence", e.id),
              revision: `v${e.version}`,
              title: e.kind,
              summary: JSON.stringify(e.payload),
              occurred_at: stamp(e.captured_at),
              actor: e.actor_name,
              site_id: a.site_id,
              state: `${e.review_status} / ${e.authority_state}${e.superseded ? " / Superseded" : ""}`,
              confidence: "Captured field evidence; retain its review status",
              access_class: "RestrictedService",
              href: `/my-jobs/${a.id}`,
            });
        }
      }
    }
    return bounded;
  });
  await source("Inspection", async () => {
    const attempts = (
      await c.query<AttemptRow>(
        `SELECT a.* FROM ppo.inspection_attempts a WHERE a.workspace_id=$1 AND (
      (a.host_type='ServiceAppointment' AND EXISTS(SELECT 1 FROM ppo.appointments v JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_revision_id)=(v.workspace_id,v.scope_revision_id) WHERE v.workspace_id=a.workspace_id AND v.id=a.host_id AND sa.asset_id=$2))
      OR (a.host_type='ProjectCommissioningScope' AND EXISTS(SELECT 1 FROM ppo.commissioning_scopes sc WHERE sc.workspace_id=a.workspace_id AND sc.commissioning_id=a.host_id AND EXISTS(SELECT 1 FROM jsonb_array_elements(sc.items) x WHERE x->>'asset_id'=$2::text)))) ORDER BY a.created_at DESC,a.id LIMIT 201`,
        [p.workspace_id, id],
      )
    ).rows;
    for (const a of attempts.slice(0, 200)) {
      const host = await equipmentInspectionHost(c, p, a);
      if (!host) continue;
      items.push({
        ...base("Inspection", a.id),
        reference: `Attempt ${a.attempt_number}`,
        revision: `v${a.version}`,
        title: host.label,
        summary: `${a.findings ?? "No findings recorded"} · Exact configuration: ${a.configuration_reference ?? "Not captured"} · ${a.predecessor_id ? "Retest of " + a.predecessor_id : "Initial attempt"}`,
        occurred_at: stamp(a.occurred_at ?? a.created_at),
        actor: a.performer_id,
        site_id: a.site_id,
        state: a.state,
        href: host.href,
        access_class: "Internal / assigned host",
      });
    }
    return attempts.length > 200;
  });
  await source("Activities", async () => {
    const rows = (
      await c.query<{ id: string }>(
        "SELECT a.id FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=$1 AND l.asset_id=$2 ORDER BY a.updated_at DESC,a.id LIMIT 201",
        [p.workspace_id, id],
      )
    ).rows;
    for (const row of rows.slice(0, 200)) {
      const a = await permitted(() => visibleActivity(c, p, row.id));
      if (a)
        items.push({
          ...base("Activity", a.id),
          revision: `v${a.version}`,
          title: a.summary,
          summary: a.outcome ?? "No completed outcome recorded",
          occurred_at: stamp(a.updated_at),
          actor: a.owner_id,
          site_id: a.site_id,
          state: a.status,
          access_class: a.access_class,
          href: `/work/${a.id}`,
        });
    }
    return rows.length > 200;
  });
  items.sort(
    (a, b) =>
      (b.occurred_at ?? "").localeCompare(a.occurred_at ?? "") ||
      a.key.localeCompare(b.key),
  );
  return {
    items,
    sources,
    partial: sources.some((s) => s.bounded || s.state === "unavailable"),
    observed_at: new Date().toISOString(),
  };
}
