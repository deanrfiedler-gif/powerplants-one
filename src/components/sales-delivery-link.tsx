"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  DeliveryKind,
  readDeliveryBinding,
  readDeliverySalesSources,
} from "../sales/delivery-binding";
import { useCrmResource, denied } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { useIdentity } from "./business-session";
import { api, ErrorNotice, Field, SelectField, Stamp } from "./business-ui";
import { Button } from "./ui/button";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import { SalesBriefContent } from "./sales-estimating-link";

export type DeliveryComparison = Awaited<
  ReturnType<typeof readDeliveryBinding>
>;
export const deliveryHref = (kind: DeliveryKind, id: string) =>
  kind === "Projects" ? `/projects/${id}` : `/service/work-orders/${id}`;
export const salesHandoverId = (value: string | null) =>
  value &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
export function DeliveryBrief({
  content,
}: {
  content: DeliveryComparison["content"];
}) {
  return (
    <>
      <SalesBriefContent content={content} />
      <dl>
        {(
          [
            ["routing_basis", "Routing basis"],
            ["delivery_items", "Delivery items"],
            ["release_prerequisites", "Release prerequisites"],
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
    </>
  );
}
export function SalesDeliveryLink({ id }: { id: string }) {
  const params = useSearchParams();
  const [selected, setSelected] = useState(
      salesHandoverId(params.get("created_destination")) ?? "",
    ),
    [query, setQuery] = useState("");
  const data = useCrmResource<DeliveryComparison>(
    `sales/handovers/${id}/delivery?${new URLSearchParams({ ...(selected ? { destination_id: selected } : {}), q: query })}`,
    true,
  );
  const [comparison, setComparison] = useState<DeliveryComparison | null>(null),
    [reason, setReason] = useState("");
  const command = useRecoverableCommand({
    key: `ppo-sales-delivery:${id}`,
    scope: useIdentity(),
    transport: api,
    accepts: (e) => e.path === `sales/handovers/${id}/delivery`,
  });
  const reload = useRef(data.reload);
  useEffect(() => {
    reload.current = data.reload;
  }, [data.reload]);
  useEffect(() => {
    if (command.accepted) {
      reload.current();
      queueMicrotask(() => setComparison(null));
    }
  }, [command.accepted]);
  useUnsavedChanges(!!comparison && !!reason, !!command.pending);
  const blocked = command.busy || !!command.pending || !command.ready;
  const error = command.error ?? data.error,
    d = data.data;
  useEffect(() => {
    if (denied(error) || d?.restricted)
      queueMicrotask(() => {
        setComparison(null);
        setReason("");
      });
  }, [error, d?.restricted]);
  if (denied(error)) return <ErrorNotice error={error} />;
  async function link() {
    const c = comparison,
      target = c?.candidate;
    if (!c?.acceptance_event_id || !target) return;
    await command.send(
      `sales/handovers/${id}/delivery`,
      {
        expected_version: c.version,
        acceptance_event_id: c.acceptance_event_id,
        source_hash: c.source_hash,
        destination_kind: target.kind,
        destination_id: target.id,
        expected_destination_version: target.version,
        destination_site_id: target.site_id,
        reason,
      },
      `/sales/handoffs/won/${id}`,
      "Link accepted Won handover",
      id,
    );
  }
  return (
    <section className="crm-panel">
      <h2>Project or Service receiving</h2>
      <p>
        Review the native record, then link the exact accepted Sales handover.
        Scope, scheduling and work authorisation remain decisions in the
        receiving module.
      </p>
      <ErrorNotice error={error} />
      <Button onClick={data.reload}>Refresh receiving context</Button>
      {data.loading && !d && <p role="status">Loading receiving context…</p>}
      {command.pending && (
        <div role="status">
          <p>
            The link result is uncertain. Resolve the original before another
            save.
          </p>
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original delivery link
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original delivery link
          </Button>
        </div>
      )}
      {command.saved && <p role="status">{command.saved}</p>}
      {d && (
        <>
          {d.source_changed && (
            <p role="alert">
              Sales sources changed. Review and accept a current successor
              before a new delivery link.
            </p>
          )}
          {d.links.map((b, i) =>
            b.access === "Restricted" ? (
              <p key={i}>An earlier delivery link is restricted.</p>
            ) : (
              <article key={b.acceptance_event_id}>
                <h3>
                  {b.current
                    ? "Current accepted handover linked"
                    : "Historical accepted handover linked"}{" "}
                  · Sales revision {b.handover_revision}
                </h3>
                <Link href={deliveryHref(b.destination.kind, b.destination.id)}>
                  {b.destination.display_number} · {b.destination.title}
                </Link>
                <p>
                  {b.destination.site_name} · Native state:{" "}
                  {b.destination.state}. Compared version {b.compared_version};
                  current version {b.destination.version}.
                </p>
                <p>
                  {b.reason} · <Stamp value={b.recorded_at} />
                </p>
              </article>
            ),
          )}
          {!d.destination_kind && (
            <p>
              The receiving route is {d.content.destination}. Choose Projects or
              Service through the handover review to use native receiving here.
            </p>
          )}
          {!d.acceptance_event_id && (
            <p>
              Accept the current Won handover before linking a native
              destination.
            </p>
          )}
          {d.can_create && !blocked && (
            <p>
              <Link
                href={`${d.destination_kind === "Projects" ? "/projects/new" : "/service/work-orders/new"}?sales_handover=${id}&sales_acceptance=${d.acceptance_event_id}`}
              >
                Create native{" "}
                {d.destination_kind === "Projects"
                  ? "project"
                  : "Service work order"}
              </Link>
              . Creation saves independently; return here to review and link.
            </p>
          )}
          {d.destination_kind && (
            <fieldset disabled={blocked || !!comparison}>
              <Field
                name="delivery-search"
                label="Find an existing destination"
                value={query}
                onChange={setQuery}
                hint="Search its reference or project name. Results require the receiving owner and matching customer context."
              />
              <SelectField
                name="delivery-destination"
                label="Native destination"
                value={selected}
                onChange={setSelected}
                options={d.options.map((o) => ({
                  id: o.id,
                  display_name: `${o.display_number} · ${o.title} · ${o.site_name}`,
                }))}
              />
              {d.more && <p>More destinations match. Refine the search.</p>}
            </fieldset>
          )}
          {d.candidate && (
            <p>
              Selected: {d.candidate.display_number} · {d.candidate.site_name} ·{" "}
              {d.candidate.state} · version {d.candidate.version}.{" "}
              <Link href={deliveryHref(d.candidate.kind, d.candidate.id)}>
                Review native destination
              </Link>
            </p>
          )}
          {d.restricted && (
            <p>
              The selected destination is unavailable under current access or
              customer context.
            </p>
          )}
          {d.candidate &&
            !d.can_link &&
            !d.links.some((b) => b.access === "Available" && b.current) && (
              <p>
                A new link needs a current accepted handover and a destination
                owned and editable by its receiving owner.
              </p>
            )}
          {d.can_link && !comparison && (
            <Button disabled={blocked} onClick={() => setComparison(d)}>
              Review delivery link
            </Button>
          )}
          {comparison && !d.restricted && (
            <div>
              <h3>Reviewed delivery comparison</h3>
              <p>
                Sales version {comparison.version};{" "}
                {comparison.candidate?.display_number}, native version{" "}
                {comparison.candidate?.version}, site{" "}
                {comparison.candidate?.site_name}.
              </p>
              {!comparison.site_id && (
                <p>
                  Sales left the site unknown. This link records your explicit
                  native site choice; the earlier Sales record stays unchanged.
                </p>
              )}
              <details>
                <summary>Accepted Sales context being linked</summary>
                <DeliveryBrief content={comparison.content} />
              </details>
              <fieldset disabled={blocked}>
                <Field
                  name="delivery-link-reason"
                  label="Delivery link reason"
                  value={reason}
                  onChange={setReason}
                />
              </fieldset>
              <Button
                disabled={blocked || !reason.trim()}
                busy={command.busy}
                onClick={() => void link()}
              >
                Link accepted Won handover
              </Button>
              <Button
                disabled={blocked}
                onClick={() => {
                  setComparison(null);
                  setReason("");
                  command.clear();
                }}
              >
                Discard delivery comparison
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function DeliverySalesSources({
  kind,
  id,
}: {
  kind: DeliveryKind;
  id: string;
}) {
  const data = useCrmResource<
    Awaited<ReturnType<typeof readDeliverySalesSources>>
  >(
    `${kind === "Projects" ? "projects" : "service/work-orders"}/${id}/sales-handovers`,
    true,
  );
  return (
    <section className="crm-panel">
      <h2>Accepted Sales handovers</h2>
      <ErrorNotice error={data.error} />
      {!!data.error && (
        <Button onClick={data.reload}>Retry Sales handovers</Button>
      )}
      {!data.error &&
        data.data?.items.map((b, i) =>
          b.access === "Restricted" ? (
            <p key={i}>A linked Sales handover is restricted.</p>
          ) : (
            <details key={b.acceptance_event_id} open={b.current}>
              <summary>
                {b.current ? "Current" : "Historical"} accepted Sales handover ·{" "}
                {b.opportunity_title} · revision {b.revision}
                {b.source_changed ? " · Sources changed" : ""}
              </summary>
              <p>
                Reported Sales context is retained here. Native scope, readiness
                and authorisation remain separate.
              </p>
              <Link href={`/sales/handoffs/won/${b.handover_id}`}>
                Open exact Sales handover history
              </Link>
              <DeliveryBrief content={b.content} />
              <p>
                {b.reason} · Compared native version {b.compared_version} ·{" "}
                <Stamp value={b.recorded_at} />
              </p>
            </details>
          ),
        )}
      {!data.error && data.data && !data.data.items.length && (
        <p>
          No accepted Sales handover is linked.{" "}
          <Link href="/sales/handoffs/won">Open Won receiving</Link>.
        </p>
      )}
    </section>
  );
}
export function DeliveryProgress({ id }: { id: string }) {
  const data = useCrmResource<DeliveryComparison>(
    `sales/handovers/${id}/delivery`,
    true,
  );
  return (
    <div>
      <ErrorNotice error={data.error} />
      {data.loading && <p>Loading native receiving progress…</p>}
      {data.data && (
        <>
          {data.data.source_changed ? (
            <p>
              Next: accountable Sales and receiving owners review changed source
              context.
            </p>
          ) : !data.data.acceptance_event_id ? (
            <p>Next: complete receiving review of the current handover.</p>
          ) : !data.data.links.some(
              (b) => b.access === "Available" && b.current,
            ) ? (
            <p>
              Accepted handover: native delivery link awaits the receiving
              owner’s review.
            </p>
          ) : null}
          {data.data.links.map((b, i) =>
            b.access === "Restricted" ? (
              <p key={i}>Linked delivery progress is restricted.</p>
            ) : (
              <p key={b.acceptance_event_id}>
                {b.current ? "Current" : "Historical"} receiving link:{" "}
                <Link href={deliveryHref(b.destination.kind, b.destination.id)}>
                  {b.destination.display_number}
                </Link>{" "}
                · Native state: {b.destination.state}. Open the native record
                for its owner, tasks and readiness.
              </p>
            ),
          )}
        </>
      )}
    </div>
  );
}
