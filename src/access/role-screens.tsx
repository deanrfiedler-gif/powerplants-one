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

import { SavedLocalTeams } from "./local-team-screens";
import type { InspectedTeamPerson, TeamInspection } from "./teams";

type Roles = {
  items: RoleProposal[];
  teams: TeamInspection[];
  team_example_date: string;
};
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
      does not assign a role or approve a business action. Team proposals confer
      no access or review duty.
    </p>
  );
}

export function AccessRolesScreen() {
  const resource = useResource<Roles>("admin/access/roles");
  const [teamFailure, setTeamFailure] = useState<unknown>(null);
  const refresh = () => {
    setTeamFailure(null);
    resource.reload();
  };
  const error = teamFailure || resource.error;
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
      <ReadState loading={resource.loading} error={error} retry={refresh} />
      {resource.data && !resource.loading && !error && (
        <>
          <p>
            <a href="#proposed-teams">Inspect proposed teams</a>
          </p>
          <div
            className="record-grid"
            role="region"
            aria-label="Role proposals"
          >
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
          <section id="proposed-teams" aria-labelledby="proposed-teams-heading">
            <h2 id="proposed-teams-heading">Proposed teams</h2>
            <p className="callout">
              Retained example as at {resource.data.team_example_date}. These
              rosters are design proposals, not saved memberships. Source dates
              do not describe current team membership. Teams do not grant access
              or route reviews in this application.
            </p>
            <div className="record-grid">
              {resource.data.teams.map((team) => (
                <article
                  className="record-card"
                  key={team.id}
                  aria-label={`${team.name} proposal`}
                >
                  <h3>{team.name}</h3>
                  <p>{team.purpose}</p>
                  <p className="narrative">Source team: {team.id}</p>
                  <h4>Proposed lead</h4>
                  <TeamPerson person={team.lead} />
                  <details>
                    <summary className="ppo-button ppo-button--quiet">
                      Example roster for {team.name}
                    </summary>
                    <ul>
                      {team.members.map((member) => (
                        <li key={member.id} className="narrative">
                          <TeamPerson person={member} />
                          <p>
                            Source dates: {member.from} to{" "}
                            {member.to ?? "no end recorded"}.
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              ))}
            </div>
          </section>
          <SavedLocalTeams onDenied={setTeamFailure} />
          <Button onClick={refresh}>Refresh proposals</Button>
        </>
      )}
    </>
  );
}

function TeamPerson({ person }: { person: InspectedTeamPerson }) {
  return (
    <div>
      <p>Source example: {person.name}</p>
      {person.designOnly ? (
        <p>Design-only identity — no application person link.</p>
      ) : person.current ? (
        <p>
          Current local identity:{" "}
          <Link href={`/admin/access/${person.current.id}`}>
            {person.current.display_name}
          </Link>
          {" · "}
          {person.current.active ? "Active identity" : "Inactive identity"}
        </p>
      ) : (
        <p>
          Local identity unavailable in this workspace — no application person
          link.
        </p>
      )}
    </div>
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
          // Re-selecting an earlier combination must not briefly reuse its
          // cached result while the fresh permission read is pending.
          result.reload();
          setRequest(next);
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
