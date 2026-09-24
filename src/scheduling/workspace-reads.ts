import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import { object, optionalId, invalid } from "../shared/validation";
import { visible, visibility } from "../shared/reads";
import { orderVisibility } from "../service/work-orders";
import { capacityProjects } from "../projects/service";
import { capacityEngineering } from "../engineering/service";
import {
  appointmentDetail,
  scheduleSnapshot,
  scheduleLanes,
  visibleResource,
} from "./planner";
import { demandSnapshot } from "./demand";
import { interval, timezone } from "./validation";
import {
  uniqueContributions,
  type DemandContribution,
} from "./workspace-model";

function periodInput(input: unknown, extra: string[] = []) {
  const q = object(input, [
    "from",
    "to",
    "timezone",
    "site_id",
    "resource_id",
    ...extra,
  ]);
  const period = interval(q.from, q.to);
  if (Date.parse(period.end_at) - Date.parse(period.start_at) > 93 * 86400000)
    invalid("to", "Review at most 93 days.");
  return {
    q,
    period,
    zone: timezone(q.timezone),
    site: optionalId(q.site_id, "site_id"),
    resource: optionalId(q.resource_id, "resource_id"),
  };
}
export async function readResourceWorkspace(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { period } = periodInput(object(input, ["from", "to", "timezone"]));
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await visibleResource(c, p, id);
    const resource = (await scheduleLanes(c, p, [id], null, period))[0];
    const sites = (
      await c.query(
        `SELECT s.id,s.display_name,s.timezone FROM ppo.resource_sites rs JOIN ppo.sites s ON (s.workspace_id,s.id)=(rs.workspace_id,rs.site_id)
       WHERE rs.workspace_id=$1 AND rs.resource_id=$3 AND ${scopeSql("s.company_id", "s.id", "schedule.read")} AND ${visibility("Site", "s")} ORDER BY s.display_name,s.id`,
        [p.workspace_id, p.actor_id, id],
      )
    ).rows;
    const schedule = await scheduleSnapshot(
      c,
      p,
      {
        from: period.start_at,
        to: period.end_at,
        timezone: resource.base_timezone,
        resource_id: id,
      },
      93,
    );
    return {
      resource,
      sites,
      appointments: schedule.items,
      observed_at: schedule.observed_at,
      completeness:
        "Permitted sites and bounded period; other bookings are anonymous busy intervals",
      from: period.start_at,
      to: period.end_at,
    };
  });
}
export async function readChanges(p: Principal, input: unknown) {
  const { q, period, site, resource } = periodInput(input, ["appointment_id"]);
  const focus = optionalId(q.appointment_id, "appointment_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await requireCapability(c, p, "schedule.read");
    if (site) {
      const s = await visible(c, p, "Site", site);
      if (!(await hasPermission(c, p, "schedule.read", s.company_id, s.id)))
        throw unavailable();
    }
    if (resource) await visibleResource(c, p, resource, site ?? undefined);
    const rows = focus
      ? [{ id: focus }]
      : (
          await c.query<{ id: string }>(
            `SELECT a.id FROM ppo.appointments a JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id)
       WHERE a.workspace_id=$1 AND ${scopeSql("a.company_id", "a.site_id", "schedule.read")} AND ${orderVisibility("w")}
       AND (a.start_at<$4 AND a.end_at>$3 OR EXISTS(SELECT 1 FROM ppo.schedule_change_requests r WHERE r.workspace_id=a.workspace_id AND r.appointment_id=a.id AND r.status='Pending' AND r.proposed_start<$4 AND r.proposed_end>$3))
       AND ($5::uuid IS NULL OR a.site_id=$5)
       AND ($6::uuid IS NULL OR EXISTS(SELECT 1 FROM ppo.assignments x WHERE x.workspace_id=a.workspace_id AND x.appointment_id=a.id AND x.active AND x.resource_id=$6))
       ORDER BY a.start_at,a.id LIMIT 51`,
            [
              p.workspace_id,
              p.actor_id,
              period.start_at,
              period.end_at,
              site,
              resource,
            ],
          )
        ).rows;
    if (rows.length > 50)
      invalid(
        "from",
        "More than 50 candidate visits. Narrow the review period or site.",
      );
    const items = [];
    for (const row of rows) {
      try {
        const detail = await appointmentDetail(c, p, row.id);
        if (
          focus &&
          ((site && detail.site_id !== site) ||
            (resource &&
              !detail.assignments.some(
                (x) =>
                  x.active &&
                  x.assignment_version === detail.assignment_version &&
                  x.resource_id === resource,
              )))
        )
          throw unavailable();
        items.push(detail);
      } catch (e) {
        if (focus || !(e instanceof AppError) || ![403, 404].includes(e.status))
          throw e;
      }
    }
    return {
      items,
      from: period.start_at,
      to: period.end_at,
      focused: !!focus,
      observed_at: new Date().toISOString(),
      completeness: focus
        ? "Exact permitted appointment; date window bypassed"
        : "Complete permitted appointments in this review window",
    };
  });
}
export async function readCapacity(p: Principal, input: unknown) {
  const { period, zone, site, resource } = periodInput(input);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await requireCapability(c, p, "schedule.read");
    const schedule = await scheduleSnapshot(
      c,
      p,
      {
        from: period.start_at,
        to: period.end_at,
        timezone: zone,
        ...(site ? { site_id: site } : {}),
        ...(resource ? { resource_id: resource } : {}),
      },
      93,
    );
    const demand = await demandSnapshot(c, p, {
      ...(site ? { site_id: site } : {}),
      limit: 200,
    });
    const fromDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(period.start_at));
    const toDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(period.end_at));
    const items: DemandContribution[] = [];
    const sources = [
      {
        domain: "Service",
        state: demand.completeness,
        basis:
          "Appointments in period; undated authorised demand included. Buffered reservations are not labour effort.",
      },
    ];
    for (const a of schedule.items.filter(
      (a) =>
        !["Cancelled", "Completed", "CompletedPendingReview"].includes(
          a.status,
        ),
    )) {
      const owner = (
        await c.query(
          "SELECT w.service_owner_id,u.display_name,o.display_name AS customer_name FROM ppo.work_orders w JOIN ppo.users u ON (u.workspace_id,u.id)=(w.workspace_id,w.service_owner_id) JOIN ppo.organisations o ON (o.workspace_id,o.id)=(w.workspace_id,w.customer_id) WHERE w.workspace_id=$1 AND w.id=$2",
          [p.workspace_id, a.work_order_id],
        )
      ).rows[0];
      const crew = a.assignments.filter(
        (x) => x.active && x.assignment_version === a.assignment_version,
      );
      const skills = (
        await c.query(
          "SELECT DISTINCT unnest(required_skill_codes) AS code FROM ppo.scope_items WHERE workspace_id=$1 AND scope_revision_id=$2",
          [p.workspace_id, a.scope_revision_id],
        )
      ).rows.map((x) => x.code as string);
      items.push({
        key: "Appointment:" + a.id,
        domain: "Service",
        source_id: a.id,
        source_version: a.version,
        source_as_at: a.updated_at.toISOString(),
        reference: a.display_number,
        title: a.scope_summary,
        href: "/service/appointments/" + a.id,
        customer: owner.customer_name,
        site: a.site_name,
        site_id: a.site_id,
        owner: owner.display_name,
        owner_id: owner.service_owner_id,
        resource_ids: crew.map((x) => x.resource_id),
        skills,
        window_start: a.start_at.toISOString(),
        window_end: a.end_at.toISOString(),
        time_basis: a.site_timezone + " · appointment instants",
        effort_minutes: null,
        reserved_minutes:
          a.status === "Proposed"
            ? 0
            : crew.reduce(
                (sum: number, x) =>
                  sum +
                  (a.end_at.getTime() - a.start_at.getTime()) / 60000 +
                  x.travel_before_minutes +
                  x.travel_after_minutes,
                0,
              ),
        commitment:
          a.status === "Proposed" ? "Proposed visit" : "Operational booking",
        source_state: a.status,
        completeness: "Effort unknown",
        next_action: "Review booking, crew and preparation in Service",
      });
    }
    for (const w of demand.items) {
      const owner = (
        await c.query(
          "SELECT w.updated_at,w.service_owner_id,u.display_name FROM ppo.work_orders w JOIN ppo.users u ON (u.workspace_id,u.id)=(w.workspace_id,w.service_owner_id) WHERE w.workspace_id=$1 AND w.id=$2",
          [p.workspace_id, w.id],
        )
      ).rows[0];
      const skills = (
        await c.query(
          "SELECT DISTINCT unnest(required_skill_codes) AS code FROM ppo.scope_items WHERE workspace_id=$1 AND scope_revision_id=$2",
          [p.workspace_id, w.authorised_scope_revision_id],
        )
      ).rows.map((x) => x.code as string);
      items.push({
        key: "WorkOrder:" + w.id,
        domain: "Service",
        source_id: w.id,
        source_version: w.version,
        source_as_at: owner.updated_at.toISOString(),
        reference: w.display_number,
        title: w.authorised_scope_summary,
        href: "/service/work-orders/" + w.id,
        customer: w.customer_name,
        site: w.site_name,
        site_id: w.site_id,
        owner: owner.display_name,
        owner_id: owner.service_owner_id,
        resource_ids: [],
        skills,
        window_start: null,
        window_end: null,
        time_basis: "Undated authorised scope",
        effort_minutes: null,
        reserved_minutes: null,
        commitment: "Authorised demand",
        source_state: "Authorised",
        completeness: "Window and effort unknown",
        next_action: "Plan visit from Service planner",
      });
    }
    if (await hasPermission(c, p, "project.read")) {
      const result = await capacityProjects(c, p, fromDay, toDay);
      sources.push({
        domain: "Projects",
        state: result.completeness,
        basis:
          "Open source tasks in period and undated tasks. Dates are programme dates; resource and labour effort not supplied.",
      });
      for (const { project, tasks } of result.items)
        for (const task of tasks) {
          if (site && project.site_id !== site) continue;
          items.push({
            key: "ProjectTask:" + task.id,
            domain: "Projects",
            source_id: task.id,
            source_version: task.version,
            source_as_at: task.updated_at,
            reference: project.display_number,
            title: task.title,
            href: "/projects/" + project.id,
            customer: project.customer_name,
            site: project.site_name,
            site_id: project.site_id,
            owner: task.owner_name ?? project.coordinator_name,
            owner_id:
              task.owner_id ??
              (task.external_owner_id ? null : project.coordinator_id),
            resource_ids: [],
            skills: [],
            window_start: task.start_date,
            window_end: task.finish_date,
            time_basis:
              project.timezone + " · calendar dates (finish inclusive)",
            effort_minutes: null,
            reserved_minutes: null,
            commitment: "Source plan",
            source_state: task.phase + " / " + task.status,
            completeness:
              "Resource and effort unknown; project as-at / v" +
              project.version,
            next_action: "Review source task with Projects owner",
          });
        }
    } else
      sources.push({
        domain: "Projects",
        state: "Unavailable",
        basis:
          "Requires current project.read and source context permissions; no zero-demand inference.",
      });
    if (await hasPermission(c, p, "engineering.read")) {
      const result = await capacityEngineering(c, p, fromDay, toDay);
      sources.push({
        domain: "Engineering",
        state: result.completeness,
        basis:
          "Required dates in period and undated packages. Discipline is not a Service skill; effort and resource mapping unknown.",
      });
      for (const e of result.items) {
        if (site && e.site_id !== site) continue;
        items.push({
          key: "EngineeringPackage:" + e.id,
          domain: "Engineering",
          source_id: e.id,
          source_version: e.version,
          source_as_at: e.updated_at,
          reference: e.display_number,
          title: e.title,
          href: "/engineering/" + e.id,
          customer: e.customer_name,
          site: e.site_name,
          site_id: e.site_id,
          owner: e.owner_name,
          owner_id: e.owner_id,
          resource_ids: [],
          skills: [],
          window_start: null,
          window_end: e.required_date,
          time_basis: "Required calendar date; " + e.discipline + " discipline",
          effort_minutes: null,
          reserved_minutes: null,
          commitment: "Source plan",
          source_state: e.state,
          completeness: "Resource, start and effort unknown",
          next_action: e.next_action,
        });
      }
    } else
      sources.push({
        domain: "Engineering",
        state: "Unavailable",
        basis:
          "Requires current engineering.read and source context permissions; no zero-demand inference.",
      });
    return {
      items: uniqueContributions(items),
      resources: schedule.resources,
      observed_at: schedule.observed_at,
      from: period.start_at,
      to: period.end_at,
      sources,
    };
  });
}
