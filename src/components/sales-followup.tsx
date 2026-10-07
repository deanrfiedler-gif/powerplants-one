"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { readSalesFollowup, SalesTargetKind } from "../sales/followup";
import {
  useRecoverableCommand,
  type Receipt,
} from "../shared/ui/use-recoverable-command";
import { useIdentity } from "./business-session";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  RecordLink,
  Stamp,
} from "./business-ui";
import { useCrmResource, denied } from "./crm-state";
import { LocalDateTimeField, useUnsavedChanges } from "./record-ui";
import { Button } from "./ui/button";
import { salesHandoverId } from "./sales-delivery-link";

export type Followup = Awaited<ReturnType<typeof readSalesFollowup>>;
export const salesTargetHref = (kind: SalesTargetKind, id: string) =>
  `/sales/${kind === "Lead" ? "leads" : "opportunities"}/${id}`;
function FollowupContext({ data: d }: { data: Followup }) {
  return (
    <>
      <p>{d.activity.summary}</p>
      <p>
        {d.customer_name ?? "Customer must be selected and reviewed"} ·{" "}
        {d.site_name ?? "No captured site"} · {d.activity.status} · Activity
        version {d.activity.version} · Owner: {d.owner_name} · Due:{" "}
        <Stamp value={d.activity.due_at} />
      </p>
      <div className="related-links">
        {d.sources.map((s) =>
          s.kind === "Project" ? (
            <Link key={`${s.kind}:${s.id}`} href={`/projects/${s.id}`}>
              {s.label}
            </Link>
          ) : (
            <RecordLink key={`${s.kind}:${s.id}`} type={s.kind} id={s.id}>
              {s.label}
            </RecordLink>
          ),
        )}
      </div>
      {d.origin?.access === "Available" && (
        <p>
          Prepared from{" "}
          <Link href={`/work/${d.origin.snapshot.id}`}>original follow-up</Link>
          , version {d.origin.snapshot.version}. Its original owner, date and
          state are retained.
        </p>
      )}
      {d.origin?.access === "Restricted" && (
        <p>
          Original source is restricted. Restore access before another Sales
          continuation.
        </p>
      )}
    </>
  );
}
export function SalesFollowupPanel({
  id,
  onLinked,
}: {
  id: string;
  onLinked: () => void;
}) {
  const params = useSearchParams(),
    router = useRouter();
  const [kind, setKind] = useState<SalesTargetKind>(
      params.get("sales_kind") === "Opportunity" ? "Opportunity" : "Lead",
    ),
    [selected, setSelected] = useState(
      salesHandoverId(params.get("sales_candidate")) ?? "",
    ),
    [query, setQuery] = useState(""),
    [comparison, setComparison] = useState<Followup | null>(null),
    [checked, setChecked] = useState(false),
    [reason, setReason] = useState("");
  const data = useCrmResource<Followup>(
    `activities/${id}/sales-followup?${new URLSearchParams({ kind, q: query, ...(selected ? { destination_id: selected } : {}) })}`,
    true,
  );
  const command = useRecoverableCommand({
    key: `ppo-sales-followup:${id}`,
    scope: useIdentity(),
    transport: api,
    accepts: (e) => e.path === `activities/${id}/sales-followup`,
  });
  const refreshed = useRef({ reload: data.reload, onLinked });
  useEffect(() => {
    refreshed.current = { reload: data.reload, onLinked };
  }, [data.reload, onLinked]);
  useEffect(() => {
    if (command.accepted) {
      refreshed.current.reload();
      refreshed.current.onLinked();
      queueMicrotask(() => {
        setComparison(null);
        setChecked(false);
        setReason("");
      });
    }
  }, [command.accepted]);
  const d = data.data,
    error = denied(data.error) ? data.error : (command.error ?? data.error),
    blocked = command.busy || !!command.pending || !command.ready;
  useEffect(() => {
    if (denied(error) || d?.restricted)
      queueMicrotask(() => {
        setComparison(null);
        setChecked(false);
        setReason("");
      });
  }, [error, d?.restricted]);
  useUnsavedChanges(!!comparison && !!reason, !!command.pending);
  if (denied(error))
    return (
      <section className="crm-panel">
        <ErrorNotice error={error} />
        <Button onClick={data.reload}>Retry Sales follow-up context</Button>
      </section>
    );
  return (
    <section className="crm-panel">
      <h2>Continue a customer need in Sales</h2>
      <p>
        Review existing Sales records first. Native capture and this link save
        separately; the original follow-up remains owned and dated.
      </p>
      <ErrorNotice error={error} />
      <Button onClick={data.reload}>Refresh Sales follow-up context</Button>
      {data.loading && !d && <p role="status">Loading Sales follow-up…</p>}
      {command.pending && (
        <div role="status">
          <p>
            The original link result is uncertain. Resolve it before another
            save.
          </p>
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original Sales link
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original Sales link
          </Button>
        </div>
      )}
      {command.saved && <p role="status">{command.saved}</p>}
      {d && (
        <>
          <FollowupContext data={d} />
          {d.existing.map((t) => (
            <div key={t.id}>
              <p>
                Linked {t.kind === "Lead" ? "Lead" : "Deal"}:{" "}
                <Link href={salesTargetHref(t.kind, t.id)}>
                  {t.display_number} · {t.title}
                </Link>{" "}
                · {t.state}.
              </p>
              {t.kind === "Lead" && t.eligible && (
                <p>
                  <Link
                    href={`${salesTargetHref(t.kind, t.id)}?plan=1&plan_activity=${id}`}
                  >
                    Review this Activity as the Lead’s next action
                  </Link>
                </p>
              )}
            </div>
          ))}
          {!d.ready && (
            <p>
              An unlinked, active Internal Customer contact or Relationship
              review Activity must have a date and be owned by you. Prepare a
              separate review for a different need or restricted original.
            </p>
          )}
          {d.ready && (
            <>
              <fieldset disabled={blocked || !!comparison}>
                <SelectField
                  name="sales-followup-kind"
                  label="Sales destination type"
                  value={kind}
                  onChange={(v) => {
                    setKind(v as SalesTargetKind);
                    setSelected("");
                    setChecked(false);
                  }}
                  options={[
                    {
                      id: "Lead",
                      display_name: "Lead — qualification still required",
                    },
                    {
                      id: "Opportunity",
                      display_name: "Deal — qualified need",
                    },
                  ]}
                />
                <Field
                  name="sales-followup-search"
                  label="Find an existing Sales record"
                  value={query}
                  onChange={setQuery}
                  hint="Search its reference, title or exact ID. Only matching open records owned by you are eligible."
                />
                <SelectField
                  name="sales-followup-target"
                  label="Existing Sales destination"
                  value={selected}
                  onChange={setSelected}
                  options={[
                    ...d.options,
                    ...(d.candidate &&
                    !d.options.some((x) => x.id === d.candidate!.id)
                      ? [d.candidate]
                      : []),
                  ].map((t) => ({
                    id: t.id,
                    display_name: `${t.display_number} · ${t.title}`,
                  }))}
                />
                {d.more && <p>More records match. Refine the search.</p>}
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  I reviewed existing Sales records for this customer need
                </label>
              </fieldset>
              {d.can_create && checked && !blocked && !comparison && (
                <p>
                  <Link
                    href={`${kind === "Lead" ? "/sales/leads?create=1&" : "/sales/opportunities/new?"}source_activity=${id}&source_version=${d.activity.version}`}
                  >
                    Create {kind === "Lead" ? "Lead" : "qualified Deal"} and
                    return for link review
                  </Link>
                </p>
              )}
              {d.candidate && (
                <p>
                  Selected {d.candidate.display_number} ·{" "}
                  {d.candidate.customer_name} · {d.candidate.state} · version{" "}
                  {d.candidate.version}.{" "}
                  <Link
                    href={salesTargetHref(d.candidate.kind, d.candidate.id)}
                  >
                    Review selected Sales record
                  </Link>
                </p>
              )}
              {d.restricted && (
                <p>
                  The selected record is unavailable in this customer/site
                  context.
                </p>
              )}
              {!comparison && (
                <Button
                  disabled={
                    blocked ||
                    !!data.error ||
                    data.loading ||
                    !checked ||
                    !d.can_link
                  }
                  onClick={() => setComparison(d)}
                >
                  Compare Sales link
                </Button>
              )}
            </>
          )}
          {comparison && (
            <div className="conflict-panel">
              <h3>Review fixed Sales comparison</h3>
              <FollowupContext data={comparison} />
              <p>
                Link to {comparison.candidate?.display_number} ·{" "}
                {comparison.candidate?.title}, version{" "}
                {comparison.candidate?.version}. This preserves the Activity’s
                owner, date, state and native links. Designating a next action
                remains a separate Sales decision.
              </p>
              {(d.activity.version !== comparison.activity.version ||
                d.source_hash !== comparison.source_hash ||
                d.candidate?.version !== comparison.candidate?.version) && (
                <p role="alert">
                  Saved context changed. Discard and compare again before
                  linking.
                </p>
              )}
              <Field
                name="sales-followup-reason"
                label="Reason for Sales link"
                value={reason}
                onChange={setReason}
                required
                maxLength={1000}
              />
              <Button
                disabled={blocked || !!data.error || !reason.trim()}
                onClick={() => {
                  const t = comparison.candidate!;
                  void command.send(
                    `activities/${id}/sales-followup`,
                    {
                      expected_version: comparison.activity.version,
                      source_hash: comparison.source_hash,
                      destination_kind: t.kind,
                      destination_id: t.id,
                      expected_destination_version: t.version,
                      existing_checked: true,
                      reason,
                    },
                    `/work/${id}`,
                    "Link reviewed Sales follow-up",
                    id,
                  );
                }}
              >
                Link reviewed Sales record
              </Button>
              <Button
                disabled={blocked}
                onClick={() => {
                  setComparison(null);
                  setReason("");
                }}
              >
                Discard Sales comparison
              </Button>
            </div>
          )}
          {d.history.map((h) => (
            <p key={h.operation_id}>
              Link recorded <Stamp value={h.recorded_at} /> · compared Activity{" "}
              {h.compared_activity_version} and Sales record{" "}
              {h.compared_destination_version} · {h.reason}
            </p>
          ))}
          {d.can_review && (
            <PrepareSalesReview
              key={id}
              data={d}
              onCreated={(newId) => router.push(`/work/${newId}`)}
            />
          )}
        </>
      )}
    </section>
  );
}
function PrepareSalesReview({
  data: d,
  onCreated,
}: {
  data: Followup;
  onCreated: (id: string) => void;
}) {
  const [source] = useState(d),
    [id] = useState(() => crypto.randomUUID()),
    [summary, setSummary] = useState(""),
    [due, setDue] = useState(""),
    [reason, setReason] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const path = `activities/${d.activity.id}/sales-followup/review`;
  const command = useRecoverableCommand({
    key: `ppo-sales-review:${d.activity.id}`,
    scope: useIdentity(),
    transport: api,
    accepts: (e) => e.path === path,
  });
  const created = command.accepted?.receipt.record_id,
    callback = useRef(onCreated);
  useEffect(() => {
    callback.current = onCreated;
  }, [onCreated]);
  useEffect(() => {
    if (created) callback.current(created);
  }, [created]);
  useUnsavedChanges(!!summary || !!due || !!reason, !!command.pending);
  return (
    <details className="crm-panel" open={!!command.pending || undefined}>
      <summary>Prepare a separate owned Sales review</summary>
      <p>
        Write a customer need suitable for Internal access. You own the new
        Relationship review; the original Activity and its restrictions stay
        unchanged.
      </p>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <div role="status">
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original Sales review creation
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original Sales review creation
          </Button>
        </div>
      )}
      {!denied(command.error) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void command.send(
              path,
              {
                id,
                expected_version: source.activity.version,
                source_hash: source.source_hash,
                summary,
                due_at: due,
                wording_reviewed: reviewed,
                reason,
              },
              `/work/${id}`,
              "Create separate owned Sales review",
              id,
            );
          }}
        >
          <fieldset
            disabled={
              command.busy || !!command.pending || !command.ready || !!created
            }
          >
            <Field
              name="sales-review-summary"
              label="Reviewed customer need"
              value={summary}
              onChange={setSummary}
              required
              multiline
              maxLength={2000}
            />
            <LocalDateTimeField
              name="sales-review-due"
              label="Sales review due date and time"
              value={due}
              onChange={setDue}
              required
            />
            <label className="check-field">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              I reviewed this wording for Internal Sales access
            </label>
            <Field
              name="sales-review-reason"
              label="Reason for separate Sales review"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
            />
            <Button type="submit" disabled={!reviewed}>
              Create owned Sales review
            </Button>
          </fieldset>
        </form>
      )}
    </details>
  );
}
export type ActivitySalesCreation = {
  context?: ReactNode;
  source: Followup;
  blocked: boolean;
  send: (
    fields: Record<string, unknown> & { id: string },
  ) => Promise<Receipt | null>;
};
export function SalesActivityCreation({
  kind,
  children,
  onPending,
}: {
  kind: SalesTargetKind;
  children: (sales?: ActivitySalesCreation) => ReactNode;
  onPending?: (v: boolean) => void;
}) {
  const params = useSearchParams(),
    raw = params.get("source_activity"),
    id = salesHandoverId(raw),
    version = Number(params.get("source_version")),
    router = useRouter();
  const data = useCrmResource<Followup>(
      id ? `activities/${id}/sales-followup?kind=${kind}` : null,
      true,
    ),
    path = kind === "Lead" ? "crm/leads" : "crm/opportunities";
  const command = useRecoverableCommand({
    key: `ppo-sales-native:${kind}:${id}:${version}`,
    scope: useIdentity(),
    transport: api,
    enabled: !!id && version > 0,
    accepts: (e) => e.path === path,
  });
  const saved = command.accepted?.receipt.record_id;
  useEffect(() => {
    onPending?.(command.busy || !!command.pending);
  }, [onPending, command.busy, command.pending]);
  useEffect(() => {
    if (saved && id && !data.loading)
      router.replace(
        denied(data.error)
          ? salesTargetHref(kind, saved)
          : `/work/${id}?sales_kind=${kind}&sales_candidate=${saved}`,
      );
  }, [saved, id, kind, router, data.loading, data.error]);
  if (!raw) return children();
  if (!id || !Number.isInteger(version) || version < 1)
    return (
      <p role="alert">
        Reopen native capture from the reviewed source Activity.
      </p>
    );
  const d = data.data;
  const context = (
    <section className="crm-panel">
      <h2>Capture from reviewed follow-up</h2>
      <p>
        This native Sales record saves independently. Return to the Activity for
        a separate link review.
      </p>
      <Link href={`/work/${id}`}>Return to source Activity</Link>
      <ErrorNotice error={data.error} />
      <ErrorNotice error={command.error} />
      {!!data.error && (
        <Button onClick={data.reload}>Retry source Activity context</Button>
      )}
      {data.loading && <p role="status">Loading source Activity…</p>}
      {command.pending && (
        <div role="status">
          <p>Resolve the original native creation before another save.</p>
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original Sales creation
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original Sales creation
          </Button>
        </div>
      )}
      {saved && (
        <Link href={salesTargetHref(kind, saved)}>
          Open independently saved Sales record
        </Link>
      )}
      {d && (
        <>
          <FollowupContext data={d} />
          {(!d.can_create || version !== d.activity.version) && (
            <p role="alert">
              Source context changed. Return to the Activity and review it
              before creating a new record.
            </p>
          )}
        </>
      )}
    </section>
  );
  const form =
    d && !denied(command.error)
      ? children({
          context: kind === "Lead" ? context : undefined,
          source: d,
          blocked:
            !!data.error ||
            data.loading ||
            !d.can_create ||
            version !== d.activity.version ||
            command.busy ||
            !!command.pending ||
            !command.ready ||
            !!saved,
          send: (fields) =>
            command.send(
              path,
              fields,
              salesTargetHref(kind, fields.id),
              "Create native Sales record",
              fields.id,
            ),
        })
      : null;
  if (kind === "Lead")
    return (
      form ?? (
        <>
          <header className="lead-dialog-head">
            <h2 id="lead-dialog-title">Capture from follow-up</h2>
          </header>
          <div className="lead-dialog-body">{context}</div>
        </>
      )
    );
  return (
    <>
      {context}
      {form}
    </>
  );
}
