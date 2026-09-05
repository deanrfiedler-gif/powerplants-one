"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIdentity } from "./business-session";
import {
  EnumField,
  ErrorNotice,
  Field,
  PageHeader,
  ReadState,
  SelectField,
  useCommand,
  useResource,
  type Envelope,
  type Option,
} from "./business-ui";
export function SharedCreateForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const p = useIdentity(),
    router = useRouter(),
    cmd = useCommand(),
    kind = initial.kind ?? "customer";
  const [v, setV] = useState<Record<string, string>>({
    company: initial.company ?? "",
    site: initial.site ?? "",
    parent: initial.parent ?? "",
    owner: p.actor_id,
    name: "",
    location: "",
    timezone: "Australia/Brisbane",
    contact: "",
    access: "",
    biosecurity: "",
    status: "Prospect",
    role: "",
    from: "",
    to: "",
    person: "",
    email: "",
    phone: "",
    preference: "",
    identity: "Unresolved",
    model: "",
    manufacturer: "",
    serial: "",
    external: "",
    configuration: "",
    asset: "",
    history_kind: "KnownIssue",
    confidence: "Reported",
    summary: "",
    author: p.display_name,
    source_system: "",
    source_id: "",
    reason: "",
  });
  const [newId] = useState(() => crypto.randomUUID()),
    [expected, setExpected] = useState(Number(initial.version ?? 1));
  const set = (k: string, value: string) => setV((s) => ({ ...s, [k]: value }));
  const companies = useResource<Envelope<Option>>("selectors/companies");
  const owners = useResource<Envelope<Option>>(
    v.company
      ? "selectors/owners?company_id=" + v.company + "&purpose=Customer"
      : null,
  );
  const people = useResource<Envelope<Option>>("people?limit=200");
  const sites = useResource<Envelope<Option>>(
    v.company ? "sites?company_id=" + v.company + "&limit=200" : null,
  );
  const orgs = useResource<Envelope<Option>>(
    v.company ? "customers?company_id=" + v.company + "&limit=200" : null,
  );
  const assets = useResource<Envelope<Option>>(
    v.site ? "assets?site_id=" + v.site + "&limit=200" : null,
  );
  const parentPath =
    kind === "affiliation"
      ? "customers/" + v.parent
      : kind === "party"
        ? "sites/" + v.parent
        : kind === "history"
          ? "sites/" + v.site
          : null;
  const parent =
    useResource<Envelope<Option & { version: number }>>(parentPath);
  const duplicates = useResource<Envelope<Option>>(
    kind === "customer" && v.name
      ? "customers?q=" + encodeURIComponent(v.name)
      : null,
  );
  const field = (
    key: string,
    label: string,
    required = false,
    multiline = false,
    max = 200,
    type = "text",
  ) => (
    <Field
      key={key}
      name={"shared-" + key}
      label={label}
      value={v[key] ?? ""}
      onChange={(value) => set(key, value)}
      required={required}
      multiline={multiline}
      maxLength={max}
      type={type}
    />
  );
  const select = (
    key: string,
    label: string,
    options: Option[],
    required = false,
  ) => (
    <SelectField
      key={key}
      name={"shared-" + key}
      label={label}
      value={v[key] ?? ""}
      onChange={(value) => set(key, value)}
      options={options}
      required={required}
    />
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let path = "",
      destination = "",
      fields: Record<string, unknown> = { id: newId, reason: v.reason };
    const utc = (s: string) => (s ? s + ":00Z" : null);
    if (kind === "customer") {
      path = "customers";
      destination = "/customers/" + newId;
      fields = {
        ...fields,
        company_id: v.company,
        display_name: v.name,
        relationship_status: v.status,
        owner_id: v.owner,
      };
    }
    if (kind === "person") {
      path = "people";
      destination = "/people/" + newId;
      fields = {
        ...fields,
        company_ids: [v.company],
        display_name: v.name,
        email: v.email || null,
        phone: v.phone || null,
        contact_preference: v.preference || null,
      };
    }
    if (kind === "site") {
      path = "sites";
      destination = "/sites/" + newId;
      fields = {
        ...fields,
        company_id: v.company,
        display_name: v.name,
        location_description: v.location,
        timezone: v.timezone,
        owner_id: v.owner,
        primary_contact_id: v.contact || null,
        access_instructions: v.access || null,
        biosecurity_notes: v.biosecurity || null,
        parties: v.parent
          ? [
              {
                organisation_id: v.parent,
                role: v.role,
                valid_from: utc(v.from),
                valid_to: utc(v.to),
              },
            ]
          : [],
      };
    }
    if (kind === "asset") {
      path = "assets";
      destination = "/equipment/" + newId;
      fields = {
        ...fields,
        company_id: v.company,
        site_id: v.site,
        description: v.name,
        identity_status: v.identity,
        manufacturer: v.manufacturer || null,
        model: v.model || null,
        serial: v.serial || null,
        external_equipment_ref: v.external || null,
        effective_at: utc(v.from),
        configuration: v.configuration || null,
      };
    }
    if (kind === "affiliation") {
      path = "customers/" + v.parent + "/affiliations";
      destination = "/customers/" + v.parent;
      fields = {
        ...fields,
        expected_version: expected,
        person_id: v.person,
        role_label: v.role,
        valid_from: v.from,
        valid_to: v.to || null,
      };
    }
    if (kind === "party") {
      path = "sites/" + v.parent + "/parties";
      destination = "/sites/" + v.parent;
      fields = {
        ...fields,
        expected_version: expected,
        organisation_id: v.person,
        role: v.role,
        valid_from: utc(v.from),
        valid_to: utc(v.to),
      };
    }
    if (kind === "history") {
      path = "sites/" + v.site + "/history";
      destination = "/sites/" + v.site;
      fields = {
        ...fields,
        expected_version: expected,
        asset_id: v.asset || null,
        occurred_at: utc(v.from),
        author_label: v.author,
        kind: v.history_kind,
        summary: v.summary,
        confidence: v.confidence,
        source_system: v.source_system || null,
        source_id: v.source_id || null,
      };
    }
    if (!path) return;
    const result = await cmd.send(path, fields);
    if (result) router.push(destination);
  }
  const titles: Record<string, string> = {
    customer: "Create an organisation",
    person: "Create a shared contact",
    site: "Create a site",
    asset: "Record equipment identity",
    affiliation: "Add an existing contact affiliation",
    party: "Add a site party",
    history: "Record attributed technical context",
  };
  return (
    <>
      <Link href="/customers">← Customer context</Link>
      <PageHeader
        eyebrow="Synthetic context / Record capture"
        title={titles[kind] ?? "Unsupported record type"}
      />
      <p>
        Use fictional data. Unknown information stays explicit; no ERP account,
        work authority or verified source evidence is created.
      </p>
      <ErrorNotice error={cmd.error} />
      <form className="form-panel" onSubmit={submit}>
        <fieldset disabled={cmd.busy}>
          <div className="form-grid">
            {["customer", "person", "site", "asset"].includes(kind) &&
              select(
                "company",
                "Company visibility context",
                companies.data?.items ?? [],
                true,
              )}
            {["customer", "person", "site", "asset"].includes(kind) &&
              field(
                "name",
                kind === "asset" ? "Equipment description" : "Display name",
                true,
              )}
            {["customer", "site"].includes(kind) &&
              select(
                "owner",
                "Relationship / site owner",
                owners.data?.items ?? [],
                true,
              )}
            {kind === "customer" && (
              <EnumField
                name="shared-status"
                label="Relationship status"
                value={v.status}
                values={["Prospect", "Active", "Inactive"]}
                onChange={(value) => set("status", value)}
              />
            )}
            {kind === "person" && (
              <>
                {field("email", "Email", false, false, 200, "email")}
                {field("phone", "Phone")}
                {field("preference", "Contact preference")}
              </>
            )}
            {kind === "site" && (
              <>
                {field(
                  "location",
                  "Known location / explicit location uncertainty",
                  true,
                  false,
                  10000,
                )}
                {field("timezone", "Site timezone", true)}
                {select(
                  "contact",
                  "Primary contact, if known",
                  people.data?.items ?? [],
                )}
                {field(
                  "access",
                  "Known access information",
                  false,
                  false,
                  10000,
                )}
                {field(
                  "biosecurity",
                  "Biosecurity information",
                  false,
                  false,
                  10000,
                )}
                {select(
                  "parent",
                  "Initial related organisation, if known",
                  orgs.data?.items ?? [],
                )}
              </>
            )}
            {(kind === "party" || (kind === "site" && v.parent)) && (
              <>
                {kind === "party" &&
                  select(
                    "person",
                    "Organisation",
                    orgs.data?.items ?? [],
                    true,
                  )}
                <EnumField
                  name="shared-party-role"
                  label="Relationship role"
                  value={v.role}
                  values={["Operator", "Owner", "BillingParty"]}
                  onChange={(value) => set("role", value)}
                />
                {field(
                  "from",
                  "Effective from (UTC)",
                  true,
                  false,
                  200,
                  "datetime-local",
                )}
                {field(
                  "to",
                  "Effective until (UTC), if known",
                  false,
                  false,
                  200,
                  "datetime-local",
                )}
              </>
            )}
            {kind === "asset" && (
              <>
                {select("site", "Site", sites.data?.items ?? [], true)}
                <EnumField
                  name="shared-identity"
                  label="Identity status"
                  value={v.identity}
                  values={["Unresolved", "Disputed", "Verified"]}
                  onChange={(value) => set("identity", value)}
                />
                {field("manufacturer", "Manufacturer")}
                {field("model", "Model")}
                {field("serial", "Serial or candidate — exact text")}
                {field("external", "External equipment reference — exact text")}
                {field(
                  "from",
                  "Effective location time (UTC)",
                  true,
                  false,
                  200,
                  "datetime-local",
                )}
                {field(
                  "configuration",
                  "Initial configuration description (review required)",
                  false,
                  false,
                  10000,
                )}
              </>
            )}
            {kind === "affiliation" && (
              <>
                {select(
                  "person",
                  "Existing shared contact",
                  people.data?.items ?? [],
                  true,
                )}
                {field("role", "Affiliation role", true)}
                {field("from", "Valid from", true, false, 200, "date")}
                {field(
                  "to",
                  "Valid until, if known",
                  false,
                  false,
                  200,
                  "date",
                )}
                <p>
                  Choose the same Person identity for another affiliation.
                  Similar names and email addresses do not merge people.
                </p>
              </>
            )}
            {kind === "history" && (
              <>
                {select(
                  "asset",
                  "Equipment, if applicable",
                  assets.data?.items ?? [],
                )}
                <EnumField
                  name="shared-history-kind"
                  label="History type"
                  value={v.history_kind}
                  values={[
                    "PriorWork",
                    "KnownIssue",
                    "AttemptedFix",
                    "TechnicalAdvice",
                  ]}
                  onChange={(value) => set("history_kind", value)}
                />
                <EnumField
                  name="shared-confidence"
                  label="Confidence"
                  value={v.confidence}
                  values={["Reported", "Suspected"]}
                  onChange={(value) => set("confidence", value)}
                />
                {field(
                  "summary",
                  "Reported context / attempted fix / advice",
                  true,
                  true,
                  10000,
                )}
                {field("author", "Original author label", true)}
                {field(
                  "from",
                  "Occurrence time (UTC)",
                  true,
                  false,
                  200,
                  "datetime-local",
                )}
                {field("source_system", "Source system, if imported")}
                {field("source_id", "Exact source key, if imported")}
                <p>
                  Occurrence and original author are distinct from the server
                  actor and capture time. Original history is immutable.
                </p>
              </>
            )}
            {field("reason", "Reason for capture", true, false, 1000)}
          </div>
          <button type="submit">
            Save {kind === "history" ? "technical context" : "record"}
          </button>
        </fieldset>
      </form>
      {[
        companies,
        ...(["customer", "site"].includes(kind) ? [owners] : []),
        ...(["affiliation", "person", "site"].includes(kind) ? [people] : []),
        ...(kind === "asset" ? [sites] : []),
        ...(parentPath ? [parent] : []),
      ].map((r, i) => (
        <ReadState
          key={i}
          loading={r.loading}
          error={r.error}
          retry={r.reload}
        />
      ))}
      {parent.data && (
        <section className="conflict-panel">
          <p>
            Parent record version: {parent.data.items[0].version}. Your entries
            remain in the form.
          </p>
          <button className="secondary" onClick={parent.reload}>
            Compare current saved parent
          </button>
          {parent.data.items[0].version !== expected && (
            <button
              className="secondary"
              onClick={() => {
                setExpected(parent.data!.items[0].version);
                cmd.clear();
              }}
            >
              Use current parent version with my entries
            </button>
          )}
        </section>
      )}
      {duplicates.data && duplicates.data.items.length > 0 && (
        <section className="detail-section">
          <h2>Possible duplicate candidates</h2>
          {duplicates.data.items.map((o) => (
            <p key={o.id}>
              <Link href={"/customers/" + o.id}>
                {o.display_name} · {o.display_number}
              </Link>
            </p>
          ))}
          <p>
            Review before creating another organisation. Saving keeps every
            identity separate.
          </p>
        </section>
      )}
    </>
  );
}
