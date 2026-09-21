"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useIdentity } from "../../../../components/business-session";
import { commissioningHref, commissioningPath, commissioningViews, type CommissioningViewId } from "../../../../shell/navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../../../../shell/secondary-menu";
import type { readEntry, readRegister } from "../../reads";
import { Icon, Outline, ReadNotice, useRead, type IconName, type OutlineName } from "./commissioning-ui";

type Frame = Awaited<ReturnType<typeof readRegister>>;
type Entry = Awaited<ReturnType<typeof readEntry>>;

// Presentation only, kept per workspace and person in this browser under EN-08's own versioned key. It never touches
// My Work's, EN-06's or EN-07's key or default, holds no business record and grants nothing; an unreadable value falls
// back safely. First use is collapsed; after that the person's choice stands. A temporary overlay never changes it.
const preferenceEvent = "ppo-commissioning-layout";
type Preference = { menu: "open" | "closed"; columns: string[]; package_id: string | null };
const defaults: Preference = { menu: "closed", columns: [], package_id: null };
function parsePreference(raw: string | null): Preference {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v?.schema_version !== 1) return defaults;
    return {
      menu: v.menu === "open" ? "open" : "closed",
      columns: Array.isArray(v.columns) ? (v.columns as unknown[]).filter((c): c is string => typeof c === "string").slice(0, 16) : [],
      package_id: typeof v.package_id === "string" && /^[a-f0-9-]{36}$/.test(v.package_id) ? v.package_id : null,
    };
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

type CommissioningContext = {
  packageId: string; recordId: string | null; frame: Frame | null; reloadFrame: () => void; announce: (message: string) => void;
  optionalColumns: string[]; setOptionalColumns: (columns: string[]) => void;
  href: (view: CommissioningViewId, extra?: Record<string, string | null>) => string;
};
const Context = createContext<CommissioningContext | null>(null);
export function useCommissioning() {
  const value = useContext(Context);
  if (!value) throw Error("Commissioning views render inside the commissioning shell");
  return value;
}

const viewIcons: Record<CommissioningViewId, { icon?: IconName; outline?: OutlineName }> = {
  register: { icon: "register" }, basis: { outline: "basis" }, results: { outline: "results" }, configuration: { outline: "redline" }, releases: { outline: "release" }, handovers: { outline: "history" },
};

// packageOverride is given by the full record route, whose address names only the commissioning package.
export function CommissioningShell({ children, packageOverride = null, recordOverride = null }: { children: React.ReactNode; packageOverride?: string | null; recordOverride?: string | null }) {
  const identity = useIdentity(), path = usePathname(), router = useRouter(), search = useSearchParams();
  const [preference, savePreference] = usePreference(`ppo.commissioning.layout.v1:${identity.workspace_id}:${identity.actor_id}`);
  const menuState = useSecondaryMenu(preference.menu === "open", (open) => savePreference({ ...preference, menu: open ? "open" : "closed" }));
  const located = commissioningPath(path), onRecord = !!located?.record_id, current = located?.view?.id ?? "register";
  const packageId = packageOverride ?? search.get("package"), recordId = recordOverride ?? search.get("record");
  const packages = useRead<Entry>("engineering/commissioning");
  // One light read for what every destination shares: context, duties and the menu's own counts.
  const frame = useRead<Frame>(`engineering/${packageId ?? "00000000-0000-4000-8000-000000000000"}/commissioning?page_size=1`);
  const [message, setMessage] = useState("");
  // With no package in the address, the last one this person used here is offered again, then the first they may read.
  // The address always names the package that is shown: nothing is ever displayed under another package's header.
  useEffect(() => {
    if (packageId || onRecord || !packages.data) return;
    const chosen = packages.data.items.find((p) => p.id === preference.package_id) ?? packages.data.items.find((p) => p.records.total > 0) ?? packages.data.items[0];
    if (chosen) router.replace(commissioningHref(current, { package: chosen.id }), { scroll: false });
  }, [packageId, onRecord, packages.data, preference.package_id, current, router]);
  useEffect(() => {
    if (packageId && frame.data && preference.package_id !== packageId) savePreference({ ...preference, package_id: packageId });
  }, [packageId, frame.data, preference, savePreference]);
  // The selected package travels between destinations; filters and pages belong to the view that made them.
  const href = useCallback((view: CommissioningViewId, extra: Record<string, string | null> = {}) => {
    const base = commissioningHref(view, { package: packageId, record: "record" in extra ? extra.record : recordId, panel: extra.panel ?? null });
    const more = Object.entries(extra).filter(([k, v]) => v && !["record", "panel"].includes(k)).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`).join("&");
    return more ? `${base}${base.includes("?") ? "&" : "?"}${more}` : base;
  }, [packageId, recordId]);
  const data = packageId ? frame.data : null;
  const badge = (view: CommissioningViewId) => (view === "results" ? data?.menu.results : view === "releases" ? data?.menu.releases : view === "handovers" ? data?.menu.handovers : undefined);
  const badgeLabel = (view: CommissioningViewId, n: number) => (view === "results" ? `${n} test attempt${n === 1 ? "" : "s"} awaiting evidence review in this Engineering package`
    : view === "releases" ? `${n} release candidate${n === 1 ? "" : "s"} awaiting a decision or issue in this Engineering package` : `${n} receiving request${n === 1 ? "" : "s"} without an accepted outcome in this Engineering package`);
  const menu = (
    <>
      <div className="mw-menu-title">
        <strong>Commissioning</strong>
        <span>Engineering workspace</span>
      </div>
      <nav aria-label="Commissioning views">
        <ul>
          {commissioningViews.map((v) => {
            const n = badge(v.id), glyph = viewIcons[v.id];
            return (
              <li key={v.id}>
                <Link href={href(v.id, { panel: null })} aria-current={current === v.id && !onRecord ? "page" : undefined} onClick={() => menuState.closeOverlay(false)}>
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
  const heading = onRecord ? "Commissioning package" : commissioningViews.find((v) => v.id === current)?.heading;
  return (
    <SecondaryMenuFrame presentation="baseline" state={menuState} id="ppo-commissioning" name="Commissioning" menuId="cm-menu" contentId="cm-content" attributes={{ "data-view": onRecord ? "record" : current }} menu={menu} message={message}>
      <div className="em-workspace">
        {/* The visible title lives in the header breadcrumb; the page keeps one real heading for assistive technology. */}
        <h1 className="mw-sr">Commissioning Basis &amp; As-Built Release: {heading}</h1>
        <header className="em-context" aria-label="Engineering package context">
          <label className="em-context-cell em-context-project">
            <span>{data?.package.context_kind ?? "Project"}</span>
            {/* The picker resolves the Engineering package. The Project title beside it is context, never the package's identity. */}
            <select aria-label="Engineering package" value={packageId ?? ""} onChange={(e) => router.push(commissioningHref(onRecord ? "register" : current, { package: e.target.value }))}>
              {!packageId && <option value="">Choose an Engineering package…</option>}
              {packageId && !packages.data?.items.some((p) => p.id === packageId) && <option value={packageId}>{data?.package.context_title ?? "Loading…"}</option>}
              {packages.data?.items.map((p) => <option key={p.id} value={p.id}>{p.context_title} · {p.reference}</option>)}
            </select>
            <small>{data ? `${data.package.context_reference} · ${data.package.reference}` : " "}</small>
          </label>
          <div className="em-context-cell"><span>Customer</span><strong>{data?.package.customer_name ?? "…"}</strong></div>
          <div className="em-context-cell"><span>Site</span><strong>{data ? (data.package.site_name ?? "No site recorded") : "…"}</strong></div>
          <div className="em-context-actions">
            {data?.can.edit && packageId && (
              <Link className="mw-button mw-button-primary" href={`${commissioningHref("register", { package: packageId })}&new=1`} aria-label="Create commissioning package"><Icon name="plus" /><span>Commissioning package</span></Link>
            )}
          </div>
        </header>
        {packageId ? (
          <Context.Provider value={{ packageId, recordId, frame: frame.data, reloadFrame: frame.reload, announce: setMessage, optionalColumns: preference.columns, setOptionalColumns: (columns) => savePreference({ ...preference, columns }), href }}>
            <ReadNotice error={frame.error} what="Commissioning" />
            {children}
          </Context.Provider>
        ) : (
          <div className="em-empty">
            <ReadNotice error={packages.error} what="Engineering packages" />
            {packages.data && !packages.data.items.length ? <><strong>No Engineering package to show</strong><p>This identity can read no Engineering package. A commissioning package belongs to one; packages are requested from Engineering.</p></> : <p>Loading…</p>}
          </div>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
