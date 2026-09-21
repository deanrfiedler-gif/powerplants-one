"use client";
import Link from "next/link";
import { useState } from "react";
import { changesHref } from "../../../../shell/navigation";
import type { readEntry } from "../../reads";
import { Icon, ReadNotice, useRead } from "./changes-ui";

type Entry = Awaited<ReturnType<typeof readEntry>>;
// Entry to EN-07: choose a permitted Engineering package. No fixture is named here, and a Project's identity is never
// offered in place of the package's.
export function EntryView() {
  const [q, setQ] = useState(""), entry = useRead<Entry>(`engineering/changes${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  return (
    <section id="ppo-changes" data-module-layout="full-bleed" data-menu="collapsed" aria-label="Engineering Change-Impact Review">
      <div className="mw-content">
        <div className="em-page">
          <header className="em-page-head"><h1 className="mw-sr">Engineering Change-Impact Review</h1><h2>Choose an Engineering package</h2>
            <p>Engineering changes belong to one Engineering package. What a proposed change affects, who decides it, who receives it and what proves it are kept together there.</p></header>
          <label className="em-search" style={{ maxWidth: 420 }}><Icon name="search" /><span className="mw-sr">Search packages</span><input type="search" placeholder="Search packages" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <ReadNotice error={entry.error} what="Engineering packages" />
          <section className="em-panel" aria-busy={entry.loading}>
            <ul className="em-list">
              {entry.data?.items.map((p) => (
                <li key={p.id}><div><Link className="em-row-title" href={changesHref(p.id)}>{p.title}</Link><p>{p.reference} · {p.discipline} · {p.context_kind} {p.context_reference}: {p.context_title} · {p.customer_name}</p></div>
                  <span className="mw-muted">{p.changes.total ? `${p.changes.open} open of ${p.changes.total} change${p.changes.total === 1 ? "" : "s"}` : "No changes yet"}</span></li>
              ))}
            </ul>
            {entry.data && !entry.data.items.length && <div className="em-empty"><strong>No Engineering package to show</strong><p>{q ? "Nothing matches that search." : "This identity can read no Engineering package. Packages are requested from Engineering."}</p></div>}
            {!entry.data && entry.loading && <div className="em-empty"><p>Loading packages…</p></div>}
          </section>
          {entry.data?.has_more && <p className="ec-note">More packages exist. Search to narrow the list.</p>}
        </div>
      </div>
    </section>
  );
}
