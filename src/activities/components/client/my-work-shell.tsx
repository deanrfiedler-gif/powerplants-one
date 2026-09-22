"use client";
import Link from "next/link";
import { ShellIcon } from "../../../components/shell-icon";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useIdentity } from "../../../components/business-session";
import { api } from "../../../components/business-ui";
import { useShell } from "../../../components/shell-provider";
import { workViews, workspaces, type WorkViewId } from "../../../shell/navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../../../shell/secondary-menu";
import { criteriaSearch } from "../../work-criteria";
import type { readWorkNavigation } from "../../work-overview";
import type { WorkView } from "../../work-views";
import { Icon, useWorkResource, type IconName } from "./my-work-ui";

type Navigation = Awaited<ReturnType<typeof readWorkNavigation>>;
export type PanelId = "schedule" | "waiting" | "gaps";
// Weather is a personal presentation choice like the rest: whether the card shows, and the place
// last chosen for it. It holds no forecast and implies no provider.
export type Layout = { menu: "open" | "closed"; panels: PanelId[]; hidden: PanelId[]; weather: { hidden: boolean; location: string | null } };
export const defaultLayout: Layout = { menu: "open", panels: ["schedule", "waiting", "gaps"], hidden: [], weather: { hidden: false, location: null } };
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
      weather: {
        hidden: v.weather?.hidden === true,
        location: typeof v.weather?.location === "string" && v.weather.location.trim() ? v.weather.location.trim().slice(0, 80) : null,
      },
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
  // Phone presentation (mobile r07) and the Customise request the menu can raise for the overview.
  phone: boolean | null;
  customise: boolean;
  setCustomise: (open: boolean) => void;
};
const Context = createContext<WorkContext | null>(null);
export function useMyWork() {
  const value = useContext(Context);
  if (!value) throw Error("My Work views render inside the My Work shell");
  return value;
}

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
    path = usePathname(),
    router = useRouter();
  const [layout, saveLayout] = useLayout(`ppo.work.layout.v1:${identity.workspace_id}:${identity.actor_id}`);
  // Dock, overlay, header trigger, edge handle and focus return live in the shell's shared secondary
  // menu; this workspace owns only what the menu remembers and what it contains.
  const menuState = useSecondaryMenu(layout.menu === "open", (open) => saveLayout({ ...layout, menu: open ? "open" : "closed" }));
  const { phone, closeOverlay } = menuState;
  const [customise, setCustomise] = useState(false);
  const navigation = useWorkResource<Navigation>("work/navigation", 120000),
    views = useWorkResource<Views>("work/views", 0);
  const [message, setMessage] = useState("");

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
    phone,
    customise,
    setCustomise,
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
                  {v.id === "reviews" ? <ShellIcon name="nav-approval"/> : v.id === "actions" ? <ShellIcon name="nav-tasks"/> : <Icon name={viewIcons[v.id]} />}
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
      {phone && (
        <div className="mw-menu-pinned">
          <h2>Overview</h2>
          <button
            type="button"
            className="mw-menu-action"
            onClick={() => {
              // Focus returns to the menu trigger first, so closing Customise lands somewhere real.
              closeOverlay();
              setCustomise(true);
              if (path !== "/work") router.push("/work");
            }}
          >
            <Icon name="sliders" />
            <span>Customise overview</span>
          </button>
        </div>
      )}
    </>
  );
  return (
    <Context.Provider value={value}>
      <SecondaryMenuFrame state={menuState} id="ppo-my-work" name="My Work" menuId="mw-menu" contentId="mw-content" attributes={{ "data-view": current }} menu={menu} message={message}>
        {children}
      </SecondaryMenuFrame>
    </Context.Provider>
  );
}
