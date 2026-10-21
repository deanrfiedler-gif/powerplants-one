"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Field,
  SelectField,
  PageHeader,
  ValidationFields,
  ReadState,
  type Envelope,
  type Option,
} from "../business-ui";
import { useCrmCommand, useCrmResource } from "../crm-state";
import { LocalDateTimeField } from "../record-ui";
import { CommandStatus, MultiChoice, type CsOptions } from "../cs-forms";
import { Button } from "../ui/button";
import type { SurveyContent, Observation } from "../../shared/cs/model";
import type { listCs } from "../../shared/cs/service";
import {
  useSurveyFormFocus,
  SurveySection,
  SurveyTag,
  observationKinds,
  type SurveyWorkspace,
} from "./survey-ui";
import "../../app/styles/organisations.css";
import "../../app/styles/surveys.css";
const empty = (): SurveyContent => ({
  schema_version: 1,
  purpose: "",
  facility_ids: [],
  asset_ids: [],
  observations: [],
  visit: {
    planned_at: null,
    ends_at: null,
    contact_id: null,
    recorder_id: null,
  },
});
function ScopeFields({
  content,
  onChange,
  options,
  part = "all",
  requireVisit = false,
}: {
  part?: "all" | "visit" | "scope" | "purpose";
  requireVisit?: boolean;
  content: SurveyContent;
  onChange: (content: SurveyContent) => void;
  options: CsOptions;
}) {
  const visit = content.visit ?? {
    planned_at: null,
    ends_at: null,
    contact_id: null,
    recorder_id: null,
  };
  return (
    <>
      {(part === "all" || part === "visit") && (
        <div className="srv-form-grid">
          <LocalDateTimeField
            name="planned_at"
            label="Planned visit"
            value={visit.planned_at ?? ""}
            onChange={(v) =>
              onChange({
                ...content,
                visit: { ...visit, planned_at: v || null },
              })
            }
            timezone={
              options.context.timezone
                ? String(options.context.timezone)
                : undefined
            }
            required={requireVisit}
          />
          <LocalDateTimeField
            name="ends_at"
            label="Visit ends"
            value={visit.ends_at ?? ""}
            onChange={(v) =>
              onChange({ ...content, visit: { ...visit, ends_at: v || null } })
            }
            timezone={
              options.context.timezone
                ? String(options.context.timezone)
                : undefined
            }
            required={false}
          />
          <SelectField
            name="contact_id"
            label="Contact on site"
            value={visit.contact_id ?? ""}
            onChange={(v) =>
              onChange({
                ...content,
                visit: { ...visit, contact_id: v || null },
              })
            }
            options={options.people}
            empty="Not recorded"
          />
        </div>
      )}
      {(part === "all" || part === "scope") && (
        <>
          <MultiChoice
            label="Areas in scope"
            items={options.facilities}
            value={content.facility_ids}
            onChange={(ids) => onChange({ ...content, facility_ids: ids })}
          />
          <MultiChoice
            label="Equipment in scope"
            items={options.assets}
            value={content.asset_ids}
            onChange={(ids) => {
              const installed = options.assets
                .filter((a) => ids.includes(a.id))
                .flatMap((a) => (a.facility_id ? [a.facility_id] : []));
              onChange({
                ...content,
                asset_ids: ids,
                facility_ids: [
                  ...new Set([...content.facility_ids, ...installed]),
                ],
              });
            }}
          />
          <p className="srv-note">
            Selecting equipment includes its installed area. Areas it serves are
            included only when you select them.
          </p>
        </>
      )}
      {(part === "all" || part === "purpose") && (
        <Field
          name="purpose"
          label="Purpose and objectives"
          value={content.purpose}
          onChange={(purpose) => onChange({ ...content, purpose })}
          multiline
          hint="Required before submission."
          maxLength={4000}
        />
      )}
    </>
  );
}
export function SurveyCreate({
  initialSite,
  onClose,
}: {
  initialSite: string;
  onClose: () => void;
}) {
  const [site, setSite] = useState(initialSite);
  const sites = useCrmResource<Envelope<Option>>("sites?limit=100", true);
  return (
    <div className="srv-create">
      <PageHeader eyebrow="Site surveys" title="New survey" />
      {site ? (
        <CreateAtSite
          key={site}
          site={site}
          sites={sites.data?.items ?? []}
          onSiteChange={setSite}
          onClose={onClose}
        />
      ) : (
        <div className="srv-state">
          <p>Choose the site where the survey will be recorded.</p>
          <SelectField
            name="new-survey-site"
            label="Site"
            required
            value={site}
            options={sites.data?.items ?? []}
            onChange={setSite}
          />
          <ReadState
            loading={sites.loading}
            error={sites.error}
            retry={sites.reload}
          />
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
function CreateAtSite({
  site,
  sites,
  onSiteChange,
  onClose,
}: {
  site: string;
  sites: Option[];
  onSiteChange: (site: string) => void;
  onClose: () => void;
}) {
  const options = useCrmResource<CsOptions>(
      "cs/Survey/options?context_id=" + site,
      true,
    ),
    existing = useCrmResource<Awaited<ReturnType<typeof listCs>>>(
      "cs/Survey?context_id=" + site,
      true,
    ),
    router = useRouter();
  const [name, setName] = useState(""),
    [owner, setOwner] = useState(""),
    [content, setContent] = useState(empty);
  const formRef = useSurveyFormFocus();
  const command = useCrmCommand((r) => router.push("/surveys/" + r.record_id));
  const cancel = () => {
    if (
      !command.hasUnsavedChanges ||
      window.confirm("Discard this unsaved survey?")
    ) {
      command.discard();
      onClose();
    }
  };
  return (
    <>
      <ReadState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      />
      {options.data &&
        (options.data.can_create ? (
          <div className="srv-create-body">
            <form
              ref={formRef}
              className="srv-form"
              onChange={command.dirty}
              onSubmit={(e) => {
                e.preventDefault();
                void command.send("cs/Survey", {
                  id: crypto.randomUUID(),
                  context_id: site,
                  name,
                  owner_id: owner,
                  content,
                  reason: "Create survey draft: " + name,
                });
              }}
            >
              <ValidationFields error={command.error}>
                <fieldset disabled={command.busy || command.uncertain}>
                  <SurveySection title="Survey">
                    <div className="srv-form-grid">
                      <SelectField
                        name="new-survey-site"
                        label="Site"
                        required
                        value={site}
                        options={sites}
                        onChange={(v) => {
                          if (
                            v !== site &&
                            (!command.hasUnsavedChanges ||
                              window.confirm(
                                "Discard this unsaved survey and change site?",
                              ))
                          ) {
                            command.discard();
                            onSiteChange(v);
                          }
                        }}
                      />
                      <Field
                        name="name"
                        label="Survey title"
                        value={name}
                        onChange={setName}
                        required
                      />
                      <SelectField
                        name="owner_id"
                        label="Owner"
                        value={owner}
                        onChange={setOwner}
                        options={options.data.owners.edit}
                        required
                      />
                      <ScopeFields
                        part="visit"
                        requireVisit
                        content={content}
                        onChange={(v) => {
                          setContent(v);
                          command.dirty();
                        }}
                        options={options.data}
                      />
                    </div>
                  </SurveySection>
                  <SurveySection title="Scope">
                    <ScopeFields
                      part="scope"
                      content={content}
                      options={options.data}
                      onChange={(v) => {
                        setContent(v);
                        command.dirty();
                      }}
                    />
                  </SurveySection>
                  <SurveySection title="Purpose">
                    <ScopeFields
                      part="purpose"
                      content={content}
                      options={options.data}
                      onChange={(v) => {
                        setContent(v);
                        command.dirty();
                      }}
                    />
                  </SurveySection>
                  <footer className="srv-form-actions">
                    <Button onClick={cancel}>Cancel</Button>
                    <Button type="submit" variant="primary" busy={command.busy}>
                      Create draft
                    </Button>
                  </footer>
                </fieldset>
              </ValidationFields>
              <CommandStatus command={command} />
            </form>
            <aside className="srv-create-existing">
              <h2>Already recorded at this site</h2>
              <ReadState
                loading={existing.loading}
                error={existing.error}
                retry={existing.reload}
              />
              {existing.data &&
                (existing.data.items.length ? (
                  existing.data.items.map((s) => (
                    <article key={s.id}>
                      <Link href={"/surveys/" + s.id}>{s.name}</Link>
                      <p>
                        <SurveyTag value={s.state} /> · revision {s.revision}
                      </p>
                    </article>
                  ))
                ) : (
                  <p>No surveys are recorded at this site.</p>
                ))}
              <p>Bring a reviewed survey up to date with a successor draft.</p>
              <Link href={"/sites/" + site + "/readiness"}>
                Access & readiness for this site
              </Link>
            </aside>
          </div>
        ) : (
          <p className="srv-state">
            You can view this site but cannot create a survey here.{" "}
            <Button onClick={onClose}>Back to surveys</Button>
          </p>
        ))}
    </>
  );
}
export function SurveyScopeEditor({
  data,
  options,
  onSaved,
  onClose,
}: {
  data: SurveyWorkspace;
  options: CsOptions;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [base] = useState(data.record);
  const [name, setName] = useState(base.name),
    [owner, setOwner] = useState(base.owner_id),
    [content, setContent] = useState(base.content as SurveyContent),
    [reason, setReason] = useState("");
  const formRef = useSurveyFormFocus();
  const command = useCrmCommand(
    () => {
      onSaved();
      onClose();
    },
    "Unsaved",
    undefined,
    true,
    ["view"],
  );
  return (
    <form
      ref={formRef}
      className="srv-form"
      onChange={command.dirty}
      onSubmit={(e) => {
        e.preventDefault();
        void command.send("cs/Survey/" + data.record.id + "/save", {
          expected_version: base.version,
          name,
          owner_id: owner,
          content,
          reason,
        });
      }}
    >
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <SurveySection title="Edit survey scope">
            <Field
              name="name"
              label="Survey title"
              value={name}
              onChange={setName}
              required
            />
            <SelectField
              name="owner_id"
              label="Owner"
              value={owner}
              onChange={setOwner}
              options={options.owners.edit}
              required
            />
            <ScopeFields
              content={content}
              options={options}
              onChange={(v) => {
                setContent(v);
                command.dirty();
              }}
            />
            <Field
              name="reason"
              label="Reason for this change"
              value={reason}
              onChange={setReason}
              required
            />
          </SurveySection>
          <footer className="srv-form-actions">
            <Button
              onClick={() => {
                if (
                  !command.hasUnsavedChanges ||
                  window.confirm("Discard your unsaved scope changes?")
                ) {
                  command.discard();
                  onClose();
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save draft
            </Button>
          </footer>
        </fieldset>
      </ValidationFields>
      <CommandStatus command={command} />
    </form>
  );
}
export function ObservationEditor({
  data,
  options,
  answer,
  onSaved,
  onClose,
}: {
  data: SurveyWorkspace;
  options: CsOptions;
  answer?: Observation;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [base] = useState(data.record);
  const content = base.content as SurveyContent;
  const actor =
    options.owners.edit.find((u) => u.id === data.actor_id)?.display_name ??
    "Current user";
  const [observation, setObservation] = useState<Observation>(() => ({
    id: crypto.randomUUID(),
    title: answer?.title ?? "",
    kind: "Measured",
    facility_id: answer?.facility_id ?? null,
    asset_id: answer?.asset_id ?? null,
    value: null,
    unit: null,
    detail: "",
    observer: actor,
    captured_on: new Intl.DateTimeFormat("en-CA", {
      timeZone: String(options.context.timezone ?? "Australia/Brisbane"),
    }).format(new Date()),
    method_source: "",
    significant: true,
    insignificant_reason: null,
    activity_id: answer?.activity_id ?? null,
    ...(answer ? { answers_observation_id: answer.id } : {}),
  }));
  const formRef = useSurveyFormFocus();
  const command = useCrmCommand(
    () => {
      onSaved();
      onClose();
    },
    "Unsaved",
    undefined,
    true,
    ["view"],
  );
  const patch = (next: Partial<Observation>) => {
    setObservation((o) => ({ ...o, ...next }));
    command.dirty();
  };
  const targets = [
    ...options.facilities
      .filter((f) => content.facility_ids.includes(f.id))
      .map((f) => ({ ...f, id: "facility:" + f.id })),
    ...options.assets
      .filter((a) => content.asset_ids.includes(a.id))
      .map((a) => ({ ...a, id: "asset:" + a.id })),
  ];
  return (
    <form
      ref={formRef}
      className="srv-form srv-observation-form"
      onChange={command.dirty}
      onSubmit={(e) => {
        e.preventDefault();
        const next = {
          ...content,
          visit: {
            planned_at: null,
            ends_at: null,
            contact_id: null,
            ...content.visit,
            recorder_id: content.visit?.recorder_id ?? data.actor_id,
          },
          observations: [
            ...content.observations.filter(
              (o) => !answer || o.id !== answer.id,
            ),
            observation,
          ],
        };
        void command.send("cs/Survey/" + data.record.id + "/save", {
          expected_version: base.version,
          name: base.name,
          owner_id: base.owner_id,
          content: next,
          reason: "Record observation: " + observation.title,
        });
      }}
    >
      <header>
        <h2>Record observation</h2>
        <p>
          <SurveyTag value="Draft" /> · Revision {data.record.revision}
          {data.record.revision > 1 ? " · Successor draft" : ""}
        </p>
      </header>
      {answer && (
        <p className="srv-notice">
          Answers the earlier Unknown: {answer.title}. The earlier revision and
          its original observation remain unchanged.
        </p>
      )}
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <p className="srv-label">Kind</p>
          <p className="srv-note">
            {observation.kind === "Measured"
              ? "A measurement needs a number and a unit."
              : "Record the method and source for this observation."}
          </p>
          <div
            className="srv-kind-chips"
            role="group"
            aria-label="Observation kind"
          >
            {observationKinds.map((kind) => (
              <Button
                key={kind}
                aria-pressed={observation.kind === kind}
                onClick={() =>
                  patch({
                    kind,
                    ...(kind !== "Measured" ? { value: null, unit: null } : {}),
                  })
                }
              >
                {kind}
              </Button>
            ))}
          </div>
          <Field
            name="observation-title"
            validationField="title"
            label="Title"
            required
            value={observation.title}
            onChange={(title) => patch({ title })}
          />
          <SelectField
            name="observation-target"
            validationField="facility_id"
            label="Target"
            value={
              observation.asset_id
                ? "asset:" + observation.asset_id
                : observation.facility_id
                  ? "facility:" + observation.facility_id
                  : ""
            }
            options={targets}
            empty="Whole site"
            onChange={(value) => {
              const [kind, id] = value.split(":");
              patch({
                asset_id: kind === "asset" ? id : null,
                facility_id:
                  kind === "asset"
                    ? (options.assets.find((a) => a.id === id)?.facility_id ??
                      null)
                    : kind === "facility"
                      ? id
                      : null,
              });
            }}
          />
          {observation.kind === "Measured" && (
            <div className="srv-measurement-fields">
              <Field
                name="value"
                label="Value"
                value={observation.value ?? ""}
                onChange={(value) => patch({ value: value || null })}
                required
              />
              <Field
                name="unit"
                label="Unit"
                value={observation.unit ?? ""}
                onChange={(unit) => patch({ unit: unit || null })}
                required
              />
            </div>
          )}
          <Field
            name="method_source"
            label="Method and source"
            value={observation.method_source}
            onChange={(method_source) => patch({ method_source })}
            multiline
            required
            maxLength={2000}
          />
          <p className="srv-recorded">
            Recorded {observation.captured_on} · {observation.observer}
          </p>
          <label className="srv-check">
            <input
              type="checkbox"
              checked={observation.significant}
              onChange={(e) => patch({ significant: e.target.checked })}
            />
            Affects the handover
          </label>
          {["Unknown", "Assumption"].includes(observation.kind) &&
            (observation.significant ? (
              <>
                <SelectField
                  name="activity_id"
                  label="Owned follow-up"
                  options={options.activities}
                  value={observation.activity_id ?? ""}
                  onChange={(v) => patch({ activity_id: v || null })}
                  empty="Assign before submitting"
                />
                <p className="srv-note">
                  The follow-up must be an open activity linked to this site,
                  with an owner and due date.{" "}
                  <Link href={"/my-work?site_id=" + data.record.site_id}>
                    Open My Work
                  </Link>
                </p>
              </>
            ) : (
              <Field
                name="insignificant_reason"
                label="Why this gap does not affect handover"
                value={observation.insignificant_reason ?? ""}
                onChange={(v) => patch({ insignificant_reason: v || null })}
                required
                multiline
              />
            ))}
          <footer className="srv-form-actions">
            <Button
              onClick={() => {
                if (
                  !command.hasUnsavedChanges ||
                  window.confirm("Discard this unsaved observation?")
                ) {
                  command.discard();
                  onClose();
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save observation
            </Button>
          </footer>
        </fieldset>
      </ValidationFields>
      <CommandStatus command={command} />
    </form>
  );
}
