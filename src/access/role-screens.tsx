"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  type Failure,
  isDenied,
  PageHeader,
  ReadState,
  SelectField,
  Stamp,
  Status,
  useResource,
} from "../components/business-ui";
import { capabilityLabels } from "./capabilities";
import type { RoleProposal } from "./roles";

type Roles = { items: RoleProposal[] };
type Person = {
  id: string;
  display_name: string;
  active: boolean;
  masked: boolean;
};
type Company = { id: string; display_name: string; erp_company_id: string };
type Site = {
  id: string;
  company_id: string;
  display_number: string;
  display_name: string;
};
type Context = { person: Person; companies: Company[]; sites: Site[] };
type Comparison = {
  person: Person;
  bundle_name: string;
  revision: string;
  state: string;
  company: Company;
  site: Site | null;
  items: { capability: string; label: string; allowed: boolean }[];
  matched: number;
  reason: string;
  limitation: string;
  authentication: string;
  checked_at: string;
};

function ProposalBoundary() {
  return (
    <p className="callout">
      Proposed bundles — not adopted policy (D-020). A matching set of grants
      does not assign a role or approve a business action. Teams and access
      changes are not available here.
    </p>
  );
}

export function AccessRolesScreen() {
  const resource = useResource<Roles>("admin/access/roles");
  return (
    <>
      <Link href="/admin/access">Back to users and access</Link>
      <PageHeader
        variant="register"
        eyebrow="Administration · AD-01"
        title="Proposed role bundles"
        description="Inspect the retained role proposals before comparing a person's current grants at a selected scope."
      />
      <ProposalBoundary />
      <p>
        Open a person from Users and access, then choose Compare proposed role
        bundle. Hosted tester provisioning remains with the operator; its fixed
        tester set is outside this catalogue.
      </p>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data && !resource.loading && !resource.error && (
        <>
          <div className="record-grid">
            {resource.data.items.map((bundle) => (
              <article className="record-card" key={bundle.id}>
                <h2>{bundle.name}</h2>
                <p>{bundle.family} · Comparison proposal only</p>
                {bundle.revisions.map((revision, index) => {
                  const previous = bundle.revisions[index - 1];
                  const added = previous
                    ? revision.caps.filter(
                        (key) => !previous.caps.includes(key),
                      )
                    : [];
                  const removed = previous
                    ? previous.caps.filter(
                        (key) => !revision.caps.includes(key),
                      )
                    : [];
                  return (
                    <section
                      key={revision.revision}
                      aria-label={`${bundle.name} ${revision.revision}`}
                    >
                      <h3>
                        {revision.revision} · <Status value={revision.state} />
                      </h3>
                      <p>
                        {revision.caps.length} capabilities. Proposed grant
                        scopes: {revision.scopes.join(", ")}.
                      </p>
                      {previous && (
                        <p className="narrative">
                          Changes from {previous.revision}: added{" "}
                          {added.join(", ") || "none"}; removed{" "}
                          {removed.join(", ") || "none"}. This draft has not
                          replaced the proposal.
                        </p>
                      )}
                      <details>
                        <summary className="ppo-button ppo-button--quiet">
                          Capabilities in {revision.revision}
                        </summary>
                        <ul>
                          {revision.caps.map((key) => (
                            <li className="narrative" key={key}>
                              <Link href={`/admin/access/capabilities/${key}`}>
                                {key}
                              </Link>{" "}
                              — {capabilityLabels[key]}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </section>
                  );
                })}
              </article>
            ))}
          </div>
          <Button onClick={resource.reload}>Refresh proposed bundles</Button>
        </>
      )}
    </>
  );
}

export function AccessRoleComparisonScreen({ id }: { id: string }) {
  const person = useResource<Context>(`admin/access/${id}`);
  const roles = useResource<Roles>("admin/access/roles");
  const refresh = () => {
    person.reload();
    roles.reload();
  };
  return (
    <>
      <Link href={`/admin/access/${id}`}>Back to person access</Link>
      <PageHeader
        eyebrow="Administration · AD-01"
        title="Compare proposed role bundle"
        description="Check a named proposal against current grants for one company or site."
      />
      <ReadState
        loading={person.loading || roles.loading}
        error={person.error || roles.error}
        retry={refresh}
      />
      {person.data &&
        roles.data &&
        !person.loading &&
        !roles.loading &&
        !person.error &&
        !roles.error && (
          <RoleComparison
            key={id}
            id={id}
            context={person.data}
            bundles={roles.data.items}
            refresh={refresh}
          />
        )}
    </>
  );
}

function RoleComparison({
  id,
  context,
  bundles,
  refresh,
}: {
  id: string;
  context: Context;
  bundles: RoleProposal[];
  refresh: () => void;
}) {
  const [bundleId, setBundleId] = useState(bundles[0]?.id ?? "");
  const bundle = bundles.find((item) => item.id === bundleId);
  const [revision, setRevision] = useState(
    bundle?.revisions[0]?.revision ?? "",
  );
  const [company, setCompany] = useState(context.companies[0]?.id ?? "");
  const [site, setSite] = useState("");
  const [request, setRequest] = useState<string | null>(null);
  const result = useResource<Comparison>(request);
  if (
    isDenied(result.error) ||
    (result.error as Failure | null)?.code === "WorkingCompanySelected"
  )
    return <ReadState loading={false} error={result.error} retry={refresh} />;
  const subject =
    request && result.data && !result.loading && !result.error
      ? result.data.person
      : context.person;
  return (
    <>
      <h2>{subject.display_name}</h2>
      <Status value={subject.active ? "Active" : "Inactive"} />
      <ProposalBoundary />
      <p>
        <Link href="/admin/access/roles">Browse proposed role bundles</Link>
      </p>
      {subject.masked && (
        <p>
          Provider identity details are masked. Hosted invitation and session
          validity are separate checks.
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = `admin/access/${id}/roles?${new URLSearchParams({ bundle_id: bundleId, revision, company_id: company, site_id: site })}`;
          if (next === request) result.reload();
          else setRequest(next);
        }}
      >
        <SelectField
          name="role-proposal"
          label="Proposed bundle"
          value={bundleId}
          required
          options={bundles.map((item) => ({
            id: item.id,
            display_name: item.name,
          }))}
          onChange={(value) => {
            setBundleId(value);
            setRevision(
              bundles.find((item) => item.id === value)?.revisions[0]
                ?.revision ?? "",
            );
            setRequest(null);
          }}
        />
        <SelectField
          name="role-revision"
          label="Source revision"
          value={revision}
          required
          options={(bundle?.revisions ?? []).map((item) => ({
            id: item.revision,
            display_name: `${item.revision} · ${item.state}`,
          }))}
          onChange={(value) => {
            setRevision(value);
            setRequest(null);
          }}
        />
        <SelectField
          name="role-company"
          label="Company"
          value={company}
          required
          options={context.companies.map((item) => ({
            id: item.id,
            display_name: `${item.erp_company_id} · ${item.display_name}`,
          }))}
          onChange={(value) => {
            setCompany(value);
            setSite("");
            setRequest(null);
          }}
        />
        <SelectField
          name="role-site"
          label="Site"
          value={site}
          empty="Company-level check"
          options={context.sites
            .filter((item) => item.company_id === company)
            .map((item) => ({
              id: item.id,
              display_name: `${item.display_number} · ${item.display_name}`,
            }))}
          onChange={(value) => {
            setSite(value);
            setRequest(null);
          }}
        />
        <Button type="submit" disabled={!bundleId || !revision || !company}>
          Compare current grants
        </Button>
      </form>
      <p>
        Checks include Workspace grants and the person's saved working company.
        Capabilities outside the selected proposal are not assessed. A
        company-level check does not count a grant limited to a site.
      </p>
      {request && (
        <>
          <ReadState
            loading={result.loading}
            error={result.error}
            retry={result.reload}
          />
          {result.data && !result.loading && !result.error && (
            <section aria-labelledby="comparison-result">
              <h2 id="comparison-result">
                {result.data.matched} of {result.data.items.length} capabilities
                permit this scope
              </h2>
              <p>
                {result.data.bundle_name} · {result.data.revision} ·{" "}
                {result.data.state}
              </p>
              <p>
                {result.data.company.erp_company_id} ·{" "}
                {result.data.company.display_name}
                {result.data.site
                  ? ` · ${result.data.site.display_number} · ${result.data.site.display_name}`
                  : " · Company-level check"}
              </p>
              <p>{result.data.reason}</p>
              <p>{result.data.limitation}</p>
              <p>{result.data.authentication}</p>
              <p>
                Checked <Stamp value={result.data.checked_at} />. Changing any
                selection clears this result.
              </p>
              <div className="record-grid">
                {result.data.items.map((item) => (
                  <article className="record-card" key={item.capability}>
                    <h3 className="narrative">{item.capability}</h3>
                    <p>{item.label}</p>
                    <Status
                      value={
                        item.allowed
                          ? "Grant permits this scope"
                          : "Grant does not permit this scope"
                      }
                    />
                    <p>
                      <Link
                        href={`/admin/access/${id}?${new URLSearchParams({ capability: item.capability, company_id: result.data!.company.id, site_id: result.data!.site?.id ?? "" })}`}
                      >
                        Explain {item.capability}
                      </Link>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
