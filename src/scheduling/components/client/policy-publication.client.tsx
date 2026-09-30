"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  ReadState,
  Stamp,
  ValidationFields,
  friendly,
  isDenied,
  type Failure,
} from "../../../components/business-ui";
import { useIdentity } from "../../../components/business-session";
import { usePlatformResource } from "../../../components/platform-resource";
import { Button } from "../../../components/ui/button";
import { useRecoverableCommand } from "../../../shared/ui/use-recoverable-command";
import {
  acceptsPolicyEntry,
  acceptsPolicyReceipt,
  policyCommandKind,
  policyJournalKey,
  policyRecordHref,
} from "../../policy-journal";
import { plannerZones } from "../../navigation";
import { localDateTime, utcFromLocal } from "../../time";
import type {
  readPolicyFamily,
  readPolicyEvidence,
} from "../../policy-commands";
import type { readPolicyRecords, PolicyRecordKind } from "../../policy-records";
import type { PolicyProposal } from "../../policy-publication-contracts";

type Evidence = Awaited<ReturnType<typeof readPolicyEvidence>>;
const ref = (p: { id: string; version: number; content_hash: string }) => ({
  id: p.id,
  version: p.version,
  content_hash: p.content_hash,
});
const kinds: PolicyRecordKind[] = ["proposal", "review", "publication"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function RecordReference({
  label,
  value,
}: {
  label: string;
  value: { id: string; version: number; content_hash: string };
}) {
  return (
    <details>
      <summary>
        {label} · {value.id} · v{value.version}
      </summary>
      <p>Content hash: {value.content_hash}</p>
    </details>
  );
}
function ProposalTerms({
  proposal,
  zone,
}: {
  proposal: PolicyProposal;
  zone: string;
}) {
  return (
    <>
      <p>
        <strong>Maximum visit: {proposal.max_visit_minutes} minutes</strong> ·
        effective <Stamp value={proposal.effective_from} timezone={zone} /> ·{" "}
        {zone}
      </p>
      <p>Exact effective instant (UTC): {proposal.effective_from}</p>
      <RecordReference label="Proposal" value={proposal} />
      <RecordReference label="Source policy" value={proposal.source} />
      <p>
        Expected publication head {proposal.expected_head.version} · fixed
        expiry{" "}
        <Stamp value={proposal.fixed_terms.effective_to} timezone={zone} /> ·{" "}
        {zone}
      </p>
      <p>
        Fixed terms: initial customer contact required; controlled
        changed-contact plan permitted; all crew skilled. Travel allowances
        remain separate.
      </p>
      <p>
        Source as at {proposal.fixed_terms.source_as_at} ·{" "}
        {proposal.fixed_terms.evidence}
      </p>
    </>
  );
}

export function PolicyPublicationWorkspace() {
  const search = useSearchParams();
  const [kind, setKind] = useState<PolicyRecordKind>("proposal"),
    [cursor, setCursor] = useState<string | null>(null),
    [recordsOpen, setRecordsOpen] = useState(false);
  const records = usePlatformResource<
    Awaited<ReturnType<typeof readPolicyRecords>>
  >(
    `schedule/policy-records?kind=${kind}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
  const selected = kinds.filter((k) => search.has(k));
  const recordKind = selected.length === 1 ? selected[0] : null;
  const recordId = recordKind ? search.get(recordKind)! : null;
  const invalidReference =
    selected.length > 1 ||
    !!(recordKind && (!recordId || !uuid.test(recordId)));
  // A failed/refreshing authority read unmounts protected evidence and its in-flight work.
  if (records.loading) return <ReadState {...records} retry={records.reload} />;
  if (records.error)
    return (
      <section aria-label="Saved policy workflow">
        <p>
          Saved proposals, complete reviews and publication require the
          dedicated workspace reviewer or publisher duty. Temporary comparison
          uses your existing permitted reads.
        </p>
        {!isDenied(records.error) && (
          <ReadState {...records} retry={records.reload} focusOnError={false} />
        )}
      </section>
    );
  if (!records.data) return null;
  return (
    <section className="policy-publication" aria-label="Saved policy workflow">
      <h2>Saved policy workflow</h2>
      <p>
        Temporary comparison below is separate. Saved proposals and reviews are
        immutable. Publication does not grant dispatch or Start approval.
      </p>
      <details
        open={recordsOpen}
        onToggle={(event) => setRecordsOpen(event.currentTarget.open)}
      >
        <summary>Reopen saved records</summary>
        <SelectField
          name="policy-record-kind"
          label="Saved record type"
          value={kind}
          onChange={(v) => {
            setKind(v as PolicyRecordKind);
            setCursor(null);
          }}
          options={kinds.map((id) => ({
            id,
            display_name: friendly(id) + "s",
          }))}
        />
        <p>
          {records.data.items.length} records on this page. This list is not a
          population review.
        </p>
        {!records.data.items.length && <p>No saved {kind}s on this page.</p>}
        <ul>
          {records.data.items.map((item) => (
            <li key={item.id}>
              <Link href={policyRecordHref(kind, item.id)}>
                Open {kind} {item.id}
              </Link>{" "}
              · v{item.version} · {item.actor_name} ·{" "}
              <Stamp value={item.saved_at} /> · Australia/Brisbane
            </li>
          ))}
        </ul>
        <div className="button-row">
          <Button
            onClick={() => {
              setCursor(null);
              records.reload();
            }}
          >
            Refresh saved records
          </Button>
          {cursor && (
            <Button onClick={() => setCursor(null)}>First page</Button>
          )}
          {records.data.next_cursor && (
            <Button onClick={() => setCursor(records.data!.next_cursor)}>
              Next page
            </Button>
          )}
        </div>
      </details>
      {invalidReference ? (
        <ErrorNotice
          error={{
            message:
              "Use one valid saved proposal, review or publication reference.",
          }}
        />
      ) : (
        <PolicyWorkspaceBody
          key={`${recordKind}:${recordId}`}
          kind={recordKind}
          id={recordId}
          canReview={records.data.can_review}
          canPublish={records.data.can_publish}
        />
      )}
    </section>
  );
}

function PolicyWorkspaceBody({
  kind,
  id,
  canReview,
  canPublish,
}: {
  kind: PolicyRecordKind | null;
  id: string | null;
  canReview: boolean;
  canPublish: boolean;
}) {
  const identity = useIdentity(),
    router = useRouter();
  const family = usePlatformResource<
    Awaited<ReturnType<typeof readPolicyFamily>>
  >("schedule/policy-family", false);
  const saved = usePlatformResource<Evidence>(
    kind && id ? `schedule/policy-${kind}s/${id}` : null,
    false,
  );
  const command = useRecoverableCommand({
    key: policyJournalKey,
    scope: identity,
    accepts: acceptsPolicyEntry,
    acceptsReceipt: acceptsPolicyReceipt,
    transport: api,
  });
  const [editing, setEditing] = useState(false),
    [zone, setZone] = useState("Australia/Brisbane"),
    [minutes, setMinutes] = useState(""),
    [effective, setEffective] = useState(""),
    [reason, setReason] = useState(""),
    [localError, setLocalError] = useState<Failure | null>(null),
    [refused, setRefused] = useState(false);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const focusRecord = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus();
  }, []);
  const denied =
      isDenied(command.error) ||
      isDenied(saved.error) ||
      isDenied(family.error),
    frozen = command.busy || !!command.pending || !command.ready;
  const evidence =
    !denied && !saved.error && !saved.loading ? saved.data : undefined;
  const chain =
    !denied && !family.error && !family.loading ? family.data : undefined;
  const source = chain?.members.at(-1)?.policy;
  const proposal = evidence?.proposal;
  const changedHead = !!(
    proposal &&
    chain &&
    (proposal.expected_head.version !== chain.head.version ||
      proposal.source.id !== chain.head.policy.id)
  );
  const stale = changedHead || !!evidence?.successor_proposal_id;
  const accepted = command.accepted;
  const acceptedKind = accepted && policyCommandKind(accepted.entry.path);
  function edit() {
    if (!proposal) return;
    setMinutes(String(proposal.max_visit_minutes));
    setEffective(localDateTime(proposal.effective_from, zone));
    setEditing(true);
    setLocalError(null);
    requestAnimationFrame(() => formHeading.current?.focus());
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!chain || !source || frozen) return;
    let instant: string;
    try {
      instant = utcFromLocal(effective, zone);
    } catch (e) {
      setLocalError({
        message: "Check the effective local time.",
        field_errors: [
          { field: "effective_from", message: (e as Error).message },
        ],
      });
      return;
    }
    setLocalError(null);
    const proposalId = crypto.randomUUID();
    const receipt = await command.send(
      "schedule/policy-proposals",
      {
        id: proposalId,
        source: chain.head.policy,
        expected_head_version: chain.head.version,
        predecessor_proposal: editing && proposal ? ref(proposal) : null,
        max_visit_minutes: Number(minutes),
        effective_from: instant,
        reason,
      },
      policyRecordHref("proposal", proposalId),
      "Immutable policy proposal",
      proposalId,
    );
    if (receipt) router.push(policyRecordHref("proposal", receipt.record_id));
  }
  async function review() {
    if (!proposal || frozen) return;
    const reviewId = crypto.randomUUID();
    const receipt = await command.send(
      "schedule/policy-reviews",
      { id: reviewId, proposal: ref(proposal), reason },
      policyRecordHref("review", reviewId),
      "Complete policy review",
      reviewId,
    );
    if (receipt) router.push(policyRecordHref("review", receipt.record_id));
  }
  async function publish() {
    if (
      !proposal ||
      !evidence?.review ||
      !evidence.selected_policy ||
      frozen ||
      refused
    )
      return;
    setRefused(true);
    const receipt = await command.send(
      "schedule/policy-publications",
      {
        proposal: ref(proposal),
        review: ref(evidence.review),
        source: proposal.source,
        expected_head_version: proposal.expected_head.version,
        selected_policy: evidence.selected_policy,
        reason,
      },
      policyRecordHref("review", evidence.review.id),
      "Scheduling policy publication",
      evidence.review.id,
    );
    if (receipt)
      router.push(policyRecordHref("publication", receipt.record_id));
  }
  return (
    <>
      <ErrorNotice error={command.error} />
      {denied && (
        <p>
          Current authority is unavailable. Protected evidence has been cleared.
          Refresh the permitted view before continuing.
        </p>
      )}
      {command.pending && !denied && (
        <section
          className="planner-warning"
          aria-label="Original policy operation recovery"
        >
          <h3>Outcome not yet confirmed</h3>
          <p>
            The unchanged original operation is retained in this tab. No
            replacement publication will be submitted automatically. Closing the
            tab or switching identity removes this local copy; saved records
            remain on the server.
          </p>
          <p>Operation: {command.pending.body.operation_id}</p>
          <div className="button-row">
            <Button busy={command.busy} onClick={() => void command.recover()}>
              Check original receipt
            </Button>
            <Button busy={command.busy} onClick={() => void command.retry()}>
              Retry unchanged original
            </Button>
          </div>
        </section>
      )}
      {accepted &&
        acceptedKind &&
        !denied &&
        !saved.error &&
        !saved.loading &&
        !family.error &&
        !family.loading && (
          <section
            className="save-notice"
            aria-label="Accepted policy operation"
          >
            <p role="status">{accepted.entry.label} saved by the server.</p>
            <p>Receipt: {accepted.receipt.receipt_id}</p>
            <Link
              href={policyRecordHref(acceptedKind, accepted.receipt.record_id)}
            >
              Open accepted {acceptedKind}
            </Link>
          </section>
        )}
      <ReadState {...family} retry={family.reload} />
      {kind && <ReadState {...saved} retry={saved.reload} />}
      {!denied && source && chain && (
        <details open={!kind}>
          <summary>Current publication head {chain.head.version}</summary>
          <RecordReference label="Source policy" value={chain.head.policy} />
          <p>
            {source.name} · maximum visit {source.max_visit_minutes} minutes
          </p>
          <p>
            Effective {source.effective_from} to {source.effective_to} · UTC
          </p>
          <p>
            Expiry, customer-contact rules, all-crew competency and source
            provenance remain fixed.
          </p>
          <p>
            Source as at {source.source_as_at} · {source.evidence}
          </p>
          <Button disabled={frozen} onClick={family.reload}>
            Refresh publication head
          </Button>
        </details>
      )}
      {stale && !evidence?.publication && (
        <p role="alert">
          This saved evidence is stale:{" "}
          {changedHead
            ? "the publication head changed"
            : "a successor proposal exists"}
          . It cannot authorise publication. Reopen the successor or create a
          proposal against the current head, then obtain a fresh complete
          review.
        </p>
      )}
      {evidence?.successor_proposal_id && (
        <Link
          href={policyRecordHref("proposal", evidence.successor_proposal_id)}
        >
          Open successor proposal
        </Link>
      )}
      {proposal && (
        <article
          className="scheduling-card"
          aria-label="Saved immutable proposal"
        >
          <h3 ref={kind === "proposal" ? focusRecord : undefined} tabIndex={-1}>
            Saved immutable proposal
          </h3>
          <ProposalTerms proposal={proposal} zone={zone} />
          <p>
            Saved <Stamp value={proposal.proposed_at} timezone={zone} /> ·{" "}
            {zone}. Proposer: {proposal.proposer_id}
          </p>
          {proposal.predecessor_proposal && (
            <Link
              href={policyRecordHref(
                "proposal",
                proposal.predecessor_proposal.id,
              )}
            >
              Open original proposal
            </Link>
          )}
          {canReview &&
            proposal.proposer_id === identity.actor_id &&
            !evidence?.successor_proposal_id && (
              <Button disabled={frozen} onClick={edit}>
                Edit as immutable successor
              </Button>
            )}
          {evidence?.latest_review_id && kind === "proposal" && (
            <p>
              <Link
                href={policyRecordHref("review", evidence.latest_review_id)}
              >
                Open latest saved review
              </Link>
            </p>
          )}
          {evidence?.publication_id && kind !== "publication" && (
            <p>
              <Link
                href={policyRecordHref("publication", evidence.publication_id)}
              >
                Open saved publication
              </Link>
            </p>
          )}
        </article>
      )}
      {canReview && (!kind || editing) && chain && (
        <form onSubmit={save} className="scheduling-card">
          <h3 ref={formHeading} tabIndex={-1}>
            {editing ? "Unsaved successor edits" : "Unsaved policy proposal"}
          </h3>
          <p>
            Only duration and a future effective instant change. Saving freezes
            an immutable proposal; it does not publish it.
          </p>
          <ValidationFields error={localError ?? command.error}>
            <fieldset disabled={frozen}>
              <legend>Proposed change</legend>
              <div className="scheduling-toolbar">
                <Field
                  name="proposal-minutes"
                  validationField="max_visit_minutes"
                  label="Maximum visit duration (minutes)"
                  type="number"
                  value={minutes}
                  onChange={setMinutes}
                  hint="1–1440 whole minutes; travel is separate."
                  required
                />
                <Field
                  name="proposal-effective"
                  validationField="effective_from"
                  label="Effective local time"
                  type="datetime-local"
                  value={effective}
                  onChange={setEffective}
                  required
                />
                <SelectField
                  name="proposal-zone"
                  label="Proposal timezone"
                  value={zone}
                  onChange={setZone}
                  options={plannerZones.map((id) => ({ id, display_name: id }))}
                />
              </div>
              <Field
                name="proposal-reason"
                validationField="reason"
                label="Proposal reason"
                value={reason}
                onChange={setReason}
                maxLength={1000}
                required
              />
              <ErrorNotice error={localError} />
              <Button type="submit" variant="primary">
                Save immutable proposal
              </Button>
            </fieldset>
          </ValidationFields>
        </form>
      )}
      {evidence?.review && proposal && (
        <article className="scheduling-card" aria-label="Complete saved review">
          <h3 ref={kind === "review" ? focusRecord : undefined} tabIndex={-1}>
            Complete saved review
          </h3>
          <RecordReference label="Review" value={evidence.review} />
          <p>
            Reviewed{" "}
            <Stamp value={evidence.review.evaluated_at} timezone={zone} /> ·{" "}
            {zone} · reviewer {evidence.review.reviewer_id}
          </p>
          <p>
            Complete workspace family: {evidence.review.candidates.length}{" "}
            bookings;{" "}
            {
              evidence.review.candidates.filter(
                (c) => c.evaluation.outcome === "Compliant",
              ).length
            }{" "}
            compliant;{" "}
            {
              evidence.review.candidates.filter(
                (c) => c.evaluation.outcome === "ImpactRequired",
              ).length
            }{" "}
            affected.
          </p>
          <p>
            All seven checks were evaluated by the server, including previously
            compliant bookings. Temporary site filters play no part. Maximum
            complete population: 200; exceeding it refuses the whole review.
          </p>
          {!evidence.review.candidates.length && (
            <p>
              The server evaluated the complete empty population. This is
              separate from a zero-result comparison.
            </p>
          )}
          <details>
            <summary>
              Excluded bookings: {evidence.context?.exclusions.length ?? 0}
            </summary>
            <ul>
              {evidence.context?.exclusions.map((item) => (
                <li key={item.appointment.id}>
                  Appointment {item.appointment.id} · {friendly(item.reason)}
                </li>
              ))}
            </ul>
            <p>
              Exclusions retain the complete server evidence, separate from the
              candidate evaluation.
            </p>
          </details>
          <p>Exact review time (UTC): {evidence.review.evaluated_at}</p>
          <p>Population hash: {evidence.review.population_hash}</p>
          <div className="scheduling-grid">
            {evidence.review.candidates.map((c) => (
              <article
                className="scheduling-card"
                key={c.dependencies.booking.appointment.id}
              >
                <h4>{friendly(c.evaluation.outcome)}</h4>
                <Link
                  href={`/service/appointments/${c.dependencies.booking.appointment.id}`}
                >
                  {evidence.candidate_labels?.find(
                    (label) =>
                      label.appointment_id ===
                      c.dependencies.booking.appointment.id,
                  )?.reference ?? "Appointment"}{" "}
                  · {c.dependencies.booking.appointment.id}
                </Link>
                <p>
                  <Stamp
                    value={c.dependencies.booking.start_at}
                    timezone={c.dependencies.booking.site_timezone}
                  />{" "}
                  to{" "}
                  <Stamp
                    value={c.dependencies.booking.end_at}
                    timezone={c.dependencies.booking.site_timezone}
                  />{" "}
                  · {c.dependencies.booking.site_timezone}
                </p>
                <p>
                  Accountable service owner:{" "}
                  {
                    evidence.candidate_labels?.find(
                      (label) =>
                        label.appointment_id ===
                        c.dependencies.booking.appointment.id,
                    )?.owner_name
                  }{" "}
                  · {c.dependencies.ownership.service_owner.user.id}
                </p>
                {c.impact_owner_id && (
                  <p>
                    Impact owner: {c.impact_owner_id} · {c.impact_reason}
                  </p>
                )}
                <ul>
                  {c.evaluation.checks.map((check) => (
                    <li key={check.dimension}>
                      {friendly(check.dimension)}: {check.outcome}
                      {check.reasons.length
                        ? ` — ${check.reasons.map(friendly).join("; ")}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </article>
      )}
      {proposal && !editing && !evidence?.publication && (
        <section aria-label="Review and publication actions">
          <ValidationFields error={command.error}>
            <fieldset disabled={frozen || stale || denied}>
              <legend>Explicit policy action</legend>
              <Field
                name="policy-action-reason"
                validationField="reason"
                label="Action reason"
                value={reason}
                onChange={setReason}
                required
                maxLength={1000}
              />
              {canReview && (
                <Button disabled={!reason.trim()} onClick={() => void review()}>
                  Obtain fresh complete review
                </Button>
              )}
              {canPublish && evidence?.review && (
                <>
                  <h3>Confirm exact reviewed publication</h3>
                  <p>
                    Publish proposal {proposal.id}, review {evidence.review.id},
                    against head {proposal.expected_head.version}. Maximum visit
                    becomes {proposal.max_visit_minutes} minutes at{" "}
                    {proposal.effective_from} (UTC).
                  </p>
                  <p>
                    {
                      evidence.review.candidates.filter(
                        (c) => c.evaluation.outcome === "ImpactRequired",
                      ).length
                    }{" "}
                    affected bookings receive owned impacts and immediate holds.
                    Bookings retain their pins and reservations. Activity
                    completion and acknowledgement cannot clear holds; the
                    appointment owner must use controlled resolution.
                    Publication gives no dispatch or Start approval.
                  </p>
                  <Button
                    variant="primary"
                    disabled={!reason.trim() || refused}
                    onClick={() => void publish()}
                  >
                    Publish exact reviewed proposal
                  </Button>
                </>
              )}
            </fieldset>
          </ValidationFields>
          {refused && !command.pending && !accepted && (
            <p role="alert">
              Publication was not accepted. No review was refreshed or
              substituted. A reviewer must obtain a fresh complete review before
              another explicit publication.
            </p>
          )}
          {!canReview && (
            <p>
              A dedicated reviewer must obtain any fresh review. Reopen its
              stable review link when ready.
            </p>
          )}
        </section>
      )}
      {evidence?.publication && (
        <section className="scheduling-card" aria-label="Saved publication">
          <h3 ref={focusRecord} tabIndex={-1}>
            Saved publication
          </h3>
          <p role="status">
            Published policy saved by the server. Dispatch and Start still
            require their independent approvals.
          </p>
          <p>
            Publication: {evidence.publication.id} · head{" "}
            {evidence.publication.head_version}
          </p>
          <p>
            Policy: {evidence.publication.policy_id} · hash{" "}
            {evidence.publication.policy_hash}
          </p>
          <p>
            Published{" "}
            <Stamp value={evidence.publication.created_at} timezone={zone} /> ·{" "}
            {zone}
          </p>
          <p>Receipt identity: {evidence.publication.receipt_id}</p>
          {evidence.receipt ? (
            <details>
              <summary>Exact accepted receipt</summary>
              <pre>{JSON.stringify(evidence.receipt, null, 2)}</pre>
              <p>
                task_ids are outbox jobs. Use the typed Activity links below.
              </p>
            </details>
          ) : (
            <p>
              The original receipt is available only to its currently authorised
              publisher.
            </p>
          )}
          <h4>Current owned impacts</h4>
          {!evidence.impacts?.length && (
            <p>No affected bookings were saved by this publication.</p>
          )}
          {evidence.impacts?.map((i) => (
            <article key={i.id}>
              <p>
                <strong>
                  {i.held ? "Start held" : "Impact history"} · {i.disposition}
                </strong>{" "}
                · {i.reason}
              </p>
              <p>Responsible owner: {i.owner_name}</p>
              <p>{i.next_action}</p>
              <div className="button-row">
                <Link href={`/service/appointments/${i.appointment_id}`}>
                  Review impacted appointment
                </Link>
                <Link href={`/work/${i.activity_id}`}>Open owned Activity</Link>
              </div>
            </article>
          ))}
          <Button onClick={saved.reload}>
            Refresh saved publication and holds
          </Button>
        </section>
      )}
      {kind && (
        <p>
          <Link href="/schedule/policy-impact">
            {canReview
              ? "Start a new policy proposal"
              : "Return to saved policy workspace"}
          </Link>
        </p>
      )}
    </>
  );
}
