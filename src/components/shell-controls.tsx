"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { useShell } from "./shell-provider";
import { ShellWorkspaceSelector } from "./shell-workspace-selector";
import { ShellPageGuide } from "./shell-page-guide";
import { ProductIcon } from "./product-icons";
import { businessViewChannel, sessionLockEvent } from "./session-signal";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import { contextualActions, type SearchResults } from "../shell/model";

type Panel =
  "search" | "quick" | "help" | "notifications" | "account" | "guide" | null;
const panelNames = {
  guide: "Page guide",
  search: "Search Powerplants One",
  quick: "Quick add",
  help: "Quick Help",
  notifications: "Notifications",
  account: "Account",
};
const subscribe = (changed: () => void) => {
  const media = window.matchMedia("(min-width: 781px)");
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
function panelPosition(panel: Exclude<Panel, null>, target: HTMLElement) {
  const mobile = window.innerWidth <= 780;
  const width = Math.min(
    panel === "search" || panel === "guide"
      ? 550
      : panel === "quick"
        ? 330
        : 380,
    window.innerWidth - (mobile ? 24 : 108),
  );
  const rect = (
    panel === "search" ? (target.closest("label") ?? target) : target
  ).getBoundingClientRect();
  return {
    width,
    left: mobile
      ? (window.innerWidth - width) / 2
      : Math.max(
          88,
          Math.min(
            window.innerWidth - width - 18,
            panel === "search" ? rect.left : rect.right - width,
          ),
        ),
    right: "auto" as const,
  };
}
async function read<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1/shell/${path}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Choose an identity or sign in to use this control."
        : "Unable to load permitted records. Try again.",
    );
  return response.json();
}
export function ShellControls({
  module,
  page,
}: {
  module: string;
  page: string;
}) {
  const router = useRouter();
  const { context, error: contextError, reload } = useShell();
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 781px)").matches,
    () => true,
  );
  const [position, setPosition] = useState<ReturnType<typeof panelPosition>>();
  const [panel, setPanel] = useState<Panel>(null),
    [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null),
    [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false),
    [selected, setSelected] = useState(-1),
    [retry, setRetry] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    popup = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null),
    searchRequest = useRef<AbortController | null>(null);
  const generation = useRef(0),
    restoringFocus = useRef(false);
  useEffect(() => {
    const lock = () => {
      generation.current++;
      searchRequest.current?.abort();
      setPanel(null);
      setQ("");
      setResults(null);
      setSearchError("");
      setSearching(false);
      setSelected(-1);
    };
    const channel = businessViewChannel(),
      remoteLock = (event: MessageEvent) => {
        if (event.data === "Lock") lock();
      };
    window.addEventListener(sessionLockEvent, lock);
    channel.addEventListener("message", remoteLock);
    return () => {
      searchRequest.current?.abort();
      window.removeEventListener(sessionLockEvent, lock);
      channel.removeEventListener("message", remoteLock);
    };
  }, []);
  useEffect(() => {
    if (panel !== "search" || !context || q.trim().length < 2) return;
    const controller = new AbortController(),
      stamp = generation.current;
    searchRequest.current = controller;
    const timer = setTimeout(() => {
      setSearching(true);
      void read<SearchResults>(
        `search?q=${encodeURIComponent(q.trim())}`,
        controller.signal,
      ).then(
        (value) => {
          if (!controller.signal.aborted && stamp === generation.current) {
            setResults(value);
            setSearching(false);
          }
        },
        (error) => {
          if (!controller.signal.aborted && stamp === generation.current) {
            setResults(null);
            setSearchError(error.message);
            setSearching(false);
          }
        },
      );
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [context, panel, q, retry]);
  useEffect(() => {
    const resize = () => {
      if (panel && opener.current)
        setPosition(panelPosition(panel, opener.current));
    };
    const media = window.matchMedia("(min-width: 781px)");
    const breakpoint = () => {
      setPanel(null);
      if (document.activeElement?.closest(".ppo-shell-controls")) document.getElementById("main")?.focus();
    };
    media.addEventListener("change", breakpoint);
    window.addEventListener("resize", resize);
    const utility = (event: Event) => {
      const value = (event as CustomEvent).detail;
      if (!["quick", "help", "notifications"].includes(value)) return;
      opener.current =
        document.getElementById("navigation-toggle") ??
        document.getElementById("desktop-more-toggle");
      if (opener.current) setPosition(panelPosition(value, opener.current));
      openShellPanel("header");
      setPanel(value);
    };
    window.addEventListener("ppo-shell-utility", utility);
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== "header") setPanel(null);
    };
    const outside = (event: Event) => {
      const target = event.target as Element | null;
      if (target && !target.closest("[data-shell-header-control]"))
        setPanel(null);
    };
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const target =
          input.current ?? document.getElementById("shell-mobile-search");
        if (target) {
          opener.current = target;
          setPosition(panelPosition("search", target));
        }
        input.current?.focus();
        openShellPanel("header");
        setPanel("search");
      }
      if (event.key === "Escape") {
        setPanel(null);
        if (panel) {
          restoringFocus.current = true;
          opener.current?.focus();
          restoringFocus.current = false;
        }
      }
    };
    window.addEventListener(shellPanelEvent, other);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("ppo-shell-utility", utility);
      media.removeEventListener("change", breakpoint);
      window.removeEventListener("resize", resize);
      window.removeEventListener(shellPanelEvent, other);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", shortcut);
    };
  }, [panel]);
  useEffect(() => {
    if (panel === "search" && !wide) input.current?.focus();
    else if (panel && panel !== "search")
      popup.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [panel, wide]);
  useEffect(() => {
    if (selected >= 0)
      document
        .getElementById(`shell-result-${selected}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const show = (value: Exclude<Panel, null>, target: HTMLElement) => {
    opener.current = target;
    setPosition(panelPosition(value, target));
    openShellPanel("header");
    setPanel((old) => (old === value ? null : value));
  };
  const close = () => {
    setPanel(null);
    restoringFocus.current = true;
    opener.current?.focus();
    restoringFocus.current = false;
  };
  const actions = contextualActions(context?.actions ?? [], module);
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = results?.items.length ?? 0;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openShellPanel("header");
      setPanel("search");
      if (count)
        setSelected((old) =>
          old < 0
            ? event.key === "ArrowDown"
              ? 0
              : count - 1
            : (old + (event.key === "ArrowDown" ? 1 : -1) + count) % count,
        );
    }
    if (
      event.key === "Enter" &&
      panel === "search" &&
      results?.items[selected]
    ) {
      event.preventDefault();
      setPanel(null);
      router.push(results.items[selected].href);
    }
  };
  const searchField = (
    <label className="ppo-global-search">
      <ProductIcon name="search" />
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-label="Search Powerplants One"
        aria-autocomplete="list"
        aria-controls="shell-search-list"
        aria-expanded={panel === "search"}
        aria-activedescendant={
          panel === "search" && results?.items[selected]
            ? `shell-result-${selected}`
            : undefined
        }
        placeholder="Search Powerplants One"
        autoComplete="off"
        maxLength={200}
        value={q}
        onFocus={(event) => {
          if (restoringFocus.current) return;
          opener.current = wide
            ? event.currentTarget
            : document.getElementById("shell-mobile-search");
          setPosition(panelPosition("search", event.currentTarget));
          if (panel !== "search") {
            setResults(null);
            setSelected(-1);
            setSearchError("");
          }
          openShellPanel("header");
          setPanel("search");
        }}
        onClick={() => {
          if (panel !== "search") {
            setResults(null);
            setSelected(-1);
            setSearchError("");
          }
          setPanel("search");
        }}
        onChange={(event) => {
          searchRequest.current?.abort();
          setQ(event.target.value);
          setResults(null);
          setSelected(-1);
          setSearchError("");
          setSearching(false);
          setPanel("search");
        }}
        onKeyDown={onSearchKey}
      />
      <kbd aria-hidden="true">Ctrl K</kbd>
    </label>
  );
  return (
    <div className="ppo-shell-controls">
      <div className="ppo-header-centre" data-shell-header-control>
        {wide && searchField}
        <button
          className="ppo-top-action ppo-quick-add"
          aria-label="Quick add"
          title="Quick add"
          aria-expanded={panel === "quick"}
          aria-controls="shell-utility-panel"
          onClick={(event) => show("quick", event.currentTarget)}
        >
          <ProductIcon name="plus" />
        </button>
      </div>
      <div className="ppo-header-utilities" data-shell-header-control>
        {!wide && (
          <button
            id="shell-mobile-search"
            className="ppo-top-action"
            aria-label="Open global search"
            title="Search"
            aria-expanded={panel === "search"}
            aria-controls="shell-search-panel"
            onClick={(event) => show("search", event.currentTarget)}
          >
            <ProductIcon name="search" />
          </button>
        )}
        <button
          className="ppo-top-action"
          aria-label="Page guide"
          title="Page guide"
          aria-expanded={panel === "guide"}
          aria-controls="shell-utility-panel"
          onClick={(event) => show("guide", event.currentTarget)}
        >
          <ProductIcon name="info" />
        </button>
        <button
          className="ppo-top-action ppo-desktop-utility"
          aria-label="Quick Help"
          title="Quick Help"
          aria-expanded={panel === "help"}
          aria-controls="shell-utility-panel"
          onClick={(event) => show("help", event.currentTarget)}
        >
          <ProductIcon name="help" />
        </button>
        <button
          className="ppo-top-action ppo-desktop-utility"
          aria-label="Notifications"
          title="Notifications"
          aria-expanded={panel === "notifications"}
          aria-controls="shell-utility-panel"
          onClick={(event) => show("notifications", event.currentTarget)}
        >
          <ProductIcon name="bell" />
        </button>
      </div>
      <div className="ppo-account-fallback" data-shell-header-control>
        <button
          className="ppo-top-action"
          aria-label="Account"
          title="Account"
          aria-expanded={panel === "account"}
          aria-controls="shell-utility-panel"
          onClick={(event) => show("account", event.currentTarget)}
        >
          <ProductIcon name="person" />
        </button>
      </div>
      <section
        id="shell-search-panel"
        className="ppo-header-panel ppo-search-panel"
        style={position}
        role="dialog"
        aria-label="Global search"
        hidden={panel !== "search"}
        data-shell-header-control
      >
        <div className="ppo-panel-titlebar">
          <h2>Search Powerplants One</h2>
          <button
            className="ppo-top-action"
            aria-label="Close search"
            onClick={close}
          >
            <ProductIcon name="close" />
          </button>
        </div>
        <div className="ppo-panel-body">
          {!wide && (
            <div className="ppo-mobile-search-field">{searchField}</div>
          )}
          <p className="ppo-panel-hint">
            Leads, engineering requests, projects, opportunities, customers,
            contacts, sites, equipment, activities and service requests you can
            access.
          </p>
          <div role="status" className="ppo-panel-status">
            {contextError ||
              searchError ||
              (!context
                ? "Loading your search access…"
                : q.trim().length < 2
                  ? "Enter at least 2 characters."
                  : searching || !results
                    ? "Searching…"
                    : results.items.length
                      ? `${results.items.length} results${results.has_more ? "; more matches available — refine your search" : ""}.`
                      : "No matching records in the supported record types.")}
          </div>
          {(contextError || searchError) && (
            <button
              className="secondary ppo-retry"
              onClick={() => {
                setSearchError("");
                setResults(null);
                setRetry((value) => value + 1);
                if (contextError) reload();
              }}
            >
              Try again
            </button>
          )}
          <div
            id="shell-search-list"
            role="listbox"
            aria-label="Search results"
          >
            {results?.items.map((item, index) => (
              <div
                id={`shell-result-${index}`}
                key={item.id}
                role="option"
                aria-selected={selected === index}
                className="ppo-search-option"
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setSelected(index)}
                onClick={() => {
                  setPanel(null);
                  router.push(item.href);
                }}
              >
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.reference}</small>
                </span>
                <small>{item.kind}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="ppo-panel-footer">
          Up to 5 matches per record type. Search within a module for other
          records.
        </div>
      </section>
      <section
        ref={popup}
        style={position}
        id="shell-utility-panel"
        className={`ppo-header-panel ppo-utility-panel${panel === "quick" ? " ppo-quick-panel" : ""}`}
        role="dialog"
        aria-labelledby="shell-utility-title"
        hidden={!panel || panel === "search"}
        data-shell-header-control
        onKeyDown={(event) => {
          if (
            panel !== "quick" ||
            !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
          )
            return;
          const options = [
            ...event.currentTarget.querySelectorAll<HTMLAnchorElement>(
              "a.ppo-quick-option",
            ),
          ];
          if (!options.length) return;
          event.preventDefault();
          const index = options.indexOf(
            document.activeElement as HTMLAnchorElement,
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? options.length - 1
                : index < 0
                  ? event.key === "ArrowUp"
                    ? options.length - 1
                    : 0
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      options.length) %
                    options.length;
          options[next].focus();
        }}
      >
        <div className="ppo-panel-titlebar">
          <h2 id="shell-utility-title">{panel ? panelNames[panel] : ""}</h2>
          <button
            className="ppo-top-action"
            aria-label="Close panel"
            onClick={close}
          >
            <ProductIcon name="close" />
          </button>
        </div>
        <div className="ppo-panel-body">
          {panel === "guide" && <ShellPageGuide page={page} />}
          {panel === "quick" && (
            <>
              <p className="ppo-panel-hint">
                {module} actions appear first. Choose a record to create.
              </p>
              {!context ? (
                <p className="ppo-panel-status" role="status">
                  {contextError || "Loading your actions…"}
                </p>
              ) : actions.length ? (
                <nav aria-label="Create a record">
                  {actions.map((action) => (
                    <Link
                      className="ppo-quick-option"
                      key={action.id}
                      href={action.href}
                      onClick={() => setPanel(null)}
                    >
                      <ProductIcon name="plus" />
                      <span>{action.label}</span>
                      {action.module === module && (
                        <small>In this module</small>
                      )}
                    </Link>
                  ))}
                </nav>
              ) : (
                <p className="ppo-panel-status">
                  No creation actions are available for this identity.
                </p>
              )}
              {contextError && (
                <button className="secondary ppo-retry" onClick={reload}>
                  Try again
                </button>
              )}
            </>
          )}
          {panel === "help" && (
            <div className="ppo-help-content">
              <details open>
                <summary>Move around PPO</summary>
                <p>
                  Open More for workspaces, My Work, Email & Calendar and shared
                  records. Search the menu by page or workspace name. On a
                  phone, the bottom bar follows your current workspace.
                </p>
              </details>
              <details>
                <summary>Find or create a record</summary>
                <p>
                  Use the top search bar to find permitted records. Quick add
                  opens an existing form; available actions depend on your
                  identity. Use the search inside a page to filter that page.
                </p>
              </details>
              <details>
                <summary>Keyboard controls</summary>
                <p>
                  Ctrl or Command + K focuses global search. Use Up and Down to
                  select a result, Enter to open it, and Escape to close a
                  panel. Tab moves between controls.
                </p>
              </details>
            </div>
          )}
          {panel === "notifications" && (
            <p className="ppo-panel-status">
              Notifications are not connected yet. This control will show your
              permitted updates when the notification feed is available.
            </p>
          )}
          {panel === "account" && (
            <div className="ppo-help-content">
              <p>{context?.display_name ?? "No identity loaded"}</p>
              <ShellWorkspaceSelector />
              <Link href="/work" onClick={() => setPanel(null)}>
                Open My Work and account controls
              </Link>
            </div>
          )}
        </div>
        <div className="ppo-panel-footer">
          {panel === "guide"
            ? `${page} · Shared shell guide`
            : "Powerplants One · Synthetic data only"}
        </div>
      </section>
    </div>
  );
}
