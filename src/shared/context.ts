import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import {
  authoriseActivityInput,
  activityLinks,
  visibleActivity,
} from "../activities/activities";
import { visibleTicket } from "../service/tickets";
import { companyContext, scopedOwner } from "./authority";
import { envelope, page, readShared, visible, visibility } from "./reads";
import { choice, object, optionalId, uuid } from "./validation";
export async function companyOptions(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "shared.read");
  const r = object(input, ["limit", "cursor", "q"]),
    pg = page(r, {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "CompanySelector",
    });
  const rows = (
    await c.query(
      `SELECT c.id,c.display_name,
    ${scopeSql("c.id", "NULL::uuid", "shared.create")} AS can_create_shared,
    ${scopeSql("c.id", "NULL::uuid", "service.ticket.edit")} AS can_create_ticket,
    ${scopeSql("c.id", "NULL::uuid", "activity.edit")} AS can_create_activity
    FROM ppo.companies c WHERE c.workspace_id=$1 AND (${scopeSql("c.id")} OR EXISTS(SELECT 1 FROM ppo.sites cs WHERE cs.workspace_id=c.workspace_id AND cs.company_id=c.id AND ${visibility("Site", "cs")}))
    AND ($3::uuid IS NULL OR c.id>$3) AND position(lower($4) in lower(c.display_name))>0 ORDER BY c.id LIMIT $5`,
      [p.workspace_id, p.actor_id, pg.after, pg.q, pg.limit + 1],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
export async function ownerOptions(p: Principal, input: unknown = {}) {
  const c = database(),
    r = object(input, [
      "company_id",
      "site_id",
      "purpose",
      "access_class",
      "activity_id",
      "ticket_id",
      "limit",
      "cursor",
      "q",
    ]);
  const company = uuid(r.company_id, "company_id"),
    site = optionalId(r.site_id, "site_id"),
    purpose = choice(r.purpose, "purpose", ["Customer", "Ticket", "Activity"]);
  const capability =
    purpose === "Customer"
      ? "shared.edit"
      : purpose === "Ticket"
        ? "service.ticket.edit"
        : "activity.edit";
  const access = choice(r.access_class ?? "RestrictedService", "access_class", [
    "Internal",
    "RestrictedService",
    "RestrictedFinance",
  ] as const);
  // Selector visibility is business scope, not a directory of all workspace/system users.
  await companyContext(c, p, company, site, "shared.read");
  if (
    purpose === "Activity" &&
    access !== "RestrictedService" &&
    !(await hasPermission(
      c,
      p,
      access === "RestrictedFinance"
        ? "shared.finance.read"
        : "shared.internal.read",
      company,
      site ?? undefined,
    ))
  )
    throw unavailable();
  const a = r.activity_id
    ? await visibleActivity(c, p, uuid(r.activity_id, "activity_id"))
    : null;
  const t = r.ticket_id
    ? await visibleTicket(c, p, uuid(r.ticket_id, "ticket_id"))
    : null;
  if (
    (a && (a.company_id !== company || a.site_id !== site)) ||
    (t && (t.company_id !== company || t.site_id !== site))
  )
    throw unavailable();
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => ["limit", "cursor", "q"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "OwnerSelector",
      company,
      site,
      purpose,
      access,
      activity: a?.id,
      ticket: t?.id,
    },
  );
  const candidates = (
    await c.query(
      `SELECT u.id,u.display_name FROM ppo.users u WHERE u.workspace_id=$1 AND u.active AND ($2::uuid IS NULL OR u.id>$2) AND position(lower($3) in lower(u.display_name))>0 ORDER BY u.id`,
      [p.workspace_id, pg.after, pg.q],
    )
  ).rows;
  const rows = [];
  for (const u of candidates) {
    try {
      const owner = await scopedOwner(
        c,
        p,
        u.id,
        company,
        site ?? undefined,
        capability,
      );
      if (purpose === "Ticket") {
        if (
          !(await hasPermission(
            c,
            owner,
            "service.ticket.read",
            company,
            site ?? undefined,
          ))
        )
          continue;
        if (t) await visibleTicket(c, owner, t.id);
      }
      if (purpose === "Activity") {
        if (t) await visibleTicket(c, owner, t.id);
        if (
          !(await hasPermission(
            c,
            owner,
            "activity.read",
            company,
            site ?? undefined,
          ))
        )
          continue;
        const cap =
          access === "RestrictedFinance"
            ? "shared.finance.read"
            : access === "Internal"
              ? "shared.internal.read"
              : null;
        if (
          cap &&
          !(await hasPermission(c, owner, cap, company, site ?? undefined))
        )
          continue;
        if (a)
          await authoriseActivityInput(c, p, {
            ...a,
            owner_id: u.id,
            links: await activityLinks(c, p, a.id),
          });
      }
      rows.push(u);
      if (rows.length > pg.limit) break;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
export async function personContext(p: Principal, id: string) {
  const c = database(),
    person = await readShared(p, "Person", id);
  const affiliations = (
    await c.query(
      `SELECT rel.id,rel.role_label,rel.valid_from,rel.valid_to,r.id AS organisation_id,r.display_number,r.display_name FROM ppo.relationships rel JOIN ppo.organisations r ON (r.workspace_id,r.id)=(rel.workspace_id,rel.organisation_id)
    WHERE rel.workspace_id=$1 AND rel.person_id=$3 AND ${scopeSql("rel.company_id")} AND ${visibility("Organisation")} ORDER BY rel.valid_from,rel.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  return { ...person, affiliations };
}
export async function siteHistory(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  const c = database();
  await visible(c, p, "Site", id);
  const r = object(input, ["limit", "cursor"]),
    pg = page(r, {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "SiteHistory",
      id,
    });
  const rows = (
    await c.query(
      `SELECT h.id,h.version,h.site_id,h.asset_id,h.occurred_at,h.author_label,h.kind,h.summary,h.confidence,h.source_system,h.source_id,h.verification_status,h.site_label,h.operator_label,h.asset_identity_status
    FROM ppo.history_records h WHERE h.workspace_id=$1 AND h.site_id=$3 AND ${scopeSql("h.company_id", "h.site_id")}
    AND (h.asset_id IS NULL OR EXISTS(SELECT 1 FROM ppo.assets ha WHERE ha.workspace_id=h.workspace_id AND ha.id=h.asset_id AND ${visibility("Asset", "ha")}))
    AND (h.access_class IN ('RestrictedService','CustomerApproved') OR (h.access_class='Internal' AND ${scopeSql("h.company_id", "h.site_id", "shared.internal.read")}) OR (h.access_class='RestrictedFinance' AND ${scopeSql("h.company_id", "h.site_id", "shared.finance.read")}))
    AND ($4::uuid IS NULL OR h.id>$4) ORDER BY h.id LIMIT $5`,
      [p.workspace_id, p.actor_id, id, pg.after, pg.limit + 1],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
