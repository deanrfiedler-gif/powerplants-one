import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { hasPermission, scopeSql } from "../../platform/permissions";
import { opportunityVisibility } from "../../crm/context";
import { ticketVisibility } from "../../service/tickets";
import { projectRow } from "../../projects/service";
import { AppError } from "../../platform/errors";
import { envelope, page, readShared, visibility, visible } from "../reads";
import { companyContext } from "../authority";
import { canEditPerson } from "./commands";

export type Collection<T> = {
  items: T[];
  state: "Available" | "Restricted" | "Partial";
  basis: string;
};
export type Affiliation = {
  id: string;
  organisation_id: string;
  organisation_version: number;
  person_id: string;
  display_name: string;
  display_number?: string;
  role_label: string;
  valid_from: string;
  valid_to: string | null;
  period: "Current" | "Historic" | "Future";
  active: boolean;
  can_end: boolean;
  authority_basis: "Recorded";
};
export type ContactSite = {
  id: string;
  display_name: string;
  display_number: string;
  company_id: string;
  version: number;
};
export type Reliance = {
  id: string;
  label: string;
  href: string;
  kind: string;
  consequence: string;
};
export type ContactHistory = {
  id: string;
  occurred_at: string;
  reason: string;
  actor_name: string;
  details: {
    command: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
};
export type ContactWorkspace = {
  id: string;
  version: number;
  display_name: string;
  email: string | null;
  phone: string | null;
  contact_preference: string | null;
  active: boolean;
  can_edit: boolean;
  observed_at: string;
  affiliations: Collection<Affiliation>;
  sites: Collection<ContactSite>;
  reliance: Collection<Reliance>;
  history: Collection<ContactHistory>;
};
export type Stakeholders = {
  organisation: {
    id: string;
    display_name: string;
    display_number: string;
    version: number;
    owner_name: string | null;
  };
  affiliations: Collection<Affiliation>;
  sites: Collection<
    ContactSite & {
      contact: { id: string; display_name: string; active: boolean } | null;
      contact_state: "Recorded" | "Not recorded" | "Restricted";
      parties: {
        id: string;
        organisation_id: string;
        display_name: string;
        role: string;
        is_current: boolean;
      }[];
    }
  >;
  observed_at: string;
};
const collection = <T>(
  items: T[],
  state: Collection<T>["state"],
  basis: string,
): Collection<T> => ({ items, state, basis });
const periodSql =
  "CASE WHEN rel.valid_from>CURRENT_DATE THEN 'Future' WHEN rel.valid_to<=CURRENT_DATE THEN 'Historic' ELSE 'Current' END";

export async function primaryContactOptions(
  p: Principal,
  id: string,
  input: unknown,
) {
  const c = database(),
    site = await visible(c, p, "Site", id);
  await companyContext(c, p, site.company_id, id, "shared.edit");
  const pg = page(input, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    site: id,
    kind: "PrimaryContact",
  });
  const rows = (
    await c.query(
      `SELECT r.id,r.display_name FROM ppo.people r
    JOIN ppo.person_company_contexts pc ON (pc.workspace_id,pc.person_id)=(r.workspace_id,r.id)
    WHERE r.workspace_id=$1 AND pc.company_id=$3 AND r.active AND ${visibility("Person")}
    AND ($4::uuid IS NULL OR r.id>$4) AND position(lower($5) in lower(r.display_name))>0 ORDER BY r.id LIMIT $6`,
      [
        p.workspace_id,
        p.actor_id,
        site.company_id,
        pg.after,
        pg.q,
        pg.limit + 1,
      ],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}

export async function contactWorkspace(
  p: Principal,
  id: string,
): Promise<ContactWorkspace> {
  const c = database(),
    person = await readShared(p, "Person", id);
  if (!("email" in person))
    throw new Error("Expected canonical Person projection");
  const companyScope =
    (
      await c.query<{ complete: boolean }>(
        `SELECT bool_and(${scopeSql("pc.company_id")}) AS complete
    FROM ppo.person_company_contexts pc WHERE pc.workspace_id=$1 AND pc.person_id=$3`,
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0]?.complete === true;
  const affiliations = (
    await c.query<Affiliation>(
      `SELECT rel.id,rel.organisation_id,r.version AS organisation_version,rel.person_id,r.display_name,r.display_number,
    rel.role_label,rel.valid_from::text,rel.valid_to::text,${periodSql} AS period,'Recorded' AS authority_basis,
    pe.active,(${scopeSql("rel.company_id", "NULL::uuid", "shared.edit")} AND rel.valid_to IS NULL) AS can_end
    FROM ppo.relationships rel JOIN ppo.organisations r ON (r.workspace_id,r.id)=(rel.workspace_id,rel.organisation_id)
    JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(rel.workspace_id,rel.person_id)
    WHERE rel.workspace_id=$1 AND rel.person_id=$3 AND ${scopeSql("rel.company_id")} AND ${visibility("Organisation")}
    ORDER BY rel.valid_from,rel.id LIMIT 201`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const sites = (
    await c.query<ContactSite>(
      `SELECT r.id,r.display_name,r.display_number,r.company_id,r.version FROM ppo.sites r
    WHERE r.workspace_id=$1 AND r.primary_contact_id=$3 AND ${visibility("Site")} ORDER BY r.display_name,r.id LIMIT 201`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const opportunities = (
    await c.query(
      `SELECT o.id,o.title,o.display_number FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.primary_person_id=$3
    AND ${opportunityVisibility()} ORDER BY o.id LIMIT 101`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const tickets = (
    await c.query(
      `SELECT t.id,t.summary,t.display_number FROM ppo.tickets t WHERE t.workspace_id=$1 AND t.requester_id=$3
    AND ${ticketVisibility()} ORDER BY t.id LIMIT 101`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  // Authorise each project through its owning service before exposing task text.
  const tasks = (
    await c.query(
      `SELECT t.id,t.project_id,t.title FROM ppo.project_tasks t WHERE t.workspace_id=$1 AND t.external_owner_id=$2 ORDER BY t.id LIMIT 101`,
      [p.workspace_id, id],
    )
  ).rows;
  const projectReliance: Reliance[] = [];
  for (const task of tasks) {
    try {
      const project = await projectRow(c, p, task.project_id);
      projectReliance.push({
        id: task.id,
        label: `${project.display_number} · ${task.title}`,
        href: `/projects/${project.id}`,
        kind: "Project task",
        consequence:
          "Recorded external responsibility; Projects owns reassignment and progress.",
      });
    } catch (error) {
      if (!(error instanceof AppError) || ![403, 404].includes(error.status))
        throw error;
    }
  }
  const reliance: Reliance[] = [
    ...sites.slice(0, 200).map((s) => ({
      id: s.id,
      label: s.display_name,
      href: `/sites/${s.id}`,
      kind: "Site primary contact",
      consequence:
        "Service report approval requires a current active contact. Service owns the decision; this page cannot approve a report.",
    })),
    ...opportunities.slice(0, 100).map((o) => ({
      id: o.id,
      label: `${o.display_number} · ${o.title}`,
      href: `/sales/opportunities/${o.id}`,
      kind: "Opportunity contact",
      consequence:
        "Sales must review the contact and current affiliation before its next change.",
    })),
    ...tickets.slice(0, 100).map((t) => ({
      id: t.id,
      label: `${t.display_number} · ${t.summary}`,
      href: `/service/tickets/${t.id}`,
      kind: "Service requester",
      consequence:
        "Original requester attribution is retained; contact correction does not rewrite the service history.",
    })),
    ...projectReliance,
  ];
  const edit = await canEditPerson(c, p, id);
  const history = edit
    ? (
        await c.query<ContactHistory>(
          `SELECT a.id,a.occurred_at::text,a.reason,u.display_name AS actor_name,a.details
    FROM ppo.audit_events a JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.actor_id)
    WHERE a.workspace_id=$1 AND a.object_type='Person' AND a.object_id=$2 ORDER BY a.occurred_at DESC,a.id LIMIT 101`,
          [p.workspace_id, id],
        )
      ).rows
    : [];
  return {
    id,
    version: person.version,
    display_name: String(person.display_name),
    email: person.email as string | null,
    phone: person.phone as string | null,
    contact_preference: person.contact_preference as string | null,
    active: Boolean(person.active),
    can_edit: edit,
    observed_at: new Date().toISOString(),
    affiliations: collection(
      affiliations.slice(0, 200),
      !companyScope
        ? "Restricted"
        : affiliations.length > 200
          ? "Partial"
          : "Available",
      "Company-scoped affiliations; validity end dates are exclusive.",
    ),
    sites: collection(
      sites.slice(0, 200),
      sites.length > 200 ? "Partial" : "Available",
      "Permitted sites only; other scopes are not counted.",
    ),
    reliance: collection(
      reliance,
      "Partial",
      "Derived from permitted primary-contact, opportunity, requester and external project-task links. This is not a complete interaction log. Activity does not support Person links.",
    ),
    history: collection(
      history.slice(0, 100),
      !edit ? "Restricted" : history.length > 100 ? "Partial" : "Available",
      "Accepted Person commands only. Affiliation changes belong to the organisation history.",
    ),
  };
}

export async function stakeholders(
  p: Principal,
  id: string,
): Promise<Stakeholders> {
  const c = database(),
    org = await visible(c, p, "Organisation", id);
  const companyRead = await hasPermission(c, p, "shared.read", org.company_id);
  const affiliations = companyRead
    ? (
        await c.query<Affiliation>(
          `SELECT rel.id,rel.organisation_id,$4::integer AS organisation_version,rel.person_id,r.display_name,
    rel.role_label,rel.valid_from::text,rel.valid_to::text,${periodSql} AS period,r.active,'Recorded' AS authority_basis,
    (${scopeSql("rel.company_id", "NULL::uuid", "shared.edit")} AND rel.valid_to IS NULL) AS can_end
    FROM ppo.relationships rel JOIN ppo.people r ON (r.workspace_id,r.id)=(rel.workspace_id,rel.person_id)
    WHERE rel.workspace_id=$1 AND rel.organisation_id=$3 AND ${visibility("Person")} ORDER BY rel.valid_from,rel.id LIMIT 201`,
          [p.workspace_id, p.actor_id, id, org.version],
        )
      ).rows
    : [];
  const sites = (
    await c.query<ContactSite>(
      `SELECT DISTINCT r.id,r.display_name,r.display_number,r.company_id,r.version FROM ppo.sites r
    JOIN ppo.site_parties sp ON (sp.workspace_id,sp.site_id)=(r.workspace_id,r.id)
    WHERE r.workspace_id=$1 AND sp.organisation_id=$3 AND ${visibility("Site")} ORDER BY r.display_name,r.id LIMIT 201`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const entries: Stakeholders["sites"]["items"] = [];
  for (const s of sites.slice(0, 200)) {
    const row = await visible(c, p, "Site", s.id);
    let contact: Stakeholders["sites"]["items"][number]["contact"] = null;
    let contact_state: Stakeholders["sites"]["items"][number]["contact_state"] =
      "Not recorded";
    if (row.primary_contact_id) {
      try {
        const person = await readShared(p, "Person", row.primary_contact_id);
        if (!("email" in person))
          throw new Error("Expected canonical Person projection");
        contact = {
          id: person.id,
          display_name: String(person.display_name),
          active: Boolean(person.active),
        };
        contact_state = "Recorded";
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
        contact_state = "Restricted";
      }
    }
    const parties = (
      await c.query(
        `SELECT sp.id,sp.organisation_id,r.display_name,sp.role,
      sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp()) AS is_current
      FROM ppo.site_parties sp JOIN ppo.organisations r ON (r.workspace_id,r.id)=(sp.workspace_id,sp.organisation_id)
      WHERE sp.workspace_id=$1 AND sp.site_id=$3 AND ${visibility("Organisation")} ORDER BY sp.role,sp.id`,
        [p.workspace_id, p.actor_id, s.id],
      )
    ).rows;
    entries.push({ ...s, contact, contact_state, parties });
  }
  const owner = (
    await c.query(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, org.owner_id],
    )
  ).rows[0];
  return {
    organisation: {
      id,
      display_name: org.display_name,
      display_number: org.display_number,
      version: org.version,
      owner_name: owner?.display_name ?? null,
    },
    affiliations: collection(
      affiliations.slice(0, 200),
      !companyRead
        ? "Restricted"
        : affiliations.length > 200
          ? "Partial"
          : "Available",
      "Recorded affiliations, including ended and future periods. A role is not purchasing authority.",
    ),
    sites: collection(
      entries,
      sites.length > 200 ? "Partial" : "Available",
      "Permitted sites with current or historic organisation relationships; inspect each party's validity.",
    ),
    observed_at: new Date().toISOString(),
  };
}
