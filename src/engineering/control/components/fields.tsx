"use client";
import { useId } from "react";
import type { ControlRead } from "../reads";
export function TextField({
  label,
  value,
  onChange,
  area = false,
  type = "text",
  required = false,
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  area?: boolean;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <label className="ec-field" htmlFor={id}>
      <span>{label}</span>
      {area ? (
        <textarea
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}
export function Pick({
  label,
  value,
  onChange,
  options,
  empty = "Choose…",
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  empty?: string;
}) {
  const id = useId();
  return (
    <label className="ec-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function People({
  data,
  label,
  value,
  onChange,
  duty,
}: {
  data: ControlRead;
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  duty?: "author" | "review";
}) {
  return (
    <Pick
      label={label}
      value={value}
      onChange={onChange}
      options={data.people
        .filter((p) => !duty || p[duty])
        .map((p) => ({ id: p.id, label: p.display_name }))}
    />
  );
}
export function Sources({
  data,
  value,
  onChange,
  label = "Exact source revisions",
}: {
  data: ControlRead;
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  return (
    <fieldset className="ec-choices">
      <legend>{label}</legend>
      {data.sources.length ? (
        data.sources.map((s) => (
          <label key={s.id}>
            <input
              type="checkbox"
              checked={value.includes(s.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, s.id]
                    : value.filter((id) => id !== s.id),
                )
              }
            />
            <span>
              {s.reference} · engineering revision {s.revision} · source version{" "}
              {s.file_version}
              <small>
                {s.title} · {s.use} · {s.completeness}
              </small>
            </span>
          </label>
        ))
      ) : (
        <p>
          No permitted source snapshots. The coordinator can retain synthetic
          evidence in Materials → Sources; live SharePoint/CAD is not
          configured.
        </p>
      )}
    </fieldset>
  );
}
export function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="ec-choices">
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.id}>
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, o.id]
                  : value.filter((id) => id !== o.id),
              )
            }
          />
          {o.label}
        </label>
      ))}
      {!options.length && <p>None available for this package.</p>}
    </fieldset>
  );
}
