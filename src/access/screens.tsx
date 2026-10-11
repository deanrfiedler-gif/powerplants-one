"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Field,
  type Failure,
  isDenied,
  PageHeader,
  ReadState,
  SelectField,
  Stamp,
  Status,
  useResource,
} from "../components/business-ui";
import { Button } from "../components/ui/button";
import { isCapability } from "./capabilities";

type ExplanationContext = {
  capability?: string;
  company_id?: string;
  site_id?: string;
};

type Person = {
  id: string;
  display_name: string;
  active: boolean;
  masked: boolean;
  grant_count: number;
};
type Grant = {
  id: string;
  capability: string;
  scope_type: string;
  company_name: string | null;
  erp_company_id: string | null;
  site_number: string | null;
  site_name: string | null;
  valid_from: string;
  valid_to: string | null;
  state: string;
};
type Detail = {
  person: Person;
  grants: Grant[];
  companies: { id: string; display_name: string; erp_company_id: string }[];
  sites: {
    id: string;
    company_id: string;
    display_number: string;
    display_name: string;
  }[];
};

function InspectionBoundary() {
  return (
    <p className="callout">
      Inspect current access and compare proposed role bundles. Local synthetic requests can be independently reviewed; applying changes, teams
      and review campaigns remain subsequent work. Grant inspection
      does not approve a business action.
    </p>
  );
}

export function AccessPeopleScreen() {
  const [query, setQuery] = useState(""),
    [state, setState] = useState(""),
    [applied, setApplied] = useState(""),
    [offset, setOffset] = useState(0);
  const resource = useResource<{ items: Person[]; has_more: boolean }>(
    `admin/access?${applied}&offset=${offset}`,
  );
  return (
    <>
      <PageHeader
        variant="register"
        eyebrow="Administration · AD-01"
        title="Users and access"
        description="Inspect identities and their exact permission grants in this workspace."
      />
      <InspectionBoundary />
      <p><Link href="/admin/access/requests">Access-change requests</Link></p>
      <p>
        <Link href="/admin/access/roles">Browse proposed role bundles</Link>
      </p>
      <p>
        <Link href="/admin/access/capabilities">
          Browse the capability catalogue
        </Link>
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setOffset(0);
          setApplied(new URLSearchParams({ q: query, state }).toString());
        }}
      >
        <Field
          name="access-search"
          label="Find a person"
          value={query}
          onChange={setQuery}
          maxLength={100}
        />
        <SelectField
          name="identity-status"
          label="Identity status"
          value={state}
          onChange={setState}
          empty="All identities"
          options={[
            { id: "active", display_name: "Active" },
            { id: "inactive", display_name: "Inactive" },
          ]}
        />
        <Button type="submit">Search identities</Button>
      </form>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data && !resource.loading && !resource.error && (
        <>
          <p className="read-meta">
            Showing {resource.data.items.length} identities
            {offset ? ` from result ${offset + 1}` : ""}. Grant counts include
            scheduled and expired grants.
          </p>
          {!resource.data.items.length && (
            <p className="empty-state">No identities match these filters.</p>
          )}
          <div className="record-grid">
            {resource.data.items.map((person) => (
              <article className="record-card" key={person.id}>
                <h2>
                  <Link href={`/admin/access/${person.id}`}>
                    {person.display_name}
                  </Link>
                </h2>
                <Status value={person.active ? "Active" : "Inactive"} />
                <p>{person.grant_count} recorded grants</p>
                {person.masked && <p>Provider identity details are masked.</p>}
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
            <Button onClick={resource.reload}>Refresh identities</Button>
          </div>
        </>
      )}
    </>
  );
}

export function AccessPersonScreen({
  id,
  initial = {},
}: {
  id: string;
  initial?: ExplanationContext;
}) {
  const resource = useResource<Detail>(`admin/access/${id}`);
  return (
    <>
      <Link href="/admin/access">Back to users and access</Link>
      <PageHeader eyebrow="Administration · AD-01" title="Person access" />
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data && !resource.loading && !resource.error && (
        <PersonDetail
          key={`${id}:${initial.capability}:${initial.company_id}:${initial.site_id}`}
          id={id}
          data={resource.data}
          refresh={resource.reload}
          initial={initial}
        />
      )}
    </>
  );
}

function PersonDetail({
  id,
  data,
  refresh,
  initial,
}: {
  id: string;
  data: Detail;
  refresh: () => void;
  initial: ExplanationContext;
}) {
  const initialCompany = data.companies.some(
    (item) => item.id === initial.company_id,
  )
    ? initial.company_id!
    : (data.companies[0]?.id ?? "");
  const [capability, setCapability] = useState<string>(
      initial.capability && isCapability(initial.capability)
        ? initial.capability
        : "shared.read",
    ),
    [company, setCompany] = useState(initialCompany),
    [site, setSite] = useState(
      data.sites.some(
        (item) =>
          item.id === initial.site_id && item.company_id === initialCompany,
      )
        ? initial.site_id!
        : "",
    );
  const [request, setRequest] = useState<string | null>(null);
  const explanation = useResource<{
    allowed: boolean;
    capability: string;
    reason: string;
    checked_at: string;
    limitation: string;
    authentication: string;
  }>(request);
  if (
    isDenied(explanation.error) ||
    (explanation.error as Failure | null)?.code === "WorkingCompanySelected"
  )
    return (
      <ReadState loading={false} error={explanation.error} retry={refresh} />
    );
  return (
    <>
      <h2>{data.person.display_name}</h2>
      <p>
        <Link href={`/admin/access/${id}/roles`}>
          Compare proposed role bundle
        </Link>
      </p>
      <Status value={data.person.active ? "Active" : "Inactive"} />
      <InspectionBoundary />
      <p><Link href="/admin/access/requests">Access-change requests</Link></p>
      <p>
        <Link href="/admin/access/capabilities">
          Browse the capability catalogue
        </Link>
      </p>
      {data.person.masked && (
        <p>
          Provider subject, tenant, sign-in details and personal name are
          masked. Hosted invitation/session validity is a separate check.
        </p>
      )}
      <Button onClick={refresh}>Refresh person access</Button>
      <section aria-labelledby="explain-heading">
        <h2 id="explain-heading">Explain grant eligibility</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const next = `admin/access/${id}/explanation?${new URLSearchParams({ capability, company_id: company, site_id: site })}`;
            explanation.reload();
            setRequest(next);
          }}
        >
          <Field
            name="capability"
            label="Capability key"
            value={capability}
            onChange={(value) => {
              setCapability(value);
              setRequest(null);
            }}
            required
            maxLength={101}
          />
          <SelectField
            name="access-company"
            label="Company"
            value={company}
            onChange={(value) => {
              setCompany(value);
              setSite("");
              setRequest(null);
            }}
            required
            options={data.companies.map((item) => ({
              id: item.id,
              display_name: `${item.erp_company_id} · ${item.display_name}`,
            }))}
          />
          <SelectField
            name="access-site"
            label="Site"
            value={site}
            onChange={(value) => {
              setSite(value);
              setRequest(null);
            }}
            empty="Company-level check"
            options={data.sites
              .filter((item) => item.company_id === company)
              .map((item) => ({
                id: item.id,
                display_name: `${item.display_number} · ${item.display_name}`,
              }))}
          />
          <Button type="submit" disabled={!company || !capability}>
            Check grant eligibility
          </Button>
        </form>
        {request && (
          <>
            <ReadState
              loading={explanation.loading}
              error={explanation.error}
              retry={explanation.reload}
            />
            {explanation.data && !explanation.loading && !explanation.error && (
              <div role="status" className="record-card">
                <h3>
                  {explanation.data.allowed
                    ? "Grant permits this scope"
                    : "Grant does not permit this scope"}
                </h3>
                <p>{explanation.data.reason}</p>
                <p>{explanation.data.limitation}</p>
                <p>{explanation.data.authentication}</p>
                <p>
                  Checked <Stamp value={explanation.data.checked_at} />
                </p>
              </div>
            )}
          </>
        )}
      </section>
      <section aria-labelledby="grants-heading">
        <h2 id="grants-heading">Recorded grants ({data.grants.length})</h2>
        {!data.grants.length && (
          <p className="empty-state">
            This identity has no recorded permission grants.
          </p>
        )}
        <div className="record-grid">
          {data.grants.map((grant) => (
            <article className="record-card" key={grant.id}>
              <h3 className="narrative">{grant.capability}</h3>
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
                      {grant.company_name} · {grant.erp_company_id}
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
                      "No end recorded"
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
