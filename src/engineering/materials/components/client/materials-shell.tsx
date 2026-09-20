"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useIdentity } from "../../../../components/business-session";
import { materialViews, materialsHref, materialsPath, type MaterialViewId } from "../../../../shell/navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../../../../shell/secondary-menu";
import type { readEntry, readRegister } from "../../reads";
import { Icon, ReadNotice, revisionText, useRead, type IconName } from "./materials-ui";

type Frame = Awaited<ReturnType<typeof readRegister>>;
type Entry = Awaited<ReturnType<typeof readEntry>>;
type Selection = Record<string, string>; // line id -> release quantity

// Presentation only, kept per workspace and person in this browser under EN-06's own versioned key. It never
// touches My Work's key or default, holds no record and grants nothing; an unreadable value falls back safely.
const preferenceEvent = "ppo-materials-layout";
type Preference = { menu: "open" | "closed"; columns: string[] };
const defaults: Preference = { menu: "closed", columns: [] };
function parsePreference(raw: string | null): Preference {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v?.schema_version !== 1) return defaults;
    return { menu: v.menu === "open" ? "open" : "closed", columns: Array.isArray(v.columns) ? (v.columns as unknown[]).filter((c): c is string => typeof c === "string").slice(0, 12) : [] };
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

type MaterialsContext = {
  packageId: string; setId: string | null; frame: Frame | null; reloadFrame: () => void; announce: (message: string) => void;
  selection: Selection; setSelection: (next: Selection) => void; hiddenColumns: string[]; setHiddenColumns: (columns: string[]) => void;
  href: (view: MaterialViewId, extra?: Record<string, string | null>) => string;
};
const Context = createContext<MaterialsContext | null>(null);
export function useMaterials() {
  const value = useContext(Context);
  if (!value) throw Error("Material views render inside the materials shell");
  return value;
}

const viewIcons: Record<MaterialViewId, IconName> = { register: "register", mapping: "mapping", substitutions: "swap", releases: "review", handover: "truck", history: "history" };

export function MaterialsShell({ packageId, children }: { packageId: string; children: React.ReactNode }) {
  const identity = useIdentity(), path = usePathname(), router = useRouter(), search = useSearchParams();
  const [preference, savePreference] = usePreference(`ppo.materials.layout.v1:${identity.workspace_id}:${identity.actor_id}`);
  const menuState = useSecondaryMenu(preference.menu === "open", (open) => savePreference({ ...preference, menu: open ? "open" : "closed" }));
  const setId = search.get("set");
  // One light read for what every destination shares: context, sets, duties and the menu's own count.
  const frame = useRead<Frame>(`engineering/${packageId}/materials?page_size=1${setId ? `&set=${setId}` : ""}`);
  const packages = useRead<Entry>("engineering/materials");
  const [message, setMessage] = useState("");
  // Checkbox selection belongs to one package, set and person. It never follows a change of any of them.
  const scope = `${identity.actor_id}:${packageId}:${setId ?? ""}`;
  const [picked, setPicked] = useState<{ scope: string; lines: Selection }>({ scope, lines: {} });
  const selection = picked.scope === scope ? picked.lines : {};
  const current = materialsPath(path)?.view?.id ?? "register";
  const href = useCallback((view: MaterialViewId, extra: Record<string, string | null> = {}) => {
    const q = new URLSearchParams();
    if (setId) q.set("set", setId);
    for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
    const text = q.toString();
    return `${materialsHref(packageId, view)}${text ? `?${text}` : ""}`;
  }, [packageId, setId]);
  const value: MaterialsContext = {
    packageId, setId, frame: frame.data, reloadFrame: frame.reload, announce: setMessage, selection,
    setSelection: (lines) => setPicked({ scope, lines }), hiddenColumns: preference.columns, setHiddenColumns: (columns) => savePreference({ ...preference, columns }), href,
  };
  const data = frame.data, open = data?.menu.substitutions_open;
  const menu = (
    <>
      <div className="mw-menu-title">
        <strong>Materials &amp; substitutions</strong>
        <span>Engineering workspace</span>
      </div>
      <nav aria-label="Materials and substitutions views">
        <ul>
          {materialViews.map((v) => (
            <li key={v.id}>
              <Link href={href(v.id)} aria-current={current === v.id ? "page" : undefined} onClick={() => menuState.closeOverlay(false)}>
                <Icon name={viewIcons[v.id]} />
                <span>{v.label}</span>
                {/* Unavailable is not zero: the badge appears only for a real, positive count of this set. */}
                {v.id === "substitutions" && typeof open === "number" && open > 0 && (
                  <span className="mw-badge" aria-label={`${open} proposed alternate${open === 1 ? "" : "s"} waiting`}>{open}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
  const set = data?.set;
  return (
    <Context.Provider value={value}>
      <SecondaryMenuFrame state={menuState} id="ppo-materials" name="Materials" menuId="em-menu" contentId="em-content" attributes={{ "data-view": current }} menu={menu} message={message}>
        <div className="em-workspace">
          {/* The visible title lives in the header breadcrumb; the page keeps a real heading for assistive technology. */}
          <h1 className="mw-sr">Released Materials &amp; Substitutions: {materialViews.find((v) => v.id === current)?.label}</h1>
          <header className="em-context" aria-label="Package context">
            <label className="em-context-cell em-context-project">
              <span>{data?.package.context_kind ?? "Project"}</span>
              <select aria-label="Engineering package" value={packageId} onChange={(e) => router.push(materialsHref(e.target.value, current))}>
                {!packages.data?.items.some((p) => p.id === packageId) && <option value={packageId}>{data?.package.context_title ?? "Loading…"}</option>}
                {packages.data?.items.map((p) => <option key={p.id} value={p.id}>{p.context_title} · {p.reference}</option>)}
              </select>
              <small>{data ? `${data.package.context_reference} · ${data.package.reference}` : " "}</small>
            </label>
            <div className="em-context-cell"><span>Customer</span><strong>{data?.package.customer_name ?? "…"}</strong></div>
            <div className="em-context-cell"><span>Site</span><strong>{data ? (data.package.site_name ?? "No site recorded") : "…"}</strong></div>
            <div className="em-context-cell em-context-set">
              <span>Material set</span>
              <div>
                {data && data.sets.length > 1 ? (
                  <select aria-label="Material set" value={set?.id ?? ""} onChange={(e) => router.push(`${materialsHref(packageId, current)}?set=${e.target.value}`)}>
                    {data.sets.map((s) => <option key={s.id} value={s.id}>{s.code} · {revisionText(s.revision)}</option>)}
                  </select>
                ) : <strong>{set ? `${set.code} · ${revisionText(set.revision)}` : data ? "None yet" : "…"}</strong>}
                {set && <span className="em-chip">{set.status}</span>}
              </div>
            </div>
            <div className="em-context-actions">
              {data?.can.edit && set && <Link className="mw-button" href={href("register", { new: "1" })}><Icon name="plus" /><span>Material requirement</span></Link>}
              {set && <Link className="mw-button mw-button-primary" href={href("releases", Object.keys(selection).length ? { prepare: "1" } : {})}>Review release set</Link>}
            </div>
          </header>
          <ReadNotice error={frame.error} what="Materials" />
          {children}
        </div>
      </SecondaryMenuFrame>
    </Context.Provider>
  );
}
