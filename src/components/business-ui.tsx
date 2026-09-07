"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
export type Envelope<T> = {
  items: T[];
  next_cursor: string | null;
  observed_at: string;
  completeness: string;
};
export type Failure = {
  status?: number;
  code?: string;
  message?: string;
  field_errors?: { field: string; message: string }[];
  retryable?: boolean;
  correlation_id?: string;
};
export function isDenied(error:unknown) {
  return [401,403,404].includes((error as Failure)?.status ?? 0);
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw {
      message:
        "The result could not be confirmed. Your entries remain here; retry when the connection is available.",
      retryable: true,
    } satisfies Failure;
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw {
      message:
        "The server response could not be read. Your entries remain here; retry the unchanged action to confirm its result.",
      retryable: true,
    } satisfies Failure;
  }
  if (!response.ok) throw { ...result, status: response.status };
  return result as T;
}
const ValidationContext = createContext<Failure | null>(null);
export function ValidationFields({
  error,
  children,
}: {
  error: unknown;
  children: React.ReactNode;
}) {
  return (
    <ValidationContext.Provider value={error as Failure | null}>
      {children}
    </ValidationContext.Provider>
  );
}
function useFieldError(name: string) {
  const errors = useContext(ValidationContext)?.field_errors;
  const canonical = name.replace(/-\d+$/, "").replaceAll("-", "_");
  return errors?.find((e) => e.field === name || e.field === canonical)
    ?.message;
}
export function ErrorNotice({ error }: { error: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) ref.current?.focus();
  }, [error]);
  if (!error) return null;
  const e = error as Failure;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="business-error">
      <strong>{e.message ?? "The data could not be loaded. Try again."}</strong>
      {e.field_errors?.length ? (
        <ul>
          {e.field_errors.map((f, i) => (
            <li key={i}>
              {friendly(f.field)}: {f.message}
            </li>
          ))}
        </ul>
      ) : null}
      {e.correlation_id && <small>Support reference: {e.correlation_id}</small>}
    </div>
  );
}
export function useResource<T>(path: string | null) {
  const [revision, setRevision] = useState(0),
    [state, setState] = useState<{
      path: string | null;
      revision: number;
      data: T | null;
      error: unknown;
    }>({ path: null, revision: 0, data: null, error: null });
  useEffect(() => {
    let live = true;
    if (path)
      void api<T>(path).then(
        (data) => {
          if (live) setState({ path, revision, data, error: null });
        },
        (error) => {
          if (live)
            setState((previous) => ({
              path,
              revision,
              data: !isDenied(error) && previous.path === path ? previous.data : null,
              error,
            }));
        },
      );
    return () => {
      live = false;
    };
  }, [path, revision]);
  const current = state.path === path && state.revision === revision;
  return {
    data: state.path === path ? state.data : null,
    error: current ? state.error : null,
    loading: !!path && (!current || (!state.data && !state.error)),
    reload: () => setRevision((x) => x + 1),
  };
}
export function useCommand() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [saved, setSaved] = useState("");
  const uncertain = useRef(false);
  const pending = useRef<{ key: string; body: Record<string, unknown> } | null>(
    null,
  );
  async function send<T>(
    path: string,
    fields: Record<string, unknown>,
  ): Promise<T | null> {
    const key = JSON.stringify({ path, fields });
    if (pending.current && pending.current.key !== key && uncertain.current) {
      setError({
        message:
          "First retry the unchanged pending action to confirm its result. Restore the submitted values, or compare the saved record before starting a new action.",
        retryable: true,
      });
      return null;
    }
    if (!pending.current || pending.current.key !== key)
      pending.current = {
        key,
        body: {
          operation_id: crypto.randomUUID(),
          schema_version: 1,
          ...fields,
        },
      };
    setBusy(true);
    setError(null);
    setSaved("");
    try {
      const result = await api<T>(path, pending.current.body);
      pending.current = null;
      uncertain.current = false;
      setSaved("Saved to the server.");
      return result;
    } catch (e) {
      setError(e);
      uncertain.current = !!(e as Failure).retryable;
      if (!uncertain.current) pending.current = null;
      return null;
    } finally {
      setBusy(false);
    }
  }
  return {
    send,
    busy,
    error,
    saved,
    clear: () => {
      pending.current = null;
      uncertain.current = false;
      setError(null);
      setSaved("");
    },
  };
}
export const friendly = (value: string) =>
  value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
export function Stamp({
  value,
  timezone = "Australia/Brisbane",
}: {
  value?: string | null;
  timezone?: string;
}) {
  return (
    <>
      {value
        ? new Intl.DateTimeFormat("en-AU", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: timezone,
          }).format(new Date(value))
        : "Unknown"}
    </>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span
      className={`status-chip ${["NeedsInformation", "Unresolved", "Disputed", "Urgent"].includes(value) ? "attention" : ""}`}
    >
      {friendly(value)}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="business-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="lede">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Field({
  name,
  validationField,
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  type = "text",
  maxLength = 200,
  placeholder,
  hint,
}: {
  name: string;
  validationField?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
}) {
  const error = useFieldError(validationField ?? name);
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          aria-label={label}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          rows={4}
          aria-invalid={!!error}
          aria-describedby={
            [hint && `${name}-hint`, error && `${name}-error`]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
      ) : (
        <input
          id={name}
          aria-label={label}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={
            [hint && `${name}-hint`, error && `${name}-error`]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
      )}{" "}
      {error && (
        <small id={`${name}-error`} className="field-error">
          {error}
        </small>
      )}
      {hint && <small id={`${name}-hint`}>{hint}</small>}
    </div>
  );
}
export type Option = {
  id: string;
  display_name?: string;
  display_number?: string;
  description?: string;
};
export function SelectField({
  name,
  validationField,
  label,
  value,
  onChange,
  options,
  empty = "Choose…",
  required = false,
}: {
  name: string;
  validationField?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  empty?: string;
  required?: boolean;
}) {
  const error = useFieldError(validationField ?? name);
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={name}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.display_name ?? o.description ?? o.id}
            {o.display_number ? ` · ${o.display_number}` : ""}
          </option>
        ))}
      </select>
      {error && (
        <small id={`${name}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
export function EnumField({
  name,
  label,
  value,
  onChange,
  values,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  values: readonly string[];
}) {
  return (
    <SelectField
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      options={values.map((v) => ({ id: v, display_name: friendly(v) }))}
    />
  );
}
export function ReadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: unknown;
  retry: () => void;
}) {
  return (
    <>
      {loading && <p role="status">Loading permitted records…</p>}
      <ErrorNotice error={error} />
      {!!error && (
        <button className="secondary" onClick={retry}>
          Retry loading
        </button>
      )}
    </>
  );
}
export function Observed({
  envelope,
}: {
  envelope: { observed_at: string; completeness: string };
}) {
  return (
    <p className="read-meta">
      Permitted results · Read <Stamp value={envelope.observed_at} />{" "}
      (Australia/Brisbane) ·{" "}
      {envelope.completeness === "Partial"
        ? "More records available"
        : "Complete filtered result"}
    </p>
  );
}
export function RecordLink({
  type,
  id,
  children,
}: {
  type: string;
  id: string;
  children: React.ReactNode;
}) {
  const root = (
    {
      Organisation: "customers",
      Person: "people",
      Site: "sites",
      Asset: "equipment",
      Ticket: "service/tickets",
      Activity: "work",
      Opportunity: "crm/opportunities",
    } as Record<string, string>
  )[type];
  return root ? (
    <Link href={`/${root}/${id}`}>{children}</Link>
  ) : (
    <>{children}</>
  );
}
export function SummaryPair({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="summary-pair">
      <dt>{label}</dt>
      <dd>{children ?? "Unknown"}</dd>
    </div>
  );
}
