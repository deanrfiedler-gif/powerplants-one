"use client";
import type { ReactNode } from "react";
import { PageHeader } from "../business-ui";

/** Shared-record composition: the host owns authorised data and command authority. */
export function SharedRecord({
  id,
  title,
  reference,
  status,
  meta,
  actions,
  sources,
  facts,
  tabs,
  children,
  stickyAction,
}: {
  id: string;
  title: string;
  reference: string;
  status: ReactNode;
  meta: ReactNode;
  actions: ReactNode;
  sources: ReactNode;
  facts: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
  stickyAction?: ReactNode;
}) {
  return (
    <section id={id} className="shared-record" data-module-layout="full-bleed">
      <header className="shared-record-header">
        <div>
          <PageHeader title={title} eyebrow={reference} />
          <div className="shared-record-meta">
            {status}
            {meta}
          </div>
        </div>
        <div className="shared-record-actions">{actions}</div>
      </header>
      <div
        className="shared-record-sources"
        aria-label="Sources for this customer"
      >
        {sources}
      </div>
      <div className="shared-record-body">
        <aside className="shared-record-facts" aria-label="Record details">
          {facts}
        </aside>
        <div className="shared-record-workspace">
          {tabs}
          <div className="shared-record-content">{children}</div>
        </div>
      </div>
      {stickyAction && (
        <div className="shared-record-sticky">{stickyAction}</div>
      )}
    </section>
  );
}

export function RecordFactSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="shared-record-fact-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function RecordSourceState({
  title,
  state,
  children,
  retry,
}: {
  title: string;
  state: string;
  children?: ReactNode;
  retry?: () => void;
}) {
  const label =
    state === "Not configured"
      ? "Not connected"
      : state === "Unavailable"
        ? "Could not be read"
        : state;
  return (
    <div className="shared-record-source-state" data-state={state}>
      <strong>
        {title} · {label}
      </strong>
      {children}
      {state === "Unavailable" && retry && (
        <button type="button" className="secondary" onClick={retry}>
          Retry {title.toLowerCase()}
        </button>
      )}
    </div>
  );
}
