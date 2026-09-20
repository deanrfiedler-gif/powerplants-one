"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { materialsHref } from "../../../../shell/navigation";
import type { readEntry } from "../../reads";
import { Icon, ReadNotice, revisionText, useRead } from "./materials-ui";

type Entry = Awaited<ReturnType<typeof readEntry>>;
const lastKey = "ppo.materials.last-package.v1";

// Entry to EN-06. It lists the Engineering packages this identity may read and offers the one it last opened.
// It names no fixture: what appears is whatever the server permits.
export function EntryView() {
  const [draft, setDraft] = useState(""), [q, setQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setQ(draft.trim()), 300); return () => clearTimeout(t); }, [draft]);
  // A remembered shortcut is a convenience only: unreadable storage simply offers nothing.
  const last = useSyncExternalStore(() => () => {}, () => { try { return localStorage.getItem(lastKey); } catch { return null; } }, () => null);
  const read = useRead<Entry>(`engineering/materials${q ? `?q=${encodeURIComponent(q)}` : ""}`), data = read.data;
  const remember = (id: string) => { try { localStorage.setItem(lastKey, id); } catch { /* ignore */ } };
  const resume = data?.items.find((p) => p.id === last);
  return (
    <section id="ppo-materials" data-module-layout="full-bleed" data-menu="collapsed" aria-label="Released Materials and Substitutions">
      <div className="mw-content">
        <div className="em-page" aria-busy={read.loading}>
          <h1 className="mw-sr">Released Materials &amp; Substitutions</h1>
          <div className="em-page-head">
            <h2>Choose an Engineering package</h2>
            <p>Material requirements, substitutions, technical release and supply handover belong to one Engineering package. Packages appear here only where this identity may read them.</p>
          </div>
          <label className="em-search" style={{ flex: "none", maxWidth: 420 }}><Icon name="search" /><span className="mw-sr">Search packages</span><input type="search" placeholder="Search packages, projects or customers" value={draft} onChange={(e) => setDraft(e.target.value)} /></label>
          <ReadNotice error={read.error} what="Engineering packages" />
          {resume && <p className="mw-notice">Last opened: <Link className="mw-link" href={materialsHref(resume.id)} onClick={() => remember(resume.id)}>{resume.context_title} · {resume.reference} <Icon name="arrow-right" /></Link></p>}
          {data && (
            <section className="em-panel" aria-label="Packages">
              {data.items.length ? (
                <ul className="em-list">
                  {data.items.map((p) => (
                    <li key={p.id}>
                      <div>
                        <Link className="em-row-title" href={materialsHref(p.id)} onClick={() => remember(p.id)}>{p.context_title} · {p.title}</Link>
                        <p>{p.reference} · {p.context_kind} {p.context_reference} · {p.customer_name} · {p.discipline}</p>
                      </div>
                      <span className="mw-muted">{p.sets.length ? p.sets.map((s) => `Set ${s.code} ${revisionText(s.revision)} · ${s.lines} line${s.lines === 1 ? "" : "s"}`).join(" · ") : "No material set yet"}</span>
                    </li>
                  ))}
                </ul>
              ) : <div className="em-empty">{q ? <><strong>No packages match</strong><p>Clear the search to see every package you may read.</p></> : <><strong>No Engineering packages are available to this identity</strong><p>A package is requested from the Engineering workspace. Choose an identity with Engineering access to see existing ones.</p></>}</div>}
              {data.has_more && <p className="em-panel-body mw-muted">More packages exist than are shown. Search to narrow them.</p>}
            </section>
          )}
          <p><Link className="mw-link" href="/engineering"><Icon name="chevron-left" /> Engineering work packages</Link></p>
        </div>
      </div>
    </section>
  );
}
