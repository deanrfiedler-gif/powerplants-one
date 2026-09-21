"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api, type Failure } from "../../../../components/business-ui";
import { label as stateLabel } from "../../model";

// One outline family on a 24px grid at 1.7 stroke: the weight of the shell and of the shared secondary menu.
const paths = {
  register: (
    <>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4M10 12h5m-5 4h5" />
    </>
  ),
  mapping: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </>
  ),
  swap: <path d="M4 8h14m-4-4 4 4-4 4M20 16H6m4 4-4-4 4-4" />,
  review: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.5h11v10H3ZM14 9.5h3.8L21 13v3.5h-7Z" />
      <circle cx="7.5" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  history: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9M4.5 4.5V9H9" />
      <path d="M12 8v4.2l2.8 1.8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  filter: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5Z" />,
  columns: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </>
  ),
  dots: <path d="M5.5 12h.01M12 12h.01M18.5 12h.01" />,
  warning: (
    <>
      <path d="M12 4 2.8 19.5h18.4Z" />
      <path d="M12 10v4.5m0 2.6h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4m8-4v4" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4" />
    </>
  ),
  "arrow-right": <path d="M4 12h15m-5-5 5 5-5 5" />,
  "chevron-down": <path d="m6 9.5 6 6 6-6" />,
  "chevron-left": <path d="m14.5 6-6 6 6 6" />,
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M8.5 11V8.2a3.5 3.5 0 0 1 7 0V11" />
    </>
  ),
  download: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14" />,
  link: <path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" />,
  cycle: <path d="M19.5 9A8 8 0 0 0 5.2 7.5L4 9m0-4.5V9h4.5M4.5 15a8 8 0 0 0 14.3 1.5L20 15m0 4.5V15h-4.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5m0-8.2h.01" />
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

export const text = stateLabel;
export function dateText(value: string | null, missing = "Date needed") {
  return value ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : missing;
}
export const stampText = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Australia/Brisbane" }).format(new Date(value)) : "";
export const revisionText = (n: number) => `r${String(n).padStart(2, "0")}`;

// The package last opened in this browser: a convenience for the entry route, never a record or a permission.
export const lastPackageKey = "ppo.materials.last-package.v1";

// A chip is a register cell's state at a glance: a check only for a completed positive state, a warning only where
// someone must act, and plain words for everything that is merely in progress.
export function Chip({ tone, children }: { tone: "neutral" | "attention" | "positive" | "negative"; children: React.ReactNode }) {
  return (
    <span className={`em-chip em-chip-${tone}`}>
      {tone === "positive" ? <Icon name="check" /> : tone === "neutral" ? null : <Icon name="warning" />}
      <span>{children}</span>
    </span>
  );
}

// A status is a dot and words. Pending review is neutral; only a completed positive check is green.
export function Status({ tone, children }: { tone: "neutral" | "attention" | "positive" | "negative"; children: React.ReactNode }) {
  return (
    <span className={`em-status em-status-${tone}`}>
      <span className="em-dot" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
export const toneFor = (state: string): "neutral" | "attention" | "positive" | "negative" =>
  ["Accepted", "Verified", "Issued", "EligibleForPurpose", "TechnicallyReviewed", "Current", "Meets", "Resolved", "Decided", "NoEffectConfirmed", "Authorised"].includes(state) ? "positive"
    : ["Rejected", "DoesNotMeet", "Withdrawn", "Cancelled"].includes(state) ? "negative"
      : ["Returned", "Held", "EvidenceNeeded", "ReassessmentNeeded", "Missing", "Ambiguous", "Changed", "Unavailable", "Restricted", "DecisionNeeded", "Superseded", "Open"].includes(state) ? "attention" : "neutral";

// A modal dialog or a right-edge drawer. Focus goes to the first field marked data-autofocus, else the heading;
// closing returns it to whatever opened the dialog. A command in flight keeps it open so its result is never hidden.
export function Dialog({ title, subtitle, drawer = false, wide = false, busy = false, dirty = false, onClose, footer, children }: {
  title: string; subtitle?: React.ReactNode; drawer?: boolean; wide?: boolean; busy?: boolean; dirty?: boolean; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null), outside = useRef(false), id = useId();
  useEffect(() => {
    const d = dialog.current, previous = document.activeElement as HTMLElement | null;
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
      className={`mw-dialog${drawer ? " mw-drawer" : ""}${wide ? " em-dialog-wide" : ""}`}
      aria-labelledby={`${id}-title`}
      onCancel={(e) => { e.preventDefault(); close(); }}
      onPointerDown={(e) => { outside.current = e.target === e.currentTarget && isOutside(e); }}
      onClick={(e) => { if (outside.current && e.target === e.currentTarget && isOutside(e)) close(); outside.current = false; }}
    >
      <header className="mw-dialog-head">
        <div>
          <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button type="button" className="mw-icon-button" onClick={close} disabled={busy} aria-label="Close"><Icon name="close" /></button>
      </header>
      <div className="mw-dialog-body">{children}</div>
      {footer && <footer className="mw-dialog-foot">{footer}</footer>}
    </dialog>
  );
}

// A button that opens a short list. Arrow keys move, Escape closes and returns focus.
export type MenuItem = { id: string; label: string; hint?: string; checked?: boolean; disabled?: boolean; onSelect: () => void } | { id: string; separator: true };
export function Menu({ label, name, icon, items, iconOnly = false, quiet = false, align = "start", keepOpen = false }: {
  label: React.ReactNode; name: string; icon?: IconName; items: MenuItem[]; iconOnly?: boolean; quiet?: boolean; align?: "start" | "end"; keepOpen?: boolean;
}) {
  const [open, setOpen] = useState(false), root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), id = useId();
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    root.current?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("focusin", away); };
  }, [open]);
  const move = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); setOpen(false); trigger.current?.focus(); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const options = [...(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? [])], at = options.indexOf(document.activeElement as HTMLElement);
    options[e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
  };
  return (
    <div className="mw-menu-root" ref={root} onKeyDown={move}>
      <button ref={trigger} type="button" className={`mw-button${quiet ? " mw-button-quiet" : ""}${iconOnly ? " mw-button-icon" : ""}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} aria-label={iconOnly ? name : undefined} onClick={() => setOpen((v) => !v)}>
        {icon && <Icon name={icon} />}
        {!iconOnly && <span>{label}</span>}
        {!iconOnly && !icon && <Icon name="chevron-down" />}
      </button>
      {open && (
        <div id={id} role="menu" aria-label={name} className={`mw-menu-list mw-menu-${align}`}>
          {items.map((item) => "separator" in item ? <hr key={item.id} /> : (
            <button key={item.id} type="button" role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={item.checked} disabled={item.disabled}
              onClick={() => { if (!keepOpen) { setOpen(false); trigger.current?.focus(); } item.onSelect(); }}>
              <span className="mw-menu-check">{item.checked && <Icon name="check" />}</span>
              <span>{item.label}{item.hint && <small>{item.hint}</small>}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// A read that keeps the last coherent result on screen while the next scope loads, drops a superseded
// response, and drops everything the moment access is denied.
export function useRead<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: unknown; settled: string | null }>({ path: null, data: null, error: null, settled: null });
  const latest = useRef(0), [revision, setRevision] = useState(0), key = path ? `${path}#${revision}` : null;
  useEffect(() => {
    if (!path || !key) return;
    let live = true;
    const request = ++latest.current;
    void api<T>(path).then(
      (data) => { if (live && request === latest.current) setState({ path, data, error: null, settled: key }); },
      (error) => { if (live && request === latest.current) setState((old) => ({ path, data: [401, 403, 404].includes((error as Failure)?.status ?? 0) ? null : old.data, error, settled: key })); },
    );
    return () => { live = false; };
  }, [path, key]);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  const current = state.settled === key;
  return { data: state.data, stale: !!state.data && state.path !== path, error: current ? state.error : null, loading: !!path && !current, reload };
}

// One command at a time, under one original operation ID for as long as its outcome is unknown.
//   saved    the server confirmed it; only now may the screen say so
//   failed   the server answered with a refusal, so nothing took effect and the entries stay for a valid retry
//   unknown  no readable answer arrived; the effect may exist, so the ONLY ways forward are to recover the
//            original result by its operation ID or to resend the identical command, which replays it
export type CommandState = "idle" | "sending" | "saved" | "failed" | "unknown";
export function useMaterialsCommand(onSaved?: () => void) {
  const [state, setState] = useState<CommandState>("idle"), [error, setError] = useState<Failure | null>(null), [receipt, setReceipt] = useState<{ operation_id: string; record_id: string; state: string } | null>(null);
  const [operationId, setOperationId] = useState<string>();
  const pending = useRef<{ key: string; path: string; body: Record<string, unknown> } | null>(null);
  const settle = (r: { operation_id: string; record_id: string; state: string }) => { pending.current = null; setReceipt(r); setError(null); setState("saved"); onSaved?.(); return r; };
  async function send(path: string, fields: Record<string, unknown>, options: { discardReply?: boolean } = {}) {
    const key = JSON.stringify({ path, fields });
    if (pending.current && pending.current.key !== key && state === "unknown") {
      setError({ message: "An earlier action has an unknown outcome. Recover its original result first; a different action cannot be started over it." });
      return null;
    }
    if (!pending.current || pending.current.key !== key) pending.current = { key, path, body: { operation_id: crypto.randomUUID(), schema_version: 1, ...fields } };
    setOperationId(pending.current.body.operation_id as string);
    setState("sending"); setError(null); setReceipt(null);
    try {
      const result = await api<{ operation_id: string; record_id: string; state: string }>(path, pending.current.body);
      // A labelled synthetic fault: the command really ran, and its reply is thrown away to exercise recovery.
      if (options.discardReply) throw { retryable: true, message: "The reply was discarded (synthetic fault). The outcome is unknown until the original operation is recovered." } satisfies Failure;
      return settle(result);
    } catch (e) {
      const failure = e as Failure;
      setError(failure);
      if (failure.retryable || failure.status === undefined) setState("unknown");
      else { pending.current = null; setState("failed"); }
      return null;
    }
  }
  // Recovery asks for the original receipt by its operation ID. The server rechecks access first. Not found means
  // the original never took effect, which is the only case in which a fresh attempt is safe.
  async function recover() {
    if (!pending.current) return null;
    setState("sending");
    try {
      return settle(await api<{ operation_id: string; record_id: string; state: string }>(`operations/${pending.current.body.operation_id}`));
    } catch (e) {
      const failure = e as Failure;
      if (failure.status === 404) { pending.current = null; setError({ message: "No original result exists for that operation: it never took effect. Your entries are retained and the action can be sent again." }); setState("failed"); }
      else { setError(failure); setState("unknown"); }
      return null;
    }
  }
  return { send, recover, state, error, receipt, busy: state === "sending", operationId, clear: () => { pending.current = null; setOperationId(undefined); setState("idle"); setError(null); setReceipt(null); } };
}
export type MaterialsCommand = ReturnType<typeof useMaterialsCommand>;

export function CommandNotice({ command, saved = "Saved to the server." }: { command: MaterialsCommand; saved?: string }) {
  if (command.state === "saved") return <p className="em-saved" role="status">{saved}</p>;
  if (!command.error) return null;
  const e = command.error;
  return (
    <div className={`mw-notice ${command.state === "unknown" ? "mw-notice-attention" : "em-notice-error"}`} role="alert">
      <strong>{command.state === "unknown" ? "Outcome unknown" : "Not saved"}</strong>
      <p>{e.message ?? "The request could not be completed."}</p>
      {!!e.field_errors?.length && <ul className="em-errors">{e.field_errors.map((f, i) => <li key={i}>{f.message}</li>)}</ul>}
      {command.state === "unknown" && (
        <p className="em-recover">
          <button type="button" className="mw-button" onClick={() => void command.recover()} disabled={command.busy}>Recover the original result</button>
          <small>Operation {command.operationId}</small>
        </p>
      )}
      {e.correlation_id && <small>Support reference: {e.correlation_id}</small>}
    </div>
  );
}

export function ReadNotice({ error, what }: { error: unknown; what: string }) {
  if (!error) return null;
  const e = error as Failure, denied = [401, 403, 404].includes(e.status ?? 0);
  return (
    <div className={`mw-notice ${denied ? "" : "mw-notice-attention"}`} role="alert">
      <strong>{denied ? `${what} unavailable` : `${what} could not be loaded`}</strong>
      <p>{denied ? "This identity cannot read this record, or it does not exist. Nothing is shown in its place." : (e.message ?? "The last confirmed result stays on screen. Try again.")}</p>
    </div>
  );
}
// A disabled positive decision always has its reason beside it.
export function Reason({ children }: { children: React.ReactNode }) {
  return children ? <p className="em-reason"><Icon name="lock" /><span>{children}</span></p> : null;
}
export function Field({ label, hint, error, children, inline = false }: { label: string; hint?: string; error?: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <label className={`mw-field${inline ? " mw-field-inline" : ""}`}>
      <span className="em-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="mw-inline-error" role="alert">{error}</small>}
    </label>
  );
}
export const fieldError = (failure: Failure | null, name: string) => failure?.field_errors?.find((f) => f.field === name || f.field.replace(/-\d+$/, "") === name)?.message;
