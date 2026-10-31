"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCrmResource } from "../../components/crm-state";
import { Button, ButtonLink } from "../../components/ui/button";
import { RecordTabs, RecordPanel } from "../../components/record-ui";
import { RegisterTable } from "../../components/ui/register-table";
import { usePublishRecordIdentity } from "../../shell/record-identity";
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
import { ProposalForm } from "./proposal-form";
import {
  definitionHref,
  proposalHref,
  familyNames,
  short,
  type Family,
  type Template,
  type Scope,
  type Usage,
  type PublicationData,
} from "./types";

export function DefinitionRecord({
  family,
  id,
  initialTab,
}: {
  family: Family;
  id: string;
  initialTab?: string;
}) {
  const read = useCrmResource<Template>(
      `document-templates/${id}?family=${family}`,
      true,
    ),
    t = read.data;
  const scopes = useTemplatePages<Scope>(
    `document-template-drafts/scopes?family=${family}&limit=50`,
  );
  const [tab, setTab] = useState(
      ["definition", "usage", "publication"].includes(initialTab ?? "")
        ? initialTab!
        : "definition",
    ),
    [create, setCreate] = useState<Template | null>(null);
  const router = useRouter(),
    canCreate =
      !!t &&
      (!!scopes.data?.items.some((s) => s.can_propose) || scopes.hasMore);
  usePublishRecordIdentity(
    t ? `${family} · Version ${t.version}` : null,
    t?.name ?? "Definition",
  );

  return (
    <TemplateFrame
      view="definitions"
      family={family}
      manage={!!scopes.data}
      phoneHeader={{
        title: t ? `Version ${t.version}` : "Definition",
        record: {
          more: canCreate
            ? [{ label: "Propose a change", onSelect: () => setCreate(t) }]
            : [],
        },
      }}
    >
      <ReadFeedback {...read} />
      {t && (
        <>
          <header className="tm-record-header">
            <div>
              <p className="tm-eyebrow">
                {familyNames[family]} · {family}
              </p>
              <h1>{t.name}</h1>
              <span>Version {t.version}</span>{" "}
              <Chip value={t.runtime_support} />
            </div>
            <div className="tm-actions">
              <ButtonLink
                href={`/documents/templates?view=definitions&family=${family}`}
              >
                Definitions
              </ButtonLink>
              {canCreate && (
                <Button variant="primary" onClick={() => setCreate(t)}>
                  Propose a change
                </Button>
              )}
              <Button onClick={read.reload}>Refresh</Button>
            </div>
          </header>
          <div className="tm-fact-strip">
            <span>
              Integrity{" "}
              <b>
                {t.definition_integrity ? "Matches stored bytes" : "Changed"}
              </b>
            </span>
            <span>
              Family default <b>{t.selected_by_policy ? "Yes" : "No"}</b>
            </span>
            <span>
              Eligible <b>{t.definition_eligible ? "Yes" : "No"}</b>
            </span>
            <span>
              Dependencies <b>{t.dependencies.state}</b>
            </span>
          </div>
          <div className="tm-record-grid">
            <aside className="tm-record-facts">
              <h2>Definition details</h2>
              <Facts
                items={[
                  ["Family", `${family} · ${familyNames[family]}`],
                  ["Version", t.version],
                  ["Definition ID", <code key="id">{t.id}</code>],
                  [
                    "Definition fingerprint",
                    <code key="hash">{t.content_hash}</code>,
                  ],
                  ["Renderer", t.renderer_version ?? "Not recorded"],
                  [
                    "Publication",
                    t.publication_id ? (
                      <code>{t.publication_id}</code>
                    ) : (
                      "Seeded definition"
                    ),
                  ],
                  ["Policy version", t.policy_version ?? "Not selected"],
                ]}
              />
              <Note>
                The family default is separate from site use. A definition and
                its exact version remain evidence after a successor is assigned.
              </Note>
            </aside>
            <section className="tm-record-main">
              <RecordTabs
                id="definition-tabs"
                label="Definition sections"
                value={
                  tab === "publication" && !t.publication_id
                    ? "definition"
                    : tab
                }
                onChange={setTab}
                tabs={[
                  { id: "definition", label: "Definition" },
                  { id: "usage", label: "Usage" },
                  ...(t.publication_id
                    ? [{ id: "publication", label: "Publication" }]
                    : []),
                ]}
              />
              <RecordPanel
                id="definition-tabs"
                tab="definition"
                value={
                  tab === "publication" && !t.publication_id
                    ? "definition"
                    : tab
                }
              >
                <h2>Stored definition</h2>
                <Note>
                  Read-only definition bytes. Catalogue coverage does not imply
                  publication or rendering support.
                </Note>
                <pre className="tm-definition">
                  {t.definition ?? "Definition unavailable"}
                </pre>
                <h2>Renderer dependencies</h2>
                {t.dependencies.items.length ? (
                  <ul className="tm-dependencies">
                    {t.dependencies.items.map((d) => (
                      <li key={d.path}>
                        <strong>{d.path}</strong>
                        <code>{d.sha256}</code>
                        <span>{d.byte_count} bytes</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>No dependency evidence is recorded.</Empty>
                )}
                {t.runtime_support !== "Supported" && (
                  <Note warning>
                    Current definition or renderer evidence does not support
                    this version. Stored fingerprints cannot be refreshed in
                    place; use the native revision, independent review and
                    publication path for a successor.
                  </Note>
                )}
              </RecordPanel>
              <RecordPanel id="definition-tabs" tab="usage" value={tab}>
                {tab === "usage" && <DefinitionUsage family={family} id={id} />}
              </RecordPanel>
              <RecordPanel id="definition-tabs" tab="publication" value={tab}>
                {tab === "publication" &&
                  (t.publication_id ? (
                    <PublicationEvidence id={t.publication_id} />
                  ) : (
                    <Empty>
                      This seeded definition has no managed publication record.
                    </Empty>
                  ))}
              </RecordPanel>
            </section>
          </div>
          {canCreate && (
            <div className="tm-phone-primary">
              <Button variant="primary" onClick={() => setCreate(t)}>
                Propose a change
              </Button>
            </div>
          )}
        </>
      )}
      {create && (
        <ProposalForm
          family={family}
          base={create}
          available={!!t}
          onClose={() => setCreate(null)}
          onSaved={(result) => router.push(proposalHref(result))}
        />
      )}
    </TemplateFrame>
  );
}
function DefinitionUsage({ family, id }: { family: Family; id: string }) {
  const [kind, setKind] = useState(
    family === "OUT-09" ? "PackRevision" : "RenderJob",
  );
  const read = useTemplatePages<Usage>(
    `document-templates/${id}/usage?family=${family}&kind=${kind}&limit=25`,
  );
  return (
    <>
      <h2>Permitted usage</h2>
      <Note>
        Only records you can currently read are listed. Matching a stored
        definition does not verify file availability. No global count is
        available.
      </Note>
      <label className="tm-inline-field">
        Record kind
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {(family === "OUT-09"
            ? ["PackRevision", "RenderJob", "Issue"]
            : ["RenderJob", "Issue"]
          ).map((k) => (
            <option key={k} value={k}>
              {k.replace(/([a-z])([A-Z])/g, "$1 $2")}
            </option>
          ))}
        </select>
      </label>
      <ReadFeedback {...read} />
      {read.data && !read.data.items.length && (
        <Empty>No permitted usage was found for this record kind.</Empty>
      )}
      {!!read.data?.items.length && (
        <RegisterTable caption="Permitted definition usage">
          <thead>
            <tr>
              <th>Record</th>
              <th>Revision</th>
              <th>State</th>
              <th>Exact definition</th>
              <th>File availability</th>
              <th>Policy</th>
            </tr>
          </thead>
          <tbody>
            {read.data.items.map((u) => (
              <tr key={u.id}>
                <td>
                  <code title={u.record_id}>{short(u.record_id)}</code>
                </td>
                <td>
                  <code title={u.revision_id}>{short(u.revision_id)}</code>
                </td>
                <td>{u.state}</td>
                <td>{u.exact_definition_match ? "Matches" : "Different"}</td>
                <td>{u.file_availability}</td>
                <td>{u.template.policy_version ?? "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </RegisterTable>
      )}
      <Paging read={read} scope={read.data?.scope ?? "permitted usage"} />
    </>
  );
}
export function PublicationEvidence({ id }: { id: string }) {
  const read = useCrmResource<PublicationData>(
      `document-template-publications/${id}`,
      true,
    ),
    pub = read.data?.publication;
  return (
    <>
      <h2>Publication record</h2>
      <ReadFeedback {...read} />
      {pub && (
        <>
          <Facts
            items={[
              ["Publication ID", <code key="id">{pub.id}</code>],
              [
                "Exact proposal",
                <Link
                  key="proposal"
                  href={`${proposalHref(pub.proposal_id)}?revision=${pub.revision_id}`}
                >
                  {pub.proposal_id}
                </Link>,
              ],
              [
                "Proposal revision",
                <code key="revision">{pub.revision_id}</code>,
              ],
              ["Independent review", <code key="review">{pub.review_id}</code>],
              [
                "Runtime version",
                <Link
                  key="definition"
                  href={definitionHref("OUT-09", pub.template_id)}
                >
                  Version {pub.runtime_version}
                </Link>,
              ],
              [
                "Definition fingerprint",
                <code key="hash">{pub.definition_hash}</code>,
              ],
              [
                "Current support",
                <Chip key="support" value={read.data!.runtime_support} />,
              ],
              ["Publisher", pub.publisher_name ?? pub.publisher_id],
              ["Published", <Time key="time" value={pub.published_at} />],
              ["Approval note", pub.approval_note],
              ["Reason", pub.reason],
            ]}
          />
          <Note>
            Publication is retained evidence. It does not assign site use.
          </Note>
          <ButtonLink
            href={`/documents/templates/use?company=${pub.proposal_snapshot.company_id}&site=${pub.proposal_snapshot.site_id}`}
          >
            Open site use
          </ButtonLink>
        </>
      )}
    </>
  );
}
