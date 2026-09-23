"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Field,
  SelectField,
  ErrorNotice,
  ValidationFields,
} from "./business-ui";
import { useCrmCommand } from "./crm-state";
import type { csOptions } from "../shared/cs/options";
import type {
  CsKind,
  CsRow,
  CsContent,
  ReadinessContent,
  SurveyContent,
  PlanContent,
} from "../shared/cs/model";
import { evidenceKinds } from "../shared/cs/model";
export type CsOptions = Awaited<ReturnType<typeof csOptions>>;
type Choice = { id: string; display_name: string };
type Item = Record<string, unknown> & { id: string };
type Spec = {
  key: string;
  label: string;
  type?: "date" | "time" | "checkbox" | "textarea";
  choices?: Choice[];
  optional?: boolean;
  hint?: string;
};
const choices = (xs: readonly string[]) =>
  xs.map((x) => ({ id: x, display_name: x }));
export function MultiChoice({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Choice[];
  value: string[];
  onChange: (x: string[]) => void;
}) {
  return (
    <fieldset className="cs-checks">
      <legend>{label}</legend>
      {items.length ? (
        items.map((o) => (
          <label key={o.id}>
            <input
              type="checkbox"
              checked={value.includes(o.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, o.id]
                    : value.filter((x) => x !== o.id),
                )
              }
            />
            {o.display_name}
          </label>
        ))
      ) : (
        <p>
          No permitted choices returned. Open the owning register to check the
          context.
        </p>
      )}
    </fieldset>
  );
}
function Input({
  spec,
  value,
  onChange,
  index,
}: {
  spec: Spec;
  value: unknown;
  onChange: (v: unknown) => void;
  index: number;
}) {
  const name = spec.key + "-" + index;
  if (spec.type === "checkbox")
    return (
      <label>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {spec.label}
      </label>
    );
  if (spec.choices)
    return (
      <SelectField
        name={name}
        label={spec.label}
        value={String(value ?? "")}
        options={spec.choices}
        onChange={(v) => onChange(v || null)}
        required={!spec.optional}
      />
    );
  return (
    <Field
      name={name}
      label={spec.label}
      value={String(value ?? "")}
      onChange={(v) => onChange(spec.optional && !v ? null : v)}
      type={
        spec.type === "date" || spec.type === "time" ? spec.type : undefined
      }
      multiline={spec.type === "textarea"}
      maxLength={spec.type === "textarea" ? 2000 : 200}
      required={!spec.optional}
      hint={spec.hint}
    />
  );
}
function Rows({
  title,
  items,
  specs,
  onChange,
  create,
  transform,
}: {
  title: string;
  items: Item[];
  specs: Spec[];
  onChange: (xs: Item[]) => void;
  create: () => Item;
  transform?: (item: Item, key: string, value: unknown) => Item;
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {items.length === 0 && <p>Not recorded.</p>}
      {items.map((item, i) => (
        <fieldset key={item.id} className="cs-entry">
          <legend>
            {title} {i + 1}
          </legend>
          <div className="cs-fields">
            {specs
              .filter(
                (s) =>
                  !(s.key === "value" || s.key === "unit") ||
                  item.kind === "Measured",
              )
              .map((spec) => (
                <Input
                  key={spec.key}
                  spec={spec}
                  value={item[spec.key]}
                  index={i}
                  onChange={(value) =>
                    onChange(
                      items.map((x) =>
                        x.id === item.id
                          ? transform
                            ? transform(x, spec.key, value)
                            : { ...x, [spec.key]: value }
                          : x,
                      ),
                    )
                  }
                />
              ))}
          </div>
          <button
            className="secondary"
            type="button"
            onClick={() => onChange(items.filter((x) => x.id !== item.id))}
          >
            Remove {title.toLowerCase()} {i + 1} from this draft
          </button>
        </fieldset>
      ))}
      <button
        className="secondary"
        type="button"
        disabled={items.length >= 40}
        onClick={() => onChange([...items, create()])}
      >
        Add {title.toLowerCase()}
      </button>
    </section>
  );
}
export function CommandStatus({
  command,
}: {
  command: ReturnType<typeof useCrmCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      <p role="status">{command.status}</p>
      {command.uncertain && (
        <button
          type="button"
          className="secondary"
          disabled={command.busy}
          onClick={() => void command.reconcile()}
        >
          Confirm original save
        </button>
      )}
    </>
  );
}
export function ContentEditor({
  row,
  kind,
  options,
  view,
  onSaved,
  onCancel,
}: {
  row: CsRow;
  kind: CsKind;
  options: CsOptions;
  view: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CsContent>(structuredClone(row.content)),
    [name, setName] = useState(row.name),
    [owner, setOwner] = useState(row.owner_id),
    [reason, setReason] = useState("");
  const command = useCrmCommand(onSaved),
    set = (value: CsContent) => {
      setDraft(value);
      command.dirty();
    };
  const activity: Spec = {
    key: "activity_id",
    label: "Existing owned follow-up",
    choices: options.activities,
    optional: true,
  };
  const facility: Spec = {
    key: "facility_id",
    label: "Exact Facility (blank means Site)",
    choices: options.facilities,
    optional: true,
  };
  const source: Spec = {
    key: "source",
    label: "Source and revision / evidence reference",
    type: "textarea",
  };
  const activityBasis: Spec = {
    key: "activity",
    label: "Activity basis",
    hint: "Record an exact activity label, or * only when the source explicitly covers all activities.",
  };
  const targetFields = [
    facility,
    {
      key: "asset_id",
      label: "Exact equipment (optional)",
      choices: options.assets,
      optional: true,
    } satisfies Spec,
  ];
  const today = () => new Date().toISOString().slice(0, 10);
  const r = draft as ReadinessContent,
    s = draft as SurveyContent,
    p = draft as PlanContent;
  const arrays = (key: string, items: Item[]) =>
    set({ ...draft, [key]: items } as CsContent);
  const requiredSpecs: Spec[] = [
    { key: "title", label: "Requirement" },
    {
      key: "kind",
      label: "Evidence required",
      choices: choices(evidenceKinds),
    },
    facility,
    activityBasis,
    source,
  ];
  return (
    <form
      className="cs-form detail-section"
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`cs/${kind}/${row.id}/save`, {
          expected_version: row.version,
          name,
          owner_id: owner,
          content: draft,
          reason,
        });
      }}
    >
      <h2>Edit {view === "overview" ? "record" : view}</h2>
      <p>
        Editing saved version {row.version}. A conflicting change must be
        reloaded and reconciled; this draft will not silently replace it.
      </p>
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <div className="cs-fields">
            <Field
              name="name"
              label="Name"
              value={name}
              onChange={(v) => {
                setName(v);
                command.dirty();
              }}
              required
            />
            <SelectField
              name="owner_id"
              label="Accountable owner"
              value={owner}
              options={options.owners.edit}
              onChange={(v) => {
                setOwner(v);
                command.dirty();
              }}
              required
            />
          </div>
          {kind === "Readiness" && (
            <>
              <details open={view === "requirements" || view === "overview"}>
                <summary>Requirements and exact applicability</summary>
                <Rows
                  title="Requirement"
                  items={r.requirements}
                  specs={requiredSpecs}
                  onChange={(xs) => arrays("requirements", xs)}
                  create={() => ({
                    id: crypto.randomUUID(),
                    revision: 1,
                    title: "",
                    kind: "Site approval",
                    facility_id: null,
                    activity: "",
                    source: "",
                  })}
                />
              </details>
              <details open={view === "evidence"}>
                <summary>Visitor, biosecurity and captured evidence</summary>
                <p>
                  Capture records a source. Another permitted editor must review
                  each exact item separately. Individual induction needs the
                  named Person.
                </p>
                <Rows
                  title="Evidence"
                  items={r.evidence}
                  specs={[
                    {
                      key: "requirement_id",
                      label: "Exact requirement",
                      choices: r.requirements.map((x) => ({
                        id: x.id,
                        display_name: `${x.title} · revision ${x.revision}`,
                      })),
                    },
                    facility,
                    activityBasis,
                    {
                      key: "person_id",
                      label: "Individual visitor (required for induction)",
                      choices: options.people,
                      optional: true,
                    },
                    { key: "captured_on", label: "Capture date", type: "date" },
                    { key: "expires_on", label: "Valid through", type: "date" },
                    source,
                  ]}
                  onChange={(xs) => arrays("evidence", xs)}
                  transform={(item, key, value) => {
                    const requirement =
                      key === "requirement_id"
                        ? r.requirements.find((x) => x.id === value)
                        : null;
                    return {
                      ...item,
                      [key]: value,
                      ...(requirement
                        ? {
                            requirement_revision: requirement.revision,
                            facility_id: requirement.facility_id,
                            activity: requirement.activity,
                          }
                        : {}),
                    };
                  }}
                  create={() => ({
                    id: crypto.randomUUID(),
                    requirement_id: null,
                    requirement_revision: 1,
                    facility_id: null,
                    activity: "",
                    person_id: null,
                    captured_on: today(),
                    expires_on: today(),
                    source: "",
                  })}
                />
              </details>
              <details open={view === "windows"}>
                <summary>Seasonal and dated work windows</summary>
                <p>
                  Use the Site time zone: {options.context.timezone}. Missing
                  windows do not establish unrestricted access.
                </p>
                <Rows
                  title="Work window"
                  items={r.windows}
                  specs={[
                    facility,
                    activityBasis,
                    { key: "from_date", label: "Effective from", type: "date" },
                    {
                      key: "to_date",
                      label: "Effective through",
                      type: "date",
                    },
                    { key: "season_from", label: "Season begins (MM-DD)" },
                    { key: "season_to", label: "Season ends (MM-DD)" },
                    { key: "start_time", label: "Daily start", type: "time" },
                    { key: "end_time", label: "Daily end", type: "time" },
                    source,
                  ]}
                  onChange={(xs) => arrays("windows", xs)}
                  create={() => ({
                    id: crypto.randomUUID(),
                    facility_id: null,
                    activity: "",
                    from_date: "",
                    to_date: "",
                    season_from: "",
                    season_to: "",
                    start_time: "",
                    end_time: "",
                    source: "",
                  })}
                />
              </details>
            </>
          )}
          {kind === "Survey" && (
            <>
              <Field
                name="purpose"
                label="Survey scope and purpose"
                maxLength={4000}
                multiline
                value={s.purpose}
                onChange={(v) => set({ ...s, purpose: v })}
                required
              />
              <MultiChoice
                label="Exact Facilities in scope"
                items={options.facilities}
                value={s.facility_ids}
                onChange={(v) => set({ ...s, facility_ids: v })}
              />
              <MultiChoice
                label="Exact equipment in scope"
                items={options.assets}
                value={s.asset_ids}
                onChange={(v) => set({ ...s, asset_ids: v })}
              />
              <Rows
                title="Observation"
                items={s.observations}
                specs={[
                  { key: "title", label: "Observation" },
                  {
                    key: "kind",
                    label: "Observation basis",
                    choices: choices([
                      "Measured",
                      "Observed",
                      "Customer statement",
                      "Assumption",
                      "Unknown",
                    ]),
                  },
                  ...targetFields,
                  { key: "value", label: "Measured value" },
                  { key: "unit", label: "Explicit unit" },
                  {
                    key: "detail",
                    label: "Finding / missing information",
                    type: "textarea",
                  },
                  { key: "observer", label: "Observer or source person" },
                  { key: "captured_on", label: "Capture date", type: "date" },
                  {
                    key: "method_source",
                    label: "Method and source",
                    type: "textarea",
                  },
                  {
                    key: "significant",
                    label: "Affects the handover",
                    type: "checkbox",
                  },
                  {
                    key: "insignificant_reason",
                    label: "Reason a gap does not affect handover",
                    optional: true,
                  },
                  activity,
                ]}
                onChange={(xs) => arrays("observations", xs)}
                transform={(item, key, value) => ({
                  ...item,
                  [key]: value,
                  ...(key === "kind" && value !== "Measured"
                    ? { value: null, unit: null }
                    : {}),
                })}
                create={() => ({
                  id: crypto.randomUUID(),
                  title: "",
                  kind: "Unknown",
                  facility_id: null,
                  asset_id: null,
                  value: null,
                  unit: null,
                  detail: "",
                  observer: "",
                  captured_on: today(),
                  method_source: "",
                  significant: true,
                  insignificant_reason: null,
                  activity_id: null,
                })}
              />
            </>
          )}
          {kind === "AccountPlan" && (
            <>
              <div className="cs-fields">
                <Field
                  name="sector"
                  label="Recorded sector (optional)"
                  value={p.sector ?? ""}
                  onChange={(v) => set({ ...p, sector: v || null })}
                />
                <Field
                  name="territory"
                  label="Recorded territory (optional)"
                  value={p.territory ?? ""}
                  onChange={(v) => set({ ...p, territory: v || null })}
                />
                <Field
                  name="review_on"
                  label="Next account review (optional)"
                  type="date"
                  value={p.review_on ?? ""}
                  onChange={(v) => set({ ...p, review_on: v || null })}
                />
              </div>
              <Field
                name="horticultural_context"
                maxLength={2000}
                label="Recorded horticultural context (optional)"
                multiline
                value={p.horticultural_context ?? ""}
                onChange={(v) =>
                  set({ ...p, horticultural_context: v || null })
                }
              />
              <Field
                name="objectives"
                maxLength={4000}
                label="Relationship objectives"
                multiline
                value={p.objectives}
                onChange={(v) => set({ ...p, objectives: v })}
                required
              />
              <Rows
                title="Planned relationship visit"
                items={p.visits}
                specs={[
                  {
                    key: "site_id",
                    label: "Related Site (optional)",
                    choices: options.sites,
                    optional: true,
                  },
                  { key: "purpose", label: "Visit purpose", type: "textarea" },
                  {
                    key: "planned_on",
                    label: "Proposed visit date (optional)",
                    type: "date",
                    optional: true,
                  },
                  activity,
                ]}
                onChange={(xs) => arrays("visits", xs)}
                create={() => ({
                  id: crypto.randomUUID(),
                  site_id: null,
                  purpose: "",
                  planned_on: null,
                  activity_id: null,
                })}
              />
              <MultiChoice
                label="Accountable next actions"
                items={options.activities}
                value={p.activity_ids}
                onChange={(v) => set({ ...p, activity_ids: v })}
              />
            </>
          )}
          <p>
            Follow-up choices: {options.activities_state}.{" "}
            <Link
              href={`/work/new?type=${row.site_id ? "Site" : "Organisation"}&id=${row.site_id ?? row.organisation_id}&company=${row.company_id}`}
            >
              Create an Activity in My Work
            </Link>
            , then reload before editing to select it. No duplicate task or
            resource booking is created here.
          </p>
          <Field
            name="reason"
            label="Reason for this revision"
            value={reason}
            onChange={(v) => {
              setReason(v);
              command.dirty();
            }}
            required
          />
          <div className="button-row">
            <button disabled={command.busy}>Save revision</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                command.discard();
                onCancel();
              }}
            >
              Discard draft
            </button>
          </div>
        </fieldset>
      </ValidationFields>
      <CommandStatus command={command} />
    </form>
  );
}
