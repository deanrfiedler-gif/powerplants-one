"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ReviewDialog, PublishDialog } from "./decisions";
import { PublicationEvidence } from "./definition";
import {
  definitionHref,
  proposalHref,
  familyNames,
  short,
  type ProposalData,
  type Revision,
  type Review,
  type Readiness,
} from "./types";

export function ProposalRecord({ id }: { id: string }) {
  const params = useSearchParams();
  return (
    <Proposal
      key={`${id}:${params.toString()}`}
      id={id}
      revisionId={params.get("revision")}
      initialTab={params.get("tab")}
    />
  );
}
function Proposal({
  id,
  revisionId,
  initialTab,
}: {
  id: string;
  revisionId: string | null;
  initialTab: string | null;
}) {
  const read = useCrmResource<ProposalData>(
      `document-template-drafts/${id}${revisionId ? `?revision_id=${encodeURIComponent(revisionId)}` : ""}`,
      true,
    ),
    d = read.data;
  const router = useRouter();
  const [tab, setTab] = useState(
    ["proposal", "reviews", "history", "publication"].includes(initialTab ?? "")
      ? initialTab!
      : "proposal",
  );
  const [dialog, setDialog] = useState<{
      kind: "revise" | "review";
      data: ProposalData;
    } | null>(null),
    [publishing, setPublishing] = useState<Readiness | null>(null);
  usePublishRecordIdentity(
    d ? `Proposal · r${d.revision.revision}` : null,
    d?.revision.body.title ?? "Proposal",
  );

  const saved = () => {
    setDialog(null);
    setPublishing(null);
    read.reload();
  };
  return (
    <TemplateFrame
      view="proposals"
      family={d?.proposal.family ?? null}
      manage
      phoneHeader={{
        title: d ? `Proposal · r${d.revision.revision}` : "Proposal",
        record: {
          more: d
            ? [
                ...(d.permissions.can_revise
                  ? [
                      {
                        label: "Revise",
                        onSelect: () => setDialog({ kind: "revise", data: d }),
                      },
                    ]
                  : []),
                ...(d.permissions.can_review
                  ? [
                      {
                        label: "Review",
                        onSelect: () => setDialog({ kind: "review", data: d }),
                      },
                    ]
                  : []),
              ]
            : [],
        },
      }}
    >
      <ReadFeedback {...read} />
      {d && (
        <>
          <header className="tm-record-header">
            <div>
              <p className="tm-eyebrow">
                Proposal · {familyNames[d.proposal.family]}
              </p>
              <h1>{d.revision.body.title}</h1>
              <Chip
                value={
                  d.is_current_revision ? d.proposal.state : "Earlier revision"
                }
              />{" "}
              <span>
                r{d.revision.revision} · {d.revision.body.audience}
              </span>
            </div>
            <div className="tm-actions">
              <ButtonLink
                href={`/documents/templates?view=proposals&family=${d.proposal.family}`}
              >
                Proposals
              </ButtonLink>
              {d.permissions.can_revise && (
                <Button onClick={() => setDialog({ kind: "revise", data: d })}>
                  Revise
                </Button>
              )}
              {d.permissions.can_review && (
                <Button
                  variant="primary"
                  onClick={() => setDialog({ kind: "review", data: d })}
                >
                  Review
                </Button>
              )}
              <Button onClick={read.reload}>Refresh</Button>
            </div>
          </header>
          {!d.is_current_revision && (
            <Note warning>
              This is retained revision r{d.revision.revision}; current proposal
              state is {d.proposal.state.replace(/([a-z])([A-Z])/g, "$1 $2")}.{" "}
              <Link href={proposalHref(id)}>Open the current revision</Link> to
              make a new decision.
            </Note>
          )}
          {d.is_current_revision && d.proposal.state === "ChangesRequested" && (
            <Note warning>
              Changes requested. Read the independent review observations, then
              use Revise to create a new Draft revision. Earlier evidence stays
              intact.
            </Note>
          )}
          <div className="tm-fact-strip">
            <span>
              Review scope <b>{d.site_name ?? d.proposal.site_id}</b>
            </span>
            <span>
              Company <b>{d.company_name ?? d.proposal.company_id}</b>
            </span>
            <span>
              Command version <b>{d.proposal.version}</b>
            </span>
            <span>
              Publication{" "}
              <b>
                {d.publication_id
                  ? `Version ${d.runtime_version}`
                  : "None for this revision"}
              </b>
            </span>
          </div>
          <div className="tm-record-grid">
            <aside className="tm-record-facts">
              <h2>Proposal details</h2>
              <Facts
                items={[
                  [
                    "Family",
                    `${d.proposal.family} · ${familyNames[d.proposal.family]}`,
                  ],
                  ["Proposal ID", <code key="id">{id}</code>],
                  ["Revision", `r${d.revision.revision}`],
                  ["Revision ID", <code key="revision">{d.revision.id}</code>],
                  [
                    "Proposal fingerprint",
                    <code key="hash">{d.revision.content_hash}</code>,
                  ],
                  ["Author", d.actor_name ?? d.revision.created_by],
                  [
                    "Authored",
                    <Time key="time" value={d.revision.created_at} />,
                  ],
                  [
                    "Base definition",
                    <Link
                      key="base"
                      href={definitionHref(
                        d.proposal.family,
                        d.revision.base.id,
                      )}
                    >
                      Version {d.revision.base.version}
                    </Link>,
                  ],
                  [
                    "Base fingerprint",
                    <code key="basehash">{d.revision.base.content_hash}</code>,
                  ],
                  ["Reason", d.revision.reason],
                ]}
              />
              <Note>
                Review scope controls evidence access. It is not a use
                assignment.
              </Note>
              {d.permissions.is_contributor && (
                <Note>
                  Contributors can author revisions when permitted. An
                  independent person must review and publish.
                </Note>
              )}
            </aside>
            <section className="tm-record-main">
              <RecordTabs
                id="proposal-tabs"
                label="Proposal sections"
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: "proposal", label: "Proposal" },
                  { id: "reviews", label: "Reviews" },
                  { id: "history", label: "History" },
                  { id: "publication", label: "Publication" },
                ]}
              />
              <RecordPanel id="proposal-tabs" tab="proposal" value={tab}>
                <h2>Proposed fields</h2>
                <Note>
                  Ordered field definitions and permitted source bindings. This
                  view does not fetch source values or render a preview.
                </Note>
                <RegisterTable
                  caption="Proposed fields in authored order"
                  variant="panel"
                >
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Label</th>
                      <th>Source binding</th>
                      <th>Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.revision.body.fields.map((f) => (
                      <tr key={f.key}>
                        <td>
                          <code>{f.key}</code>
                        </td>
                        <td>{f.label}</td>
                        <td>
                          <code>{f.binding}</code>
                        </td>
                        <td>{f.required ? "Proposed" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </RegisterTable>
                {d.latest_review && (
                  <>
                    <h2>Latest review of this revision</h2>
                    <ReviewEvidence review={d.latest_review} />
                  </>
                )}
              </RecordPanel>
              <RecordPanel id="proposal-tabs" tab="reviews" value={tab}>
                {tab === "reviews" && <Reviews id={id} />}
              </RecordPanel>
              <RecordPanel id="proposal-tabs" tab="history" value={tab}>
                {tab === "history" && (
                  <History id={id} current={d.proposal.current_revision_id} />
                )}
              </RecordPanel>
              <RecordPanel id="proposal-tabs" tab="publication" value={tab}>
                {tab === "publication" &&
                  (d.publication_id ? (
                    <PublicationEvidence id={d.publication_id} />
                  ) : (
                    <PublicationReadiness data={d} onPublish={setPublishing} />
                  ))}
              </RecordPanel>
            </section>
          </div>
          <div className="tm-phone-primary">
            {d.permissions.can_revise ? (
              <Button
                variant="primary"
                onClick={() => setDialog({ kind: "revise", data: d })}
              >
                Revise proposal
              </Button>
            ) : d.permissions.can_review ? (
              <Button
                variant="primary"
                onClick={() => setDialog({ kind: "review", data: d })}
              >
                Review exact revision
              </Button>
            ) : null}
          </div>
        </>
      )}
      {dialog?.kind === "revise" && (
        <ProposalForm
          family={dialog.data.proposal.family}
          proposal={dialog.data}
          onClose={() => setDialog(null)}
          onSaved={() => {
            saved();
            if (revisionId) router.push(proposalHref(id));
          }}
        />
      )}
      {dialog?.kind === "review" && (
        <ReviewDialog
          data={dialog.data}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}{" "}
      {publishing && (
        <PublishDialog
          data={publishing}
          onClose={() => setPublishing(null)}
          onSaved={saved}
        />
      )}
    </TemplateFrame>
  );
}
function ReviewEvidence({ review: r }: { review: Review }) {
  return (
    <article className="tm-evidence">
      <header>
        <Chip value={r.outcome} />
        <span>
          {r.actor_name ?? r.reviewer_id} · <Time value={r.created_at} />
        </span>
      </header>
      <Facts
        items={[
          ["Review ID", <code key="id">{r.id}</code>],
          ["Exact revision", <code key="rev">{r.revision_id}</code>],
          ["Proposal version", r.proposal_version],
          ["Fingerprint", <code key="hash">{r.content_hash}</code>],
          ["Reason", r.reason],
        ]}
      />
      {Object.entries(r.checks).map(([key, c]) => (
        <div className="tm-review-observation" key={key}>
          <strong>
            {key.replaceAll("_", " ")} · {c.result}
          </strong>
          <p>{c.note}</p>
        </div>
      ))}
    </article>
  );
}
function Reviews({ id }: { id: string }) {
  const read = useTemplatePages<Review>(
    `document-template-drafts/${id}/history?kind=Review&limit=25`,
  );
  return (
    <>
      <h2>Independent reviews</h2>
      <Note>
        Reviews remain bound to their exact revision and fingerprint. An earlier
        Reviewed result does not approve a later revision.
      </Note>
      <ReadFeedback {...read} />
      {read.data && !read.data.items.length && (
        <Empty>No permitted independent reviews.</Empty>
      )}
      {read.data?.items.map((r) => (
        <ReviewEvidence key={r.id} review={r} />
      ))}
      <Paging
        read={read}
        order="review command-version order"
        scope="permitted review evidence"
      />
    </>
  );
}
function History({ id, current }: { id: string; current: string }) {
  const read = useTemplatePages<Revision>(
    `document-template-drafts/${id}/history?kind=Revision&limit=25`,
  );
  return (
    <>
      <h2>Revision history</h2>
      <Note>
        Immutable revisions in authored order. Open an earlier revision to
        inspect its body, review and publication separately.
      </Note>
      <ReadFeedback {...read} />
      {read.data && !read.data.items.length && (
        <Empty>No permitted revision evidence.</Empty>
      )}
      <ol className="tm-history">
        {read.data?.items.map((r) => (
          <li key={r.id}>
            <div>
              <Link href={`${proposalHref(id)}?revision=${r.id}`}>
                Revision r{r.revision}
              </Link>{" "}
              {r.id === current && <Chip value="Current" />}
            </div>
            <p>
              {r.actor_name ?? r.created_by} · <Time value={r.created_at} />
            </p>
            <p>{r.reason}</p>
            <code title={r.content_hash}>{short(r.content_hash)}</code>
            <span> · command version {r.proposal_version}</span>
          </li>
        ))}
      </ol>
      <Paging
        read={read}
        order="revision order"
        scope="permitted revision evidence"
      />
    </>
  );
}
function PublicationReadiness({
  data: d,
  onPublish,
}: {
  data: ProposalData;
  onPublish: (r: Readiness) => void;
}) {
  const ready =
    d.is_current_revision &&
    d.proposal.family === "OUT-09" &&
    d.proposal.state === "Reviewed" &&
    d.permissions.can_publish;
  const read = useCrmResource<Readiness>(
    ready ? `document-template-drafts/${d.proposal.id}/publication` : null,
    true,
  );
  return (
    <>
      <h2>Publication eligibility</h2>
      <Note>
        {d.proposal.family !== "OUT-09"
          ? "Publication is supported only for Internal Job packs (OUT-09). This family supports catalogue and proposal evidence only."
          : !d.is_current_revision
            ? "Only the current revision can be published."
            : d.proposal.state !== "Reviewed"
              ? "An independent all-Pass review of this exact current revision is required."
              : !d.permissions.can_publish
                ? "Publication requires a permitted independent publisher with Job pack check authority at this site. Contributors cannot publish."
                : "Readiness binds this exact proposal, independent review, runtime version and definition fingerprint. The command checks every value again."}
      </Note>
      <ReadFeedback {...read} />
      {read.data && (
        <>
          <Facts
            items={[
              [
                "Exact revision",
                <code key="revision">{read.data.revision_id}</code>,
              ],
              [
                "Independent review",
                <code key="review">{read.data.review_id}</code>,
              ],
              ["Proposed runtime version", read.data.runtime_version],
              [
                "Definition fingerprint",
                <code key="hash">{read.data.definition_hash}</code>,
              ],
            ]}
          />
          <h3>Exact supported definition</h3>
          <pre className="tm-definition">{read.data.definition}</pre>
          <Button variant="primary" onClick={() => onPublish(read.data!)}>
            Publish version {read.data.runtime_version}
          </Button>
        </>
      )}
    </>
  );
}
