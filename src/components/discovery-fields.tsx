"use client";
import type {
  Answer,
  AnswerValue,
  DiscoveryInput,
  DiscoveryScope,
  FollowUp,
  Question,
  SystemTag,
} from "../estimating/discovery";
import type { discoveryFormOptions } from "../estimating/discovery-form-options";
import { applicableQuestions } from "../estimating/discovery-questions";
import { Field, SelectField } from "./business-ui";
export type FormOptions = Awaited<ReturnType<typeof discoveryFormOptions>>;
export const labels = (values: readonly string[]) =>
  values.map((id) => ({
    id,
    display_name: id.replace(/([a-z])([A-Z])/g, "$1 $2"),
  }));
const systemLabels: { id: SystemTag; display_name: string }[] = [
  { id: "ProductSupply", display_name: "Product supply" },
  { id: "DefinedLabour", display_name: "Defined labour" },
  { id: "Freight", display_name: "Freight" },
];
export function blankDiscovery(
  options: FormOptions,
  siteId: string | null,
): DiscoveryInput {
  return {
    definition_id: options.definition.id,
    definition_revision: options.definition.revision,
    definition_hash: options.definition_hash,
    effort: {
      value: "Unknown",
      source: null,
      follow_up: { owner_id: options.owner.id, reason: "" },
    },
    scope: {
      mode: siteId ? "Site" : "Unknown",
      site_id: siteId,
      site_reason: siteId ? null : "",
      follow_up: siteId ? null : { owner_id: options.owner.id, reason: "" },
      facility_ids: [],
      equipment_ids: [],
      systems: [],
      unsupported_scope: null,
    },
    answers: options.definition.questions.map((q) => ({
      question_id: q.id,
      state: "Empty",
      value: null,
      source: null,
      follow_up: { owner_id: options.owner.id, reason: "" },
    })),
  };
}
export function activeInput(
  value: DiscoveryInput,
  options: FormOptions,
): DiscoveryInput {
  const active = applicableQuestions(
    value.scope,
    value.answers,
    options.definition,
  );
  return {
    ...value,
    answers: value.answers.filter((a) =>
      active.some((q) => q.id === a.question_id),
    ),
  };
}
export function preserveAnswerOrder(
  answers: readonly Answer[],
  answer: Answer,
  questions: readonly Question[],
) {
  const byId = new Map(answers.map((item) => [item.question_id, item]));
  byId.set(answer.question_id, answer);
  return questions.flatMap((question) => {
    const current = byId.get(question.id);
    return current ? [current] : [];
  });
}
export function FollowUpFields({
  label,
  value,
  owners,
  onChange,
}: {
  label: string;
  value: FollowUp;
  owners: FormOptions["owners"];
  onChange: (v: FollowUp) => void;
}) {
  return (
    <div className="e2-grid">
      <SelectField
        label={`${label} owner`}
        name={`${label}-owner`}
        value={value.owner_id}
        options={owners}
        onChange={(owner_id) => onChange({ ...value, owner_id })}
        required
      />
      <Field
        label={`${label} follow-up reason`}
        name={`${label}-reason`}
        value={value.reason}
        onChange={(reason) => onChange({ ...value, reason })}
        maxLength={1000}
        multiline
        required
      />
    </div>
  );
}
function Membership({
  label,
  items,
  selected,
  onChange,
  max,
}: {
  label: string;
  items: { id: string; display_name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  max: number;
}) {
  return (
    <fieldset className="est-line">
      <legend>
        {label} ({selected.length}/{max})
      </legend>
      {items.length === 0 ? (
        <p>No permitted choices in this Site.</p>
      ) : (
        items.map((item) => (
          <label className="e2-check" key={item.id}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              disabled={!selected.includes(item.id) && selected.length >= max}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selected, item.id]
                    : selected.filter((id) => id !== item.id),
                )
              }
            />
            {item.display_name}
          </label>
        ))
      )}
      {selected
        .filter((id) => !items.some((item) => item.id === id))
        .map((id) => (
          <p key={id}>
            A saved selection is outside the current candidate page.{" "}
            <button
              type="button"
              className="secondary"
              onClick={() => onChange(selected.filter((x) => x !== id))}
            >
              Remove this selection
            </button>
          </p>
        ))}
    </fieldset>
  );
}
function AnswerFields({
  question: q,
  value: a,
  options,
  onChange,
}: {
  question: Question;
  value: Answer;
  options: FormOptions;
  onChange: (a: Answer) => void;
}) {
  const fallback = { owner_id: options.owner.id, reason: "" };
  function patch(next: Partial<Answer>) {
    const v = { ...a, ...next };
    if (v.state === "Empty") {
      v.value = null;
      v.source = null;
    }
    const unresolved =
      v.state === "Empty" ||
      v.state === "Deferred" ||
      v.state === "Assumed" ||
      v.value === "Unknown" ||
      (q.required && v.state !== "Confirmed");
    v.follow_up =
      v.state === "Confirmed"
        ? null
        : unresolved
          ? (v.follow_up ?? fallback)
          : v.follow_up;
    onChange(v);
  }
  const hasValue = a.state !== "Empty" && a.state !== "Deferred";
  return (
    <fieldset className="est-line e2-question">
      <legend>
        {q.id} · {q.label}
        {q.required ? " · Required" : " · Optional"}
      </legend>
      <SelectField
        label={`${q.id} answer state`}
        name={`${q.id}.state`}
        value={a.state}
        options={labels([
          "Empty",
          "Deferred",
          "Answered",
          "Confirmed",
          "Assumed",
        ])}
        onChange={(state) =>
          patch({
            state: state as Answer["state"],
            ...(state === "Deferred" ? { value: null, source: null } : {}),
          })
        }
        required
      />
      {hasValue && (
        <>
          {q.type === "Choice" ? (
            <SelectField
              label={`${q.id} ${q.label}`}
              name={q.id}
              value={typeof a.value === "string" ? a.value : ""}
              onChange={(value) => patch({ value })}
              options={labels(q.choices ?? [])}
              required
            />
          ) : q.type === "TextOrNone" ? (
            <>
              <SelectField
                label={`${q.id} declaration`}
                name={`${q.id}.declaration`}
                value={
                  a.value && typeof a.value === "object"
                    ? "NoneDeclared"
                    : "Text"
                }
                options={labels(["Text", "NoneDeclared"])}
                onChange={(v) =>
                  patch({
                    value:
                      v === "NoneDeclared" ? { choice: "NoneDeclared" } : null,
                  })
                }
              />
              {!(a.value && typeof a.value === "object") && (
                <Field
                  label={`${q.id} ${q.label}`}
                  name={q.id}
                  value={typeof a.value === "string" ? a.value : ""}
                  onChange={(value) => patch({ value: value || null })}
                  multiline
                  maxLength={q.max_length}
                  required
                />
              )}
            </>
          ) : (
            <Field
              label={`${q.id} ${q.label}`}
              name={q.id}
              value={a.value == null ? "" : String(a.value)}
              onChange={(v) =>
                patch({
                  value:
                    q.type === "Integer"
                      ? v === ""
                        ? null
                        : Number(v)
                      : v || null,
                })
              }
              type={q.type === "Integer" ? "number" : "text"}
              multiline={q.type === "Text"}
              maxLength={q.max_length}
              hint={
                q.type === "Integer"
                  ? `${q.minimum}–${q.maximum} ${q.unit}. Discovery only; no cost quantity is generated.`
                  : undefined
              }
              required
            />
          )}
          <Field
            label={`${q.id} source`}
            name={`${q.id}.source`}
            value={a.source ?? ""}
            onChange={(source) => patch({ source: source || null })}
            maxLength={500}
            required
          />
        </>
      )}
      {a.follow_up && (
        <>
          <FollowUpFields
            label={q.id}
            value={a.follow_up}
            owners={options.owners}
            onChange={(follow_up) => onChange({ ...a, follow_up })}
          />
          {!q.required && a.state === "Answered" && a.value !== "Unknown" && (
            <button
              type="button"
              className="secondary"
              onClick={() => onChange({ ...a, follow_up: null })}
            >
              Resolve optional {q.id} follow-up
            </button>
          )}
        </>
      )}
    </fieldset>
  );
}
export function DiscoveryFields({
  value,
  options,
  onChange,
}: {
  value: DiscoveryInput;
  options: FormOptions;
  onChange: (v: DiscoveryInput) => void;
}) {
  const s = value.scope,
    owner = { owner_id: options.owner.id, reason: "" };
  const scope = (patch: Partial<DiscoveryScope>) =>
    onChange({ ...value, scope: { ...s, ...patch } });
  const questions = applicableQuestions(s, value.answers, options.definition);
  return (
    <>
      <h3>Scope membership</h3>
      <SelectField
        label="Site declaration"
        name="scope.mode"
        value={s.mode}
        options={labels(["Site", "NoSiteRequired", "Unknown"])}
        onChange={(v) =>
          scope({
            mode: v as DiscoveryScope["mode"],
            site_id: null,
            site_reason: v === "Site" ? null : "",
            follow_up: v === "Unknown" ? owner : null,
            facility_ids: [],
            equipment_ids: [],
            systems: s.systems.map((x) => ({ ...x, facility_ids: [] })),
          })
        }
        required
      />
      {s.mode === "Site" ? (
        <SelectField
          label="Existing Site"
          name="scope.site_id"
          value={s.site_id ?? ""}
          options={options.sites}
          onChange={(site_id) =>
            scope({
              site_id: site_id || null,
              facility_ids: [],
              equipment_ids: [],
              systems: s.systems.map((x) => ({ ...x, facility_ids: [] })),
            })
          }
          required
        />
      ) : (
        <Field
          label="Site declaration reason"
          name="scope.site_reason"
          value={s.site_reason ?? ""}
          onChange={(site_reason) => scope({ site_reason })}
          maxLength={1000}
          required
        />
      )}
      {s.follow_up && (
        <FollowUpFields
          label="Site"
          value={s.follow_up}
          owners={options.owners}
          onChange={(follow_up) => scope({ follow_up })}
        />
      )}{" "}
      {s.mode === "Site" && (
        <>
          <Membership
            label="Facilities"
            items={options.facilities}
            selected={s.facility_ids}
            max={10}
            onChange={(facility_ids) =>
              scope({
                facility_ids,
                systems: s.systems.map((x) => ({
                  ...x,
                  facility_ids: x.facility_ids.filter((id) =>
                    facility_ids.includes(id),
                  ),
                })),
              })
            }
          />
          <Membership
            label="Existing equipment"
            items={options.equipment.map((e) => ({
              ...e,
              display_name: `${e.display_name} · ${e.identity_status} · ${e.lifecycle_status}`,
            }))}
            selected={s.equipment_ids}
            max={100}
            onChange={(equipment_ids) => scope({ equipment_ids })}
          />
          <p>
            Equipment references retain recorded identity and lifecycle status.
            Selecting equipment does not verify its configuration or add a
            Facility.
          </p>
        </>
      )}
      <fieldset className="est-line">
        <legend>Supported work systems</legend>
        {systemLabels.map((item) => {
          const selected = s.systems.find((x) => x.tag === item.id);
          return (
            <div key={item.id}>
              <label className="e2-check">
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={(e) =>
                    scope({
                      systems: e.target.checked
                        ? [...s.systems, { tag: item.id, facility_ids: [] }]
                        : s.systems.filter((x) => x.tag !== item.id),
                    })
                  }
                />
                {item.display_name}
              </label>
              {selected && s.facility_ids.length > 0 && (
                <Membership
                  label={`${item.display_name} Facilities`}
                  items={options.facilities.filter((f) =>
                    s.facility_ids.includes(f.id),
                  )}
                  selected={selected.facility_ids}
                  max={10}
                  onChange={(facility_ids) =>
                    scope({
                      systems: s.systems.map((x) =>
                        x.tag === item.id ? { ...x, facility_ids } : x,
                      ),
                    })
                  }
                />
              )}
            </div>
          );
        })}
      </fieldset>
      <label className="e2-check">
        <input
          type="checkbox"
          checked={s.unsupported_scope !== null}
          onChange={(e) =>
            scope({ unsupported_scope: e.target.checked ? owner : null })
          }
        />
        Additional scope needs specialist clarification
      </label>
      {s.unsupported_scope && (
        <FollowUpFields
          label="Additional scope"
          value={s.unsupported_scope}
          owners={options.owners}
          onChange={(unsupported_scope) => scope({ unsupported_scope })}
        />
      )}
      <h3>Estimating effort</h3>
      <SelectField
        label="Effort declaration"
        name="effort.value"
        value={value.effort.value}
        options={labels(["Full", "Express", "Unknown"])}
        onChange={(v) =>
          onChange({
            ...value,
            effort: {
              value: v as DiscoveryInput["effort"]["value"],
              source: null,
              follow_up: v === "Unknown" ? owner : null,
            },
          })
        }
        required
      />
      {value.effort.follow_up ? (
        <FollowUpFields
          label="Effort"
          value={value.effort.follow_up}
          owners={options.owners}
          onChange={(follow_up) =>
            onChange({ ...value, effort: { ...value.effort, follow_up } })
          }
        />
      ) : (
        <Field
          label="Effort source"
          name="effort.source"
          value={value.effort.source ?? ""}
          onChange={(source) =>
            onChange({
              ...value,
              effort: { ...value.effort, source: source || null },
            })
          }
          required
          maxLength={500}
        />
      )}
      <h3>Applicable questions</h3>
      <p>
        {options.definition.id} · {options.definition.revision}. Unconfirmed
        required answers need an owned follow-up. Confirmed answers require an
        explicit acknowledgement in the comparison before saving.
      </p>
      {questions.map((q) => (
        <AnswerFields
          key={q.id}
          question={q}
          value={
            value.answers.find((a) => a.question_id === q.id) ?? {
              question_id: q.id,
              state: "Empty",
              value: null,
              source: null,
              follow_up: owner,
            }
          }
          options={options}
          onChange={(answer) =>
            onChange({
              ...value,
              answers: preserveAnswerOrder(
                value.answers,
                answer,
                options.definition.questions,
              ),
            })
          }
        />
      ))}
      {Object.values(options.more).some(Boolean) && (
        <p role="status">
          These choices show the first 100 permitted records in each category.
          Saved memberships outside this page remain explicit and are checked
          again on save.
        </p>
      )}
    </>
  );
}
export function answerText(value: AnswerValue): string {
  return value == null
    ? "No value recorded"
    : typeof value === "object"
      ? "None declared"
      : String(value);
}
