"use client";
import { useEffect, useRef } from "react";
import { initials } from "../../pack-view";

// The accepted r03 icon set, verbatim.
const paths = {
  check: <path d="m5 12 4 4L19 6" />,
  circle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 10 18H2Z" />
      <path d="M12 9v5m0 3h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  minus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v5h4M9 12h6m-6 4h6" />
    </>
  ),
  source: (
    <path d="m10 13 4-4M8 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 8a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2" />
  ),
  edit: <path d="m15 4 5 5M4 20l5-1L20 8a3 3 0 0 0-4-4L5 15Z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  print: <path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7ZM17 11h.01" />,
  arrow: <path d="M4 12h16m-5-5 5 5-5 5" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />,
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="jp-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warning" | "green" | "blue";
  children: React.ReactNode;
}) {
  return (
    <span className={`jp-badge${tone === "neutral" ? "" : " " + tone}`}>
      {children}
    </span>
  );
}
export function Person({ name }: { name: string }) {
  return (
    <span className="jp-person">
      <span className="jp-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      {name}
    </span>
  );
}
export function KeyRow({
  label,
  held,
  children,
}: {
  label: string;
  held?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="jp-key-row">
      <dt>{label}</dt>
      <dd className={held ? "held" : undefined}>{children}</dd>
    </div>
  );
}
export function Pair({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "wide" : undefined}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// One modal for the page. A confirmation focuses its reason field or, without one, its primary action;
// an information dialog focuses its heading. Closing returns focus to the control that opened it.
export function PackDialog({
  title,
  subtitle,
  onClose,
  actions,
  busy = false,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  actions?: React.ReactNode;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    outside = useRef(false);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    // Where focus came from, so it can go back. A control that has since gone leaves focus on the
    // active tab rather than on the document, which would strand a keyboard user at the page start.
    const opener = document.activeElement as HTMLElement | null;
    d.showModal();
    const first = d.querySelector<HTMLElement>("[data-autofocus]"),
      primary = d.querySelector<HTMLElement>("[data-primary]");
    (first ?? primary ?? heading.current)?.focus();
    return () => {
      d.close();
      const back =
        opener?.isConnected && opener.offsetParent !== null
          ? opener
          : document.querySelector<HTMLElement>(
              '#ppo-job-pack [role="tab"][aria-selected="true"]',
            );
      back?.focus();
    };
  }, []);
  const isOutside = (event: { clientX: number; clientY: number }) => {
    const b = dialog.current?.getBoundingClientRect();
    return (
      !!b &&
      (event.clientX < b.left ||
        event.clientX > b.right ||
        event.clientY < b.top ||
        event.clientY > b.bottom)
    );
  };
  // A command in flight keeps its dialog: closing it would hide the result of an action that may have been accepted.
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <dialog
      ref={dialog}
      className="jp-dialog"
      aria-labelledby="jp-dialog-title"
      aria-describedby="jp-dialog-subtitle"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onPointerDown={(e) => {
        outside.current = e.target === e.currentTarget && isOutside(e);
      }}
      onClick={(e) => {
        if (outside.current && e.target === e.currentTarget && isOutside(e))
          close();
        outside.current = false;
      }}
    >
      <header className="jp-dialog-heading">
        <div>
          <h2 id="jp-dialog-title" ref={heading} tabIndex={-1}>
            {title}
          </h2>
          <p id="jp-dialog-subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="jp-quiet"
          onClick={close}
          disabled={busy}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="jp-dialog-body">{children}</div>
      <footer className="jp-dialog-actions">
        <button type="button" onClick={close} disabled={busy}>
          {actions ? "Cancel" : "Close"}
        </button>
        {actions}
      </footer>
    </dialog>
  );
}
