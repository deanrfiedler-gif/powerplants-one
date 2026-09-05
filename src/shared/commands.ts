import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { hasPermission, requireCapability } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { visible, type SharedKind } from "./reads";
import {
  accessClasses,
  choice,
  common,
  commonKeys,
  dateOnly,
  exact,
  identityStates,
  instant,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalText,
  period,
  uuid,
  version,
} from "./validation";

async function scope(
  client: PoolClient,
  p: Principal,
  company_id: string,
  site_id?: string,
  cap:
    "shared.create" | "shared.edit" | "shared.history.record" = "shared.create",
) {
  await requireCapability(client, p, cap);
  await requireCapability(client, p, "shared.read");
  if (
    !(await hasPermission(client, p, "shared.read", company_id, site_id)) ||
    !(await hasPermission(client, p, cap, company_id, site_id))
  )
    throw unavailable();
  const company = await client.query(
    "SELECT 1 FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
    [p.workspace_id, company_id],
  );
  if (!company.rowCount) throw unavailable();
}
async function related(
  client: PoolClient,
  p: Principal,
  kind: SharedKind,
  id: string | null,
  company_id: string,
  site_id?: string,
) {
  if (!id) return;
  const row = await visible(client, p, kind, id);
  if (kind === "Person") {
    if (
      !(
        await client.query(
          "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
          [p.workspace_id, company_id, id],
        )
      ).rowCount
    )
      throw unavailable();
  } else if (
    row.company_id !== company_id ||
    (site_id && row.site_id !== site_id)
  )
    throw unavailable();
}
async function owner(client: PoolClient, p: Principal, id: string) {
  if (
    !(
      await client.query(
        "SELECT 1 FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
        [p.workspace_id, id],
      )
    ).rowCount
  )
    throw unavailable();
}
async function insert(
  client: PoolClient,
  p: Principal,
  table: string,
  fields: Record<string, unknown>,
) {
  const values = {
    ...fields,
    workspace_id: p.workspace_id,
    created_by: p.actor_id,
    updated_by: p.actor_id,
  };
  const entries = Object.entries(values);
  // Table/column names are typed command constants; values always use bind parameters.
  const row = (
    await client.query(
      `INSERT INTO ppo.${table}(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      entries.map(([, v]) => v),
    )
  ).rows[0];
  return {
    ...row,
    state:
      row.relationship_status ??
      row.identity_status ??
      row.mapping_status ??
      "Recorded",
  };
}
const createKeys = [...commonKeys, "id", "company_id"];
function createBase(p: Record<string, unknown>) {
  return {
    ...common(p),
    id: uuid(p.id, "id"),
    company_id: uuid(p.company_id, "company_id"),
  };
}
async function contentClass(
  client: PoolClient,
  p: Principal,
  company_id: string,
  access_class: string,
  site_id?: string,
) {
  if (
    access_class === "RestrictedFinance" &&
    !(await hasPermission(
      client,
      p,
      "shared.finance.read",
      company_id,
      site_id,
    ))
  )
    throw new AppError(
      403,
      "Forbidden",
      "This identity cannot record restricted Finance content.",
    );
}
export async function createOrganisation(p: Principal, input: unknown) {
  const raw = object(input, [
    ...createKeys,
    "display_name",
    "legal_name",
    "relationship_status",
    "owner_id",
    "parent_organisation_id",
    "sector",
    "notes",
    "access_class",
  ]);
  const command = {
    ...createBase(raw),
    display_name: label(raw.display_name, "display_name", 200),
    legal_name: optionalText(raw.legal_name, "legal_name"),
    relationship_status: choice(
      raw.relationship_status,
      "relationship_status",
      ["Prospect", "Active", "Inactive"],
    ),
    owner_id: uuid(raw.owner_id, "owner_id"),
    parent_organisation_id: optionalId(
      raw.parent_organisation_id,
      "parent_organisation_id",
    ),
    sector: optionalText(raw.sector, "sector"),
    notes: optionalText(raw.notes, "notes", 10000),
    access_class: choice(
      raw.access_class ?? "Internal",
      "access_class",
      accessClasses,
    ),
  };
  return sharedOperation(
    p,
    command,
    "CreateOrganisation",
    async (c) => {
      await scope(c, p, command.company_id);
      await owner(c, p, command.owner_id);
      await related(
        c,
        p,
        "Organisation",
        command.parent_organisation_id,
        command.company_id,
      );
      await contentClass(c, p, command.company_id, command.access_class);
    },
    async (c) => {
      const {
        operation_id: _,
        schema_version: __,
        reason: ___,
        ...fields
      } = command;
      void _;
      void __;
      void ___;
      return insert(c, p, "organisations", fields);
    },
    "Organisation",
    "SharedRecordCreated",
  );
}
export async function createPerson(p: Principal, input: unknown) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "company_ids",
    "display_name",
    "email",
    "phone",
    "contact_preference",
  ]);
  if (
    !Array.isArray(raw.company_ids) ||
    !raw.company_ids.length ||
    raw.company_ids.length > 10
  )
    invalid("company_ids", "Provide 1–10 explicit company contexts.");
  const company_ids = [
    ...new Set(raw.company_ids.map((v) => uuid(v, "company_ids"))),
  ].sort();
  const email = optionalText(raw.email, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    invalid("email", "Enter a valid email address.");
  const command = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    company_ids,
    display_name: label(raw.display_name, "display_name", 200),
    email,
    phone: optionalText(raw.phone, "phone"),
    contact_preference: optionalText(
      raw.contact_preference,
      "contact_preference",
    ),
  };
  return sharedOperation(
    p,
    command,
    "CreatePerson",
    async (c) => {
      for (const id of command.company_ids) await scope(c, p, id);
    },
    async (c) => {
      const row = await insert(c, p, "people", {
        id: command.id,
        display_name: command.display_name,
        email: command.email,
        phone: command.phone,
        contact_preference: command.contact_preference,
        active: true,
      });
      for (const id of command.company_ids)
        await c.query(
          "INSERT INTO ppo.person_company_contexts VALUES($1,$2,$3)",
          [p.workspace_id, id, command.id],
        );
      return row;
    },
    "Person",
    "SharedRecordCreated",
  );
}
function party(value: unknown) {
  const x = object(value, [
    "organisation_id",
    "role",
    "valid_from",
    "valid_to",
  ]);
  return {
    organisation_id: uuid(x.organisation_id, "organisation_id"),
    role: choice(x.role, "role", ["Operator", "Owner", "BillingParty"]),
    ...period(x),
  };
}
export async function createSite(p: Principal, input: unknown) {
  const raw = object(input, [
    ...createKeys,
    "display_name",
    "location_description",
    "timezone",
    "owner_id",
    "primary_contact_id",
    "access_instructions",
    "biosecurity_notes",
    "parties",
  ]);
  const timezone = label(raw.timezone, "timezone", 200);
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: timezone });
  } catch {
    invalid("timezone", "Enter a valid IANA timezone.");
  }
  if (
    raw.parties !== undefined &&
    (!Array.isArray(raw.parties) || raw.parties.length > 10)
  )
    invalid("parties", "Provide at most 10 initial site parties.");
  const command = {
    ...createBase(raw),
    display_name: label(raw.display_name, "display_name", 200),
    location_description: label(
      raw.location_description,
      "location_description",
      10000,
    ),
    timezone,
    owner_id: uuid(raw.owner_id, "owner_id"),
    primary_contact_id: optionalId(
      raw.primary_contact_id,
      "primary_contact_id",
    ),
    access_instructions: optionalText(
      raw.access_instructions,
      "access_instructions",
      10000,
    ),
    biosecurity_notes: optionalText(
      raw.biosecurity_notes,
      "biosecurity_notes",
      10000,
    ),
    parties: ((raw.parties ?? []) as unknown[]).map(party),
  };
  return sharedOperation(
    p,
    command,
    "CreateSite",
    async (c) => {
      await scope(c, p, command.company_id);
      await owner(c, p, command.owner_id);
      await related(
        c,
        p,
        "Person",
        command.primary_contact_id,
        command.company_id,
      );
      for (const x of command.parties)
        await related(
          c,
          p,
          "Organisation",
          x.organisation_id,
          command.company_id,
        );
    },
    async (c) => {
      const {
        operation_id: _,
        schema_version: __,
        reason: ___,
        parties,
        ...fields
      } = command;
      void _;
      void __;
      void ___;
      const row = await insert(c, p, "sites", fields);
      for (const x of parties)
        await insert(c, p, "site_parties", {
          id: randomUUID(),
          company_id: command.company_id,
          site_id: command.id,
          ...x,
        });
      return row;
    },
    "Site",
    "SharedRecordCreated",
  );
}
export async function createFacility(p: Principal, input: unknown) {
  const raw = object(input, [
    ...createKeys,
    "site_id",
    "name",
    "parent_facility_id",
  ]);
  const command = {
    ...createBase(raw),
    site_id: uuid(raw.site_id, "site_id"),
    name: label(raw.name, "name", 200),
    parent_facility_id: optionalId(
      raw.parent_facility_id,
      "parent_facility_id",
    ),
  };
  return sharedOperation(
    p,
    command,
    "CreateFacility",
    async (c) => {
      await scope(c, p, command.company_id, command.site_id);
      await related(c, p, "Site", command.site_id, command.company_id);
      await related(
        c,
        p,
        "Facility",
        command.parent_facility_id,
        command.company_id,
        command.site_id,
      );
    },
    async (c) =>
      insert(c, p, "facilities", {
        id: command.id,
        company_id: command.company_id,
        site_id: command.site_id,
        name: command.name,
        parent_facility_id: command.parent_facility_id,
      }),
    "Facility",
    "SharedRecordCreated",
  );
}
export async function createAsset(p: Principal, input: unknown) {
  const raw = object(input, [
    ...createKeys,
    "site_id",
    "description",
    "identity_status",
    "facility_id",
    "parent_asset_id",
    "predecessor_asset_id",
    "manufacturer",
    "model",
    "serial",
    "external_equipment_ref",
    "lifecycle_status",
    "installed_on",
    "commissioned_on",
    "warranty_start",
    "warranty_end",
    "effective_at",
    "configuration",
  ]);
  const dates = Object.fromEntries(
    ["installed_on", "commissioned_on", "warranty_start", "warranty_end"].map(
      (k) => [
        k,
        raw[k] === undefined || raw[k] === null ? null : dateOnly(raw[k], k),
      ],
    ),
  );
  const command = {
    ...createBase(raw),
    site_id: uuid(raw.site_id, "site_id"),
    description: label(raw.description, "description", 200),
    identity_status: choice(
      raw.identity_status,
      "identity_status",
      identityStates,
    ),
    facility_id: optionalId(raw.facility_id, "facility_id"),
    parent_asset_id: optionalId(raw.parent_asset_id, "parent_asset_id"),
    predecessor_asset_id: optionalId(
      raw.predecessor_asset_id,
      "predecessor_asset_id",
    ),
    manufacturer: optionalText(raw.manufacturer, "manufacturer"),
    model: optionalText(raw.model, "model"),
    serial:
      raw.serial === undefined || raw.serial === null
        ? null
        : exact(raw.serial, "serial"),
    external_equipment_ref:
      raw.external_equipment_ref === undefined ||
      raw.external_equipment_ref === null
        ? null
        : exact(raw.external_equipment_ref, "external_equipment_ref"),
    lifecycle_status: choice(
      raw.lifecycle_status ?? "Active",
      "lifecycle_status",
      ["Active", "Removed", "Decommissioned"],
    ),
    ...dates,
    effective_at: instant(raw.effective_at, "effective_at"),
    configuration: optionalText(raw.configuration, "configuration", 10000),
  };
  return sharedOperation(
    p,
    command,
    "CreateAsset",
    async (c) => {
      await scope(c, p, command.company_id, command.site_id);
      await related(c, p, "Site", command.site_id, command.company_id);
      await related(
        c,
        p,
        "Facility",
        command.facility_id,
        command.company_id,
        command.site_id,
      );
      await related(
        c,
        p,
        "Asset",
        command.parent_asset_id,
        command.company_id,
        command.site_id,
      );
      await related(
        c,
        p,
        "Asset",
        command.predecessor_asset_id,
        command.company_id,
      );
    },
    async (c) => {
      const {
        operation_id: _,
        schema_version: __,
        reason: ___,
        configuration,
        effective_at,
        ...fields
      } = command;
      void _;
      void __;
      void ___;
      const row = await insert(c, p, "assets", fields);
      await insert(c, p, "asset_location_events", {
        id: randomUUID(),
        company_id: command.company_id,
        asset_id: command.id,
        to_site_id: command.site_id,
        effective_at,
        reason: command.reason,
      });
      if (configuration)
        await insert(c, p, "asset_configurations", {
          id: randomUUID(),
          company_id: command.company_id,
          asset_id: command.id,
          revision: 1,
          description: configuration,
          valid_from: effective_at,
        });
      return row;
    },
    "Asset",
    "SharedRecordCreated",
  );
}
export async function addAffiliation(
  p: Principal,
  organisation_id: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "person_id",
    "role_label",
    "valid_from",
    "valid_to",
  ]);
  const command = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    organisation_id: uuid(organisation_id, "organisation_id"),
    expected_version: version(raw.expected_version),
    person_id: uuid(raw.person_id, "person_id"),
    role_label: label(raw.role_label, "role_label", 200),
    ...period(raw, true),
  };
  return sharedOperation(
    p,
    command,
    "AddAffiliation",
    async (c) => {
      const org = await visible(c, p, "Organisation", command.organisation_id);
      await scope(c, p, org.company_id, undefined, "shared.edit");
      await related(c, p, "Person", command.person_id, org.company_id);
      return org;
    },
    async (c, org) => {
      checkVersion(org.version, command.expected_version);
      const row = await insert(c, p, "relationships", {
        id: command.id,
        company_id: org.company_id,
        organisation_id: org.id,
        person_id: command.person_id,
        role_label: command.role_label,
        valid_from: command.valid_from,
        valid_to: command.valid_to,
      });
      await bump(c, p, "organisations", org.id);
      return row;
    },
    "Relationship",
    "SharedRecordCreated",
  );
}
export async function addSiteParty(
  p: Principal,
  site_id: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "organisation_id",
    "role",
    "valid_from",
    "valid_to",
  ]);
  const command = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    site_id: uuid(site_id, "site_id"),
    expected_version: version(raw.expected_version),
    ...party({
      organisation_id: raw.organisation_id,
      role: raw.role,
      valid_from: raw.valid_from,
      valid_to: raw.valid_to,
    }),
  };
  return sharedOperation(
    p,
    command,
    "AddSiteParty",
    async (c) => {
      const site = await visible(c, p, "Site", command.site_id);
      await scope(c, p, site.company_id, site.id, "shared.edit");
      await related(
        c,
        p,
        "Organisation",
        command.organisation_id,
        site.company_id,
      );
      return site;
    },
    async (c, site) => {
      checkVersion(site.version, command.expected_version);
      const row = await insert(c, p, "site_parties", {
        id: command.id,
        company_id: site.company_id,
        site_id: site.id,
        organisation_id: command.organisation_id,
        role: command.role,
        valid_from: command.valid_from,
        valid_to: command.valid_to,
      });
      await bump(c, p, "sites", site.id);
      return row;
    },
    "SiteParty",
    "SharedRecordCreated",
  );
}
export async function proposeMapping(
  p: Principal,
  organisation_id: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "erp_connection_id",
    "erp_company_id",
    "entity_type",
    "customer_id",
    "valid_from",
    "valid_to",
  ]);
  const command = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    organisation_id: uuid(organisation_id, "organisation_id"),
    expected_version: version(raw.expected_version),
    erp_connection_id: uuid(raw.erp_connection_id, "erp_connection_id"),
    erp_company_id: exact(raw.erp_company_id, "erp_company_id"),
    entity_type: choice(raw.entity_type, "entity_type", ["Customer"]),
    customer_id: exact(raw.customer_id, "customer_id"),
    ...period(raw),
  };
  return sharedOperation(
    p,
    command,
    "ProposeMapping",
    async (c) => {
      const org = await visible(c, p, "Organisation", command.organisation_id);
      await scope(c, p, org.company_id, undefined, "shared.edit");
      if (
        !(
          await c.query(
            "SELECT 1 FROM ppo.companies WHERE workspace_id=$1 AND id=$2 AND erp_connection_id=$3 AND erp_company_id=$4",
            [
              p.workspace_id,
              org.company_id,
              command.erp_connection_id,
              command.erp_company_id,
            ],
          )
        ).rowCount
      )
        throw unavailable();
      return org;
    },
    async (c, org) => {
      checkVersion(org.version, command.expected_version);
      const row = await insert(c, p, "erp_account_mappings", {
        id: command.id,
        company_id: org.company_id,
        organisation_id: org.id,
        erp_connection_id: command.erp_connection_id,
        erp_company_id: command.erp_company_id,
        entity_type: command.entity_type,
        customer_id: command.customer_id,
        valid_from: command.valid_from,
        valid_to: command.valid_to,
        mapping_status: "Proposed",
      });
      await bump(c, p, "organisations", org.id);
      return row;
    },
    "ErpAccountMapping",
    "SharedRecordCreated",
  );
}
export async function renameOrganisation(
  p: Principal,
  id: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "expected_version",
    "display_name",
    "parent_organisation_id",
  ]);
  const command = {
    ...common(raw),
    id: uuid(id, "id"),
    expected_version: version(raw.expected_version),
    display_name: label(raw.display_name, "display_name", 200),
    parent_organisation_id: optionalId(
      raw.parent_organisation_id,
      "parent_organisation_id",
    ),
  };
  return sharedOperation(
    p,
    command,
    "ReviseOrganisationIdentity",
    async (c) => {
      const org = await visible(c, p, "Organisation", command.id);
      await scope(c, p, org.company_id, undefined, "shared.edit");
      await related(
        c,
        p,
        "Organisation",
        command.parent_organisation_id,
        org.company_id,
      );
      return org;
    },
    async (c, org) => {
      checkVersion(org.version, command.expected_version);
      const updated = (
        await c.query(
          "UPDATE ppo.organisations SET display_name=$1,parent_organisation_id=$2,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$4 AND id=$5 RETURNING *,relationship_status AS state",
          [
            command.display_name,
            command.parent_organisation_id,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          previous_version: org.version,
          before: {
            display_name: org.display_name,
            parent_organisation_id: org.parent_organisation_id,
          },
          after: {
            display_name: command.display_name,
            parent_organisation_id: command.parent_organisation_id,
          },
        },
      };
    },
    "Organisation",
    "SharedRecordUpdated",
  );
}
export async function reviseAssetIdentity(
  p: Principal,
  id: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "expected_version",
    "identity_status",
    "serial",
    "parent_asset_id",
  ]);
  const command = {
    ...common(raw),
    id: uuid(id, "id"),
    expected_version: version(raw.expected_version),
    identity_status: choice(
      raw.identity_status,
      "identity_status",
      identityStates,
    ),
    serial: raw.serial === null ? null : exact(raw.serial, "serial"),
    parent_asset_id: optionalId(raw.parent_asset_id, "parent_asset_id"),
  };
  return sharedOperation(
    p,
    command,
    "ReviseAssetIdentity",
    async (c) => {
      const a = await visible(c, p, "Asset", command.id);
      await scope(c, p, a.company_id, a.site_id, "shared.edit");
      await related(
        c,
        p,
        "Asset",
        command.parent_asset_id,
        a.company_id,
        a.site_id,
      );
      return a;
    },
    async (c, a) => {
      checkVersion(a.version, command.expected_version);
      const updated = (
        await c.query(
          "UPDATE ppo.assets SET identity_status=$1,serial=$2,parent_asset_id=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$5 AND id=$6 RETURNING *,identity_status AS state",
          [
            command.identity_status,
            command.serial,
            command.parent_asset_id,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          previous_version: a.version,
          before: {
            identity_status: a.identity_status,
            serial: a.serial,
            parent_asset_id: a.parent_asset_id,
          },
          after: {
            identity_status: command.identity_status,
            serial: command.serial,
            parent_asset_id: command.parent_asset_id,
          },
        },
      };
    },
    "Asset",
    "SharedRecordUpdated",
  );
}
export async function recordHistory(
  p: Principal,
  site_id: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "asset_id",
    "occurred_at",
    "author_label",
    "kind",
    "summary",
    "confidence",
    "source_system",
    "source_id",
    "access_class",
  ]);
  const source_system =
      raw.source_system === undefined || raw.source_system === null
        ? null
        : exact(raw.source_system, "source_system"),
    source_id =
      raw.source_id === undefined || raw.source_id === null
        ? null
        : exact(raw.source_id, "source_id");
  if ((source_system === null) !== (source_id === null))
    invalid(
      "source_id",
      "Source system and exact source key must be supplied together.",
    );
  const command = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    site_id: uuid(site_id, "site_id"),
    expected_version: version(raw.expected_version),
    asset_id: optionalId(raw.asset_id, "asset_id"),
    occurred_at: instant(raw.occurred_at, "occurred_at"),
    author_label: label(raw.author_label, "author_label", 200),
    kind: choice(raw.kind, "kind", [
      "PriorWork",
      "KnownIssue",
      "AttemptedFix",
      "TechnicalAdvice",
    ]),
    summary: narrative(raw.summary, "summary", 10000),
    confidence: choice(raw.confidence, "confidence", ["Reported", "Suspected"]),
    source_system,
    source_id,
    access_class: choice(
      raw.access_class ?? "RestrictedService",
      "access_class",
      accessClasses,
    ),
  };
  return sharedOperation(
    p,
    command,
    "RecordSharedHistory",
    async (c) => {
      const site = await visible(c, p, "Site", command.site_id);
      await scope(c, p, site.company_id, site.id, "shared.history.record");
      await related(c, p, "Asset", command.asset_id, site.company_id);
      await contentClass(c, p, site.company_id, command.access_class, site.id);
      return site;
    },
    async (c, site) => {
      checkVersion(site.version, command.expected_version);
      const {
        operation_id: _,
        reason: __,
        expected_version: ___,
        ...fields
      } = command;
      void _;
      void __;
      void ___;
      const row = await insert(c, p, "history_records", {
        ...fields,
        company_id: site.company_id,
        verification_status: source_system ? "Imported" : "ReviewRequired",
        site_label: "server-derived",
      });
      await bump(c, p, "sites", site.id);
      return row;
    },
    "HistoryRecord",
    "SharedHistoryRecorded",
  );
}
function checkVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "This record has changed. Keep your proposed values and reload the current version.",
    );
}
async function bump(
  c: PoolClient,
  p: Principal,
  table: "organisations" | "sites",
  id: string,
) {
  await c.query(
    `UPDATE ppo.${table} SET version=version+1,updated_by=$1,updated_at=clock_timestamp() WHERE workspace_id=$2 AND id=$3`,
    [p.actor_id, p.workspace_id, id],
  );
}
