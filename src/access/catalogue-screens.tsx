"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Field,
  SelectField,
  PageHeader,
  ReadState,
  Stamp,
  Status,
  useResource,
} from "../components/business-ui";
import { Button } from "../components/ui/button";

type Capability = {
  key: string;
  label: string;
  domain: string;
  hosted_only: boolean;
};
type Catalogue = {
  items: (Capability & { recorded: number; current: number })[];
  domains: string[];
  checked_at: string;
};
type Holder = {
  id: string;
  user_id: string;
  display_name: string;
  masked: boolean;
  scope_type: string;
  company_id: string | null;
  site_id: string | null;
  company_name: string | null;
  erp_company_id: string | null;
  site_number: string | null;
  site_name: string | null;
  state: string;
  valid_from: string;
  valid_to: string | null;
};
type Holders = {
  capability: Capability;
  items: Holder[];
  has_more: boolean;
  checked_at: string;
};

function Boundary() {
  return (
    <p className="callout">
      Recorded grants show scope and validity. A current grant does not confirm
      access to every record or approve a business action. Role bundles and
      teams are not assigned here.
    </p>
  );
}

export function AccessCapabilitiesScreen() {
  const [query, setQuery] = useState(""),
    [domain, setDomain] = useState(""),
    [applied, setApplied] = useState("");
  const resource = useResource<Catalogue>(
    `admin/access/capabilities?${applied}`,
  );
  return (
    <>
      <Link href="/admin/access">Back to users and access</Link>
      <PageHeader
        variant="register"
        eyebrow="Administration · AD-01"
        title="Capability catalogue"
        description="Find a permission and inspect its recorded grants in this workspace."
      />
      <Boundary />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = new URLSearchParams({ q: query, domain }).toString();
          if (next === applied) resource.reload();
          else setApplied(next);
        }}
      >
        <Field
          name="capability-search"
          label="Find a capability"
          value={query}
          onChange={setQuery}
          maxLength={100}
        />
        <SelectField
          name="capability-domain"
          label="Domain"
          value={domain}
          onChange={setDomain}
          empty="All domains"
          options={(resource.data?.domains ?? []).map((id) => ({
            id,
            display_name: id,
          }))}
        />
        <Button type="submit">Search capabilities</Button>
      </form>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data && !resource.loading && !resource.error && (
        <>
          <p className="read-meta">
            Capabilities shown: {resource.data.items.length}. Counts are grants, not
            people. Checked <Stamp value={resource.data.checked_at} />.
          </p>
          <p>
            Current means an active identity and a grant within its validity
            dates. Recorded includes scheduled, expired and inactive-identity
            grants. Capabilities with no grants remain visible.
          </p>
          {!resource.data.items.length && (
            <p className="empty-state">No capabilities match these filters.</p>
          )}
          <div className="record-grid">
            {resource.data.items.map((item) => (
              <article className="record-card" key={item.key}>
                <h2 className="narrative">
                  <Link href={`/admin/access/capabilities/${item.key}`}>
                    {item.key}
                  </Link>
                </h2>
                <p>{item.label}</p>
                <p>
                  {item.current} current · {item.recorded} recorded grants
                </p>
                {item.hosted_only && (
                  <p>
                    Hosted demo only; mailbox connection has separate
                    authentication requirements.
                  </p>
                )}
              </article>
            ))}
          </div>
          <Button onClick={resource.reload}>Refresh capabilities</Button>
        </>
      )}
    </>
  );
}

export function AccessCapabilityScreen({ capability }: { capability: string }) {
  const [scope, setScope] = useState(""),
    [state, setState] = useState(""),
    [offset, setOffset] = useState(0),
    [applied, setApplied] = useState("");
  const resource = useResource<Holders>(
    `admin/access/capabilities/${encodeURIComponent(capability)}?${applied}&offset=${offset}`,
  );
  return (
    <>
      <Link href="/admin/access/capabilities">
        Back to capability catalogue
      </Link>
      <PageHeader eyebrow="Administration · AD-01" title="Capability grants" />
      <Boundary />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = new URLSearchParams({ scope, state }).toString();
          if (!offset && next === applied) resource.reload();
          setOffset(0);
          setApplied(next);
        }}
      >
        <SelectField
          name="grant-scope"
          label="Grant scope"
          value={scope}
          onChange={setScope}
          empty="All scopes"
          options={["Workspace", "Company", "Site"].map((id) => ({
            id,
            display_name: id,
          }))}
        />
        <SelectField
          name="grant-state"
          label="Grant state"
          value={state}
          onChange={setState}
          empty="All states"
          options={["Current", "Scheduled", "Expired", "Inactive identity"].map(
            (id) => ({ id, display_name: id }),
          )}
        />
        <Button type="submit">Filter grants</Button>
      </form>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data && !resource.loading && !resource.error && (
        <>
          <h2 className="narrative">{resource.data.capability.key}</h2>
          <p>{resource.data.capability.label}</p>
          {resource.data.capability.hosted_only && (
            <p>
              Hosted demo only. Invitation, session and mailbox connection
              validity are not evaluated here.
            </p>
          )}
          <p className="read-meta">
            Showing {resource.data.items.length} grants
            {offset ? ` from result ${offset + 1}` : ""}. Checked{" "}
            <Stamp value={resource.data.checked_at} />.
          </p>
          {!resource.data.items.length && (
            <p className="empty-state">
              No recorded grants match this capability and these filters.
            </p>
          )}
          <div className="record-grid">
            {resource.data.items.map((grant) => (
              <article className="record-card" key={grant.id}>
                <h3>
                  <Link
                    href={`/admin/access/${grant.user_id}?${new URLSearchParams({ capability, company_id: grant.company_id ?? "", site_id: grant.site_id ?? "" })}`}
                  >
                    {grant.display_name}
                  </Link>
                </h3>
                <Status value={grant.state} />
                <dl className="record-summary">
                  <div>
                    <dt>Scope</dt>
                    <dd>{grant.scope_type}</dd>
                  </div>
                  {grant.company_name && (
                    <div>
                      <dt>Company</dt>
                      <dd>
                        {grant.erp_company_id} · {grant.company_name}
                      </dd>
                    </div>
                  )}
                  {grant.site_number && (
                    <div>
                      <dt>Site</dt>
                      <dd>
                        {grant.site_number} · {grant.site_name}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Valid from</dt>
                    <dd>
                      <Stamp value={grant.valid_from} />
                    </dd>
                  </div>
                  <div>
                    <dt>Valid to</dt>
                    <dd>
                      {grant.valid_to ? (
                        <Stamp value={grant.valid_to} />
                      ) : (
                        "No end date"
                      )}
                    </dd>
                  </div>
                </dl>
                {grant.masked && <p>Provider identity details are masked.</p>}
                <p>
                  Open person access to check this capability against a company
                  and site.
                </p>
              </article>
            ))}
          </div>
          <div className="related-links">
            <Button
              disabled={!offset}
              onClick={() => setOffset(Math.max(0, offset - 50))}
            >
              Previous page
            </Button>
            <Button
              disabled={!resource.data.has_more}
              onClick={() => setOffset(offset + 50)}
            >
              Next page
            </Button>
            <Button onClick={resource.reload}>Refresh grants</Button>
          </div>
        </>
      )}
    </>
  );
}
