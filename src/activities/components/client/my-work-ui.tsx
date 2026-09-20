"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api, isDenied } from "../../../components/business-ui";

// One outline family, 24px grid, 1.7 stroke, matching the shell's icon weight.
const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4m8-4v4" />
    </>
  ),
  "calendar-alert": (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4m8-4v4M12 13v3m0 2.2h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
      <path d="m15.5 10.5 5-3v9l-5-3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  task: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5m0 3h.01" />
    </>
  ),
  bookmark: <path d="M7 4h10v16l-5-3.5L7 20Z" />,
  filter: <path d="M4 7h16M7 12h10M10 17h4" />,
  sliders: (
    <>
      <path d="M4 8h9m4 0h3M4 16h3m4 0h9" />
      <circle cx="15" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 19.5a6 6 0 0 1 12 0M16 6.2a3 3 0 0 1 0 5.6M17.5 14.2a6 6 0 0 1 3.5 5.3" />
    </>
  ),
  review: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3 19.5a6 6 0 0 1 11-3.3M15 17.5l2 2 4-4.5" />
    </>
  ),
  dots: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  "chevron-left": <path d="m14.5 6-6 6 6 6" />,
  "chevron-down": <path d="m6 9.5 6 6 6-6" />,
  "arrow-right": <path d="M4 12h15m-5-5 5 5-5 5" />,
  document: (
    <>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4M10 12h5m-5 4h5" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </>
  ),
  list: <path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5m0 13V21m9-9h-2.5M5.5 12H3m15.4-6.4-1.8 1.8M7.4 16.6l-1.8 1.8m12.8 0-1.8-1.8M7.4 7.4 5.6 5.6" />
    </>
  ),
  panel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />,
  bell: <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15ZM10 20.5a2 2 0 0 0 4 0" />,
  link: <path d="m10 14 4-4M8.5 15.5l-2 2a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m3 5a3 3 0 0 0 4 0l4-4a3 3 0 0 0-4-4l-2 2" />,
  // Mobile r07.
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  "calendar-check": (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4m8-4v4M9 15.2l2.1 2.1 4-4.6" />
    </>
  ),
  // An opportunity, wherever this page names one: the same mark as the Opportunities cell of the phone bar.
  dollar: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 8.6h-3.9a1.7 1.7 0 0 0 0 3.4h2.2a1.7 1.7 0 0 1 0 3.4H9.2M12 6.8v10.4" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M8.5 11V8.2a3.5 3.5 0 0 1 7 0V11" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 2.5V5m0 14v2.5M2.5 12H5m14 0h2.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 9a2 2 0 0 1 2-2h2.2l1.5-2.2h4.6L15.8 7H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  building: <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20m0-10h3.5a1.5 1.5 0 0 1 1.5 1.5V20M3.5 20h17M8.5 8h3m-3 4h3m-3 4h3" />,
  chat: <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-7l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4" />
    </>
  ),
  cloud: <path d="M7.5 18.5a4 4 0 0 1-.6-7.96 5.5 5.5 0 0 1 10.6 1.5A3.25 3.25 0 0 1 17 18.5Z" />,
  "cloud-sun": (
    <>
      <path d="M8 4v1.5M3.5 8.5H5m.3-3.2 1 1m6.4-1-1 1M5.6 11.2A3.2 3.2 0 0 1 10.9 7.7" />
      <path d="M9.5 19.5a3.5 3.5 0 0 1-.5-6.96 4.8 4.8 0 0 1 9.2 1.3 2.85 2.85 0 0 1-.4 5.66Z" />
    </>
  ),
  rain: (
    <>
      <path d="M7.5 15.5a4 4 0 0 1-.6-7.96 5.5 5.5 0 0 1 10.6 1.5A3.25 3.25 0 0 1 17 15.5Z" />
      <path d="m9 18-1 2.5m4.5-2.5-1 2.5M16 18l-1 2.5" />
    </>
  ),
  "cloud-off": (
    <>
      <path d="M9.2 7.2a5.5 5.5 0 0 1 8.3 3.34A3.25 3.25 0 0 1 19 16.6M16 18.5H7.5a4 4 0 0 1-1.9-7.5" />
      <path d="m4 4 16 16" />
    </>
  ),
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="mw-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "overdue" | "attention" | "quiet" | "context";
  children: React.ReactNode;
}) {
  return <span className={`mw-tag mw-tag-${tone}`}>{children}</span>;
}

// A modal dialog, a right-edge drawer for details, or (on a phone) a bottom sheet for a menu.
// Focus goes to the first field marked data-autofocus, else the heading; closing returns it to
// whatever opened the dialog. A command in flight keeps the dialog open so its result is never
// hidden. The background is inert for as long as any of them is open, because all are modal.
export function WorkDialog({
  title,
  subtitle,
  drawer = false,
  sheet = false,
  busy = false,
  dirty = false,
  onClose,
  footer,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  drawer?: boolean;
  sheet?: boolean;
  busy?: boolean;
  dirty?: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    outside = useRef(false),
    id = useId();
  useEffect(() => {
    const d = dialog.current,
      previous = document.activeElement as HTMLElement | null;
    if (!d) return;
    d.showModal();
    (d.querySelector<HTMLElement>("[data-autofocus]") ?? heading.current)?.focus();
    return () => {
      d.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  const close = () => {
    if (busy) return;
    if (dirty && !window.confirm("Discard the entries in this form?")) return;
    onClose();
  };
  const isOutside = (e: { clientX: number; clientY: number }) => {
    const b = dialog.current?.getBoundingClientRect();
    return !!b && (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom);
  };
  return (
    <dialog
      ref={dialog}
      className={`mw-dialog${drawer ? " mw-drawer" : ""}${sheet ? " mw-sheet" : ""}`}
      aria-labelledby={`${id}-title`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onPointerDown={(e) => {
        outside.current = e.target === e.currentTarget && isOutside(e);
      }}
      onClick={(e) => {
        if (outside.current && e.target === e.currentTarget && isOutside(e)) close();
        outside.current = false;
      }}
    >
      {sheet && <span className="mw-sheet-handle" aria-hidden="true" />}
      <header className="mw-dialog-head">
        <div>
          <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>
            {title}
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button type="button" className="mw-icon-button" onClick={close} disabled={busy} aria-label="Close">
          <Icon name="close" />
        </button>
      </header>
      <div className="mw-dialog-body">{children}</div>
      {footer && <footer className="mw-dialog-foot">{footer}</footer>}
    </dialog>
  );
}

// A button that opens a short list of choices. Arrow keys move, Escape closes and returns focus.
export type MenuItem =
  | { id: string; label: string; hint?: string; checked?: boolean; disabled?: boolean; onSelect: () => void }
  | { id: string; separator: true };
export function Menu({
  label,
  name,
  icon,
  items,
  quiet = false,
  iconOnly = false,
  align = "start",
}: {
  label: React.ReactNode;
  name: string;
  icon?: IconName;
  items: MenuItem[];
  quiet?: boolean;
  iconOnly?: boolean;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false),
    root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    id = useId();
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    root.current?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
    };
  }, [open]);
  const move = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const options = [...(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? [])];
    const at = options.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  };
  return (
    <div className="mw-menu-root" ref={root} onKeyDown={move}>
      <button
        ref={trigger}
        type="button"
        className={`mw-button${quiet ? " mw-button-quiet" : ""}${iconOnly ? " mw-button-icon" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        // A visible label is the accessible name; only an icon-only trigger needs one supplied.
        aria-label={iconOnly ? name : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {icon && <Icon name={icon} />}
        {!iconOnly && <span>{label}</span>}
        {!iconOnly && <Icon name="chevron-down" />}
      </button>
      {open && (
        <div id={id} role="menu" aria-label={name} className={`mw-menu-list mw-menu-${align}`}>
          {items.map((item) =>
            "separator" in item ? (
              <hr key={item.id} />
            ) : (
              <button
                key={item.id}
                type="button"
                role={item.checked === undefined ? "menuitem" : "menuitemradio"}
                aria-checked={item.checked}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                  item.onSelect();
                }}
              >
                <span className="mw-menu-check">{item.checked && <Icon name="check" />}</span>
                <span>
                  {item.label}
                  {item.hint && <small>{item.hint}</small>}
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// A read that keeps the last coherent result on screen while a new scope loads, ignores any
// response that a newer request has superseded, and drops everything the moment access is denied.
// It refreshes when the window regains focus and once a minute, so due times are crossed honestly.
export function useWorkResource<T>(path: string | null, refreshMs = 60000) {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: unknown; settled: string | null }>({
    path: null,
    data: null,
    error: null,
    settled: null,
  });
  const latest = useRef(0),
    [revision, setRevision] = useState(0);
  // A new scope or a requested reload is "loading" until it answers. The quiet background refresh
  // reuses the settled key, so it never flashes a loading state at someone who is reading.
  const key = path ? `${path}#${revision}` : null;
  useEffect(() => {
    if (!path || !key) return;
    let live = true;
    const load = () => {
      const request = ++latest.current;
      void api<T>(path).then(
        (data) => {
          if (live && request === latest.current) setState({ path, data, error: null, settled: key });
        },
        (error) => {
          if (live && request === latest.current)
            setState((old) => ({ path, data: isDenied(error) ? null : old.data, error, settled: key }));
        },
      );
    };
    load();
    const timer = refreshMs ? setInterval(() => document.visibilityState === "visible" && load(), refreshMs) : null;
    const focus = () => load();
    window.addEventListener("focus", focus);
    return () => {
      live = false;
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [path, key, refreshMs]);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  const current = state.settled === key;
  return {
    data: state.data,
    // Data from a previous scope is shown as stale until the requested scope answers.
    stale: !!state.data && state.path !== path,
    error: current ? state.error : null,
    loading: !!path && !current,
    reload,
  };
}
