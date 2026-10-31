"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "../../components/ui/button";
import { RegisterTable } from "../../components/ui/register-table";
import {
  WorklistChoice,
  WorklistPanel,
} from "../../components/crm-worklist-tools";
import {
  TemplateFrame,
  ReadFeedback,
  Paging,
  Note,
  Chip,
  Facts,
  Empty,
  useTemplatePages,
} from "./common";
import { ProposalForm } from "./proposal-form";
import {
  definitionHref,
  proposalHref,
  familyNames,
  families,
  familyOf,
  short,
  type Template,
  type Scope,
  type ProposalSummary,
} from "./types";
export function TemplatesRegister() {
  const params = useSearchParams();
  return <Register query={new URLSearchParams(params.toString())} />;
}
function Register({ query }: { query: URLSearchParams }) {
  const router = useRouter(),
    family = familyOf(query.get("family")),
    view = query.get("view") === "proposals" ? "proposals" : "definitions";
  const definitions = useTemplatePages<Template>(
    family && view === "definitions"
      ? `document-templates?family=${family}&limit=25`
      : null,
  );
  const proposals = useTemplatePages<ProposalSummary>(
    family && view === "proposals"
      ? `document-template-drafts?family=${family}&limit=25`
      : null,
  );
  const scopes = useTemplatePages<Scope>(
    `document-template-drafts/scopes?family=${family ?? "OUT-09"}`,
  );
  const [selectedSnapshot, setSnapshot] = useState<Template | null>(null),
    [create, setCreate] = useState(false),
    [filterOpen, setFilterOpen] = useState(false);
  const snapshot =
    definitions.data?.items.find((item) => item.id === selectedSnapshot?.id) ??
    null;
  const snapshotPanel = useRef<HTMLElement>(null);
  const snapshotId = snapshot?.id;
  useEffect(() => {
    if (!snapshotId) return;
    const trigger = document.activeElement as HTMLElement | null;
    snapshotPanel.current?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, [snapshotId]);
  const queryKey = query.toString();
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setSnapshot(null);
    setCreate(false);
  }
  const read = view === "definitions" ? definitions : proposals;
  const canCreate =
    !!scopes.data?.items.some((x) => x.can_propose) || scopes.hasMore;
  const choose = (value: string) => {
    const next = new URLSearchParams(query);
    next.set("family", value);
    next.set("view", view);
    router.replace(`/documents/templates?${next}`);
  };
  return (
    <TemplateFrame
      view={view}
      family={family}
      manage={!!scopes.data}
      onRefresh={() => {
        read.reload();
        scopes.reload();
      }}
      phoneHeader={{
        filter: { open: () => setFilterOpen(true), applied: !!family },
        ...(view === "proposals" &&
        canCreate &&
        family &&
        !read.error &&
        !read.loading
          ? {
              pageAction: {
                label: "New proposal",
                icon: "plus" as const,
                onSelect: () => setCreate(true),
              },
            }
          : {}),
      }}
    >
      {filterOpen && (
        <WorklistPanel
          title="Template filters"
          onClose={() => setFilterOpen(false)}
        >
          <div className="tm-phone-filter">
            <WorklistChoice
              label="Family"
              prefix="Family: "
              value={family ?? ""}
              options={families.map((id) => ({
                id,
                label: `${familyNames[id]} (${id})`,
              }))}
              onChange={choose}
            />
            <p>
              A family is required. Results include only records you can read.
            </p>
            <Button
              onClick={() => {
                const next = new URLSearchParams(query);
                next.delete("family");
                router.replace(`/documents/templates?${next}`);
              }}
            >
              Reset
            </Button>
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
      <div className="tm-register">
        <div className="tm-toolbar">
          <WorklistChoice
            label="Family"
            prefix="Family: "
            value={family ?? ""}
            options={families.map((id) => ({
              id,
              label: `${familyNames[id]} (${id})`,
            }))}
            onChange={choose}
          />
          <span className="tm-muted">
            {view === "definitions"
              ? "Family is required · separate reads"
              : "Review scope, not where a template is used"}
          </span>
          <Button
            onClick={() => {
              setSnapshot(null);
              read.reload();
              scopes.reload();
            }}
            disabled={!family}
          >
            Refresh
          </Button>
          {view === "proposals" && canCreate && (
            <Button
              variant="primary"
              disabled={!family || !!read.error || read.loading}
              onClick={() => setCreate(true)}
            >
              New proposal
            </Button>
          )}
        </div>
        {!family ? (
          <Empty>
            Choose a family to read Definitions or Proposals. There is no
            combined family catalogue.
          </Empty>
        ) : (
          <>
            <ReadFeedback {...read} />
            {read.data && !read.data.items.length && (
              <Empty>
                Nothing in this view for this family and your current
                permissions.
              </Empty>
            )}
            {view === "definitions" && definitions.data && (
              <>
                <div className="tm-desktop">
                  <RegisterTable caption="Retained template definitions in identity order. Inspect a row for its snapshot.">
                    <thead>
                      <tr>
                        {[
                          "Inspect",
                          "Definition",
                          "Template ID",
                          "Runtime support",
                          "Integrity",
                          "Workspace default",
                          "Eligible as default",
                          "Dependencies",
                          "Renderer",
                          "Publication",
                        ].map((h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {definitions.data.items.map((t) => (
                        <tr
                          key={t.id}
                          data-inspected={snapshot?.id === t.id || undefined}
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Inspect version ${t.version}`}
                              checked={snapshot?.id === t.id}
                              onChange={() =>
                                setSnapshot(snapshot?.id === t.id ? null : t)
                              }
                            />
                          </td>
                          <td>
                            <Link
                              href={definitionHref(t.family, t.id)}
                              title={t.name}
                            >
                              {t.name}
                            </Link>
                          </td>
                          <td title={t.id}>{short(t.id)}</td>
                          <td>
                            <Chip value={t.runtime_support} />
                          </td>
                          <td>
                            {t.definition_integrity
                              ? "Intact"
                              : "Integrity mismatch"}
                          </td>
                          <td>
                            {t.selected_by_policy ? "Selected" : "Not selected"}{" "}
                            · policy {t.policy_version ?? "unknown"}
                          </td>
                          <td>{t.definition_eligible ? "Yes" : "No"}</td>
                          <td>
                            {t.dependencies.state}
                            {t.dependencies.state === "Recorded"
                              ? ` · ${t.dependencies.items.length} files`
                              : ""}
                          </td>
                          <td>{t.renderer_version ?? "Not recorded"}</td>
                          <td>
                            {t.publication_id ? (
                              <Link
                                href={`${definitionHref(t.family, t.id)}?tab=publication`}
                              >
                                {short(t.publication_id)}
                              </Link>
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
                  {definitions.data.items.map((t) => (
                    <Link
                      className="tm-phone-row"
                      key={t.id}
                      href={definitionHref(t.family, t.id)}
                    >
                      <strong>
                        {t.name} · version {t.version}
                      </strong>
                      <span>
                        {short(t.id)} ·{" "}
                        {t.publication_id ? "managed" : "no publication"}
                      </span>
                      <Chip value={t.runtime_support} />
                      <span>
                        {t.selected_by_policy
                          ? "Workspace default"
                          : "Not the workspace default"}{" "}
                        · {t.definition_eligible ? "eligible · " : ""}
                        {t.dependencies.state === "Recorded"
                          ? `${t.dependencies.items.length} dependencies`
                          : "dependencies not recorded"}
                      </span>
                      <small>
                        {t.definition_integrity
                          ? "Intact"
                          : "Integrity mismatch"}
                      </small>
                    </Link>
                  ))}
                </div>
                <Paging
                  read={definitions}
                  scope="this family’s permitted definitions"
                />
              </>
            )}
            {view === "proposals" && proposals.data && (
              <>
                <div className="tm-desktop">
                  <RegisterTable caption="Permitted proposals in identity order. Open the exact current record.">
                    <thead>
                      <tr>
                        {[
                          "Proposal",
                          "State",
                          "Audience",
                          "Site",
                          "Company",
                          "Command version",
                          "Current revision",
                          "Fingerprint",
                          "Proposal ID",
                          "Publication",
                        ].map((h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.data.items.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <Link href={proposalHref(p.id)}>{p.title}</Link>
                          </td>
                          <td>
                            <Chip value={p.state} />
                          </td>
                          <td>{p.audience}</td>
                          <td>{p.site_name ?? p.site_id}</td>
                          <td>{p.company_name ?? p.company_id}</td>
                          <td>{p.version}</td>
                          <td>
                            r{p.revision} · {short(p.current_revision_id)}
                          </td>
                          <td title={p.content_hash}>
                            {short(p.content_hash)}
                          </td>
                          <td title={p.id}>{short(p.id)}</td>
                          <td>
                            {p.publication_id ? (
                              <Link
                                href={`${proposalHref(p.id)}?tab=publication`}
                              >
                                Version {p.runtime_version}
                              </Link>
                            ) : (
                              "None for current revision"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </RegisterTable>
                </div>
                <div className="tm-phone-list">
                  {proposals.data.items.map((p) => (
                    <Link
                      className="tm-phone-row"
                      key={p.id}
                      href={proposalHref(p.id)}
                    >
                      <strong>{p.title}</strong>
                      <Chip value={p.state} />
                      <span>
                        r{p.revision} · {p.audience}
                      </span>
                      <span>
                        {p.site_name ?? p.site_id} ·{" "}
                        {p.company_name ?? p.company_id}
                      </span>
                    </Link>
                  ))}
                </div>
                <Paging
                  read={proposals}
                  scope="this family’s permitted proposals"
                />
              </>
            )}
            <Note>
              {view === "definitions"
                ? "Eligible as default means only the workspace default, intact and supported by today’s renderer. Job pack selection at a company and site is resolved separately in Site use."
                : "Reviewed is independent evidence for one exact proposal revision. Publication is a separate record; assignment is a separate site decision. A new revision returns the proposal to Draft."}
            </Note>
          </>
        )}
        {snapshot && family && (
          <aside
            className="tm-snapshot"
            ref={snapshotPanel}
            tabIndex={-1}
            aria-label="Definition snapshot"
            onKeyDown={(e) => {
              if (e.key === "Escape") setSnapshot(null);
            }}
          >
            <header>
              <h2>
                {snapshot.family_name} · version {snapshot.version}
              </h2>
              <Button
                aria-label="Close snapshot"
                onClick={() => setSnapshot(null)}
              >
                Close
              </Button>
            </header>
            <div>
              <Chip value={snapshot.runtime_support} />
              <Facts
                items={[
                  ["Name", snapshot.name],
                  ["Template ID", snapshot.id],
                  ["Content SHA-256", snapshot.content_hash],
                  [
                    "Integrity",
                    snapshot.definition_integrity ? "Intact" : "Mismatch",
                  ],
                  ["Dependencies", snapshot.dependencies.state],
                  ["Renderer", snapshot.renderer_version],
                  [
                    "Workspace default",
                    snapshot.selected_by_policy ? "Selected" : "Not selected",
                  ],
                  [
                    "Eligible as default",
                    snapshot.definition_eligible ? "Yes" : "No",
                  ],
                ]}
              />
              <Note>
                Catalogue facts, not permission to render. Site use is resolved
                separately.
              </Note>
            </div>
            <footer>
              {snapshot.publication_id && (
                <ButtonLink
                  href={`${definitionHref(family, snapshot.id)}?tab=publication`}
                >
                  Open publication
                </ButtonLink>
              )}
              <ButtonLink
                variant="primary"
                href={definitionHref(family, snapshot.id)}
              >
                Open record
              </ButtonLink>
            </footer>
          </aside>
        )}
        {create && family && (
          <ProposalForm
            available={!read.error && !!scopes.data}
            family={family}
            onClose={() => setCreate(false)}
            onSaved={(id) => router.push(proposalHref(id))}
          />
        )}
      </div>
    </TemplateFrame>
  );
}
