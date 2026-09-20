"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useIdentity } from "../../../../components/business-session";
import { changeViews, changesHref, changesPath, type ChangeViewId } from "../../../../shell/navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../../../../shell/secondary-menu";
import type { readEntry, readRegister } from "../../reads";
import { Icon, Outline, ReadNotice, useRead, type IconName, type OutlineName } from "./changes-ui";

type Frame = Awaited<ReturnType<typeof readRegister>>;
type Entry = Awaited<ReturnType<typeof readEntry>>;

// Presentation only, kept per workspace and person in this browser under EN-07's own versioned key. It never touches
// My Work's or EN-06's key or default, holds no record and grants nothing; an unreadable value falls back safely.
// First use is collapsed (the register decision carried forward from EN-06); after that the person's choice stands.
const preferenceEvent = "ppo-changes-layout";
type Preference = { menu: "open" | "closed"; columns: string[] };
const defaults: Preference = { menu: "closed", columns: [] };
function parsePreference(raw: string | null): Preference {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v?.schema_version !== 1) return defaults;
    return { menu: v.menu === "open" ? "open" : "closed", columns: Array.isArray(v.columns) ? (v.columns as unknown[]).filter((c): c is string => typeof c === "string").slice(0, 16) : [] };
  } catch {
    return defaults;
  }
}
function usePreference(key: string) {
  const memory = useRef<string | null>(null);
  const read = () => {
    try { return localStorage.getItem(key) ?? memory.current; } catch { return memory.current; }
  };
  const raw = useSyncExternalStore(
    (notify) => {
      window.addEventListener(preferenceEvent, notify);
      window.addEventListener("storage", notify);
      return () => { window.removeEventListener(preferenceEvent, notify); window.removeEventListener("storage", notify); };
    },
    read,
    () => null,
  );
  const preference = useMemo(() => parsePreference(raw), [raw]);
  const save = useCallback((next: Preference) => {
    const value = JSON.stringify({ schema_version: 1, ...next });
    memory.current = value;
    try { localStorage.setItem(key, value); } catch { /* Private browsing: the choice lasts for this visit only. */ }
    window.dispatchEvent(new Event(preferenceEvent));
  }, [key]);
  return [preference, save] as const;
}

type ChangesContext = {
  packageId: string; changeId: string | null; frame: Frame | null; reloadFrame: () => void; announce: (message: string) => void;
  selection: string[]; setSelection: (next: string[]) => void; hiddenColumns: string[]; setHiddenColumns: (columns: string[]) => void;
  href: (view: ChangeViewId, extra?: Record<string, string | null>) => string;
};
const Context = createContext<ChangesContext | null>(null);
export function useChanges() {
  const value = useContext(Context);
  if (!value) throw Error("Change views render inside the changes shell");
  return value;
}

const viewIcons: Record<ChangeViewId, { icon?: IconName; outline?: OutlineName }> = {
  register: { icon: "register" }, impact: { icon: "mapping" }, reviews: { icon: "review" }, handovers: { outline: "people" }, verification: { outline: "retest" }, history: { icon: "history" },
};

export function ChangesShell({ packageId, children }: { packageId: string; children: React.ReactNode }) {
  const identity = useIdentity(), path = usePathname(), router = useRouter(), search = useSearchParams();
  const [preference, savePreference] = usePreference(`ppo.changes.layout.v1:${identity.workspace_id}:${identity.actor_id}`);
  const menuState = useSecondaryMenu(preference.menu === "open", (open) => savePreference({ ...preference, menu: open ? "open" : "closed" }));
  const changeId = search.get("change");
  // One light read for what every destination shares: context, duties and the menu's own counts.
  const frame = useRead<Frame>(`engineering/${packageId}/changes?page_size=1`);
  const packages = useRead<Entry>("engineering/changes");
  const [message, setMessage] = useState("");
  // Checkbox selection belongs to one package and person. It never follows a change of either.
  const scope = `${identity.actor_id}:${packageId}`;
  const [picked, setPicked] = useState<{ scope: string; ids: string[] }>({ scope, ids: [] });
  const selection = picked.scope === scope ? picked.ids : [];
  const current = changesPath(path)?.view?.id ?? "register";
  // The selected change travels between destinations; filters and pages belong to the view that made them.
  const href = useCallback((view: ChangeViewId, extra: Record<string, string | null> = {}) => {
    const q = new URLSearchParams();
    const change = "change" in extra ? extra.change : changeId;
    if (change) q.set("change", change);
    for (const [k, v] of Object.entries(extra)) if (v && k !== "change") q.set(k, v);
    const text = q.toString();
    return `${changesHref(packageId, view)}${text ? `?${text}` : ""}`;
  }, [packageId, changeId]);
  const value: ChangesContext = {
    packageId, changeId, frame: frame.data, reloadFrame: frame.reload, announce: setMessage, selection, setSelection: (ids) => setPicked({ scope, ids }),
    hiddenColumns: preference.columns, setHiddenColumns: (columns) => savePreference({ ...preference, columns }), href,
  };
  const data = frame.data;
  const badge = (view: ChangeViewId) => (view === "reviews" ? data?.menu.reviews : view === "handovers" ? data?.menu.handovers : undefined);
  const badgeLabel = (view: ChangeViewId, n: number) => (view === "reviews" ? `${n} change${n === 1 ? "" : "s"} in review in this package` : `${n} request${n === 1 ? "" : "s"} awaiting an outcome in this package`);
  const menu = (
    <>
      <div className="mw-menu-title">
        <strong>Engineering changes</strong>
        <span>Engineering workspace</span>
      </div>
      <nav aria-label="Engineering change views">
        <ul>
          {changeViews.map((v) => {
            const n = badge(v.id), glyph = viewIcons[v.id];
            return (
              <li key={v.id}>
                <Link href={href(v.id)} aria-current={current === v.id ? "page" : undefined} onClick={() => menuState.closeOverlay(false)}>
                  {glyph.icon ? <Icon name={glyph.icon} /> : <Outline name={glyph.outline!} />}
                  <span>{v.label}</span>
                  {/* Unavailable is not zero: a badge appears only for a real, positive count of this permitted package. */}
                  {typeof n === "number" && n > 0 && <span className="mw-badge" aria-label={badgeLabel(v.id, n)}>{n}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
  return (
    <Context.Provider value={value}>
      <SecondaryMenuFrame state={menuState} id="ppo-changes" name="Engineering changes" menuId="ec-menu" contentId="ec-content" attributes={{ "data-view": current }} menu={menu} message={message}>
        <div className="em-workspace">
          {/* The visible title lives in the header breadcrumb; the page keeps one real heading for assistive technology. */}
          <h1 className="mw-sr">Engineering Change-Impact Review: {changeViews.find((v) => v.id === current)?.label}</h1>
          <header className="em-context" aria-label="Package context">
            <label className="em-context-cell em-context-project">
              <span>{data?.package.context_kind ?? "Project"}</span>
              {/* The picker resolves the Engineering package. The Project title shown beside it is context, never the package's identity. */}
              <select aria-label="Engineering package" value={packageId} onChange={(e) => router.push(changesHref(e.target.value, current))}>
                {!packages.data?.items.some((p) => p.id === packageId) && <option value={packageId}>{data?.package.context_title ?? "Loading…"}</option>}
                {packages.data?.items.map((p) => <option key={p.id} value={p.id}>{p.context_title} · {p.reference}</option>)}
              </select>
              <small>{data ? `${data.package.context_reference} · ${data.package.reference}` : " "}</small>
            </label>
            <div className="em-context-cell"><span>Customer</span><strong>{data?.package.customer_name ?? "…"}</strong></div>
            <div className="em-context-cell"><span>Site</span><strong>{data ? (data.package.site_name ?? "No site recorded") : "…"}</strong></div>
            <div className="em-context-cell em-context-set"><span>Engineering package</span><strong>{data?.package.title ?? "…"}</strong></div>
            <div className="em-context-actions">
              {data?.can.edit && <Link className="mw-button mw-button-primary" href={href("register", { new: "1" })}><Icon name="plus" /><span>New change</span></Link>}
            </div>
          </header>
          <ReadNotice error={frame.error} what="Engineering changes" />
          {children}
        </div>
      </SecondaryMenuFrame>
    </Context.Provider>
  );
}
