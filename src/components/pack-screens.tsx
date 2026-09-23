"use client";
import Link from "next/link";
import {
  useResource,
  ErrorNotice,
  ReadState,
  isDenied,
  type Envelope,
  Stamp,
  RegisterHeading,
} from "./business-ui";
import type { Pack, PackIssue as Issue } from "../documents/components/client/job-pack-types";
// The pack detail page and its first-preparation view are
// src/documents/components/client/job-pack-screen.tsx. This file keeps the register and the exact
// issued document screen.
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
