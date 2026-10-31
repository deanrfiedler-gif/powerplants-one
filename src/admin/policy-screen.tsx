"use client";
import "../app/styles/organisations.css";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SettingsFrame } from "./settings-screen";
import { usePlatformResource } from "../components/platform-resource";
import {
  ReadState,
  Stamp,
  Field,
  ErrorNotice,
  isDenied,
  ValidationFields,
  type Failure,
} from "../components/business-ui";
import { useIdentity } from "../components/business-session";
import { Button } from "../components/ui/button";
import { SharedRecord } from "../components/ui/shared-record";
import { RegisterTable, RegisterChip } from "../components/ui/register-table";
import { WorkDialog } from "../activities/components/client/my-work-ui";
import { usePolicyOperation } from "../scheduling/components/client/policy-publication.client";
import {
  policyRecordHref,
  policyCommandKind,
} from "../scheduling/policy-journal";
import { localDateTime, utcFromLocal } from "../scheduling/time";
import type { readBusinessPolicy, PolicyTerm } from "./policies";
type Detail = Awaited<ReturnType<typeof readBusinessPolicy>>;
const ref = (p: { id: string; version: number; content_hash: string }) => ({
  id: p.id,
  version: p.version,
  content_hash: p.content_hash,
});
const zone = "Australia/Brisbane";
function TermValue({ value }: { value: string }) {
  return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) ? (
    <Stamp value={value} timezone={zone} />
  ) : (
    value
  );
}
export function PolicyRecord({ id }: { id: string }) {
  const source = usePlatformResource<Detail>(
    `admin/policies/${encodeURIComponent(id)}`,
    false,
  );
  const data = !source.loading && !source.error ? source.data : undefined;
  return data ? (
    <PolicyBody key={id} data={data} reload={source.reload} />
  ) : (
    <SettingsFrame record phoneHeader={{ title: "Business policies" }}>
      <ReadState {...source} retry={source.reload} />
    </SettingsFrame>
  );
}
function PolicyBody({ data, reload }: { data: Detail; reload: () => void }) {
  const identity = useIdentity(),
    command = usePolicyOperation();
  const { item, evidence } = data,
    proposal = evidence?.proposal,
    review = evidence?.review,
    chain = item.chain;
  const shownReview = review ?? data.previous?.review,
    shownEvidence = review ? evidence : data.previous;
  const [tab, setTab] = useState<"terms" | "proposal">("terms"),
    [dialog, setDialog] = useState<"propose" | "publish" | "review" | null>(
      null,
    );
  const [reason, setReason] = useState(""),
    [minutes, setMinutes] = useState(
      String(
        proposal?.max_visit_minutes ??
          chain?.members.at(-1)?.policy.max_visit_minutes ??
          "",
      ),
    ),
    [effective, setEffective] = useState(
      proposal ? localDateTime(proposal.effective_from, zone) : "",
    ),
    [localError, setLocalError] = useState<Failure | null>(null);
  const denied = isDenied(command.error),
    frozen = command.busy || !!command.pending || !command.ready;
  const canPropose = !!chain && (data.can_review || data.can_publish);
  const canReview =
    !!proposal &&
    data.can_review &&
    proposal.expected_head.version === chain?.head.version &&
    proposal.effective_from > data.read_at &&
    proposal.proposer_id !== identity.actor_id &&
    !evidence?.successor_proposal_id &&
    !evidence?.publication_id;
  const canPublish =
    !!proposal &&
    !!review &&
    !!chain &&
    data.can_publish &&
    review.reviewer_id !== identity.actor_id &&
    review.reviewer_id !== proposal.proposer_id &&
    !evidence?.publication_id &&
    !evidence?.successor_proposal_id &&
    proposal.expected_head.version === chain.head.version &&
    proposal.effective_from > data.read_at;
  const nextVersion = chain ? chain.head.version + 1 : null;
  const proposalVersion = proposal ? proposal.expected_head.version + 1 : null;
  function open(which: typeof dialog) {
    setLocalError(null);
    setReason("");
    setDialog(which);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (frozen || !chain) return;
    setLocalError(null);
    if (dialog === "propose") {
      let instant: string;
      try {
        instant = utcFromLocal(effective, zone);
      } catch {
        setLocalError({
          message: "Enter a valid Brisbane effective date and time.",
        });
        return;
      }
      const id = crypto.randomUUID();
      const receipt = await command.send(
        "schedule/policy-proposals",
        {
          id,
          source: chain.head.policy,
          expected_head_version: chain.head.version,
          predecessor_proposal:
            proposal &&
            proposal.proposer_id === identity.actor_id &&
            proposal.expected_head.version === chain.head.version &&
            !evidence?.successor_proposal_id
              ? ref(proposal)
              : null,
          max_visit_minutes: Number(minutes),
          effective_from: instant,
          reason,
        },
        policyRecordHref("proposal", id),
        "Policy proposal",
        id,
      );
      if (receipt) {
        setDialog(null);
        reload();
      }
    } else if (dialog === "review" && proposal) {
      const id = crypto.randomUUID();
      const receipt = await command.send(
        "schedule/policy-reviews",
        { id, proposal: ref(proposal), reason },
        policyRecordHref("review", id),
        "Independent policy review",
        id,
      );
      if (receipt) {
        setDialog(null);
        reload();
      }
    } else if (
      dialog === "publish" &&
      proposal &&
      review &&
      evidence?.selected_policy
    ) {
      const receipt = await command.send(
        "schedule/policy-publications",
        {
          proposal: ref(proposal),
          review: ref(review),
          source: proposal.source,
          expected_head_version: proposal.expected_head.version,
          selected_policy: evidence.selected_policy,
          reason:
            reason.trim() ||
            "Publish the exact independently reviewed policy proposal.",
        },
        policyRecordHref("review", review.id),
        "Policy publication",
        review.id,
      );
      if (receipt) {
        setDialog(null);
        reload();
      }
    }
  }
  if (denied)
    return (
      <SettingsFrame record phoneHeader={{ title: "Business policies" }}>
        <ReadState
          loading={false}
          error={command.error as Failure}
          retry={reload}
        />
      </SettingsFrame>
    );
  const primary = canPublish ? (
    <Button variant="primary" disabled={frozen} onClick={() => open("publish")}>
      Publish version {nextVersion}
    </Button>
  ) : canPropose ? (
    <Button variant="primary" disabled={frozen} onClick={() => open("propose")}>
      Propose change
    </Button>
  ) : null;
  const affected =
    shownReview?.candidates.filter(
      (c) => c.evaluation.outcome === "ImpactRequired",
    ) ?? [];
  const terms = (rows: PolicyTerm[]) => (
    <div className="settings-current-terms">
      <RegisterTable
        variant="panel"
        caption="Policy terms and what each controls"
      >
        <thead>
          <tr>
            <th scope="col">Term</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.name}>
              <td className="ppo-register-wrap">
                <strong>
                  {t.name}
                  <span className="settings-phone-term-value">
                    {" "}
                    · <TermValue value={t.value} />
                  </span>
                </strong>
                <small className="settings-term-meaning">{t.meaning}</small>
              </td>
              <td>
                <TermValue value={t.value} />
              </td>
            </tr>
          ))}
        </tbody>
      </RegisterTable>
    </div>
  );
  const acceptedKind =
    command.accepted && policyCommandKind(command.accepted.entry.path);
  return (
    <SettingsFrame
      record
      phoneHeader={{
        title: "Business policies",
        record: {
          position: "All policies",
          more: [
            ...(canPropose && !frozen
              ? [
                  {
                    label: "Propose change",
                    onSelect: (opener: HTMLElement) => {
                      opener.focus();
                      open("propose");
                    },
                  },
                ]
              : []),
            ...(proposal
              ? [
                  {
                    label: tab === "terms" ? "View proposal" : "View terms",
                    onSelect: () =>
                      setTab(tab === "terms" ? "proposal" : "terms"),
                  },
                ]
              : []),
            ...(!command.busy
              ? [{ label: "Refresh policy", onSelect: reload }]
              : []),
          ],
        },
      }}
    >
      <SharedRecord
        id="ppo-policy-record"
        title={item.name}
        reference=""
        status={
          <RegisterChip tone={item.version ? "positive" : "neutral"}>
            {item.version
              ? `Version ${item.version} in force`
              : item.id === "record-references"
                ? "Owner decision"
                : "Not in force"}
          </RegisterChip>
        }
        statusPlacement="title"
        meta={
          <>
            <span>
              {item.area} · {item.scope}
            </span>
            <span className="settings-record-viewer">
              {" "}
              · Viewed by {data.viewer}
            </span>
            <span className="settings-record-read">
              {" "}
              · Read <Stamp value={data.read_at} timezone={zone} />
            </span>
          </>
        }
        actions={
          <>
            <Button onClick={reload} disabled={command.busy}>
              Refresh
            </Button>
            {canPublish && (
              <Button disabled={frozen} onClick={() => open("propose")}>
                Propose change
              </Button>
            )}
            {primary}
          </>
        }
        sourcesLabel="Policy state"
        sources={
          <>
            <strong>Policy state</strong>
            <span>{item.state}</span>
            {chain && (
              <span>Publication head: version {chain.head.version}</span>
            )}
            {item.until && (
              <span>
                Runs to <Stamp value={item.until} timezone={zone} />
              </span>
            )}
          </>
        }
        facts={
          <>
            <h2>Policy</h2>
            <dl>
              <dt>Area</dt>
              <dd>{item.area}</dd>
              <dt>Scope</dt>
              <dd>{item.scope}</dd>
              <dt>In force</dt>
              <dd>
                {item.version
                  ? `Version ${item.version}`
                  : "No numbered version"}
              </dd>
              {item.since && (
                <>
                  <dt>Since</dt>
                  <dd>
                    <Stamp value={item.since} timezone={zone} />
                  </dd>
                </>
              )}
              {item.source_at && (
                <>
                  <dt>Source as at</dt>
                  <dd>
                    <Stamp value={item.source_at} timezone={zone} />
                  </dd>
                </>
              )}
            </dl>
            <h2>How it changes</h2>
            <p>{item.changes}</p>
            {chain && (
              <>
                <p>
                  The proposer cannot review their own change. The publisher
                  must be different from the reviewer.
                </p>
                <p>These duties give no booking or dispatch authority.</p>
                <h2>Used by</h2>
                <p>
                  <Link href="/schedule">Schedule · book and move</Link>
                </p>
                <p>
                  <Link href="/schedule/policy-impact">
                    Changes and follow-up · policy review
                  </Link>
                </p>
              </>
            )}
            <p>
              <Link href="/admin/policies">All policies</Link>
            </p>
          </>
        }
        tabs={
          <div
            className="settings-tabs"
            role="tablist"
            aria-label="Policy views"
            onKeyDown={(event) => {
              if (
                proposal &&
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? "terms"
                    : event.key === "End"
                      ? "proposal"
                      : tab === "terms"
                        ? "proposal"
                        : "terms";
                setTab(next);
                (
                  event.currentTarget.querySelectorAll("button")[
                    next === "terms" ? 0 : 1
                  ] as HTMLButtonElement
                )?.focus();
              }
            }}
          >
            <button
              role="tab"
              id="policy-terms-tab"
              aria-controls="policy-terms-panel"
              tabIndex={tab === "terms" ? 0 : -1}
              aria-selected={tab === "terms"}
              onClick={() => setTab("terms")}
            >
              Terms
            </button>
            {proposal && (
              <button
                role="tab"
                id="policy-proposal-tab"
                aria-controls="policy-proposal-panel"
                tabIndex={tab === "proposal" ? 0 : -1}
                aria-selected={tab === "proposal"}
                onClick={() => setTab("proposal")}
              >
                Version {proposalVersion} proposal
              </button>
            )}
          </div>
        }
        stickyAction={primary}
      >
        <ErrorNotice error={command.error} />
        {(item.proposal_count ?? 0) > 1 && (
          <p className="settings-note">
            Latest of {item.proposal_count} open proposal branches.{" "}
            <Link href="/schedule/policy-impact">View all in PL-04</Link>.
          </p>
        )}
        {command.pending && (
          <section
            className="settings-note"
            aria-label="Original policy operation recovery"
          >
            <h2>Outcome not yet confirmed</h2>
            <p>
              The unchanged original is retained in this tab. Check its receipt
              before any new operation. Switching identity or closing the tab
              removes this local copy.
            </p>
            <Button
              disabled={command.busy}
              onClick={() =>
                void command.recover().then((receipt) => {
                  if (receipt) reload();
                })
              }
            >
              Check original receipt
            </Button>
            <Button
              disabled={command.busy}
              onClick={() =>
                void command.retry().then((receipt) => {
                  if (receipt) reload();
                })
              }
            >
              Retry unchanged original
            </Button>
          </section>
        )}
        {command.accepted && acceptedKind && (
          <p role="status">
            {command.accepted.entry.label} saved by the server.{" "}
            <Link
              href={policyRecordHref(
                acceptedKind,
                command.accepted.receipt.record_id,
              )}
            >
              Open the accepted record and receipt
            </Link>
          </p>
        )}
        <div
          role="tabpanel"
          id={`policy-${tab}-panel`}
          aria-labelledby={`policy-${tab}-tab`}
          tabIndex={0}
        >
          {tab === "terms" ? (
            <>
              {proposal && (
                <section className="settings-proposal-callout">
                  <h2>
                    Version {proposalVersion} · {item.state.toLowerCase()}
                  </h2>
                  <p>
                    Maximum visit {proposal.max_visit_minutes} minutes from{" "}
                    <Stamp value={proposal.effective_from} timezone={zone} />.
                    Proposal revision {proposal.version}.
                  </p>
                  {review && review.reviewer_id !== proposal.proposer_id && (
                    <p>
                      Reviewed by{" "}
                      {data.actors.find((a) => a.id === review.reviewer_id)
                        ?.display_name ?? "Policy reviewer"}{" "}
                      · <Stamp value={review.evaluated_at} timezone={zone} />
                      <br />
                      {
                        review.candidates.filter(
                          (c) => c.evaluation.outcome === "ImpactRequired",
                        ).length
                      }{" "}
                      bookings need review in the saved population.
                    </p>
                  )}
                  <Button onClick={() => setTab("proposal")}>
                    Compare and view review
                  </Button>
                </section>
              )}
              {!chain && (
                <p className="settings-phone-readonly">{item.changes}</p>
              )}
              <h2>
                {item.id === "record-references"
                  ? "Format rules"
                  : item.version
                    ? `Terms in force · version ${item.version}`
                    : "Policy terms · not in force"}
              </h2>
              {!item.chain || item.version ? (
                terms(item.terms)
              ) : (
                <p>No scheduling version is currently in force.</p>
              )}
              {item.reference_types && (
                <>
                  <h2>Record types in use</h2>
                  {terms(item.reference_types)}
                  <p>
                    Existing references stay as issued. Specialised
                    configuration, maintenance and supply references retain
                    their existing suffix formats.
                  </p>
                </>
              )}
              <p className="settings-note">
                Evidence is for fictional demonstration only. Synthetic values
                are not adopted operating rules. Publishing never re-pins or
                rewrites a booking, an appointment revision or an issued
                document.
              </p>
            </>
          ) : (
            proposal && (
              <>
                <Button
                  className="settings-phone-back"
                  onClick={() => setTab("terms")}
                >
                  Back to terms
                </Button>
                <h2>
                  Version {proposalVersion} proposal · revision{" "}
                  {proposal.version}
                </h2>
                <p>
                  Proposed by{" "}
                  {data.actors.find((a) => a.id === proposal.proposer_id)
                    ?.display_name ?? "Policy proposer"}{" "}
                  · Saved <Stamp value={proposal.proposed_at} timezone={zone} />
                  . Saving changes nothing in force.
                </p>
                <div className="settings-proposal-terms">
                  <RegisterTable
                    variant="panel"
                    caption="Current and proposed policy terms"
                  >
                    <thead>
                      <tr>
                        <th scope="col">Term</th>
                        <th scope="col">In force</th>
                        <th scope="col">Proposed</th>
                        <th scope="col">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.terms.map((t) => {
                        const next =
                          t.name === "Maximum visit length"
                            ? `${proposal.max_visit_minutes} minutes`
                            : t.name === "Effective from"
                              ? proposal.effective_from
                              : t.value;
                        return (
                          <tr key={t.name} data-changed={next !== t.value}>
                            <td>{t.name}</td>
                            <td>
                              <TermValue value={t.value} />
                            </td>
                            <td>
                              <TermValue value={next} />
                            </td>
                            <td>{next === t.value ? "Same" : "Changed"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </RegisterTable>
                </div>
                {shownReview ? (
                  <section>
                    <h2>
                      {review && review.reviewer_id !== proposal.proposer_id
                        ? "Saved independent review"
                        : "Review out of date · reference only"}
                    </h2>
                    <p>
                      Reviewed by{" "}
                      {data.actors.find((a) => a.id === shownReview.reviewer_id)
                        ?.display_name ?? "Policy reviewer"}{" "}
                      ·{" "}
                      <Stamp value={shownReview.evaluated_at} timezone={zone} />
                      . Bound to proposal revision{" "}
                      {shownReview.proposal.version} and publication head{" "}
                      {shownReview.expected_head.version}.
                    </p>
                    <p>
                      {shownReview.candidates.length} bookings checked ·{" "}
                      {
                        shownReview.candidates.filter(
                          (c) => c.evaluation.outcome === "Compliant",
                        ).length
                      }{" "}
                      fit · {affected.length} need review ·{" "}
                      {shownEvidence?.context?.exclusions.length ?? 0} left out.
                    </p>
                    {!review && (
                      <p>
                        This review covers the earlier revision only. Nothing
                        was published; obtain a fresh independent review.
                      </p>
                    )}
                    <p>
                      Current permissions and every source dependency are
                      checked again on publication. A saved review does not
                      prove those checks still pass.
                    </p>
                    {affected.map((c) => {
                      const label = shownEvidence?.candidate_labels?.find(
                        (l) =>
                          l.appointment_id ===
                          c.dependencies.booking.appointment.id,
                      );
                      return (
                        <div
                          className="settings-attention-row"
                          key={c.dependencies.booking.appointment.id}
                        >
                          <Link
                            href={`/service/appointments/${c.dependencies.booking.appointment.id}`}
                          >
                            {label?.reference ?? "Open appointment"}
                          </Link>
                          <span>
                            {label?.site_name} · Owner {label?.owner_name} ·{" "}
                            {c.impact_reason}
                          </span>
                        </div>
                      );
                    })}
                  </section>
                ) : (
                  <p className="settings-note">
                    A complete independent review is required before
                    publication.
                  </p>
                )}
                {proposal.proposer_id === identity.actor_id && (
                  <p>
                    You proposed this change. Another current policy reviewer
                    must review it.
                  </p>
                )}
                {canReview && (
                  <Button disabled={frozen} onClick={() => open("review")}>
                    Review proposal
                  </Button>
                )}
                {!canPublish && review && (
                  <p role="status">
                    Publication is not available for this viewer and saved
                    state. Obtain a current independent review of the latest
                    proposal and publication head.
                  </p>
                )}
              </>
            )
          )}
        </div>
      </SharedRecord>
      {dialog && (
        <WorkDialog
          title={
            dialog === "propose"
              ? `Propose version ${nextVersion}`
              : dialog === "publish"
                ? `Publish version ${nextVersion}`
                : "Review proposal independently"
          }
          busy={command.busy}
          dirty={
            !command.pending &&
            (!!reason || (dialog === "propose" && !!effective))
          }
          onClose={() => setDialog(null)}
        >
          <form onSubmit={(e) => void submit(e)}>
            <ValidationFields error={localError ?? command.error}>
              <fieldset disabled={frozen}>
                {dialog === "propose" ? (
                  <>
                    <p>
                      Only the maximum visit length and future effective start
                      change. Other terms remain fixed. Saving changes nothing
                      in force.
                    </p>
                    <Field
                      name="max_visit_minutes"
                      label="Maximum visit (minutes)"
                      type="number"
                      value={minutes}
                      onChange={setMinutes}
                      required
                    />
                    <Field
                      name="effective_from"
                      label="Effective from · Brisbane time"
                      type="datetime-local"
                      value={effective}
                      onChange={setEffective}
                      required
                    />
                    <div className="settings-fixed-terms">
                      <h3>Unchanged terms</h3>
                      <dl>
                        <dt>Initial date agreement</dt>
                        <dd>Required</dd>
                        <dt>Changed date contact</dt>
                        <dd>Allowed, dispatch held</dd>
                        <dt>Crew competence</dt>
                        <dd>All crew</dd>
                        <dt>Effective to</dt>
                        <dd>
                          {chain && (
                            <Stamp
                              value={chain.members.at(-1)!.policy.effective_to}
                              timezone={zone}
                            />
                          )}
                        </dd>
                        <dt>Applies to</dt>
                        <dd>{item.scope}</dd>
                      </dl>
                    </div>
                    <p>
                      The server checks the current publication head, a future
                      start and unchanged fixed terms before saving.
                    </p>
                    {effective && (
                      <p>
                        UTC:{" "}
                        {(() => {
                          try {
                            return utcFromLocal(effective, zone);
                          } catch {
                            return "Enter a valid local time";
                          }
                        })()}
                      </p>
                    )}
                  </>
                ) : dialog === "publish" ? (
                  <>
                    <p>
                      Publishing cannot be undone. A later change requires
                      another reviewed version. Publish the exact proposal and
                      independent review. A new version and an owned review for
                      each affected booking will be created. Dispatch and start
                      stay held until the impacts are resolved.
                    </p>
                    <p>
                      {affected.length} bookings in the saved review need
                      attention. No booking, pin or issued pack is rewritten.
                    </p>
                    <p>
                      Checks: current publisher duty; publisher is not reviewer;
                      independent review is complete, unchanged and unused;
                      publication head still version {chain?.head.version}.
                    </p>
                  </>
                ) : (
                  <p>
                    The server reviews the complete permitted workspace
                    population against this exact proposal. The proposer cannot
                    perform this review.
                  </p>
                )}
                <Field
                  name="reason"
                  label={
                    dialog === "publish"
                      ? "Publication note (optional)"
                      : "Reason"
                  }
                  value={reason}
                  onChange={setReason}
                  required={dialog !== "publish"}
                  multiline
                  maxLength={1000}
                />
              </fieldset>
              <ErrorNotice error={localError ?? command.error} />
              <div className="settings-dialog-actions">
                <Button
                  disabled={command.busy}
                  onClick={() => {
                    if (
                      !command.pending &&
                      (reason || (dialog === "propose" && effective)) &&
                      !window.confirm("Discard the entries in this form?")
                    )
                      return;
                    setDialog(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={frozen || (dialog !== "publish" && !reason.trim())}
                >
                  {dialog === "propose"
                    ? "Save proposal"
                    : dialog === "publish"
                      ? `Publish version ${nextVersion}`
                      : "Save complete review"}
                </Button>
              </div>
            </ValidationFields>
          </form>
          {command.pending && (
            <p role="alert">
              The outcome is unknown. Close this dialog and use the
              original-operation recovery controls. Do not create a replacement.
            </p>
          )}
        </WorkDialog>
      )}
    </SettingsFrame>
  );
}
