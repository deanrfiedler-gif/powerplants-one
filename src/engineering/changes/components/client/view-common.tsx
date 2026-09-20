"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { sourcePresentation, stagePresentation, decisionPresentation } from "../../model";
import type { readView } from "../../reads";
import { useChanges } from "./changes-shell";
import { CommandNotice, ReadNotice, Tone, stampText, text, useChangeCommand, useRead } from "./changes-ui";

export type View = Awaited<ReturnType<typeof readView>>;
export type Detail = NonNullable<View["selected"]>;
export type ViewName = "impact" | "reviews" | "handovers" | "verification";

// One read per destination: the package queue for that destination and, where the address names a change this
// reader may see, that change in full. After any accepted command both it and the shell's counts are read again.
export function useView(view: ViewName) {
  const { packageId, changeId, reloadFrame } = useChanges();
  const read = useRead<View>(`engineering/${packageId}/changes/${view}${changeId ? `?change=${changeId}` : ""}`);
  const reload = () => { read.reload(); reloadFrame(); };
  return { ...read, reload, packageId, changeId };
}
export function useSelect() {
  const router = useRouter(), path = usePathname(), search = useSearchParams();
  return (changeId: string | null, extra: Record<string, string | null> = {}) => {
    const q = new URLSearchParams(search.toString());
    if (changeId) q.set("change", changeId); else q.delete("change");
    for (const k of ["panel", "record"]) q.delete(k);
    for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
    router.push(`${path}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };
}
// A panel named in the address (?panel=commercial, ?panel=sources…) is scrolled to and focused once it exists.
export function usePanelFocus(ready: boolean) {
  const panel = useSearchParams().get("panel");
  useEffect(() => {
    if (!ready || !panel) return;
    const target = document.getElementById(`ec-panel-${panel}`);
    if (target) { target.scrollIntoView({ block: "start" }); target.focus({ preventScroll: true }); }
  }, [ready, panel]);
}

export function Page({ view, label, empty, children, queue }: { view: ReturnType<typeof useView>; label: string; empty: string; queue: React.ReactNode; children: (d: Detail) => React.ReactNode }) {
  const data = view.data;
  return (
    <div className="ec-page" aria-busy={view.loading} aria-label={label}>
      <ReadNotice error={view.error} what={label} />
      <section className="ec-flush" aria-label={`${label} queue`}>{queue}</section>
      {data?.selection === "Unavailable" && (
        // Nothing from an earlier selection stays on screen under this address.
        <div className="ec-detail"><div className="mw-notice" role="alert"><strong>Change unavailable</strong><p>This change does not exist in this package, or this identity cannot read it. Nothing is shown in its place. Choose a change from the list above.</p></div></div>
      )}
      {data?.selection === "None" && <div className="em-empty"><strong>Select a change</strong><p>{empty}</p></div>}
      {data?.selected && <div className="ec-detail" data-stale={view.stale || undefined}>{children(data.selected)}</div>}
      {!data && view.loading && <div className="em-empty"><p>Loading…</p></div>}
    </div>
  );
}

export function DetailHead({ d, children }: { d: Detail; children?: React.ReactNode }) {
  const { href } = useChanges(), i = d.inspector;
  return (
    <header className="ec-detail-head">
      <div>
        <span className="ec-inspector-ref">{d.change.reference} · revision {d.revision.number} ({text(d.revision.state).toLowerCase()})</span>
        <h2>{d.change.title}</h2>
        <div className="ec-facts">
          <span>{d.change.location} · {d.change.system_name}</span>
          <Tone view={stagePresentation[d.change.stage]} />
          <span>Technical decision: <Tone view={decisionPresentation(i.decision)} /></span>
          <span>Implementation: <Tone view={i.implementation.view} /></span>
          <Tone view={sourcePresentation[i.sources.condition]} />
          <span className="mw-muted">{i.sources.checked_at ? `checked ${stampText(i.sources.checked_at)}` : "no source check recorded"}</span>
        </div>
      </div>
      <div className="em-actions">
        {children}
        <Link className="mw-button mw-button-quiet" href={href("register", { change: d.change.id })}>Open in register</Link>
      </div>
    </header>
  );
}

// A positive action with a reason it cannot be taken shows that reason beside it, and stays disabled.
export function useAct(onSaved: () => void) {
  const command = useChangeCommand(onSaved);
  return { command, notice: <CommandNotice command={command} /> };
}
export const lines = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);
