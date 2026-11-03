"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "../../components/business-ui";
import { useCrmResource } from "../../components/crm-state";
import { WorklistPanel } from "../../components/crm-worklist-tools";
import { Button, ButtonLink } from "../../components/ui/button";
import { RegisterTable } from "../../components/ui/register-table";
import {
  TemplateFrame,
  ReadFeedback,
  Paging,
  Note,
  Chip,
  Facts,
  Empty,
  useTemplatePages,
  Time,
} from "./common";
import { AssignDialog } from "./decisions";
import {
  definitionHref,
  short,
  type Scope,
  type UsePolicy,
  type Assignment,
} from "./types";

export function SiteUse() {
  const params = useSearchParams();
  return (
    <Use
      company={params.get("company") ?? ""}
      site={params.get("site") ?? ""}
    />
  );
}
function Use({ company, site }: { company: string; site: string }) {
  const router = useRouter();
  const scopes = useTemplatePages<Scope>(
    "document-template-drafts/scopes?family=OUT-09&limit=50",
  );
  const read = useTemplatePages<Assignment>(
    company && site
      ? `document-template-use-policies?company_id=${encodeURIComponent(company)}&site_id=${encodeURIComponent(site)}&limit=25`
      : null,
    "after",
  );
  const policy = read.data as UsePolicy | null;
  const [filterOpen, setFilterOpen] = useState(false);
  const [inspect, setInspect] = useState<string | null>(null),
    [assign, setAssign] = useState<{
      policy: UsePolicy;
      predecessor?: Assignment;
    } | null>(null);
  const queryKey = company + ":" + site;
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setInspect(null);
    setAssign(null);
  }
  const choices = scopes.data?.items ?? [],
    companies = [
      ...new Map(choices.map((s) => [s.company_id, s.company_name])).entries(),
    ];
  if (policy && !companies.some(([id]) => id === company))
    companies.push([company, policy.company_name]);
  const sites = choices
    .filter((s) => s.company_id === company)
    .map((s) => ({ id: s.site_id, display_name: s.site_name ?? s.site_id }));
  if (policy && !sites.some((s) => s.id === site))
    sites.push({ id: site, display_name: policy.site_name ?? site });
  const navigate = (c: string, s: string) =>
    router.replace(
      `/documents/templates/use?${new URLSearchParams({ company: c, ...(s ? { site: s } : {}) })}`,
    );
  const canAssign = !!policy?.can_assign && !read.error && !read.loading;
  return (
    <TemplateFrame
      view="use"
      family="OUT-09"
      manage
      onRefresh={() => {
        read.reload();
        scopes.reload();
      }}
      phoneHeader={{
        filter: {
          open: () => setFilterOpen(true),
          applied: !!company || !!site,
        },
      }}
    >
      {filterOpen && (
        <WorklistPanel
          title="Site use filters"
          onClose={() => setFilterOpen(false)}
        >
          <div className="tm-phone-filter">
            <SelectField
              name="phone-use-company"
              label="Company"
              required
              value={company}
              options={companies.map(([id, name]) => ({
                id,
                display_name: name ?? id,
              }))}
              onChange={(c) => navigate(c, "")}
            />
            <SelectField
              name="phone-use-site"
              label="Site"
              required
              value={site}
              options={sites}
              onChange={(s) => navigate(company, s)}
              disabled={!company}
            />
            <ReadFeedback {...scopes} />
            {scopes.hasMore && <Paging read={scopes} scope="permitted sites" />}
            <Button onClick={() => navigate("", "")}>Reset</Button>
            <Button variant="primary" onClick={() => setFilterOpen(false)}>
              Show records
            </Button>
            <Button
              onClick={() => {
                read.reload();
                scopes.reload();
              }}
            >
              Refresh current records
            </Button>
          </div>
        </WorklistPanel>
      )}
      <div className="tm-use">
        <header className="tm-use-header">
          <div>
            <h1>Site use</h1>
            <p>Job packs · OUT-09</p>
          </div>
          <div className="tm-actions">
            <Button
              onClick={() => {
                read.reload();
                scopes.reload();
              }}
              disabled={!site}
            >
              Refresh
            </Button>
            {canAssign && (
              <Button
                variant="primary"
                onClick={() => setAssign({ policy: policy! })}
              >
                Assign use
              </Button>
            )}
          </div>
        </header>
        <div className="tm-scope">
          <SelectField
            name="use-company"
            label="Company"
            required
            value={company}
            options={companies.map(([id, name]) => ({
              id,
              display_name: name ?? id,
            }))}
            onChange={(c) => navigate(c, "")}
          />
          <SelectField
            name="use-site"
            label="Site"
            required
            value={site}
            options={sites}
            onChange={(s) => navigate(company, s)}
            disabled={!company}
          />
          <p>One company and site · Job packs only</p>
        </div>
        <ReadFeedback {...scopes} />
        {scopes.hasMore && <Paging read={scopes} scope="permitted sites" />}
        {!company || !site ? (
          <Empty>
            Choose a company and site to read the current selection and retained
            assignments.
          </Empty>
        ) : (
          <>
            <ReadFeedback {...read} />
            {policy && (
              <>
                <section className="tm-use-selection">
                  <header>
                    <h2>Selected now</h2>
                    <span>
                      As of <Time value={policy.as_of} />
                    </span>
                  </header>
                  {policy.selection ? (
                    <>
                      <div className="tm-selection-title">
                        <Link
                          href={definitionHref(
                            "OUT-09",
                            policy.selection.template_id,
                          )}
                        >
                          Job pack · version {policy.selection.template_version}
                        </Link>
                        <Chip value="Selected now" />
                      </div>
                      <Facts
                        items={[
                          [
                            "Selection",
                            policy.selection.assignment_id ? (
                              <Button
                                onClick={() =>
                                  setInspect(policy.selection!.assignment_id!)
                                }
                              >
                                Assigned interval ·{" "}
                                {short(policy.selection.assignment_id)}
                              </Button>
                            ) : policy.version === 0 ? (
                              "Workspace default · not adopted"
                            ) : (
                              "Pinned baseline"
                            ),
                          ],
                          ["Site policy version", policy.version],
                          [
                            "Selection policy version",
                            policy.selection.policy_version,
                          ],
                        ]}
                      />
                    </>
                  ) : (
                    <Note warning>
                      Preparation held ·{" "}
                      {policy.hold ?? "Selection unavailable"}. No fallback is
                      implied after an assignment interval has begun.
                    </Note>
                  )}
                </section>
                <section className="tm-baseline">
                  <h2>
                    {policy.version === 0
                      ? "Workspace default before adoption"
                      : "Pinned baseline"}
                  </h2>
                  <Facts
                    items={[
                      [
                        "Definition",
                        <Link
                          key="base"
                          href={definitionHref(
                            "OUT-09",
                            policy.baseline_template_id,
                          )}
                        >
                          {policy.baseline_template_id}
                        </Link>,
                      ],
                      ["Policy version", policy.baseline_policy_version],
                      [
                        "Fingerprint",
                        <code key="hash">{policy.baseline_hash}</code>,
                      ],
                    ]}
                  />
                  <Note>
                    {policy.version === 0
                      ? "No site-use policy has been adopted. The first assignment pins the current workspace default as its baseline."
                      : "The baseline applies before the first assignment starts. Later gaps hold preparation. Existing pack revisions and issued files keep their original selection."}
                  </Note>
                </section>
                <section className="tm-assignments">
                  <h2>Assignments</h2>
                  <p className="tm-section-note">
                    Start inclusive · resolved end exclusive · identity order
                  </p>
                  {!policy.items.length ? (
                    <Empty>
                      No permitted assignments. The pinned baseline remains
                      separately visible above.
                    </Empty>
                  ) : (
                    <>
                      <div className="tm-desktop">
                        <RegisterTable caption="Retained site-use assignments. Open an interval for its exact publication, predecessor and successor.">
                          <thead>
                            <tr>
                              <th>Assignment</th>
                              <th>Definition</th>
                              <th>Starts</th>
                              <th>Resolved end</th>
                              <th>Site policy</th>
                              <th>Successor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {policy.items.map((a) => (
                              <tr key={a.id}>
                                <td>
                                  <Button onClick={() => setInspect(a.id)}>
                                    {short(a.id)}
                                  </Button>
                                </td>
                                <td>
                                  <Link
                                    href={definitionHref(
                                      "OUT-09",
                                      a.template_id,
                                    )}
                                  >
                                    Version {a.template_version ?? "retained"}
                                  </Link>
                                </td>
                                <td>
                                  <Time value={a.effective_from} />
                                </td>
                                <td>
                                  {a.resolved_effective_to ? (
                                    <Time value={a.resolved_effective_to} />
                                  ) : (
                                    "Open-ended"
                                  )}
                                </td>
                                <td>{a.policy_version}</td>
                                <td>
                                  {a.successor_id ? (
                                    <Button
                                      onClick={() => setInspect(a.successor_id)}
                                    >
                                      {short(a.successor_id)}
                                    </Button>
                                  ) : (
                                    "None"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </RegisterTable>
                      </div>
                      <div className="tm-phone-list">
                        {policy.items.map((a) => (
                          <button
                            className="tm-phone-row"
                            key={a.id}
                            onClick={() => setInspect(a.id)}
                          >
                            <strong>
                              Job pack version{" "}
                              {a.template_version ?? "retained"}
                            </strong>
                            <span>
                              {short(a.id)} · policy {a.policy_version}
                            </span>
                            <span>
                              From <Time value={a.effective_from} />
                            </span>
                            <span>
                              {a.resolved_effective_to ? (
                                <>
                                  Until <Time value={a.resolved_effective_to} />
                                </>
                              ) : (
                                "Open-ended"
                              )}
                            </span>
                            <span>
                              {a.successor_id
                                ? "Successor recorded"
                                : "No successor"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <Paging
                    read={read}
                    scope="permitted assignments at this site"
                  />
                </section>
                <Note>
                  Publication is a separate decision. An assignment must name
                  the exact currently supported publication at this company and
                  site. Successors preserve the earlier assignment; there is no
                  edit, cancel or withdraw action.
                </Note>
                {canAssign && (
                  <div className="tm-phone-primary">
                    <Button
                      variant="primary"
                      onClick={() => setAssign({ policy })}
                    >
                      Assign use
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {inspect && policy && (
        <AssignmentDetail
          key={inspect}
          id={inspect}
          policy={policy}
          onClose={() => setInspect(null)}
          onInspect={setInspect}
          onSuccessor={(a) => {
            setInspect(null);
            if (policy) setAssign({ policy, predecessor: a });
          }}
        />
      )}
      {assign && (
        <AssignDialog
          available={!!policy}
          policy={assign.policy}
          predecessor={assign.predecessor}
          onClose={() => setAssign(null)}
          onSaved={() => {
            setAssign(null);
            read.reload();
          }}
        />
      )}
    </TemplateFrame>
  );
}
function AssignmentDetail({
  id,
  policy,
  onClose,
  onInspect,
  onSuccessor,
}: {
  id: string;
  policy: UsePolicy | null;
  onClose: () => void;
  onInspect: (id: string) => void;
  onSuccessor: (a: Assignment) => void;
}) {
  const read = useCrmResource<{ assignment: Assignment; as_of: string }>(
      `document-template-use-assignments/${id}`,
      true,
    ),
    a = read.data?.assignment;
  const inScope =
    a && a.company_id === policy?.company_id && a.site_id === policy.site_id;
  return (
    <WorklistPanel title="Assignment details" drawer onClose={onClose}>
      <div className="tm-assignment-detail">
        <ReadFeedback {...read} />
        {a && (
          <>
            <h2>Job pack version {a.template_version}</h2>
            <Facts
              items={[
                ["Assignment ID", <code key="id">{a.id}</code>],
                ["Site policy version", a.policy_version],
                [
                  "Definition",
                  <Link
                    key="definition"
                    href={definitionHref("OUT-09", a.template_id)}
                  >
                    Version {a.template_version} · {short(a.template_id)}
                  </Link>,
                ],
                [
                  "Publication",
                  <ButtonLink
                    key="publication"
                    href={`${definitionHref("OUT-09", a.template_id)}?tab=publication`}
                  >
                    {short(a.publication_id)}
                  </ButtonLink>,
                ],
                [
                  "Definition fingerprint",
                  <code key="hash">{a.definition_hash}</code>,
                ],
                [
                  "Starts (inclusive)",
                  <Time key="from" value={a.effective_from} />,
                ],
                [
                  "Stored end",
                  a.effective_to ? (
                    <Time key="to" value={a.effective_to} />
                  ) : (
                    "Open-ended · unchanged"
                  ),
                ],
                [
                  "Resolved end (exclusive)",
                  a.resolved_effective_to ? (
                    <Time key="resolved" value={a.resolved_effective_to} />
                  ) : (
                    "Open-ended"
                  ),
                ],
                [
                  "Predecessor",
                  a.predecessor_id ? (
                    <Button
                      key="prev"
                      onClick={() => onInspect(a.predecessor_id!)}
                    >
                      {short(a.predecessor_id)}
                    </Button>
                  ) : (
                    "None"
                  ),
                ],
                [
                  "Successor",
                  a.successor_id ? (
                    <Button
                      key="next"
                      onClick={() => onInspect(a.successor_id!)}
                    >
                      {short(a.successor_id)}
                    </Button>
                  ) : (
                    "None"
                  ),
                ],
                ["Assigned by", a.actor_name ?? a.actor_id],
                ["Recorded", <Time key="recorded" value={a.recorded_at} />],
                ["Service approval note", a.approval_note],
                ["Reason", a.reason],
              ]}
            />
            <Note>
              A successor supplies the derived end of an open-ended predecessor.
              It does not rewrite the predecessor’s stored interval or any
              previously prepared or issued pack.
            </Note>
            {inScope &&
              policy.can_assign &&
              !a.effective_to &&
              !a.successor_id && (
                <Button variant="primary" onClick={() => onSuccessor(a)}>
                  Assign successor
                </Button>
              )}
          </>
        )}
      </div>
    </WorklistPanel>
  );
}
