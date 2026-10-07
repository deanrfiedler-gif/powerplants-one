"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  readEstimatingBinding,
  readWorkspaceSalesBriefs,
} from "../sales/estimating-binding";
import type { HandoverContent } from "../sales/handover-model";
import { useCrmResource } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { useIdentity } from "./business-session";
import { api, ErrorNotice, Field, Stamp } from "./business-ui";
import { Button } from "./ui/button";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";

type Comparison = Awaited<ReturnType<typeof readEstimatingBinding>>;
export function SalesBriefContent({ content }: { content: HandoverContent }) {
  return (
    <dl>
      {(
        [
          ["problem", "Customer problem"],
          ["outcome", "Desired outcome"],
          ["included_scope", "Included scope"],
          ["exclusions", "Exclusions"],
          ["assumptions", "Assumptions"],
          ["unknowns", "Unknowns and owner"],
          ["requested_date", "Requested date"],
          ["date_reason", "Date basis"],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {content[key] || "Not recorded"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function SalesEstimatingLink({ id }: { id: string }) {
  const data = useCrmResource<Comparison>(
    `sales/handovers/${id}/estimating`,
    true,
  );
  const [comparison, setComparison] = useState<Comparison | null>(null),
    [reason, setReason] = useState("");
  const p = useIdentity();
  const command = useRecoverableCommand({
    key: `ppo-sales-estimating:${id}`,
    scope: p,
    transport: api,
    accepts: (e) => e.path === `sales/handovers/${id}/estimating`,
  });
  const reloadRef = useRef(data.reload);
  useEffect(() => {
    reloadRef.current = data.reload;
  }, [data.reload]);
  useEffect(() => {
    if (command.accepted) {
      reloadRef.current();
      queueMicrotask(() => setComparison(null));
    }
  }, [command.accepted]);
  useUnsavedChanges(!!comparison && !!reason, !!command.pending);
  const blocked = command.busy || !!command.pending || !command.ready;
  const error = command.error ?? data.error;
  if (error && [403, 404].includes((error as { status: number }).status))
    return <ErrorNotice error={error} />;
  const d = data.data;
  async function link() {
    const c = comparison,
      g = c?.candidate;
    if (!c || !g || !c.acceptance_event_id) return;
    await command.send(
      `sales/handovers/${id}/estimating`,
      {
        expected_version: c.version,
        acceptance_event_id: c.acceptance_event_id,
        source_hash: c.source_hash,
        estimating_workspace_id: g.id,
        expected_estimating_version: g.version,
        selected_option_id: g.selected_option_id,
        selected_revision_id: g.selected_revision_id,
        reason,
      },
      `/sales/handoffs/estimating/${id}`,
      "Link accepted Sales brief",
      id,
    );
  }
  return (
    <section className="crm-panel">
      <h2>Native estimating workspace</h2>
      <p>
        Link the accepted Sales brief after reviewing the native workspace.
        Discovery answers and costs keep their own review and history.
      </p>
      <ErrorNotice error={error} />
      {data.loading && !d && (
        <p role="status">Loading current estimating context…</p>
      )}
      {!!data.error && (
        <Button onClick={data.reload}>Retry estimating context</Button>
      )}
      {command.pending && (
        <div role="status">
          <p>
            The link result is uncertain. Resolve the original before another
            save.
          </p>
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original link
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original link
          </Button>
        </div>
      )}
      {command.saved && <p role="status">{command.saved}</p>}
      {d && (
        <>
          {d.source_changed && (
            <p role="alert">
              Sales sources changed. A current accepted successor is needed
              before a new link.
            </p>
          )}
          {d.links.map((b, i) =>
            b.access === "Restricted" ? (
              <p key={i}>An earlier estimating link is restricted.</p>
            ) : (
              <article key={b.acceptance_event_id}>
                <h3>
                  {b.current
                    ? "Current accepted brief linked"
                    : "Historical accepted brief linked"}{" "}
                  · Sales revision {b.handover_revision}
                </h3>
                <Link href={`/estimating/discovery/${b.workspace_id}`}>
                  Open linked estimating workspace
                </Link>
                <p>
                  Compared workspace version {b.workspace_version}, scope
                  revision {b.revision_version} ·{" "}
                  <Stamp value={b.recorded_at} />
                </p>
                <p>{b.reason}</p>
              </article>
            ),
          )}
          {d.candidate && (
            <p>
              Existing workspace · version {d.candidate.version} · selected
              option {d.candidate.option_label} · scope revision{" "}
              {d.candidate.revision_version} ({d.candidate.scope_readiness}).{" "}
              <Link href={`/estimating/discovery/${d.candidate.id}`}>
                Review native workspace
              </Link>
            </p>
          )}
          {d.restricted && (
            <p>
              Linking is unavailable with your current access or ownership. The
              receiving owner must also own and be able to edit the estimating
              workspace.
            </p>
          )}
          {d.can_create && !blocked && (
            <p>
              <Link
                href={`/estimating/discovery/new?opportunity=${d.opportunity_id}&sales_handover=${id}`}
              >
                Create native estimating workspace
              </Link>
              . Creation saves independently; return here to review and link the
              accepted brief.
            </p>
          )}
          {!d.acceptance_event_id && (
            <p>
              Accept the current Sales brief before linking an estimating
              workspace.
            </p>
          )}
          {d.can_link && !comparison && (
            <Button disabled={blocked} onClick={() => setComparison(d)}>
              Review workspace link
            </Button>
          )}
          {comparison && !d.restricted && (
            <div>
              <h3>Reviewed comparison</h3>
              <p>
                Sales version {comparison.version}; native workspace version{" "}
                {comparison.candidate?.version}, option{" "}
                {comparison.candidate?.option_label}, scope revision{" "}
                {comparison.candidate?.revision_version}.
              </p>
              <details>
                <summary>Accepted Sales context being linked</summary>
                <SalesBriefContent content={comparison.content} />
              </details>
              <fieldset disabled={blocked}>
                <Field
                  name="estimating-link-reason"
                  label="Link reason"
                  value={reason}
                  onChange={setReason}
                />
              </fieldset>
              <Button
                disabled={blocked || !reason.trim()}
                busy={command.busy}
                onClick={() => void link()}
              >
                Link accepted brief
              </Button>
              <Button
                disabled={blocked}
                onClick={() => {
                  setComparison(null);
                  setReason("");
                }}
              >
                Discard comparison
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function WorkspaceSalesBriefs({ id }: { id: string }) {
  const data = useCrmResource<
    Awaited<ReturnType<typeof readWorkspaceSalesBriefs>>
  >(`estimating/workspaces/${id}/sales-briefs`, true);
  return (
    <section className="crm-panel">
      <h2>Accepted Sales context</h2>
      <ErrorNotice error={data.error} />
      {!!data.error && (
        <Button onClick={data.reload}>Retry Sales context</Button>
      )}
      {!data.error &&
        data.data?.items.map((b, i) =>
          b.access === "Restricted" ? (
            <p key={i}>A linked Sales brief is restricted.</p>
          ) : (
            <details key={b.acceptance_event_id} open={b.current}>
              <summary>
                {b.current
                  ? "Current accepted brief"
                  : "Historical accepted brief"}{" "}
                · revision {b.revision}
                {b.source_changed ? " · Sources changed" : ""}
              </summary>
              <p>
                Sales context is retained as reported. Discovery confirmation,
                estimating costs and quotation approval remain separate.
              </p>
              <Link href={`/sales/handoffs/estimating/${b.handover_id}`}>
                Open exact Sales history
              </Link>
              <SalesBriefContent content={b.content} />
            </details>
          ),
        )}
      {!data.error && data.data && !data.data.items.length && (
        <p>
          No accepted Sales brief is linked.{" "}
          <Link href="/estimating/intake">Review Estimating Intake</Link>.
        </p>
      )}
    </section>
  );
}
export function CreatingFromSalesBrief({
  id,
  opportunityId,
}: {
  id: string;
  opportunityId: string;
}) {
  const data = useCrmResource<Comparison>(
    `sales/handovers/${id}/estimating`,
    true,
  );
  return (
    <section className="crm-panel">
      <h2>Sales brief for this workspace</h2>
      <ErrorNotice error={data.error} />
      {!data.error &&
        data.data &&
        data.data.opportunity_id === opportunityId && (
          <>
            <p>
              Save the native workspace, then return to review the link. Sales
              statements do not confirm discovery answers.
            </p>
            <Link href={`/sales/handoffs/estimating/${id}`}>
              Return to Sales handover
            </Link>
            {(!data.data.can_create || data.data.source_changed) && (
              <p role="alert">
                This handover needs renewed review before linking. Any
                independently saved native workspace remains available.
              </p>
            )}
            <details>
              <summary>Reported Sales problem and scope</summary>
              <SalesBriefContent content={data.data.content} />
            </details>
          </>
        )}
    </section>
  );
}
