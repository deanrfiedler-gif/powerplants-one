"use client";
import { useId, useState } from "react";
import { Field, ErrorNotice, ValidationFields, friendly } from "./business-ui";
import { Button } from "./ui/button";
import { useCrmCommand } from "./crm-state";
import type { OperationReceipt } from "../platform/operations";

export type MaOption = {
  id: string;
  label: string;
  company_id?: string;
  site_id?: string;
};
export type MaOptions = Record<string, MaOption[]>;
export type MaField = {
  key: string;
  label: string;
  type?:
    | "text"
    | "date"
    | "number"
    | "textarea"
    | "select"
    | "source"
    | "sites"
    | "tasks"
    | "mapping";
  options?: string[] | MaOption[];
  bucket?: string;
  optional?: boolean;
  hint?: string;
};
export const f = (
  key: string,
  label: string,
  type: MaField["type"] = "text",
  extra: Partial<MaField> = {},
): MaField => ({ key, label, type, ...extra });
const blankSource = () => ({
  reference: "",
  revision: "",
  availability: "Unknown",
  source_date: "",
  content: "",
  access_class: "RestrictedService",
});
type Values = Record<string, unknown>;
function FieldEditor({
  field,
  value,
  onChange,
  options,
  prefix,
}: {
  field: MaField;
  value: unknown;
  onChange: (v: unknown) => void;
  options: MaOptions;
  prefix: string;
}) {
  const key = `${prefix}-${field.key}`;
  if (field.type === "source") {
    const x = (value ?? blankSource()) as Values;
    return (
      <fieldset className="ma-subform">
        <legend>{field.label}</legend>
        {[
          f("reference", "Exact source reference"),
          f("revision", "Source revision"),
          f("availability", "Availability", "select", {
            options: ["Unknown", "Available", "Partial", "Unavailable"],
          }),
          f("source_date", "Source date", "date", { optional: true }),
          f("content", "Retained source content / reference basis", "textarea"),
          f("access_class", "Access classification", "select", {
            options: ["RestrictedService", "Internal", "RestrictedFinance"],
          }),
        ].map((s) => (
          <FieldEditor
            key={s.key}
            field={s}
            value={x[s.key]}
            onChange={(v) => onChange({ ...x, [s.key]: v })}
            options={options}
            prefix={key}
          />
        ))}
      </fieldset>
    );
  }
  if (field.type === "tasks") {
    const tasks = (value ?? []) as Values[];
    return (
      <fieldset className="ma-subform">
        <legend>{field.label}</legend>
        {tasks.map((task, i) => (
          <fieldset key={String(task.id)}>
            <legend>Task {i + 1}</legend>
            {[
              f("description", "Task description", "textarea"),
              f("expected_outcome", "Expected outcome", "textarea"),
              f(
                "completion_requirements",
                "Completion evidence required",
                "textarea",
              ),
              f("kind", "Task kind", "select", {
                options: ["Inspection", "Identification", "Intervention"],
              }),
            ].map((s) => (
              <FieldEditor
                key={s.key}
                field={s}
                value={task[s.key]}
                onChange={(v) =>
                  onChange(
                    tasks.map((t, n) => (n === i ? { ...t, [s.key]: v } : t)),
                  )
                }
                options={options}
                prefix={`${key}-${i}`}
              />
            ))}
            <Button
              variant="quiet"
              onClick={() => onChange(tasks.filter((_, n) => n !== i))}
            >
              Remove task {i + 1}
            </Button>
          </fieldset>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            onChange([
              ...tasks,
              {
                id: crypto.randomUUID(),
                description: "",
                expected_outcome: "",
                completion_requirements: "",
                kind: "Inspection",
              },
            ])
          }
          disabled={tasks.length >= 20}
        >
          Add task
        </Button>
      </fieldset>
    );
  }
  if (field.type === "sites") {
    const sites = (value ?? []) as Values[];
    return (
      <fieldset className="ma-subform">
        <legend>Covered sites and exclusions</legend>
        {sites.map((s, i) => (
          <fieldset key={i}>
            <legend>Site scope {i + 1}</legend>
            <FieldEditor
              field={f("site_id", "Site", "select", { bucket: "sites" })}
              value={s.site_id}
              onChange={(v) =>
                onChange(
                  sites.map((x, n) =>
                    n === i
                      ? {
                          ...x,
                          site_id: v,
                          facility_ids: [],
                          asset_ids: [],
                          excluded_facility_ids: [],
                          excluded_asset_ids: [],
                        }
                      : x,
                  ),
                )
              }
              options={options}
              prefix={`${key}-${i}`}
            />
            <FieldEditor
              field={f("mode", "Coverage extent", "select", {
                options: ["WholeSite", "SelectedFacilities"],
              })}
              value={s.mode}
              onChange={(v) =>
                onChange(
                  sites.map((x, n) =>
                    n === i ? { ...x, mode: v, facility_ids: [] } : x,
                  ),
                )
              }
              options={options}
              prefix={`${key}-${i}`}
            />
            {[
              ["facility_ids", "Included facilities", "facilities"],
              [
                "asset_ids",
                "Selected covered equipment (empty means all in stated area scope)",
                "assets",
              ],
              ["excluded_facility_ids", "Excluded facilities", "facilities"],
              ["excluded_asset_ids", "Excluded equipment", "assets"],
            ]
              .filter(
                ([key]) =>
                  key !== "facility_ids" || s.mode === "SelectedFacilities",
              )
              .map(([name, label, bucket]) => (
                <label key={name}>
                  {label}
                  <select
                    multiple
                    value={(s[name] ?? []) as string[]}
                    onChange={(e) =>
                      onChange(
                        sites.map((x, n) =>
                          n === i
                            ? {
                                ...x,
                                [name]: Array.from(
                                  e.target.selectedOptions,
                                ).map((o) => o.value),
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    {(options[bucket] ?? [])
                      .filter((x) => x.site_id === s.site_id)
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            <Button
              variant="quiet"
              onClick={() => onChange(sites.filter((_, n) => n !== i))}
            >
              Remove site scope {i + 1}
            </Button>
          </fieldset>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            onChange([
              ...sites,
              {
                site_id: "",
                mode: "WholeSite",
                facility_ids: [],
                asset_ids: [],
                excluded_facility_ids: [],
                excluded_asset_ids: [],
              },
            ])
          }
          disabled={sites.length >= 20}
        >
          Add covered site
        </Button>
      </fieldset>
    );
  }
  if (field.type === "mapping") {
    const rows = (value ?? []) as Values[];
    return (
      <fieldset className="ma-subform">
        <legend>Exact task receiving map</legend>
        <p>
          Use the retained original task and the reviewed Service scope item.
          Descriptions must match exactly.
        </p>
        {rows.map((row, i) => (
          <fieldset key={i}>
            <legend>Task result {i + 1}</legend>
            {[
              f("task_id", "Original task identity"),
              f("scope_item_id", "Reviewed Service scope item identity"),
              f("basis", "Mapping evidence", "textarea"),
            ].map((s) => (
              <FieldEditor
                key={s.key}
                field={s}
                value={row[s.key]}
                onChange={(v) =>
                  onChange(
                    rows.map((r, n) => (n === i ? { ...r, [s.key]: v } : r)),
                  )
                }
                options={options}
                prefix={`${key}-${i}`}
              />
            ))}
            <Button
              variant="secondary"
              onClick={() => onChange(rows.filter((_, n) => n !== i))}
            >
              Remove task result {i + 1}
            </Button>
          </fieldset>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            onChange([...rows, { task_id: "", scope_item_id: "", basis: "" }])
          }
          disabled={rows.length >= 20}
        >
          Add task result
        </Button>
      </fieldset>
    );
  }
  if (field.type === "select") {
    const choices = field.options ?? options[field.bucket ?? field.key] ?? [];
    return (
      <label className="ma-select" htmlFor={key}>
        {field.label}
        {!field.optional && " *"}
        <select
          id={key}
          data-validation-field={field.key}
          required={!field.optional}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {field.optional ? "Not established" : "Select…"}
          </option>
          {choices.map((x) =>
            typeof x === "string" ? (
              <option key={x} value={x}>
                {friendly(x)}
              </option>
            ) : (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ),
          )}
        </select>
        {field.hint && <small>{field.hint}</small>}
      </label>
    );
  }
  return (
    <Field
      name={key}
      validationField={field.key}
      label={field.label}
      value={String(value ?? "")}
      onChange={onChange}
      required={!field.optional}
      multiline={field.type === "textarea"}
      type={
        field.type === "date"
          ? "date"
          : field.type === "number"
            ? "number"
            : "text"
      }
      maxLength={field.type === "textarea" ? 4000 : 200}
      hint={field.hint}
    />
  );
}
export function MaForm({
  title,
  path,
  fields,
  build,
  onSaved,
  options = {},
  initial = {},
  version,
  versionField = "expected_version",
}: {
  title: string;
  path: string;
  fields: MaField[];
  build: (v: Values) => Values;
  onSaved: (r: OperationReceipt) => void;
  options?: MaOptions;
  initial?: Values;
  version?: number;
  versionField?: string;
}) {
  const prefix = useId(),
    [values, setValues] = useState<Values>(initial),
    [observed, setObserved] = useState(version);
  const command = useCrmCommand((r) => {
    if (versionField === "expected_version") setObserved(r.record_version);
    onSaved(r);
  });
  const clean = (v: Values) =>
    Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, x === "" ? null : x]),
    );
  return (
    <details className="ma-action">
      <summary>{title}</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prepared = { ...values };
          for (const field of fields) {
            if (field.type === "number")
              prepared[field.key] = Number(values[field.key]);
            if (field.type === "source")
              prepared[field.key] = clean(
                (values[field.key] ?? blankSource()) as Values,
              );
          }
          void command.send(path, {
            ...build(clean(prepared)),
            ...(observed ? { [versionField]: observed } : {}),
            reason: String(values.reason ?? ""),
          });
        }}
      >
        <ValidationFields error={command.error}>
          <fieldset
            disabled={command.busy || command.uncertain}
            className="ma-form-grid"
          >
            {fields.map((field) => (
              <FieldEditor
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) => {
                  setValues((x) => ({ ...x, [field.key]: v }));
                  command.dirty();
                }}
                options={options}
                prefix={prefix}
              />
            ))}
            <Field
              name={`${prefix}-reason`}
              validationField="reason"
              label="Reason for this action"
              value={String(values.reason ?? "")}
              onChange={(v) => {
                setValues((x) => ({ ...x, reason: v }));
                command.dirty();
              }}
              required
              multiline
              maxLength={1000}
            />
            <Button type="submit" busy={command.busy}>
              {title}
            </Button>
          </fieldset>
          <ErrorNotice error={command.error} />
          <p role="status">{command.status}</p>
          {command.uncertain && (
            <Button
              onClick={() => void command.reconcile()}
              busy={command.busy}
            >
              Recover original operation
            </Button>
          )}
          {version !== undefined && observed !== version && (
            <p className="ma-notice">
              A newer record version is available. Your draft still carries
              version {observed}. Compare the current record before making a new
              decision.{" "}
              <Button variant="quiet" onClick={() => setObserved(version)}>
                Use current version after comparison
              </Button>
            </p>
          )}
        </ValidationFields>
      </form>
    </details>
  );
}

export const ownerField = f("owner_id", "Responsible owner", "select", {
  bucket: "users",
});
export const sourceField = f("source", "Exact source", "source");
export const baseContext = [
  f("customer_id", "Customer / contracting organisation", "select", {
    bucket: "customers",
  }),
  f("site_id", "Event / work site", "select", { bucket: "sites" }),
  f("asset_id", "Canonical equipment", "select", { bucket: "assets" }),
  ownerField,
];
export const agreementFields = [
  f("title", "Agreement title"),
  f("effective_from", "Effective date", "date"),
  f("effective_to", "Expiry date", "date"),
  f("service_scope", "Service scope", "textarea"),
  f("exclusions", "Exclusions", "textarea"),
  f("response_terms", "Sourced response terms", "textarea", { optional: true }),
  f("charging_basis", "Charging basis / Finance review ownership", "textarea"),
  f("billing_owner_id", "Finance review owner", "select", { bucket: "users" }),
  f("responsibilities", "Responsibilities", "textarea"),
  sourceField,
  f("sites", "Covered sites", "sites"),
];
export const planFields = [
  f("title", "Plan title"),
  f("agreement_revision_id", "Exact agreement revision", "select", {
    bucket: "agreements",
  }),
  f("task_set_reference", "Task template reference"),
  f("task_set_revision", "Task template revision"),
  f("interval", "Sourced interval", "select", {
    options: ["Monthly", "Quarterly"],
  }),
  f("interval_source", "Interval source", "source"),
  f("anchor", "Original calendar anchor", "date"),
  f("timezone", "IANA timezone"),
  f("window_months", "Generation window in months (1–12)", "number"),
  f("tolerance", "Sourced tolerance", "textarea", { optional: true }),
  f("effective_from", "Revision effective date", "date"),
  f("tasks", "Task set", "tasks"),
];
export const assessmentFields = [
  f("agreement_revision_id", "Exact agreement revision", "select", {
    bucket: "agreements",
    optional: true,
  }),
  f("facility_id", "Assessed area / facility", "select", {
    bucket: "facilities",
    optional: true,
  }),
  f("event_date", "Assessed event / original due date", "date"),
  f("status", "Coverage determination", "select", {
    options: ["Unknown", "Covered", "NotCovered", "Disputed", "NotApplicable"],
  }),
  f("cause", "Cause assessment (independent of coverage)", "textarea"),
  f("basis", "Evidence and source basis", "textarea"),
  ownerField,
  f("review_due", "Review due date", "date", { optional: true }),
  f("next_action", "Next action", "textarea"),
];
