import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import { hasPermission } from "../platform/permissions";
import { visible } from "../shared/reads";
import { aftercareRecord } from "./aftercare-service";
import { activityLinks, visibleActivity } from "../activities/activities";
type Option = { id: string; display_name: string };
export async function aftercareOptions(p: Principal, id: string) {
  const c = database(),
    { row } = await aftercareRecord(c, p, id),
    people: Option[] = [],
    assets: Option[] = [],
    activities: Option[] = [],
    owners: {
      id: string;
      display_name: string;
      review: boolean;
      service: boolean;
      crm: boolean;
    }[] = [];
  for (const [table, kind, list] of [
    ["people", "Person", people],
    ["assets", "Asset", assets],
  ] as const)
    for (const { id } of (
      await c.query<{ id: string }>(
        `SELECT id FROM ppo.${table} WHERE workspace_id=$1`,
        [p.workspace_id],
      )
    ).rows)
      try {
        const x = await visible(c, p, kind, id);
        if (kind === "Asset" && x.site_id !== row.site_id) continue;
        if (
          kind === "Person" &&
          !(
            await c.query(
              "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
              [p.workspace_id, row.company_id, id],
            )
          ).rowCount
        )
          continue;
        list.push({ id, display_name: x.display_name });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
  for (const { id } of (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.activities WHERE workspace_id=$1 AND company_id=$2",
      [p.workspace_id, row.company_id],
    )
  ).rows)
    try {
      const a = await visibleActivity(c, p, id),
        links = await activityLinks(c, p, id);
      if (
        links.some(
          (l) =>
            (l.object_type === "Site" && l.object_id === row.site_id) ||
            (l.object_type === "Organisation" &&
              l.object_id === row.organisation_id),
        )
      )
        activities.push({
          id,
          display_name: `${a.summary} · ${a.status}${a.due_at ? "" : " · Date needed"}`,
        });
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  for (const u of (
    await c.query<Option>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name",
      [p.workspace_id],
    )
  ).rows) {
    const q = { ...p, actor_id: u.id };
    if (
      !(await hasPermission(c, q, "shared.read", row.company_id, row.site_id))
    )
      continue;
    const review = await hasPermission(
        c,
        q,
        "shared.history.record",
        row.company_id,
        row.site_id,
      ),
      service = await hasPermission(
        c,
        q,
        "service.ticket.edit",
        row.company_id,
        row.site_id,
      ),
      crm = await hasPermission(
        c,
        q,
        "crm.opportunity.create",
        row.company_id,
        row.site_id,
      );
    if (review || service || crm) owners.push({ ...u, review, service, crm });
  }
  return {
    people,
    assets,
    activities,
    owners,
    completeness: "Complete",
    observed_at: new Date().toISOString(),
  };
}
