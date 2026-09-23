import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { hasPermission, type Capability } from "../../platform/permissions";
import { visible, listShared } from "../reads";
import { companyContext, scopedOwner } from "../authority";
import { listActivities } from "../../activities/activities";
import type { CsKind } from "./model";
export async function csOptions(p: Principal, kind: CsKind, contextId: string) {
  const c = database(),
    context = await visible(
      c,
      p,
      kind === "AccountPlan" ? "Organisation" : "Site",
      contextId,
    ),
    site = kind === "AccountPlan" ? undefined : context.id;
  await companyContext(c, p, context.company_id, site ?? null, "shared.read");
  const people = (
    await c.query(
      "SELECT r.id,r.display_name FROM ppo.people r JOIN ppo.person_company_contexts pc ON (pc.workspace_id,pc.person_id)=(r.workspace_id,r.id) WHERE r.workspace_id=$1 AND pc.company_id=$2 AND r.active ORDER BY r.display_name,r.id LIMIT 101",
      [p.workspace_id, context.company_id],
    )
  ).rows;
  const contacts = [];
  for (const person of people.slice(0, 100)) {
    try {
      await visible(c, p, "Person", person.id);
      contacts.push(person);
    } catch (e) {
      if (!(e instanceof AppError) || e.status !== 404) throw e;
    }
  }
  const owners: Record<string, { id: string; display_name: string }[]> = {
    edit: [],
    estimating: [],
    engineering: [],
  };
  const candidates = (
    await c.query(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name,id LIMIT 200",
      [p.workspace_id],
    )
  ).rows;
  for (const [key, cap] of Object.entries({
    edit: "shared.edit",
    estimating: "estimating.edit",
    engineering: "engineering.edit",
  }))
    for (const user of candidates)
      try {
        await scopedOwner(
          c,
          p,
          user.id,
          context.company_id,
          site,
          cap as Capability,
        );
        owners[key].push(user);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
  const facilities = site
      ? await listShared(p, "Facility", { site_id: site, limit: "100" })
      : null,
    assets = site
      ? await listShared(p, "Asset", { site_id: site, limit: "100" })
      : null;
  let activities: { id: string; display_name: string }[] = [];
  let activitiesState = "Restricted";
  if (await hasPermission(c, p, "activity.read", context.company_id, site)) {
    const found = await listActivities(p, {
      object_type: site ? "Site" : "Organisation",
      object_id: context.id,
      limit: "100",
    });
    activities = found.items.map((a) => ({
      id: String(a.id),
      display_name: String(a.summary),
    }));
    activitiesState = found.next_cursor ? "Partial" : "Available";
  }
  const sites =
    kind === "AccountPlan"
      ? (
          await c.query(
            "SELECT s.id,s.display_name FROM ppo.sites s JOIN ppo.site_parties sp ON (sp.workspace_id,sp.site_id)=(s.workspace_id,s.id) WHERE sp.workspace_id=$1 AND sp.organisation_id=$2 AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp()) ORDER BY s.display_name,s.id LIMIT 100",
            [p.workspace_id, context.id],
          )
        ).rows
      : [];
  const permittedSites = [];
  for (const s of sites) {
    try {
      await visible(c, p, "Site", s.id);
      permittedSites.push(s);
    } catch (e) {
      if (!(e instanceof AppError) || e.status !== 404) throw e;
    }
  }
  return {
    context: {
      id: context.id,
      name: context.name ?? context.display_name,
      timezone: context.timezone ?? null,
    },
    actor_id: p.actor_id,
    can_create: await hasPermission(
      c,
      p,
      "shared.create",
      context.company_id,
      site,
    ),
    owners,
    people: contacts,
    facilities:
      facilities?.items.map((f) => ({
        id: f.id,
        display_name: String("name" in f ? f.name : f.id),
      })) ?? [],
    assets:
      assets?.items.map((a) => ({
        id: a.id,
        display_name: String("description" in a ? a.description : a.id),
      })) ?? [],
    sites: permittedSites,
    activities,
    activities_state: activitiesState,
    completeness:
      "Bounded permitted choices; narrow the owning register if a record is not shown.",
  };
}
