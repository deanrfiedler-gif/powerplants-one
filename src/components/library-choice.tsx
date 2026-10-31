"use client";
import { useId, useState } from "react";
import { ReadState, useResource } from "./business-ui";
import { Button } from "./ui/button";
type Choices = {
  items: { id: string; display_name: string }[];
  next_after: string | null;
};
type ChoiceProps = {
  label: string;
  kind: string;
  value: string;
  onChange: (value: string) => void;
  scope?: Record<string, string>;
  required?: boolean;
  emptyLabel?: string;
};
export function LibraryChoice(props: ChoiceProps) {
  return (
    <LibraryChoiceControl
      key={JSON.stringify([props.kind, props.scope ?? {}])}
      {...props}
    />
  );
}
function LibraryChoiceControl({
  label,
  kind,
  value,
  onChange,
  scope = {},
  required = false,
  emptyLabel,
}: ChoiceProps) {
  const controlId = useId();
  const [search, setSearch] = useState(""),
    [after, setAfter] = useState("");
  const q = new URLSearchParams({
    kind,
    ...Object.fromEntries(Object.entries(scope).filter(([, v]) => v)),
    ...(search ? { q: search } : {}),
    ...(after ? { after } : {}),
  });
  const r = useResource<Choices>(`document-library/options?${q}`),
    data = !r.loading && !r.error ? r.data : null;
  const selectedQuery = new URLSearchParams({
    kind,
    ...Object.fromEntries(Object.entries(scope).filter(([, v]) => v)),
    selected_id: value,
  });
  const selected = useResource<Choices>(
    value && !data?.items.some((i) => i.id === value)
      ? `document-library/options?${selectedQuery}`
      : null,
  );
  return (
    <div className="library-choice">
      <label>
        {label}
        <select
          id={controlId}
          data-validation-field={
            kind === "Owner"
              ? "owner_id"
              : kind === "Company"
                ? "company_id"
                : kind === "Organisation"
                  ? "organisation_id"
                  : kind === "Site"
                    ? "site_id"
                    : kind.endsWith("Issue")
                      ? "source.issue_id"
                      : "target_id"
          }
          aria-label={label}
          required={required}
          value={value}
          disabled={!data}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {required
              ? "Choose…"
              : (emptyLabel ??
                `${label}: ${kind === "RecordedOwner" ? "Anyone" : "All"}`)}
          </option>
          {value && !data?.items.some((i) => i.id === value) && (
            <option value={value}>
              {selected.error
                ? "Selected record unavailable"
                : (selected.data?.items.find((i) => i.id === value)
                    ?.display_name ?? "Checking selected record…")}
            </option>
          )}
          {data?.items.map((i) => (
            <option value={i.id} key={i.id}>
              {i.display_name}
            </option>
          ))}
        </select>
      </label>
      <details>
        <summary>Find {label.toLowerCase()}</summary>
        <input
          aria-label={`Find ${label.toLowerCase()}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setAfter("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          maxLength={200}
        />
        {data?.next_after && (
          <Button onClick={() => setAfter(data.next_after!)}>
            More choices
          </Button>
        )}
        {after && <Button onClick={() => setAfter("")}>First choices</Button>}
      </details>
      <ReadState
        loading={r.loading}
        error={r.error}
        retry={r.reload}
        focusOnError={false}
      />
    </div>
  );
}
