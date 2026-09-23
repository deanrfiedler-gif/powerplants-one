import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { hasPermission, type QueryClient } from "../../platform/permissions";
import { sharedOperation } from "../../platform/operations";
import { companyContext } from "../authority";
import { visible } from "../reads";
import {
  common,
  commonKeys,
  dateOnly,
  invalid,
  label,
  object,
  optionalId,
  optionalText,
  uuid,
  version,
} from "../validation";

export function currentVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "This record has changed. Your proposal has been retained; reload and compare before saving again.",
    );
}

// A Person is shared across company contexts. A site-only grant must never
// change the identity/channels used by other companies or sites.
export async function personEditAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const person = await visible(c, p, "Person", id);
  const contexts = (
    await c.query<{ company_id: string }>(
      "SELECT company_id FROM ppo.person_company_contexts WHERE workspace_id=$1 AND person_id=$2",
      [p.workspace_id, id],
    )
  ).rows;
  if (!contexts.length) throw unavailable();
  for (const context of contexts)
    await companyContext(c, p, context.company_id, null, "shared.edit");
  return person;
}

export async function revisePerson(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "display_name",
    "email",
    "phone",
    "contact_preference",
    "active",
  ]);
  const email = optionalText(r.email, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    invalid("email", "Enter a valid email address.");
  if (typeof r.active !== "boolean")
    invalid("active", "Choose Active or Inactive.");
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    display_name: label(r.display_name, "display_name", 200),
    email,
    phone: optionalText(r.phone, "phone"),
    contact_preference: optionalText(
      r.contact_preference,
      "contact_preference",
    ),
    active: r.active as boolean,
  };
  const fields = [
    "display_name",
    "email",
    "phone",
    "contact_preference",
    "active",
  ] as const;
  return sharedOperation(
    p,
    command,
    "RevisePerson",
    (c) => personEditAuthority(c, p, command.id),
    async (c, before) => {
      currentVersion(before.version, command.expected_version);
      const row = (
        await c.query(
          `UPDATE ppo.people SET display_name=$3,email=$4,phone=$5,contact_preference=$6,active=$7,
       version=version+1,updated_by=$8,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2
       RETURNING *,CASE WHEN active THEN 'Active' ELSE 'Inactive' END AS state`,
          [
            p.workspace_id,
            command.id,
            ...fields.map((f) => command[f]),
            p.actor_id,
          ],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          previous_version: before.version,
          before: Object.fromEntries(fields.map((f) => [f, before[f]])),
          after: Object.fromEntries(fields.map((f) => [f, command[f]])),
        },
      };
    },
    "Person",
    "SharedRecordUpdated",
  );
}

export async function endAffiliation(
  p: Principal,
  organisationId: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "relationship_id",
    "valid_to",
  ]);
  const command = {
    ...common(r),
    id: uuid(organisationId, "organisation_id"),
    expected_version: version(r.expected_version),
    relationship_id: uuid(r.relationship_id, "relationship_id"),
    valid_to: dateOnly(r.valid_to, "valid_to"),
  };
  return sharedOperation(
    p,
    command,
    "EndAffiliation",
    async (c) => {
      const org = await visible(c, p, "Organisation", command.id);
      await companyContext(c, p, org.company_id, null, "shared.edit");
      const relationship = (
        await c.query(
          "SELECT *,valid_from::text,valid_to::text FROM ppo.relationships WHERE workspace_id=$1 AND organisation_id=$2 AND id=$3",
          [p.workspace_id, org.id, command.relationship_id],
        )
      ).rows[0];
      if (!relationship) throw unavailable();
      await visible(c, p, "Person", relationship.person_id);
      return { org, relationship };
    },
    async (c, { org, relationship }) => {
      currentVersion(org.version, command.expected_version);
      if (relationship.valid_to)
        throw new AppError(
          409,
          "AffiliationEnded",
          "This affiliation already has an end date. Its history is retained.",
        );
      if (command.valid_to <= relationship.valid_from)
        invalid(
          "valid_to",
          "The end date must follow the start date; the end is exclusive.",
        );
      await c.query(
        "UPDATE ppo.relationships SET valid_to=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, relationship.id, command.valid_to, p.actor_id],
      );
      const row = (
        await c.query(
          "UPDATE ppo.organisations SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,'Recorded' AS state",
          [p.workspace_id, org.id, p.actor_id],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          relationship_id: relationship.id,
          person_id: relationship.person_id,
          previous_version: org.version,
          before: {
            valid_to: null,
            relationship_version: relationship.version,
          },
          after: {
            valid_to: command.valid_to,
            relationship_version: relationship.version + 1,
          },
        },
      };
    },
    "Organisation",
    "SharedRecordUpdated",
  );
}

export async function setSitePrimaryContact(
  p: Principal,
  siteId: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "primary_contact_id",
  ]);
  const command = {
    ...common(r),
    id: uuid(siteId, "site_id"),
    expected_version: version(r.expected_version),
    primary_contact_id: optionalId(r.primary_contact_id, "primary_contact_id"),
  };
  return sharedOperation(
    p,
    command,
    "SetSitePrimaryContact",
    async (c) => {
      const site = await visible(c, p, "Site", command.id);
      await companyContext(c, p, site.company_id, site.id, "shared.edit");
      if (command.primary_contact_id) {
        const person = await visible(
          c,
          p,
          "Person",
          command.primary_contact_id,
        );
        if (
          !person.active ||
          !(
            await c.query(
              "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
              [p.workspace_id, site.company_id, person.id],
            )
          ).rowCount
        )
          throw unavailable();
      }
      return site;
    },
    async (c, site) => {
      currentVersion(site.version, command.expected_version);
      const row = (
        await c.query(
          "UPDATE ppo.sites SET primary_contact_id=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,'Recorded' AS state",
          [p.workspace_id, site.id, command.primary_contact_id, p.actor_id],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          previous_version: site.version,
          before: { primary_contact_id: site.primary_contact_id },
          after: { primary_contact_id: command.primary_contact_id },
        },
      };
    },
    "Site",
    "SharedRecordUpdated",
  );
}

export async function canEditPerson(c: QueryClient, p: Principal, id: string) {
  const contexts = (
    await c.query<{ company_id: string }>(
      "SELECT company_id FROM ppo.person_company_contexts WHERE workspace_id=$1 AND person_id=$2",
      [p.workspace_id, id],
    )
  ).rows;
  return (
    contexts.length > 0 &&
    (
      await Promise.all(
        contexts.map(
          async (x) =>
            (await hasPermission(c, p, "shared.edit", x.company_id)) &&
            (await hasPermission(c, p, "shared.read", x.company_id)),
        ),
      )
    ).every(Boolean)
  );
}
