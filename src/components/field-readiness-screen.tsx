"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  PageHeader,
  ReadState,
  Field,
  ErrorNotice,
  ValidationFields,
  Stamp,
} from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { Button } from "./ui/button";
import type { readFieldReadiness } from "../field/readiness";
import type { listMyJobs } from "../field/reads";
import "../app/field-readiness.css";
type View = Awaited<ReturnType<typeof readFieldReadiness>>;

export function FieldReadinessScreen() {
  const params = useSearchParams(),
    appointment = params.get("appointment_id");
  return (
    <div id="ppo-field-readiness">
      <PageHeader
        eyebrow="Field work · FI-05"
        title="Site readiness"
        description="Review the instructions and unresolved conditions for your exact visit."
      />
      <p>
        <Link href="/my-jobs">← My Jobs</Link>
      </p>
      {appointment ? (
        <VisitReadiness key={appointment} appointment={appointment} />
      ) : (
        <VisitList />
      )}
    </div>
  );
}
function VisitList() {
  const r = useCrmResource<Awaited<ReturnType<typeof listMyJobs>>>(
    "my-jobs",
    true,
  );
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <section className="business-card">
          <h2>Choose your assigned visit</h2>
          {r.data.items.length ? (
            r.data.items.map((j) => (
              <p key={j.id}>
                <Link href={`/my-jobs/site-readiness?appointment_id=${j.id}`}>
                  {j.reference} · {j.site_name}
                </Link>{" "}
                · {j.status}
              </p>
            ))
          ) : (
            <p>No currently permitted assigned visits were returned.</p>
          )}
          {r.data.next_cursor && <p>Open My Jobs to browse more visits.</p>}
        </section>
      )}
    </>
  );
}
function VisitReadiness({ appointment }: { appointment: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const q = new URLSearchParams();
  for (const key of ["record_id", "facility_ids", "activity"])
    if (params.get(key)) q.set(key, params.get(key)!);
  const r = useCrmResource<View>(
    `my-jobs/${appointment}/site-readiness?${q}`,
    true,
  );
  const v = r.data,
    source = v?.source;
  const facilityName = (id: string | null) =>
    id === null
      ? "Explicit Site-wide scope"
      : (v?.facilities.find((f) => f.id === id)?.display_name ?? id);
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {v && (
        <>
          <section className="business-card">
            <h2>{v.site.name}</h2>
            <p>{v.site.location || "Site location not recorded"}</p>
            <p>
              <Link href={`/my-jobs/${v.job.id}`}>{v.job.reference}</Link> ·{" "}
              {v.job.work_order_reference} · {v.job.status}
            </p>
            <p>{v.job.scope_summary}</p>
            <p>
              <Stamp value={v.job.starts_at} timezone={v.job.timezone} /> –{" "}
              <Stamp value={v.job.ends_at} timezone={v.job.timezone} /> ·{" "}
              {v.job.timezone}
            </p>
            <p>
              <strong>Arrival and access:</strong>{" "}
              {v.site.access || "Not recorded"}
            </p>
            <p>
              <strong>Biosecurity:</strong>{" "}
              {v.site.biosecurity || "Not recorded"}
            </p>
            <p>
              <Link href={`/sites/${v.site.id}/readiness`}>
                Open the owning Site readiness record
              </Link>
            </p>
            <p>
              Last verified with the server:{" "}
              <Stamp value={v.observed_at} timezone={v.job.timezone} />. Refresh
              before relying on changed instructions.
            </p>
            <Button onClick={r.reload}>Refresh current sources</Button>
          </section>
          {!source ? (
            <section className="business-card">
              <h2>Readiness unknown</h2>
              <p>
                No readiness source is recorded for this Site. Ask the Service
                owner to arrange source review before proceeding.
              </p>
            </section>
          ) : (
            <>
              <section className="business-card">
                <h2>Your review context</h2>
                <p>
                  Select the exact locations and activity described by your work
                  instructions. This selection records what you reviewed; it
                  does not expand the authorised work.
                </p>
                <form
                  key={q.toString()}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget),
                      next = new URLSearchParams({
                        appointment_id: appointment,
                        record_id: String(data.get("record_id")),
                        activity: String(data.get("activity")),
                        facility_ids: data.getAll("facility_id").join(","),
                      });
                    router.push(`/my-jobs/site-readiness?${next}`);
                  }}
                >
                  <label>
                    Readiness source
                    <select name="record_id" defaultValue={source.id}>
                      {v.sources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Exact activity
                    <input
                      name="activity"
                      required
                      maxLength={100}
                      defaultValue={source.preparation.activity}
                      placeholder="Use the activity named in your instructions"
                      list="fi-readiness-activities"
                    />
                  </label>
                  <datalist id="fi-readiness-activities">
                    {[
                      ...new Set(
                        source.content.requirements
                          .map((x) => x.activity)
                          .filter((x) => x !== "*"),
                      ),
                    ].map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                  <fieldset>
                    <legend>Exact Facility, Growing Area or Block</legend>
                    <p>
                      Leave unselected only for Site-level work. A parent
                      Facility does not stand in for its child areas.
                    </p>
                    {v.facilities.map((f) => (
                      <label className="fi-choice" key={f.id}>
                        <input
                          type="checkbox"
                          name="facility_id"
                          value={f.id}
                          defaultChecked={source.preparation.facility_ids.includes(
                            f.id,
                          )}
                        />
                        {f.display_name} · {f.facility_type}
                      </label>
                    ))}
                    {!v.facilities.length && (
                      <p>
                        No Facility records returned. Only explicit Site-wide
                        instructions can be assessed.
                      </p>
                    )}
                    {v.facilities_truncated && (
                      <p>
                        The first 100 locations are shown. Ask the Site owner to
                        identify any missing work location before review.
                      </p>
                    )}
                  </fieldset>
                  <Button type="submit">Review this context</Button>
                </form>
              </section>
              <section className="business-card">
                <h2>Current source and applicable requirements</h2>
                <p>
                  {source.name} · source revision {source.revision} · owner{" "}
                  {source.owner}
                </p>
                <p>
                  Source last recorded:{" "}
                  <Stamp value={source.updated_at} timezone={v.job.timezone} />.
                  Review and validity are separate.
                </p>
                <p>{v.personal_induction}</p>
                {!source.preparation.activity ? (
                  <p>
                    Choose the exact activity above to assess applicability.
                  </p>
                ) : (
                  <>
                    <h3>{source.assessment.status}</h3>
                    {source.assessment.blockers.length > 0 && (
                      <ul>
                        {source.assessment.blockers.map((x, i) => (
                          <li key={i}>
                            {v.facilities.reduce(
                              (text, f) =>
                                text.replaceAll(f.id, f.display_name),
                              x,
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {source.content.requirements
                      .filter(
                        (x) =>
                          (!x.facility_id ||
                            source.preparation.facility_ids.includes(
                              x.facility_id,
                            )) &&
                          (x.activity === "*" ||
                            x.activity === source.preparation.activity),
                      )
                      .map((x) => (
                        <article className="fi-requirement" key={x.id}>
                          <h3>{x.title}</h3>
                          <p>
                            {x.kind} · requirement revision {x.revision} ·{" "}
                            {facilityName(x.facility_id)} · activity{" "}
                            {x.activity}
                          </p>
                          <p>{x.source}</p>
                          {source.content.evidence
                            .filter((e) => e.requirement_id === x.id)
                            .map((e) => (
                              <p key={e.id}>
                                Evidence: {e.source} · captured {e.captured_on}{" "}
                                · expires {e.expires_on} · requirement revision{" "}
                                {e.requirement_revision}.{" "}
                                <strong>
                                  {source.evidence_status[e.id].status}.
                                </strong>{" "}
                                Review recorded:{" "}
                                {source.evidence_status[e.id].reviewed_at ? (
                                  <Stamp
                                    value={
                                      source.evidence_status[e.id].reviewed_at!
                                    }
                                    timezone={v.job.timezone}
                                  />
                                ) : (
                                  "Not established"
                                )}
                                .
                              </p>
                            ))}
                          {!source.content.evidence.some(
                            (e) => e.requirement_id === x.id,
                          ) && <p>Evidence missing.</p>}
                        </article>
                      ))}
                    <h3>Recorded access and seasonal windows</h3>
                    {source.content.windows
                      .filter(
                        (x) =>
                          (!x.facility_id ||
                            source.preparation.facility_ids.includes(
                              x.facility_id,
                            )) &&
                          (x.activity === "*" ||
                            x.activity === source.preparation.activity),
                      )
                      .map((x) => (
                        <p key={x.id}>
                          {facilityName(x.facility_id)} · {x.from_date}–
                          {x.to_date} · season {x.season_from}–{x.season_to} ·{" "}
                          {x.start_time}–{x.end_time} {v.job.timezone}.{" "}
                          {x.source}
                        </p>
                      ))}
                    <Acknowledge key={source.id} view={v} onSaved={r.reload} />
                  </>
                )}
              </section>
              <section className="business-card">
                <h2>Your retained reviews for this visit</h2>
                {v.acknowledgements.length ? (
                  v.acknowledgements.map((a) => (
                    <article key={a.id}>
                      <h3>
                        {a.current_selection
                          ? "Matches the displayed source and context"
                          : "Different or changed source/context — re-review required"}
                      </h3>
                      <p>
                        <Stamp
                          value={a.recorded_at}
                          timezone={v.job.timezone}
                        />{" "}
                        · {a.preparation.activity} ·{" "}
                        {a.preparation.facility_ids
                          .map(facilityName)
                          .join(", ") || "Site-level context"}
                      </p>
                      <p>{a.reason}</p>
                      <p>
                        {a.blockers.length} unresolved condition(s) were
                        retained. No work authority granted.
                      </p>
                    </article>
                  ))
                ) : (
                  <p>
                    No personal acknowledgement is recorded for this visit and
                    source.
                  </p>
                )}
                <p>
                  Latest 50 personal reviews. CS-06 retains the source history.
                </p>
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
function Acknowledge({ view, onSaved }: { view: View; onSaved: () => void }) {
  const [source, setSource] = useState(view.source!),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const command = useCrmCommand(onSaved);
  const stale =
    source.version !== view.source!.version ||
    source.presented_hash !== view.source!.presented_hash;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`my-jobs/${view.job.id}/site-readiness`, {
          record_id: source.id,
          expected_version: source.version,
          presented_hash: source.presented_hash,
          facility_ids: source.preparation.facility_ids,
          activity: source.preparation.activity,
          reason,
        });
      }}
    >
      <h3>Acknowledge this review</h3>
      <p>
        Acknowledgement records that you read these instructions. Unmet
        conditions remain unresolved. It grants no entry, induction, isolation
        or work permission and does not start work.
      </p>
      {stale && (
        <p>
          The source or review context has changed since this form opened. Your
          note and any original save are retained. Review the displayed
          instructions before a new acknowledgement.
        </p>
      )}
      {stale && !command.busy && !command.uncertain && (
        <Button
          onClick={() => {
            setSource(view.source!);
            setConfirmed(false);
            command.dirty();
          }}
        >
          Use the displayed context for a new review
        </Button>
      )}
      <ValidationFields error={command.error}>
        <fieldset
          disabled={
            stale || command.busy || command.uncertain || !view.can_acknowledge
          }
        >
          <Field
            name="review-note"
            label="Review note and conditions to escalate"
            value={reason}
            onChange={(x) => {
              setReason(x);
              command.dirty();
            }}
            required
          />
          <label className="fi-choice">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                command.dirty();
              }}
            />
            I have reviewed the displayed source, exact visit and unresolved
            conditions.
          </label>
          <Button
            type="submit"
            variant="primary"
            busy={command.busy}
            disabled={!confirmed || !reason.trim()}
          >
            Record my acknowledgement
          </Button>
        </fieldset>
      </ValidationFields>
      {!view.can_acknowledge && (
        <p>
          This visit or your current access does not permit a new
          acknowledgement.
        </p>
      )}
      <p role="status">{command.status}</p>
      <ErrorNotice error={command.error} />
      {command.uncertain && (
        <Button onClick={() => void command.reconcile()}>
          Check the original acknowledgement
        </Button>
      )}
    </form>
  );
}
