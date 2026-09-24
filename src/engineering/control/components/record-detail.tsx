"use client";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { friendly } from "../../../components/business-ui";
import {
  sourceIds,
  type BasisContent,
  type ContentByKind,
  type ControlKind,
  type ControlRecord,
} from "../model";
import type { ControlRead } from "../reads";
import type { ActionRequest } from "./action-form";

export function RecordDetail({
  data,
  kind,
  record,
  view,
  edit,
  act,
}: {
  data: ControlRead;
  kind: ControlKind;
  record: ControlRecord;
  view: string;
  edit: (successor?: boolean) => void;
  act: (request: ActionRequest) => void;
}) {
  const name = (id: string) =>
    data.people.find((p) => p.id === id)?.display_name ?? "Owner unavailable";
  const action = (
    action: ActionRequest["action"],
    label: string,
    extra?: Record<string, unknown>,
    actionKind: ControlKind = kind,
  ) => (
    <Button
      onClick={() => act({ action, label, kind: actionKind, record, extra })}
    >
      {label}
    </Button>
  );
  const selectedSources = sourceIds(record.content)
    .map((id) => data.sources.find((s) => s.id === id))
    .filter((s) => !!s);
  return (
    <>
      <p>
        <strong>{record.reference}</strong> · revision {record.revision} ·{" "}
        {friendly(record.state)}
      </p>
      <p>
        Responsible owner: {name(record.owner_id)}
        <br />
        Required date: {record.due_date ?? "Unknown — date needed"}
      </p>
      {data.can.author &&
        ["Draft", "Open", "Current", "Planned"].includes(record.state) &&
        !["review", "issue"].includes(kind) && (
          <Button onClick={() => edit()}>Edit draft {kind}</Button>
        )}
      {data.can.author &&
        [
          "Returned",
          "Reviewed",
          "Withdrawn",
          "Rejected",
          "Accepted",
          "Resolved",
        ].includes(record.state) &&
        ["basis", "query", "submittal"].includes(kind) && (
          <Button onClick={() => edit(true)}>Prepare successor</Button>
        )}
      {kind === "basis" &&
        (() => {
          const b = record.content as BasisContent;
          return (
            <>
              {view === "basis" && (
                <>
                  <h3>Basis & scope</h3>
                  <p>{b.summary}</p>
                  <h4>Purpose and exclusions</h4>
                  <p>
                    {friendly(b.purpose)} · {b.exclusions}
                  </p>
                  <p>
                    Applicability:{" "}
                    {b.facility_ids
                      .map(
                        (id) =>
                          data.facilities.find((f) => f.id === id)
                            ?.display_name ?? "Unavailable",
                      )
                      .join(", ") ||
                      "Package / site; no narrower facility selected"}
                  </p>
                </>
              )}
              {view === "requirements" && (
                <>
                  <h3>Requirements</h3>
                  {b.requirements.map((r) => (
                    <article key={r.id}>
                      <h4>{r.title}</h4>
                      <p>{r.criterion}</p>
                      <p>
                        Owner: {name(r.owner_id)} · {r.source_ids.length} exact
                        sources · {r.deliverable_ids.length} affected
                        deliverables
                      </p>
                    </article>
                  ))}
                  {!b.requirements.length && <p>No requirements recorded.</p>}
                </>
              )}
              {view === "assumptions" && (
                <>
                  <h3>Assumptions & questions</h3>
                  {b.inputs.map((r) => (
                    <article key={r.id}>
                      <h4>
                        {r.kind}: {r.title}
                      </h4>
                      <p>
                        {r.state} ·{" "}
                        {r.blocking
                          ? "Blocks positive review"
                          : "Retained obligation"}
                      </p>
                      <p>
                        {name(r.owner_id)} ·{" "}
                        {r.due_date ?? "Response date unknown"}
                      </p>
                      <p>{r.response ?? "No response or decision evidence"}</p>
                    </article>
                  ))}
                  {!b.inputs.length && (
                    <p>No assumptions, constraints or questions recorded.</p>
                  )}
                </>
              )}
              {view === "interfaces" && (
                <>
                  <h3>Interfaces</h3>
                  {b.interfaces.map((r) => (
                    <article key={r.id}>
                      <h4>{r.title}</h4>
                      <p>
                        Provider: {name(r.provider_id)}
                        <br />
                        Receiver: {name(r.receiver_id)}
                      </p>
                      <dl>
                        <dt>Required input</dt>
                        <dd>{r.required_input}</dd>
                        <dt>Expected output</dt>
                        <dd>{r.expected_output}</dd>
                        <dt>Agreement criterion</dt>
                        <dd>{r.criterion}</dd>
                      </dl>
                      <p>
                        Confirmed by:{" "}
                        {[r.provider_id, r.receiver_id]
                          .filter((id) =>
                            data.basis_readiness[record.id]?.confirmed.includes(
                              `${r.id}:${id}`,
                            ),
                          )
                          .map(name)
                          .join(", ") || "Neither party"}
                      </p>
                      {record.state === "Draft" &&
                        data.can.author &&
                        [r.provider_id, r.receiver_id].includes(
                          data.actor_id,
                        ) &&
                        action("confirm_interface", "Confirm my side", {
                          interface_id: r.id,
                        })}
                    </article>
                  ))}
                  {!b.interfaces.length && <p>No interfaces recorded.</p>}
                </>
              )}
              {view === "sources" && (
                <>
                  <h3>Calculations & sources</h3>
                  {b.calculations.map((r) => (
                    <article key={r.id}>
                      <h4>{r.title}</h4>
                      <p>
                        {r.model_reference} · exact model version{" "}
                        {r.model_version}
                      </p>
                      <p>
                        {r.check_evidence ??
                          "Check evidence unknown — needs review"}
                      </p>
                    </article>
                  ))}
                  <p>Native tools retain calculation/model authorship.</p>
                </>
              )}
              {view === "review" && (
                <>
                  <h3>Review & handover</h3>
                  {data.basis_readiness[record.id]?.blockers.length ? (
                    <ul>
                      {data.basis_readiness[record.id].blockers.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No recorded basis blockers. Exact review and issue
                      authority remain separate.
                    </p>
                  )}
                  {record.state === "Draft" &&
                    data.can.author &&
                    action("submit_basis", "Submit exact basis")}
                  <ul>
                    {data.records.review
                      .filter((r) => r.content.basis_id === record.id)
                      .map((r) => (
                        <li key={r.id}>
                          <Link
                            href={`/engineering/${data.package.id}/reviews?record=${r.id}`}
                          >
                            {r.reference} · {r.state}
                          </Link>
                        </li>
                      ))}
                  </ul>
                  <p>
                    Reviewed content is retained. Downstream material, change
                    and commissioning work reads an exact source reference;
                    receiving acceptance remains with that workflow.
                  </p>
                </>
              )}
            </>
          );
        })()}
      {kind === "document" && (
        <>
          <h3>Controlled revisions</h3>
          {data.can.author &&
            action("revise_document", "Retain new document revision")}
          {data.document_revisions
            .filter((r) => r.document_id === record.id)
            .toReversed()
            .map((r) => (
              <article key={r.id}>
                <h4>
                  Engineering revision {r.engineering_revision} ·{" "}
                  {data.sources.find((s) => s.id === r.source_id)?.use}
                </h4>
                <dl>
                  <dt>Native authoring system</dt>
                  <dd>{r.native_system}</dd>
                  <dt>Native source</dt>
                  <dd>{r.native_reference}</dd>
                  <dt>Source file version</dt>
                  <dd>{r.native_version}</dd>
                  <dt>Configuration</dt>
                  <dd>{r.configuration ?? "Not specified"}</dd>
                </dl>
                {r.outputs.map((o) => (
                  <p key={o.reference}>
                    {o.reference} · output {o.version}
                    <small>SHA-256 {o.content_hash}</small>
                  </p>
                ))}
                <p>Exact controlled revision: {r.id}</p>
              </article>
            ))}
          {!data.document_revisions.some(
            (r) => r.document_id === record.id,
          ) && (
            <p>
              No controlled revision retained. The stable document identity
              exists; source version, published output and engineering revision
              are still needed.
            </p>
          )}
        </>
      )}
      {kind === "query" &&
        (() => {
          const q = record.content as ContentByKind["query"];
          return (
            <>
              <h3>Technical question</h3>
              <p>{q.question}</p>
              <h4>Formal answer</h4>
              <p>
                {q.response ??
                  "No formal response. Coordination notes are not an answer."}
              </p>
              {q.response && (
                <p>
                  {name(q.response_by!)} · {q.response_at}
                  <br />
                  {q.actions}
                </p>
              )}
              {q.change_id && (
                <Link
                  href={`/engineering/${data.package.id}/changes/impact?change=${q.change_id}`}
                >
                  Related Engineering change
                </Link>
              )}
              {data.can.author &&
                record.owner_id === data.actor_id &&
                ["Open", "Returned"].includes(record.state) &&
                action("respond", "Record formal response")}
              {data.can.review &&
                record.state === "Answered" &&
                action("dispose", "Review technical answer")}
            </>
          );
        })()}
      {kind === "submittal" &&
        (() => {
          const s = record.content as ContentByKind["submittal"];
          return (
            <>
              <h3>Supplier submittal</h3>
              <p>
                {s.supplier} · {s.product_reference}
                <br />
                PO reference: {s.purchase_reference ?? "Not provided"}
                <br />
                Submitted revision: {s.submitted_revision}
              </p>
              <p>{s.evidence}</p>
              <p>Requested reviewer: {name(s.reviewer_id)}</p>
              <p>Downstream actions: {s.downstream_actions}</p>
              <p>Technical disposition does not record procurement receipt.</p>
              {data.can.review &&
                s.reviewer_id === data.actor_id &&
                record.state === "Submitted" &&
                action("dispose", "Record technical disposition")}
            </>
          );
        })()}
      {kind === "deliverable" &&
        (() => {
          const d = record.content as ContentByKind["deliverable"];
          return (
            <>
              <h3>Accountable deliverable</h3>
              <p>
                {d.discipline} · next action: {d.next_action}
              </p>
              <h4>Prerequisite</h4>
              <p>{d.prerequisite}</p>
              <p>
                {d.prerequisite_evidence ??
                  "Blocked — prerequisite evidence missing"}
              </p>
              {d.document_id && (
                <Link
                  href={`/engineering/${data.package.id}/drawings?record=${d.document_id}`}
                >
                  Controlled document and exact revisions
                </Link>
              )}
              <h4>Effort and availability</h4>
              <p>
                Planned: {d.planned_hours ?? "Unknown"} hours ·{" "}
                {d.effort_source ?? "Planning source not supplied"}
                <br />
                Authorised: {d.authorised_hours ?? "Unknown"} hours ·{" "}
                {d.authorisation_reference ??
                  "Authorisation source not supplied"}
              </p>
              <p>
                Actual effort and staff availability have no governed source
                here. No utilisation is calculated.
              </p>
            </>
          );
        })()}
      {kind === "review" &&
        (() => {
          const r = record as ControlRecord<"review">;
          const snap = r.content.submission as {
            documents?: {
              document_id: string;
              engineering_revision: string;
              native_version: string;
              native_reference: string;
            }[];
            basis?: ControlRecord<"basis">;
          };
          return (
            <>
              <h3>Frozen review submission</h3>
              <p>
                Purpose: {friendly(r.content.purpose)}
                <small>Submission SHA-256 {r.content.submission_hash}</small>
              </p>
              {snap.basis && (
                <p>
                  Basis {snap.basis.reference} · revision {snap.basis.revision}
                </p>
              )}
              {snap.documents?.map((d) => (
                <p key={d.document_id}>
                  {
                    data.records.document.find((r) => r.id === d.document_id)
                      ?.reference
                  }{" "}
                  · engineering {d.engineering_revision} · source{" "}
                  {d.native_version}
                  <small>{d.native_reference}</small>
                </p>
              ))}
              <h4>Findings and action closure</h4>
              {data.findings
                .filter((f) => f.review_id === r.id)
                .map((f) => (
                  <article key={f.id}>
                    <strong>{f.finding}</strong>
                    <p>
                      {name(f.owner_id)} · {f.due_date ?? "Date needed"} ·{" "}
                      {friendly(f.state)}
                    </p>
                    <p>{f.response ?? "No correction response"}</p>
                    {data.can.author &&
                      f.owner_id === data.actor_id &&
                      f.state !== "Accepted" &&
                      action("respond_finding", "Respond to finding", {
                        finding_id: f.id,
                      })}
                    {data.can.review &&
                      r.owner_id === data.actor_id &&
                      f.state === "ResponseReceived" &&
                      action("accept_finding", "Accept finding response", {
                        finding_id: f.id,
                      })}
                  </article>
                ))}
              {data.can.review &&
                r.owner_id === data.actor_id &&
                r.state === "Submitted" && (
                  <>
                    {action("finding", "Add review finding", {
                      finding_id: crypto.randomUUID(),
                    })}
                    {action("decide_review", "Record review outcome")}
                  </>
                )}
              {data.can.issue &&
                r.state === "Reviewed" &&
                action("issue", "Issue exact reviewed set", undefined, "issue")}
              <p>
                Technical review and issue do not certify statutory design
                authority.
              </p>
            </>
          );
        })()}
      {kind === "issue" &&
        (() => {
          const r = record as ControlRecord<"issue">;
          return (
            <>
              <h3>Exact formal issue</h3>
              {data.native_sources.some(
                (n) =>
                  n.issue_id === r.id &&
                  data.sources.some(
                    (s) => s.id === n.source_id && s.use !== "Current",
                  ),
              ) && (
                <p className="ec-warning">
                  Historical issue � upstream changes require reassessment for
                  current use.
                </p>
              )}
              <p>
                {friendly(r.content.purpose)}
                <small>Manifest SHA-256 {r.content.manifest_hash}</small>
              </p>
              <Link
                href={`/engineering/${data.package.id}/reviews?record=${r.content.review_id}`}
              >
                Reviewed content and per-document revisions
              </Link>
              <h4>Transmittals and recipient evidence</h4>
              {data.transmittals
                .filter((t) => t.issue_id === r.id)
                .map((t) => (
                  <article key={t.id}>
                    <strong>{name(t.recipient_id)}</strong>
                    <p>Issued: {String(t.created_at)}</p>
                    {["Sent", "Delivered", "Acknowledged"].map((k) => (
                      <p key={k}>
                        {k}:{" "}
                        {t.events.find((e) => e.kind === k)?.evidence ??
                          "Not recorded"}
                      </p>
                    ))}
                    {r.state === "Issued" && (
                      <>
                        {data.can.distribute &&
                          !t.events.some((e) => e.kind === "Sent") &&
                          action("distribution", "Record sent evidence", {
                            transmittal_id: t.id,
                            evidence_kind: "Sent",
                          })}
                        {data.can.distribute &&
                          t.events.some((e) => e.kind === "Sent") &&
                          !t.events.some((e) => e.kind === "Delivered") &&
                          action("distribution", "Record delivery evidence", {
                            transmittal_id: t.id,
                            evidence_kind: "Delivered",
                          })}
                        {t.recipient_id === data.actor_id &&
                          t.events.some((e) => e.kind === "Delivered") &&
                          !t.events.some((e) => e.kind === "Acknowledged") &&
                          action("distribution", "Acknowledge exact issue", {
                            transmittal_id: t.id,
                            evidence_kind: "Acknowledged",
                          })}
                      </>
                    )}
                  </article>
                ))}
              {data.can.issue &&
                r.state === "Issued" &&
                action("withdraw", "Withdraw current use")}
              <p>
                Changed content requires a new review and issue. Earlier
                acknowledgements remain attached to the original manifest.
              </p>
            </>
          );
        })()}
      <details>
        <summary>Exact source basis ({selectedSources.length})</summary>
        {selectedSources.map((s) => (
          <article key={s.id}>
            <strong>
              {s.reference} · {s.title}
            </strong>
            <p>
              Engineering revision {s.revision} · file version {s.file_version}
              <br />
              {s.use} · {s.completeness} · permitted purpose{" "}
              {friendly(s.permitted_purpose)}
              <small>SHA-256 {s.content_hash ?? "Unavailable"}</small>
            </p>
          </article>
        ))}
      </details>
      <details>
        <summary>Retained history</summary>
        {data.history
          .filter((e) => e.subject_id === record.id)
          .map((e) => (
            <article key={e.id}>
              <strong>
                {friendly(e.action)} · version {e.version}
              </strong>
              <p>
                {e.reason}
                {e.content.rationale && (
                  <>
                    <br />
                    {e.content.outcome}: {e.content.rationale}
                  </>
                )}
                <br />
                {name(e.recorded_by)} · {String(e.recorded_at)}
              </p>
            </article>
          ))}
      </details>
    </>
  );
}
