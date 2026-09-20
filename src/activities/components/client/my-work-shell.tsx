"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useIdentity } from "../../../components/business-session";
import { api } from "../../../components/business-ui";
import { HeaderContent } from "../../../components/header-content";
import { useShell } from "../../../components/shell-provider";
import { workViews, workspaces, type WorkViewId } from "../../../shell/navigation";
import { criteriaSearch } from "../../work-criteria";
import type { readWorkNavigation } from "../../work-overview";
import type { WorkView } from "../../work-views";
import { Icon, useWorkResource, type IconName } from "./my-work-ui";

type Navigation = Awaited<ReturnType<typeof readWorkNavigation>>;
export type PanelId = "schedule" | "waiting" | "gaps";
export type Layout = { menu: "open" | "closed"; panels: PanelId[]; hidden: PanelId[] };
export const defaultLayout: Layout = { menu: "open", panels: ["schedule", "waiting", "gaps"], hidden: [] };
const panelIds: PanelId[] = ["schedule", "waiting", "gaps"];

// Layout preferences are presentation only, kept per person in this browser like the Leads
// column preferences. They hold no records and grant nothing; an unreadable value is ignored.
function parseLayout(raw: string | null): Layout {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v?.schema_version !== 1) return defaultLayout;
    const panels = Array.isArray(v.panels) ? (v.panels as unknown[]).filter((x): x is PanelId => panelIds.includes(x as PanelId)) : [];
    return {
      menu: v.menu === "closed" ? "closed" : "open",
      panels: [...new Set([...panels, ...panelIds])],
      hidden: Array.isArray(v.hidden) ? (v.hidden as unknown[]).filter((x): x is PanelId => panelIds.includes(x as PanelId)) : [],
    };
  } catch {
    return defaultLayout;
  }
}
const layoutEvent = "ppo-my-work-layout";
function useLayout(key: string) {
  const memory = useRef<string | null>(null);
  const read = () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return memory.current;
    }
  };
  const raw = useSyncExternalStore(
    (notify) => {
      window.addEventListener(layoutEvent, notify);
      window.addEventListener("storage", notify);
      return () => {
        window.removeEventListener(layoutEvent, notify);
        window.removeEventListener("storage", notify);
      };
    },
    read,
    () => null,
  );
  const layout = useMemo(() => parseLayout(raw), [raw]);
  const save = useCallback(
    (next: Layout) => {
      const value = JSON.stringify({ schema_version: 1, ...next });
      memory.current = value;
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Private browsing: the choice lasts for this visit only. */
      }
      window.dispatchEvent(new Event(layoutEvent));
    },
    [key],
  );
  return [layout, save] as const;
}

type Views = { version: number; views: WorkView[] };
type WorkContext = {
  navigation: Navigation | null;
  reloadNavigation: () => void;
  views: Views | null;
  viewsError: unknown;
  saveViews: (views: WorkView[]) => Promise<Views>;
  reloadViews: () => void;
  layout: Layout;
  saveLayout: (layout: Layout) => void;
  department: string;
  announce: (message: string) => void;
};
const Context = createContext<WorkContext | null>(null);
export function useMyWork() {
  const value = useContext(Context);
  if (!value) throw Error("My Work views render inside the My Work shell");
  return value;
}

const wideQuery = "(min-width: 1200px)";
const subscribeWide = (changed: () => void) => {
  const media = window.matchMedia(wideQuery);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
const viewIcons: Record<WorkViewId, IconName> = {
  overview: "grid",
  actions: "list",
  reviews: "review",
  waiting: "clock",
  team: "users",
  updates: "settings",
};

export function MyWorkShell({ children }: { children: React.ReactNode }) {
  const identity = useIdentity(),
    shell = useShell(),
    path = usePathname();
  const [layout, saveLayout] = useLayout(`ppo.work.layout.v1:${identity.workspace_id}:${identity.actor_id}`);
  // Wide screens dock the menu beside the rail and the content reflows; narrower screens
  // overlay it so task titles are never squeezed. The remembered choice applies when docked.
  const docked = useSyncExternalStore(subscribeWide, () => window.matchMedia(wideQuery).matches, () => true);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const open = docked ? layout.menu === "open" : overlayOpen;
  const overlay = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const navigation = useWorkResource<Navigation>("work/navigation", 120000),
    views = useWorkResource<Views>("work/views", 0);
  const [message, setMessage] = useState("");

  const toggle = (source: HTMLElement | null) => {
    if (docked) saveLayout({ ...layout, menu: open ? "closed" : "open" });
    else {
      opener.current = source;
      setOverlayOpen(!open);
    }
  };
  const closeOverlay = useCallback((restoreFocus = true) => {
    setOverlayOpen(false);
    if (restoreFocus && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const d = overlay.current;
    if (!d) return;
    if (!docked && overlayOpen && !d.open) d.showModal();
    if ((docked || !overlayOpen) && d.open) d.close();
  }, [docked, overlayOpen]);

  const saveViews = useCallback(
    async (next: WorkView[]) => {
      const saved = await api<Views>("work/views", { expected_version: views.data?.version ?? 0, views: next });
      views.reload();
      return saved;
    },
    [views],
  );
  const department = workspaces.find((w) => w.id === shell.preview)?.label ?? "Sales";
  const value: WorkContext = {
    navigation: navigation.data,
    reloadNavigation: navigation.reload,
    views: views.data,
    viewsError: views.error,
    saveViews,
    reloadViews: views.reload,
    layout,
    saveLayout,
    department,
    announce: setMessage,
  };

  const current = workViews.find((v) => v.href === path)?.id ?? "overview";
  const pinned = (views.data?.views ?? []).filter((v) => v.pinned);
  const reviewCount = navigation.data?.reviews.status === "ok" ? (navigation.data.reviews.total ?? 0) : 0;
  const teamOpen = navigation.data?.can_coordinate ?? false;
  const menu = (
    <>
      <div className="mw-menu-title">
        <strong>My Work</strong>
        <span>Personal workspace</span>
      </div>
      <nav aria-label="My Work views">
        <ul>
          {workViews
            .filter((v) => v.id !== "team" || teamOpen)
            .map((v) => (
              <li key={v.id}>
                <Link href={v.href} aria-current={current === v.id ? "page" : undefined} onClick={() => closeOverlay(false)}>
                  <Icon name={viewIcons[v.id]} />
                  <span>{v.label}</span>
                  {v.id === "reviews" && reviewCount > 0 && (
                    <span className="mw-badge" aria-label={`${reviewCount} awaiting your decision`}>
                      {reviewCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
      <div className="mw-menu-pinned">
        <h2>Pinned views</h2>
        {pinned.length ? (
          <ul>
            {pinned.map((v) => (
              <li key={v.id}>
                <Link
                  href={`${v.target === "overview" ? "/work" : `/work/${v.target}`}${criteriaSearch(v.criteria, v.id)}`}
                  onClick={() => closeOverlay(false)}
                >
                  <Icon name="bookmark" />
                  <span>{v.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{views.error ? "Saved views could not be loaded." : "Pin a saved view to keep it here."}</p>
        )}
      </div>
    </>
  );
  const label = open ? "Hide menu" : "Show menu";
  return (
    <Context.Provider value={value}>
      <section
        id="ppo-my-work"
        data-module-layout="full-bleed"
        data-menu={docked ? (open ? "docked" : "collapsed") : "overlay"}
        aria-label="My Work"
      >
        <HeaderContent slot="menu">
          <button
            type="button"
            className="ppo-menu-toggle"
            aria-expanded={open}
            aria-controls="mw-menu"
            onClick={(e) => toggle(e.currentTarget)}
          >
            <Icon name="panel" />
            <span>{label}</span>
          </button>
        </HeaderContent>
        {docked ? (
          <aside id="mw-menu" className="mw-menu" hidden={!open} aria-label="My Work menu">
            {menu}
          </aside>
        ) : (
          <dialog
            id="mw-menu"
            ref={overlay}
            className="mw-menu mw-menu-overlay"
            aria-label="My Work menu"
            onCancel={(e) => {
              e.preventDefault();
              closeOverlay();
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeOverlay();
            }}
          >
            <button type="button" className="mw-icon-button mw-menu-close" onClick={() => closeOverlay()} aria-label="Close menu">
              <Icon name="close" />
            </button>
            {menu}
          </dialog>
        )}
        <button
          type="button"
          className="mw-edge"
          aria-label={label}
          aria-expanded={open}
          aria-controls="mw-menu"
          title={label}
          onClick={(e) => toggle(e.currentTarget)}
        >
          <Icon name={open ? "chevron-left" : "chevron-right"} />
        </button>
        <div className="mw-content" id="mw-content">
          <div className="mw-phone-bar">
            <button type="button" className="mw-button" aria-expanded={open} aria-controls="mw-menu" onClick={(e) => toggle(e.currentTarget)}>
              <Icon name="panel" />
              <span>{label}</span>
            </button>
            <span>{workViews.find((v) => v.id === current)?.label}</span>
          </div>
          <p className="mw-live" role="status" aria-live="polite">
            {message}
          </p>
          {children}
        </div>
      </section>
    </Context.Provider>
  );
}
