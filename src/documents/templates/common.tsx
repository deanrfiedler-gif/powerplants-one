"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, ErrorNotice, Stamp } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { RegisterChip } from "../../components/ui/register-table";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../shell/secondary-menu";
import { useShell } from "../../components/shell-provider";
import { ShellIcon } from "../../components/shell-icon";
import type { PhoneHeaderConfig } from "../../shell/phone-header";
import { familyNames, type Page, type Family } from "./types";
import "./templates.css";

// Re-read the displayed window on continuation and refresh. A later page never
// preserves earlier rows whose authority may have changed since the first read.
export function useTemplatePages<T>(path: string | null, cursorKey = "cursor") {
  const [request, setRequest] = useState({ path, epoch: 0, pages: 1 });
  if (request.path !== path)
    setRequest({ path, epoch: request.epoch + 1, pages: 1 });
  const [state, setState] = useState<{
    path: string | null;
    epoch: number;
    pages: number;
    data: Page<T> | null;
    error: unknown;
  }>({ path: null, epoch: -1, pages: 0, data: null, error: null });
  useEffect(() => {
    let live = true;
    if (!path || request.path !== path) return;
    void (async () => {
      try {
        const items: T[] = [];
        let result: Page<T> | null = null,
          cursor: string | null = null;
        for (let index = 0; index < request.pages; index++) {
          const next: Page<T> = await api<Page<T>>(
            path +
              (cursor
                ? `${path.includes("?") ? "&" : "?"}${cursorKey}=${encodeURIComponent(cursor)}`
                : ""),
          );
          if (!live) return;
          items.push(...next.items);
          result = { ...next, items: [...items] };
          cursor = next.next_cursor ?? next.next_after ?? null;
          if (!cursor) break;
        }
        if (live) setState({ ...request, data: result, error: null });
      } catch (error) {
        if (live) setState({ ...request, data: null, error });
      }
    })();
    return () => {
      live = false;
    };
  }, [path, cursorKey, request]);
  useEffect(() => {
    const refresh = () => setRequest((r) => ({ ...r, epoch: r.epoch + 1 }));
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const samePath = !!path && state.path === path;
  const current =
    samePath && state.epoch === request.epoch && state.pages === request.pages;
  const data = samePath ? state.data : null,
    loading = !!path && !current;
  return {
    data,
    error: current ? state.error : null,
    loading,
    hasMore: !!(data?.next_cursor ?? data?.next_after),
    more: () => {
      if (!loading) setRequest((r) => ({ ...r, pages: r.pages + 1 }));
    },
    reload: () => setRequest((r) => ({ ...r, epoch: r.epoch + 1, pages: 1 })),
  };
}
export function ReadFeedback({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: unknown;
  reload: () => void;
}) {
  return (
    <>
      {loading && (
        <p role="status" className="tm-note">
          Loading current records…
        </p>
      )}
      {!!error && (
        <div className="tm-note">
          <ErrorNotice error={error} />
          <p>
            These records could not be confirmed. Start again to read current
            permissions and page tokens.
          </p>
          <Button onClick={reload}>Start again</Button>
        </div>
      )}
    </>
  );
}
export function Paging({
  read,
  order = "identity order",
  scope = "records you can see",
}: {
  read: {
    data: Page<unknown> | null;
    error: unknown;
    loading: boolean;
    hasMore: boolean;
    more: () => void;
    reload: () => void;
  };
  order?: string;
  scope?: string;
}) {
  const footer = useRef<HTMLElement>(null);
  const continuation = useRef<Set<Element> | null>(null);
  useEffect(() => {
    if (read.loading || !continuation.current) return;
    const previous = continuation.current;
    continuation.current = null;
    const next = Array.from(
      footer.current?.parentElement?.querySelectorAll<HTMLElement>(
        "a[href], input, button",
      ) ?? [],
    ).find(
      (node) =>
        !previous.has(node) &&
        node.getClientRects().length &&
        !footer.current?.contains(node),
    );
    (next ?? footer.current)?.focus();
  }, [read.data, read.error, read.loading]);
  return (
    <footer
      className="tm-paging"
      ref={footer}
      tabIndex={-1}
      aria-label="List continuation"
    >
      <span className="sr-only" role="status">
        {read.data ? `${read.data.items.length} records shown` : ""}
      </span>
      <span>
        {read.data ? (read.hasMore ? "More available" : "End of list") : ""}
        {read.data && ` · ${scope} · ${order}`}
      </span>
      {read.hasMore && (
        <Button
          busy={read.loading}
          disabled={!!read.error}
          onClick={() => {
            continuation.current = new Set(
              footer.current?.parentElement?.querySelectorAll(
                "a[href], input, button",
              ) ?? [],
            );
            read.more();
          }}
        >
          Load more
        </Button>
      )}
    </footer>
  );
}
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="tm-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "Not recorded"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Note({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <div className={`tm-note ${warning ? "tm-warning" : ""}`}>{children}</div>
  );
}
export function Chip({ value }: { value: string }) {
  return (
    <RegisterChip
      tone={
        ["Supported", "Reviewed", "Selected now"].includes(value)
          ? "positive"
          : [
                "ChangesRequested",
                "DefinitionChanged",
                "RendererChanged",
              ].includes(value)
            ? "attention"
            : "neutral"
      }
    >
      {value.replace(/([a-z])([A-Z])/g, "$1 $2")}
    </RegisterChip>
  );
}
export function Time({ value }: { value: string | null | undefined }) {
  return value ? <Stamp value={value} /> : <>Not recorded</>;
}
export function TemplateFrame({
  view,
  family,
  manage,
  phoneHeader,
  onRefresh,
  children,
}: {
  view: "definitions" | "proposals" | "use";
  family: Family | null;
  manage: boolean;
  phoneHeader?: Omit<PhoneHeaderConfig, "chooseView">;
  onRefresh?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(!phoneHeader?.record),
    menu = useSecondaryMenu(open, setOpen),
    shell = useShell();
  const pull = useRef<{ x: number; y: number } | null>(null);
  const query = family ? `&family=${family}` : "";
  const nav = (
    <nav aria-label="Template views">
      <Link
        className="mw-menu-item"
        aria-current={view === "definitions" ? "page" : undefined}
        href={`/documents/templates?view=definitions${query}`}
      >
        <ShellIcon name="documents" />
        Definitions
      </Link>
      {manage && (
        <>
          <Link
            className="mw-menu-item"
            aria-current={view === "proposals" ? "page" : undefined}
            href={`/documents/templates?view=proposals${query}`}
          >
            <ShellIcon name="documents" />
            Proposals
          </Link>
          <h2 className="mw-menu-heading">Job pack use</h2>
          <Link
            className="mw-menu-item"
            aria-current={view === "use" ? "page" : undefined}
            href="/documents/templates/use"
          >
            <ShellIcon name="sites" />
            Site use
          </Link>
        </>
      )}
      <h2 className="mw-menu-heading">Other document pages</h2>
      {shell.context?.navigation.includes("documents") ? (
        <Link className="mw-menu-item" href="/documents">
          Document library
        </Link>
      ) : (
        <span className="tm-unavailable">Document library · unavailable</span>
      )}
      {shell.context?.navigation.includes("outputs") ? (
        <Link className="mw-menu-item" href="/documents/issues">
          Outputs
        </Link>
      ) : (
        <span className="tm-unavailable">Outputs · unavailable</span>
      )}
    </nav>
  );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-templates"
      name="Templates"
      menuId="template-menu"
      contentId="template-content"
      menu={nav}
      message=""
      phoneHeader={{
        title:
          view === "use"
            ? "Site use"
            : `${family ? familyNames[family] + " " : ""}${view === "definitions" ? "definitions" : "proposals"}`,
        ...phoneHeader,
      }}
    >
      <div
        className="tm-page"
        onTouchStart={(event) => {
          pull.current = null;
          if (
            !onRefresh ||
            !window.matchMedia("(max-width: 780px)").matches ||
            event.touches.length !== 1
          )
            return;
          let target: HTMLElement | null = event.target as HTMLElement;
          if (target.closest("button, input, select, textarea, dialog")) return;
          while (target) {
            if (target.scrollTop > 0) return;
            target = target.parentElement;
          }
          const touch = event.touches[0];
          pull.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = pull.current;
          pull.current = null;
          const end = event.changedTouches[0];
          if (
            start &&
            end &&
            end.clientY - start.y > 80 &&
            Math.abs(end.clientX - start.x) < 40
          )
            onRefresh?.();
        }}
        onTouchCancel={() => {
          pull.current = null;
        }}
      >
        {children}
      </div>
    </SecondaryMenuFrame>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="tm-empty" role="status">
      {children}
    </p>
  );
}
