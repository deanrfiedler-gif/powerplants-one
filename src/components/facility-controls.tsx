"use client";
import { useEffect, useRef, useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  type Envelope,
  type Failure,
} from "./business-ui";
import { useIdentity } from "./business-session";
import { useCrmResource } from "./crm-state";
import { LookupField } from "./record-ui";
import {
  displayValue,
  type Preview,
  type Review,
  type Source,
  type SourceInput,
} from "../shared/facilities/definition";
import type { RegisterRow } from "../shared/facilities/reads";

export function reviewOf(p: Preview): Review {
  return {
    target_id: p.target_id,
    version: p.version,
    proposal_hash: p.proposal_hash,
    dependency_hash: p.dependency_hash,
    acknowledgements: p.acknowledgements,
  };
}
export function SourceField({
  name,
  label,
  value,
  onChange,
  existing = [],
}: {
  name: string;
  label: string;
  value: SourceInput | null;
  onChange: (s: SourceInput | null) => void;
  existing?: Source[];
}) {
  const note =
    value?.kind === "reported_note"
      ? value
      : {
          kind: "reported_note" as const,
          title: "",
          note: null,
          source_date: null,
        };
  return (
    <fieldset className="facility-source">
      <legend>{label}</legend>
      <SelectField
        name={`${name}-kind`}
        validationField={name}
        label="Source basis"
        value={value?.kind ?? ""}
        empty="Not recorded"
        options={[
          { id: "reported_note", display_name: "Reported note" },
          ...(existing.length
            ? [
                {
                  id: "existing_source",
                  display_name: "Existing source (retained reported note)",
                },
              ]
            : []),
        ]}
        onChange={(kind) =>
          onChange(
            kind === "reported_note"
              ? note
              : kind === "existing_source"
                ? { kind, id: existing[0].id, version: 1 }
                : null,
          )
        }
      />
      {value?.kind === "reported_note" && (
        <>
          <Field
            name={`${name}-title`}
            validationField={name}
            label="Source title"
            value={note.title}
            onChange={(title) => onChange({ ...note, title })}
            required
          />
          <Field
            name={`${name}-note`}
            validationField={name}
            label="Reported note"
            value={note.note ?? ""}
            onChange={(v) => onChange({ ...note, note: v || null })}
            multiline
            maxLength={2000}
          />
          <Field
            name={`${name}-date`}
            validationField={name}
            label="Source date (if known)"
            type="date"
            value={note.source_date ?? ""}
            onChange={(v) => onChange({ ...note, source_date: v || null })}
          />
        </>
      )}
      {value?.kind === "existing_source" && (
        <SelectField
          name={`${name}-id`}
          validationField={name}
          label="Retained source"
          value={value.id}
          options={existing.map((s) => ({
            id: s.id,
            display_name: `${s.title} · ${s.source_date ?? "Date not recorded"} · ${s.id}`,
          }))}
          onChange={(id) =>
            onChange({ kind: "existing_source", id, version: 1 })
          }
        />
      )}
      <small>
        Reported context. Provider document lookup is not supported here.
      </small>
    </fieldset>
  );
}
export function Comparison({
  preview,
  confirm,
  onConfirm,
  onCancel,
}: {
  preview: Preview;
  confirm: () => void;
  onConfirm?: boolean;
  onCancel: () => void;
}) {
  return (
    <section
      className="facility-comparison"
      aria-label="Review facility changes"
      tabIndex={-1}
    >
      <h2>Review these changes</h2>
      <div className="facility-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Saved</th>
              <th>Proposed</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r) => (
              <tr key={r.field}>
                <th>
                  {r.label}
                  {preview.clearing.some((c) => c.field === r.field)
                    ? " — will be cleared"
                    : ""}
                </th>
                <td>{displayValue(r.before, r.field)}</td>
                <td>{displayValue(r.after, r.field)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview.equipment_review && (
        <p>
          Equipment installation and service relationships are retained. Review
          their applicability in Related records.
        </p>
      )}
      {!!preview.dependencies?.equipment.length && (
        <ul>
          {preview.dependencies.equipment.map((a) => (
            <li key={a.id}>
              {a.description} · {a.display_number} · {a.id} (
              {[
                a.installed ? "Installed here" : null,
                a.serves ? "Serves this area" : null,
              ]
                .filter(Boolean)
                .join("; ")}
              )
            </li>
          ))}
          {preview.dependencies.equipment_more && (
            <li>More associations are available in Related records.</li>
          )}
        </ul>
      )}
      {preview.dependencies && (
        <p>
          Saved parent path:{" "}
          {preview.dependencies.parent_before
            .map((a) => `${a.name} (${a.id})`)
            .join(" / ") || "Directly under Site"}
          <br />
          Proposed parent path:{" "}
          {preview.dependencies.parent_after
            .map((a) => `${a.name} (${a.id})`)
            .join(" / ") || "Directly under Site"}
        </p>
      )}
      {preview.acknowledgements.includes("adopt_older_observation") && (
        <p>
          This earlier observation will become current reported context.
          Existing history remains available.
        </p>
      )}
      {preview.acknowledgements.includes("parent_relationship") && (
        <p>
          Parentage changes no dimensions, equipment service or access
          authority.
        </p>
      )}
      <div className="facility-actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Back to proposal
        </button>
        <button type="button" onClick={confirm} disabled={onConfirm}>
          Confirm these changes
        </button>
      </div>
    </section>
  );
}
export function CopyId({ id }: { id: string }) {
  const [status, setStatus] = useState("");
  return (
    <span className="facility-id">
      <span>{id}</span>
      <button
        type="button"
        className="secondary"
        aria-label="Copy full record ID"
        onClick={() =>
          void navigator.clipboard.writeText(id).then(
            () => setStatus("Copied"),
            () => setStatus("Select and copy the full ID shown here."),
          )
        }
      >
        Copy
      </button>
      <small role="status">{status}</small>
    </span>
  );
}
export function SitePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const r = useCrmResource<
    Envelope<{
      id: string;
      display_name: string;
      display_number: string;
      company_id: string;
    }>
  >(`sites?q=${encodeURIComponent(search)}&limit=50`);
  const selected = useCrmResource<
    Envelope<{
      id: string;
      display_name: string;
      display_number: string;
      company_id: string;
    }>
  >(value ? `sites/${value}` : null);
  const options = [
    ...(selected.data?.items ?? []),
    ...(r.data?.items ?? []),
  ].filter((r, i, all) => all.findIndex((a) => a.id === r.id) === i);
  return (
    <LookupField
      name="site_id"
      label="Site"
      value={value}
      onChange={onChange}
      search={search}
      onSearch={setSearch}
      options={options.map((s) => ({
        ...s,
        display_name: `${s.display_name} · ${s.id}`,
      }))}
      loading={r.loading}
      more={!!r.data?.next_cursor}
      error={!!r.error}
    />
  );
}
export function ParentPicker({
  siteId,
  excludeId,
  value,
  onChange,
}: {
  siteId: string;
  excludeId?: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const r = useCrmResource<Envelope<RegisterRow>>(
    `facilities/register?${new URLSearchParams({ site_id: siteId, q: search, limit: "50", ...(excludeId ? { exclude_id: excludeId } : {}) })}`,
  );
  const selected = useCrmResource<Envelope<RegisterRow>>(
    value ? `facilities/register?site_id=${siteId}&q=${value}` : null,
  );
  const options = [
    ...(selected.data?.items ?? []),
    ...(r.data?.items ?? []),
  ].filter((r, i, all) => all.findIndex((a) => a.id === r.id) === i);
  return (
    <div>
      <LookupField
        name="parent_facility_id"
        label="Parent facility (optional)"
        value={value}
        onChange={onChange}
        search={search}
        onSearch={setSearch}
        options={options.map((f) => ({
          id: f.id,
          display_name: `${f.site_name} / ${f.ancestor_path?.length ? `${f.ancestor_path.map((a) => a.name).join(" / ")} / ` : ""}${f.name} · ${f.id}`,
        }))}
        loading={r.loading}
        more={!!r.data?.next_cursor}
        error={!!r.error}
      />
      {value && (
        <button
          type="button"
          className="secondary"
          onClick={() => onChange("")}
        >
          Place directly under Site
        </button>
      )}
    </div>
  );
}
// A query/identity change immediately hides old rows; late completions cannot append to a new query.
export function useFacilityPages<T extends { id: string }>(
  path: string | null,
) {
  const identity = useIdentity(),
    binding = `${identity.workspace_id}:${identity.actor_id}:${path}`;
  const [request, setRequest] = useState({
    binding,
    cursor: null as string | null,
    revision: 0,
  });
  const [state, setState] = useState<{
    binding: string;
    items: T[];
    next: string | null;
    total?: number;
    can_create?: boolean;
    error: unknown;
    loading: boolean;
  }>({ binding: "", items: [], next: null, error: null, loading: true });
  const current =
    request.binding === binding
      ? request
      : { binding, cursor: null, revision: 0 };
  const active = useRef(0);
  useEffect(() => {
    const generation = ++active.current;
    let live = true;
    const run = async () => {
      if (!path) return;
      try {
        const data = await api<
          Envelope<T> & { total?: number; can_create?: boolean }
        >(
          `${path}${path.includes("?") ? "&" : "?"}${current.cursor ? `cursor=${encodeURIComponent(current.cursor)}` : ""}`,
        );
        if (!live || generation !== active.current) return;
        setState((old) => ({
          binding,
          items: [
            ...(current.cursor && old.binding === binding ? old.items : []),
            ...data.items,
          ].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i),
          next: data.next_cursor,
          total: data.total,
          can_create: data.can_create,
          error: null,
          loading: false,
        }));
      } catch (error) {
        if (!live || generation !== active.current) return;
        if (
          current.cursor &&
          (error as Failure).field_errors?.some((e) => e.field === "cursor")
        ) {
          setRequest({ binding, cursor: null, revision: current.revision + 1 });
          return;
        }
        setState((old) => ({
          binding,
          items:
            ![401, 403, 404].includes((error as Failure).status ?? 0) &&
            old.binding === binding
              ? old.items
              : [],
          next: null,
          error,
          loading: false,
        }));
      }
    };
    void run();
    return () => {
      live = false;
    };
  }, [binding, path, current.cursor, current.revision]);
  const data = state.binding === binding ? state : null;
  const reload = () =>
    setRequest({ binding, cursor: null, revision: current.revision + 1 });
  useEffect(() => {
    window.addEventListener("focus", reload);
    const t = setInterval(reload, 30000);
    return () => {
      window.removeEventListener("focus", reload);
      clearInterval(t);
    };
  });
  return {
    items: data?.items ?? [],
    next: data?.next ?? null,
    total: data?.total,
    can_create: data?.can_create,
    error: data?.error,
    loading: !!path && (!data || data.loading),
    reload,
    more: () =>
      setRequest({
        binding,
        cursor: data?.next ?? null,
        revision: current.revision + 1,
      }),
  };
}
export function RelatedFailure({
  error,
  reload,
}: {
  error: unknown;
  reload: () => void;
}) {
  return (
    <>
      <ErrorNotice error={error} />
      <button type="button" className="secondary" onClick={reload}>
        Refresh
      </button>
    </>
  );
}
