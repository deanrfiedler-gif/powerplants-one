"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { commissioningRecordHref } from "../../model";
import type { QueueRow, readView } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, ReadNotice, Tag, longDate, useCommissioningCommand, useRead } from "./commissioning-ui";

export type View = Awaited<ReturnType<typeof readView>>;
export type Detail = NonNullable<View["selected"]>;
export type ViewName = "basis" | "results" | "configuration" | "releases" | "handovers";

// One read per destination: the Engineering package's queue for that destination and, where the address names a
// commissioning package this reader may see, that package in full. After any accepted command both it and the
// shell's counts are read again, so nothing on screen is a remembered number.
export function useView(view: ViewName) {
  const { packageId, recordId, reloadFrame } = useCommissioning();
  const read = useRead<View>(`engineering/${packageId}/commissioning/${view}${recordId ? `?record=${recordId}` : ""}`);
  const reload = () => { read.reload(); reloadFrame(); };
  return { ...read, reload, packageId, recordId };
}
export function useSelect() {
  const router = useRouter(), path = usePathname(), search = useSearchParams();
  return (recordId: string | null, extra: Record<string, string | null> = {}) => {
    const q = new URLSearchParams(search.toString());
    if (recordId) q.set("record", recordId); else q.delete("record");
    q.delete("panel");
    for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v); else q.delete(k);
    router.push(`${path}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };
}
// A panel named in the address (?panel=redlines, ?panel=defects…) is scrolled to and focused once it exists.
export function usePanelFocus(ready: boolean) {
  const panel = useSearchParams().get("panel");
  useEffect(() => {
    if (!ready || !panel) return;
    const target = document.getElementById(`cm-panel-${panel}`);
    if (target) { target.scrollIntoView({ block: "start" }); target.focus({ preventScroll: true }); }
  }, [ready, panel]);
}

// The queue of one destination: a flush table of every commissioning package of this Engineering package, with the
// three facts that destination is about. Opening a row selects it; it records nothing.
export function Queue({ view, columns, label }: { view: ReturnType<typeof useView>; columns: [string, string, string]; label: string }) {
  const select = useSelect(), rows: QueueRow[] = view.data?.queue ?? [];
  return (
    <div className="em-table-scroll" data-stale={view.stale || undefined}>
      <table className="em-table cm-queue-table">
        <caption className="mw-sr">{label}. Opening a package shows its detail below; it approves, issues and completes nothing.</caption>
        <thead><tr><th scope="col"><span>Package</span></th><th scope="col"><span>Area / system</span></th>{columns.map((c) => <th key={c} scope="col"><span>{c}</span></th>)}<th scope="col"><span>State</span></th><th scope="col"><span>Owner / due</span></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} data-inspected={r.id === view.recordId || undefined} onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button,input,label")) select(r.id); }}>
              <td className="cm-col-package"><Link className="em-row-title" href={`?package=${view.packageId}&record=${r.id}`} scroll={false} aria-label={`Open ${r.reference}, ${r.title}`}>{r.title}</Link><span className="em-cell-sub">{r.reference}</span></td>
              <td data-label="Area / system">{r.area}<span className="em-cell-sub">{r.system_name}</span></td>
              {r.cells.map((cell, i) => <td key={i} data-label={columns[i]}>{cell}</td>)}
              <td data-label="State"><Tag view={r.state_view} /></td>
              <td data-label="Owner / due">{r.owner_name ?? "Unassigned"}<span className="em-cell-sub">{longDate(r.due)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {view.data && !rows.length && <div className="em-empty"><strong>No commissioning packages yet</strong><p>{view.data.can.edit ? "Create the first commissioning package from the context row above." : "Nothing has been prepared for this Engineering package."}</p></div>}
      {!view.data && view.loading && <div className="em-empty"><p>Loading…</p></div>}
    </div>
  );
}

export function Page({ view, label, empty, columns, children }: { view: ReturnType<typeof useView>; label: string; empty: string; columns: [string, string, string]; children: (d: Detail) => React.ReactNode }) {
  const data = view.data;
  usePanelFocus(!!data?.selected);
  return (
    <div className="cm-page" aria-busy={view.loading} aria-label={label}>
      <ReadNotice error={view.error} what={label} />
      <section className="cm-flush" aria-label={`${label}: packages`}><Queue view={view} columns={columns} label={label} /></section>
      {data?.selection === "Unavailable" && (
        // Nothing from an earlier selection stays on screen under this address.
        <div className="cm-detail"><div className="mw-notice" role="alert"><strong>Commissioning package unavailable</strong><p>This package does not exist in this Engineering package, or this identity cannot read it. Nothing is shown in its place. Choose a package from the list above.</p></div></div>
      )}
      {data?.selection === "None" && <div className="em-empty"><strong>Select a commissioning package</strong><p>{empty}</p></div>}
      {data?.selected && <div className="cm-detail" data-stale={view.stale || undefined}>{children(data.selected)}</div>}
    </div>
  );
}

export function DetailHead({ d, children }: { d: Detail; children?: React.ReactNode }) {
  const { href } = useCommissioning(), i = d.inspector;
  return (
    <header className="cm-detail-head">
      <div>
        <span className="cm-ref">{d.record.reference}</span>
        <h2>{d.record.title}</h2>
        <div className="cm-facts">
          <span>{d.record.area} · {d.record.system_name}</span>
          {i.tags.map((t) => <Tag key={t.label} view={t} />)}
          <Tag view={d.source_condition.view} />
        </div>
      </div>
      <div className="em-actions">
        {children}
        <Link className="mw-button mw-button-quiet" href={href("register", { record: d.record.id })}>Open in register</Link>
        <Link className="mw-button mw-button-quiet" href={commissioningRecordHref(d.record.id)}>Open full record</Link>
      </div>
    </header>
  );
}

// A positive action with a reason it cannot be taken shows that reason beside it, and stays disabled.
export function useAct(onSaved: () => void) {
  const command = useCommissioningCommand(onSaved);
  return { command, notice: <CommandNotice command={command} /> };
}
export function Refusal({ reason }: { reason: string | null }) {
  return reason ? <p className="cm-note" role="note">{reason}</p> : null;
}
