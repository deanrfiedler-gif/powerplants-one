"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useResource,
  useCommand,
  ErrorNotice,
  ReadState,
  isDenied,
  type Envelope,
  Stamp,
  RegisterHeading,
} from "./business-ui";
import {
  sectionKeys,
  sectionLabels,
  type PackInput,
} from "../documents/validation";
import type {
  Pack,
  PackHistory as History,
  PackIssue as Issue,
  PackSource as Source,
} from "../documents/components/client/job-pack-types";
// The pack detail page is src/documents/components/client/job-pack-screen.tsx. This file keeps the list,
// first preparation and exact issued document screens, and the preparation form the detail page hosts.
const empty = () =>
  Object.fromEntries(sectionKeys.map((k) => [k, ""])) as PackInput["sections"];
function Intro({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <p className="eyebrow">SERVICE OPERATIONS · SYNTHETIC PROTOTYPE</p>
      <h1>{title}</h1>
      <p>Synthetic prototype — not for operational use</p>
      {children}
    </>
  );
}
export function PreparationForm({
  appointment,
  pack,
  sources,
  history,
  onSaved,
}: {
  appointment?: { id: string; version: number };
  pack?: Pack;
  sources: Source[];
  history: History[];
  onSaved: (id: string) => void;
}) {
  const current = pack?.revisions[0];
  const [sections, setSections] = useState<PackInput["sections"]>(
      current?.input.sections ?? empty(),
    ),
    [sourceIds, setSourceIds] = useState<string[]>(
      current?.input.source_ids ?? [],
    ),
    [historyIds, setHistoryIds] = useState<string[]>(
      current?.input.history_ids ?? [],
    ),
    [reason, setReason] = useState(""),
    [id] = useState(() => crypto.randomUUID());
  const command = useCommand();
  return (
    <form
      className="pack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await command.send<{ record_id: string }>(
          pack ? `packs/${pack.id}/amend` : "packs",
          {
            ...(pack
              ? { expected_version: pack.version }
              : {
                  id,
                  appointment_id: appointment!.id,
                  expected_appointment_version: appointment!.version,
                }),
            reason,
            content: {
              sections,
              source_ids: sourceIds,
              history_ids: historyIds,
            },
          },
        );
        if (result) onSaved(result.record_id);
      }}
    >
      <h2>
        {pack ? "Prepare successor revision" : "Prepare nine-section job pack"}
      </h2>
      <p>
        Each section includes server-derived authorised context. Add reviewed
        preparation notes, explicit limits or a reason where no additional
        information applies. These notes cannot extend authorised scope.
      </p>
      <fieldset disabled={command.busy}>
        <legend>Exact technical sources</legend>
        {sources.map((s) => (
          <label className="pack-choice" key={s.id}>
            <input
              type="checkbox"
              checked={sourceIds.includes(s.id)}
              disabled={!s.available}
              onChange={(e) =>
                setSourceIds((x) =>
                  e.target.checked ? [...x, s.id] : x.filter((v) => v !== s.id),
                )
              }
            />
            <span>
              {s.title}
              <small>
                {s.available
                  ? "Available exact version"
                  : "Unavailable — recover original source"}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset disabled={command.busy}>
        <legend>Relevant service history</legend>
        {history.length ? (
          history.map((h) => (
            <label className="pack-choice" key={h.id}>
              <input
                type="checkbox"
                checked={historyIds.includes(h.id)}
                onChange={(e) =>
                  setHistoryIds((x) =>
                    e.target.checked
                      ? [...x, h.id]
                      : x.filter((v) => v !== h.id),
                  )
                }
              />
              <span>
                {h.kind}: {h.summary}
              </span>
            </label>
          ))
        ) : (
          <p>No permitted service history is available for selection.</p>
        )}
      </fieldset>
      {sectionKeys.map((k, i) => (
        <label className="pack-field" key={k} htmlFor={`section-${k}`}>
          <strong>
            {i + 1}. {sectionLabels[i]}
          </strong>
          <textarea
            id={`section-${k}`}
            required
            maxLength={6000}
            rows={3}
            value={sections[k]}
            disabled={command.busy}
            onChange={(e) =>
              setSections((x) => ({ ...x, [k]: e.target.value }))
            }
          />
        </label>
      ))}
      <label className="pack-field" htmlFor="pack-change-reason">
        Preparation / change reason
        <textarea
          id="pack-change-reason"
          required
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={command.busy}
        />
      </label>
      <ErrorNotice error={command.error} />
      <p role="status">
        {command.busy ? "Saving preparation…" : command.saved}
      </p>
      <button disabled={command.busy}>
        {pack ? "Save successor and hold dispatch" : "Save preparation"}
      </button>
    </form>
  );
}
export function PackListScreen() {
  const r = useResource<Envelope<Pack>>("packs");
  return (
    <div className="business-page">
      {/* The breadcrumb names this register, so the title band gives up its room. The environment
          marker is not a title band and stays: this prototype must never read as operational. */}
      <RegisterHeading
        title="Job packs"
        description="Prepare and check work instructions, issue exact documents, and follow each crew member’s acknowledgement."
      >
        <Link href="/schedule">Open service planner</Link>
      </RegisterHeading>
      <p className="source-stamp">Synthetic prototype — not for operational use</p>
      <ErrorNotice error={r.error} />
      {r.loading ? (
        <p role="status">Loading job packs…</p>
      ) : r.error ? null : r.data?.items.length ? (
        <div className="pack-list">
          {r.data.items.map((p) => (
            <article key={p.id}>
              <h2>
                <Link href={`/service/packs/${p.id}`}>{p.display_number}</Link>
              </h2>
              <p>
                {p.status} ·{" "}
                {p.needs_review
                  ? "Preparation or review required"
                  : p.status === "Issued"
                    ? "Issued"
                    : "Not issued"}
              </p>
              <Link href={`/service/appointments/${p.appointment_id}`}>
                {p.appointment_reference ?? "Appointment"}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p>
          No job packs are available to this identity. Open a confirmed
          appointment in the planner to prepare one.
        </p>
      )}
    </div>
  );
}
export function NewPackScreen({ appointmentId }: { appointmentId: string }) {
  const router = useRouter(),
    r = useResource<{
      appointment: { id: string; version: number; display_number: string };
      work_order_reference: string;
      sources: Source[];
      history: History[];
    }>(`appointments/${appointmentId}/pack-options`);
  return (
    <div className="business-page">
      <Intro title="Prepare job pack">
        <Link href={`/service/appointments/${appointmentId}`}>
          Back to appointment
        </Link>
      </Intro>
      <ErrorNotice error={r.error} />
      {r.data && (
        <>
          <p>
            {r.data.work_order_reference} · {r.data.appointment.display_number}
          </p>
          <PreparationForm
            appointment={r.data.appointment}
            sources={r.data.sources}
            history={r.data.history}
            onSaved={(id) => router.push(`/service/packs/${id}`)}
          />
        </>
      )}
      {r.loading && <p>Loading preparation context…</p>}
    </div>
  );
}
export function DocumentScreen({ id }: { id: string }) {
  const status = useResource<{
    pack_id: string;
    status: string;
    applicable: boolean;
    issued_at: string;
    as_at: string;
  }>(`pack-issues/${id}`);
  const r = useResource<
    Issue["manifest"] & {
      template: { version: number; hash: string };
      sources: {
        id: string;
        title: string;
        version_id: string;
        hash: string;
      }[];
    }
  >(`pack-issues/${id}/manifest`);
  if (isDenied(status.error) || isDenied(r.error))
    return (
      <ErrorNotice error={isDenied(status.error) ? status.error : r.error} />
    );
  return (
    <div className="business-page">
      <Intro title="Exact issued job pack">
        <Link href="/service/packs">Back to job packs</Link>
      </Intro>
      <ReadState
        loading={r.loading}
        error={r.error}
        retry={r.reload}
        retained={!!r.data}
      />
      {r.data && (
        <>
          <h2>{r.data.filename}</h2>
          <ReadState
            loading={status.loading}
            error={status.error}
            retry={status.reload}
            retained={!!status.data}
          />
          {status.data && !status.loading && !status.error && (
            <p role="status">
              <strong>
                {status.data.applicable
                  ? "Current applicable issue"
                  : "Not currently applicable"}
              </strong>{" "}
              · {status.data.status} · issued{" "}
              <Stamp value={status.data.issued_at} /> · checked as at{" "}
              <Stamp value={status.data.as_at} />.{" "}
              <Link href={`/service/packs/${status.data.pack_id}`}>
                Open current pack status
              </Link>
            </p>
          )}
          <div className="pack-toolbar">
            <a
              className="button"
              href={`/api/v1/pack-issues/${id}/html`}
              target="_blank"
              rel="noreferrer"
            >
              Open accessible HTML
            </a>
            <a
              className="button secondary"
              href={`/api/v1/pack-issues/${id}/pdf`}
            >
              Download exact A4 PDF
            </a>
          </div>
          <p>
            The file retains its original bytes. Check the job pack for current
            applicability, withdrawal and acknowledgement status.
          </p>
          <p>
            PDF tagging is requested; PDF/UA conformance and screen-reader
            behaviour are not verified.
          </p>
          <dl className="pack-manifest">
            <dt>PDF bytes</dt>
            <dd>{r.data.pdf_bytes}</dd>
            <dt>PDF SHA-256</dt>
            <dd>{r.data.pdf_hash}</dd>
            <dt>HTML SHA-256</dt>
            <dd>{r.data.html_hash}</dd>
            <dt>Renderer</dt>
            <dd>
              {r.data.renderer_version} · Chromium {r.data.browser_version}
            </dd>
            <dt>Template version</dt>
            <dd>
              {r.data.template.version} · {r.data.template.hash}
            </dd>
          </dl>
          <h2>Exact technical source manifest</h2>
          {r.data.sources.map((s) => (
            <article key={s.id}>
              <h3>{s.title}</h3>
              <p className="pack-hash">
                {s.id}
                <br />
                {s.version_id}
                <br />
                {s.hash}
              </p>
            </article>
          ))}
        </>
      )}
      {r.loading && <p>Loading exact manifest…</p>}
    </div>
  );
}
