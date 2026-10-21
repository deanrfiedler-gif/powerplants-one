"use client";
import { useState } from "react";
import Link from "next/link";
import { useContactView } from "../contact-workspace";
import { equipmentHref, activityHref } from "../../shell/context-links";
import { ReadState } from "../business-ui";
import { useCrmResource } from "../crm-state";
import { RecordTabs, RecordPanel } from "../record-ui";
import { SharedRecord, RecordFactSection } from "../ui/shared-record";
import { RegisterTable } from "../ui/register-table";
import { Button } from "../ui/button";
import { usePhoneHeader } from "../../shell/phone-header";
import type { CsOptions } from "../cs-forms";
import type { Observation, SurveyContent } from "../../shared/cs/model";
import { SurveyScopeEditor, ObservationEditor } from "./survey-forms";
import {
  SurveyActionForm,
  SurveyDecisions,
  type SurveyAction,
} from "./survey-review";
import { SurveyPhotos } from "./survey-photos";
import {
  SurveyReadState,
  SurveyTag,
  SurveySection,
  SurveyFacts,
  surveyDate,
  surveyBoundary,
  tabs,
  observationKinds,
  type SurveyWorkspace,
} from "./survey-ui";
import "../../app/styles/organisations.css";
import "../../app/styles/surveys.css";
export function SurveyRecord({ id }: { id: string }) {
  const r = useCrmResource<SurveyWorkspace>("cs/Survey/" + id);
  if (!r.data)
    return (
      <SurveyReadState loading={r.loading} error={r.error} retry={r.reload} />
    );
  return (
    <LoadedSurvey
      key={id}
      data={r.data}
      reload={r.reload}
      readError={r.error}
    />
  );
}
function LoadedSurvey({
  data,
  reload,
  readError,
}: {
  data: SurveyWorkspace;
  reload: () => void;
  readError: unknown;
}) {
  const [view, setView] = useContactView(
    tabs.map((t) => t.id),
    "scope",
  );
  const [editScope, setEditScope] = useState(false),
    [observationForm, setObservationForm] = useState<{
      answer?: Observation;
    } | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [kind, setKind] = useState("All"),
    [action, setAction] = useState<SurveyAction | null>(null);
  const options = useCrmResource<CsOptions>(
    "cs/Survey/options?context_id=" + data.record.site_id,
    true,
  );
  const row = data.record,
    content = row.content as SurveyContent,
    details = data.survey!;
  const draft = data.can_edit && row.state === "Draft",
    submitted = row.state === "Submitted";
  const openAction = (value: SurveyAction) => {
    if (!action) setAction(value);
    setView("review");
  };
  usePhoneHeader({
    title: row.display_number ?? row.name,
    record: {
      more: data.can_edit
        ? [
            {
              label:
                row.state === "Draft"
                  ? "Submit for review"
                  : submitted
                    ? "Review submission"
                    : "Start successor draft",
              onSelect: () =>
                openAction(
                  row.state === "Draft"
                    ? "submit"
                    : submitted
                      ? "review"
                      : "revise",
                ),
            },
          ]
        : [],
    },
  });
  const owner =
      details.people.find((p) => p.id === row.owner_id)?.display_name ??
      "Not recorded",
    recorder =
      details.people.find((p) => p.id === content.visit?.recorder_id)
        ?.display_name ?? "Not recorded";
  const targetName = (o: {
    asset_id: string | null;
    facility_id: string | null;
  }) =>
    details.targets.find((t) => t.id === (o.asset_id ?? o.facility_id))?.name ??
    details.site.name;
  const gaps = content.observations.filter(
    (o) => ["Unknown", "Assumption"].includes(o.kind) && o.significant,
  );
  const current =
    content.observations.find((o) => o.id === selected) ??
    content.observations[0];
  const priorUnknowns = data.snapshots
    .filter((s) => s.revision < row.revision)
    .flatMap((s) =>
      (s.basis.content as SurveyContent).observations.filter(
        (o) => o.kind === "Unknown",
      ),
    );
  const answers = priorUnknowns.filter(
    (o, i, a) =>
      a.findIndex((x) => x.id === o.id) === i &&
      !content.observations.some((x) => x.answers_observation_id === o.id),
  );
  const openObservation = (answer?: Observation) => {
    if (!observationForm) setObservationForm({ answer });
    setView("observations");
  };
  const actionButtons = (
    <>
      {draft && (
        <>
          <Button
            onClick={() => {
              setEditScope(true);
              setView("scope");
            }}
          >
            Edit scope
          </Button>
          <Button variant="primary" onClick={() => openAction("submit")}>
            Submit for review
          </Button>
        </>
      )}
      {submitted && data.can_edit && (
        <>
          <Button onClick={() => openAction("return")}>
            Return with clarification
          </Button>
          <Button variant="primary" onClick={() => openAction("review")}>
            Review submission
          </Button>
        </>
      )}
      {["Reviewed", "Returned"].includes(row.state) && data.can_edit && (
        <>
          <Button onClick={() => openAction("revise")}>
            Start successor draft
          </Button>
          {row.state === "Reviewed" && (
            <Button variant="primary" onClick={() => openAction("handover")}>
              Record handover
            </Button>
          )}
        </>
      )}
    </>
  );
  const facts = (
    <>
      <RecordFactSection title="Survey">
        <SurveyFacts
          items={[
            [
              "Site",
              <Link key="site" href={"/sites/" + details.site.id}>
                {details.site.name}
              </Link>,
            ],
            [
              "Organisation",
              details.organisations.length
                ? details.organisations.map((o) => (
                    <Link key={o.id} href={"/customers/" + o.id}>
                      {o.display_name}
                    </Link>
                  ))
                : "Not recorded",
            ],
            [
              "Contact on site",
              details.contact ? (
                <Link key="contact" href={"/people/" + details.contact.id}>
                  {details.contact.name}
                </Link>
              ) : (
                "Not recorded"
              ),
            ],
            [
              "Planned visit",
              surveyDate(
                content.visit?.planned_at,
                details.site.timezone,
                true,
              ),
            ],
            ["Recorded by", recorder],
            ["Owner", owner],
          ]}
        />
        <p className="srv-note">{surveyBoundary}</p>
        <Link href={"/sites/" + details.site.id + "/readiness"}>
          Access & readiness
        </Link>
      </RecordFactSection>
      <RecordFactSection title="Revisions">
        {[...new Set(data.history.map((h) => h.revision))].map((revision) => {
          const entry = data.history.find((h) => h.revision === revision)!;
          return (
            <article key={revision}>
              <strong>Revision {revision}</strong>
              <p>
                <SurveyTag value={entry.state} />
              </p>
              <p>{entry.reason}</p>
            </article>
          );
        })}
      </RecordFactSection>
      <RecordFactSection title="People">
        <SurveyFacts
          items={[
            ["Contact on site", details.contact?.name ?? "Not recorded"],
            ["Recorder", recorder],
            ["Owner", owner],
          ]}
        />
      </RecordFactSection>
    </>
  );
  return (
    <SharedRecord
      id="ppo-survey-record"
      sourceLabel="Survey submission and handover checks"
      title={row.name}
      reference={row.display_number ?? "Site survey"}
      status={<SurveyTag value={row.state} />}
      meta={
        <>
          <span>
            {details.site.name} · {owner}
          </span>
          <span>Revision {row.revision}</span>
        </>
      }
      actions={actionButtons}
      sources={
        <>
          <strong>
            {row.state === "Reviewed" ? "Handover checks" : "Submission checks"}
          </strong>
          <span>
            Scope{" "}
            {content.facility_ids.length + content.asset_ids.length
              ? "recorded"
              : "not recorded"}
          </span>
          <span>{content.observations.length} observations</span>
          <span>{data.photos.length} original photos</span>
          <span>
            {gaps.filter((o) => o.activity_id).length} of {gaps.length} gaps
            linked
          </span>
          <span>
            {row.state === "Draft"
              ? "Draft revision"
              : "Locked while " + row.state.toLowerCase()}
          </span>
        </>
      }
      facts={facts}
      tabs={
        <RecordTabs
          id="survey"
          label="Survey sections"
          tabs={tabs}
          value={view}
          onChange={setView}
        />
      }
      stickyAction={
        data.can_edit && !observationForm && !editScope && !action ? (
          <Button
            variant="primary"
            onClick={() =>
              row.state === "Draft"
                ? openObservation()
                : openAction(
                    submitted
                      ? "review"
                      : row.state === "Reviewed"
                        ? "handover"
                        : "revise",
                  )
            }
          >
            {row.state === "Draft"
              ? "Record observation"
              : submitted
                ? "Review submission"
                : row.state === "Reviewed"
                  ? "Record handover"
                  : "Start successor draft"}
          </Button>
        ) : undefined
      }
    >
      {Boolean(readError) && (
        <div className="srv-notice" role="status">
          The latest read could not be confirmed. This is the last loaded
          record; unsaved entries remain in this tab.{" "}
          <Button onClick={reload}>Retry read</Button>
        </div>
      )}
      {!data.can_edit && (
        <p className="srv-note">
          View access · editing and review are not available with your current
          permissions.
        </p>
      )}
      <ReadState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      />
      {details.sources.some((s) => s.changed) && (
        <SurveySection title="Scope changed since submission">
          <p className="srv-notice">
            {details.sources
              .filter((s) => s.changed)
              .map((s) => s.name)
              .join(", ")}{" "}
            changed after this survey was submitted. Review as submitted or
            return for clarification.
          </p>
          <ul className="srv-sources">
            {details.sources.map((s) => (
              <li key={s.key}>
                <strong>{s.name}</strong>
                <span>
                  Submitted version {s.version} · current{" "}
                  {s.current_version ?? "unavailable"}
                </span>
                <SurveyTag
                  value={s.changed ? "Recheck required" : "Unchanged"}
                />
              </li>
            ))}
          </ul>
        </SurveySection>
      )}
      <RecordPanel id="survey" tab="scope" value={view}>
        <div className="srv-phone-context">
          <strong>{details.site.name}</strong>
          <p>{details.contact?.name ?? "Contact on site not recorded"}</p>
          <p>
            {surveyDate(content.visit?.planned_at, details.site.timezone, true)}
          </p>
          <Link href={"/sites/" + details.site.id + "/readiness"}>
            Access & readiness
          </Link>
        </div>
        {editScope && options.data ? (
          <SurveyScopeEditor
            data={data}
            options={options.data}
            onSaved={reload}
            onClose={() => setEditScope(false)}
          />
        ) : (
          <>
            <SurveySection
              title="Survey scope"
              action={
                draft ? (
                  <Button onClick={() => setEditScope(true)}>Edit scope</Button>
                ) : undefined
              }
            >
              <p>{content.purpose}</p>
              <div className="srv-scope-rows">
                {details.targets.map((t) => (
                  <article key={t.id}>
                    <div>
                      <Link
                        href={
                          t.kind === "Asset"
                            ? equipmentHref(t.id, row.id)
                            : "/facilities/" + t.id
                        }
                      >
                        {t.name}
                      </Link>
                      <p>
                        {t.kind === "Asset" ? "Equipment" : "Area"}
                        {t.facility_id
                          ? " · installed in " +
                            (details.targets.find((f) => f.id === t.facility_id)
                              ?.name ?? "recorded area")
                          : ""}
                      </p>
                    </div>
                    <span>
                      {
                        content.observations.filter(
                          (o) => o.asset_id === t.id || o.facility_id === t.id,
                        ).length
                      }{" "}
                      observations ·{" "}
                      {
                        data.photos.filter(
                          (p) => p.asset_id === t.id || p.facility_id === t.id,
                        ).length
                      }{" "}
                      photos
                    </span>
                  </article>
                ))}
                {!details.targets.length && (
                  <p>No areas or equipment are selected.</p>
                )}
              </div>
              <p className="srv-note">
                Survey notes do not change the shared area or equipment records.
              </p>
            </SurveySection>
            <SurveySection title="Visit context">
              <p>{content.purpose}</p>
              <p className="srv-note">
                Observations retain their own recording date, method and source.
                A planned visit does not confirm attendance or authorise work.
              </p>
            </SurveySection>
          </>
        )}
      </RecordPanel>
      <RecordPanel id="survey" tab="observations" value={view}>
        {observationForm && options.data ? (
          <ObservationEditor
            key={observationForm.answer?.id ?? "new"}
            data={data}
            options={options.data}
            answer={observationForm.answer}
            onSaved={reload}
            onClose={() => setObservationForm(null)}
          />
        ) : (
          <>
            <div className="srv-section-heading">
              <h2>Observations</h2>
              {draft && (
                <Button onClick={() => openObservation()}>
                  Record observation
                </Button>
              )}
            </div>
            <div
              className="srv-kind-chips"
              role="group"
              aria-label="Filter observation kinds"
            >
              {["All", ...observationKinds].map((v) => (
                <Button
                  key={v}
                  aria-pressed={kind === v}
                  onClick={() => setKind(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
            <RegisterTable
              variant="panel"
              caption="Survey observations. Choose a title to read its source and follow-up."
            >
              <thead>
                <tr>
                  <th>Observation</th>
                  <th>Kind</th>
                  <th>Value</th>
                  <th>Target</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {content.observations
                  .filter((o) => kind === "All" || o.kind === kind)
                  .map((o) => (
                    <tr
                      key={o.id}
                      data-selected={current?.id === o.id || undefined}
                    >
                      <td>
                        <button
                          className="srv-text-button"
                          onClick={() => setSelected(o.id)}
                        >
                          {o.title}
                        </button>
                      </td>
                      <td>
                        <SurveyTag value={o.kind} />
                      </td>
                      <td>
                        {o.kind === "Measured"
                          ? o.value + " " + o.unit
                          : o.kind === "Unknown"
                            ? "Unknown"
                            : "—"}
                      </td>
                      <td>{targetName(o)}</td>
                      <td>
                        {o.activity_id
                          ? "Linked"
                          : o.significant &&
                              ["Unknown", "Assumption"].includes(o.kind)
                            ? "Needs owner"
                            : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </RegisterTable>
            {!content.observations.length && <p>No observations recorded.</p>}
            {current && (
              <SurveySection title={current.title}>
                <SurveyTag value={current.kind} />
                <SurveyFacts
                  items={[
                    ["Target", targetName(current)],
                    [
                      "Value",
                      current.kind === "Measured"
                        ? current.value + " " + current.unit
                        : current.kind === "Unknown"
                          ? "Unknown"
                          : "Not a measurement",
                    ],
                    ["Recorded by", current.observer],
                    ["Recorded on", current.captured_on],
                    ["Method and source", current.method_source],
                    [
                      "Affects handover",
                      current.significant
                        ? "Yes"
                        : (current.insignificant_reason ?? "No"),
                    ],
                  ]}
                />
                <p>{current.detail}</p>
                {current.answers_observation_id && (
                  <p className="srv-note">
                    Answers an Unknown retained in the preceding revision.
                  </p>
                )}
                {current.activity_id && (
                  <Link href={activityHref(current.activity_id)}>
                    Open owned follow-up
                  </Link>
                )}
              </SurveySection>
            )}
            {draft && answers.length > 0 && (
              <SurveySection title="Answer an earlier Unknown">
                {answers.map((o) => (
                  <Button key={o.id} onClick={() => openObservation(o)}>
                    {o.title}
                  </Button>
                ))}
              </SurveySection>
            )}
          </>
        )}
      </RecordPanel>
      <RecordPanel id="survey" tab="photos" value={view}>
        <SurveyPhotos data={data} options={options.data} onSaved={reload} />
      </RecordPanel>
      <RecordPanel id="survey" tab="follow-up" value={view}>
        <SurveySection title="Missing information & follow-up">
          <p className="srv-note">
            Significant Unknowns and Assumptions need an open activity with an
            owner and due date before submission. Review can acknowledge them as
            known gaps.
          </p>
          {content.observations
            .filter((o) => ["Unknown", "Assumption"].includes(o.kind))
            .map((o) => {
              const activity = details.followups.find(
                (a) => a.id === o.activity_id,
              );
              return (
                <article className="srv-follow-up" key={o.id}>
                  <div>
                    <strong>{o.title}</strong>
                    <p>
                      <SurveyTag value={o.kind} /> · {targetName(o)}
                    </p>
                    <p>
                      {o.significant
                        ? "Affects the handover"
                        : o.insignificant_reason}
                    </p>
                  </div>
                  <div>
                    {activity ? (
                      <>
                        <Link href={activityHref(activity.id)}>
                          {activity.summary}
                        </Link>
                        <p>
                          {activity.owner_name ?? "Owner not recorded"} ·{" "}
                          {surveyDate(
                            activity.due_at,
                            details.site.timezone,
                            true,
                          )}
                        </p>
                        <p>{activity.status}</p>
                      </>
                    ) : (
                      <p>
                        {o.significant
                          ? "Owned follow-up not recorded"
                          : "No follow-up required for this recorded reason"}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          {!content.observations.some((o) =>
            ["Unknown", "Assumption"].includes(o.kind),
          ) && <p>No Unknowns or Assumptions recorded.</p>}
        </SurveySection>
      </RecordPanel>
      <RecordPanel id="survey" tab="review" value={view}>
        {action && options.data ? (
          <SurveyActionForm
            key={action}
            data={data}
            options={options.data}
            action={action}
            onSaved={reload}
            onClose={() => setAction(null)}
          />
        ) : (
          <SurveySection title="Review & handover">
            <p>{surveyBoundary}</p>
            <div className="srv-form-actions">{actionButtons}</div>
            {submitted && !details.independent_reviewer && (
              <p>
                The owner, recorder and submitter cannot review their own
                survey.
              </p>
            )}
          </SurveySection>
        )}
        <SurveyDecisions data={data} />
      </RecordPanel>
      <RecordPanel id="survey" tab="history" value={view}>
        <SurveySection title="Retained history">
          <p className="srv-note">{data.history_scope}</p>
          {data.history.map((h) => (
            <article className="srv-decision" key={h.id}>
              <strong>
                Revision {h.revision} · version {h.version} · {h.state}
              </strong>
              <p>{surveyDate(h.recorded_at, details.site.timezone, true)}</p>
              <p>{h.reason}</p>
              <details>
                <summary>Content hash</summary>
                <code>{h.content_hash}</code>
              </details>
            </article>
          ))}
        </SurveySection>
      </RecordPanel>
    </SharedRecord>
  );
}
