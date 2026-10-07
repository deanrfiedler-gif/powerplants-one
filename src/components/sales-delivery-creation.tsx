"use client";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DeliveryKind } from "../sales/delivery-binding";
import {
  useRecoverableCommand,
  type Receipt,
} from "../shared/ui/use-recoverable-command";
import { useIdentity } from "./business-session";
import { api, ErrorNotice } from "./business-ui";
import { useCrmResource, denied } from "./crm-state";
import { Button } from "./ui/button";
import {
  DeliveryBrief,
  deliveryHref,
  salesHandoverId,
  type DeliveryComparison,
} from "./sales-delivery-link";

export type SalesCreation = {
  source: DeliveryComparison;
  blocked: boolean;
  busy: boolean;
  error: unknown;
  send: (
    fields: Record<string, unknown> & { id: string },
  ) => Promise<Receipt | null>;
};
// Creation has its own original receipt. Losing Sales authority must never send
// a replacement create or prevent checking an independently saved native record.
export function DeliveryCreation({
  kind,
  children,
  intake = false,
}: {
  kind: DeliveryKind;
  intake?: boolean;
  children: (sales?: SalesCreation) => ReactNode;
}) {
  const params = useSearchParams(),
    raw = params.get("sales_handover"),
    id = salesHandoverId(raw),
    acceptance = salesHandoverId(params.get("sales_acceptance")),
    router = useRouter();
  const path = intake
    ? "service/tickets"
    : kind === "Projects"
      ? "projects"
      : "service/work-orders";
  const data = useCrmResource<DeliveryComparison>(
    id ? `sales/handovers/${id}/delivery` : null,
  );
  const command = useRecoverableCommand({
    key: `ppo-sales-create:${intake ? "Intake" : kind}:${id}:${acceptance}`,
    scope: useIdentity(),
    transport: api,
    enabled: !!id && !!acceptance,
    accepts: (e) => e.path === path,
  });
  const receiptId = command.accepted?.receipt.record_id;
  const createdTicket = useCrmResource<{ items: { site_id: string | null }[] }>(
    intake && receiptId ? `service/tickets/${receiptId}` : null,
    true,
  );
  const createdSite =
    createdTicket.data?.items[0]?.site_id ??
    command.accepted?.entry.body.site_id;
  useEffect(() => {
    if (receiptId && id && !data.loading && (!intake || !createdTicket.loading))
      router.replace(
        denied(data.error)
          ? intake
            ? `/service/tickets/${receiptId}`
            : deliveryHref(kind, receiptId)
          : intake
            ? `/service/work-orders/new?${new URLSearchParams({ sales_handover: id, sales_acceptance: acceptance!, ticket_id: receiptId, ...(typeof createdSite === "string" ? { site_id: createdSite } : {}) })}`
            : `/sales/handoffs/won/${id}?created_destination=${receiptId}`,
      );
  }, [
    receiptId,
    id,
    acceptance,
    intake,
    createdSite,
    router,
    data.loading,
    data.error,
    createdTicket.loading,
    kind,
  ]);
  if (!raw) return children();
  if (!id || !acceptance)
    return (
      <p role="alert">
        The Sales handover reference is invalid. Return to Won receiving and
        reopen the creation action.
      </p>
    );
  const d = data.data;
  return (
    <>
      <section className="crm-panel">
        <h2>Creating from accepted Sales context</h2>
        <p>
          Save this native record, then review its link to the accepted
          handover. Native scope and work authorisation remain separate.
        </p>
        <Link href={`/sales/handoffs/won/${id}`}>Return to Won handover</Link>
        <ErrorNotice error={data.error} />
        <ErrorNotice error={command.error} />
        {!!data.error && (
          <Button onClick={data.reload}>Retry Sales creation context</Button>
        )}
        {data.loading && <p role="status">Loading Sales context…</p>}
        {command.pending && (
          <div role="status">
            <p>
              The native creation result is uncertain. Resolve the original
              creation before another save.
            </p>
            <Button busy={command.busy} onClick={() => void command.recover()}>
              Check original native creation
            </Button>
            <Button busy={command.busy} onClick={() => void command.retry()}>
              Retry exact original native creation
            </Button>
          </div>
        )}
        {receiptId && (
          <Link
            href={
              intake
                ? `/service/tickets/${receiptId}`
                : deliveryHref(kind, receiptId)
            }
          >
            Open independently saved native record
          </Link>
        )}
        {d && (
          <>
            <details>
              <summary>Reported Sales context</summary>
              <DeliveryBrief content={d.content} />
            </details>
            {(!d.can_create ||
              d.acceptance_event_id !== acceptance ||
              d.destination_kind !== kind) && (
              <p role="alert">
                Review the current accepted route and receiving owner before a
                new native creation from this handover. Existing native records
                remain independent.
              </p>
            )}
          </>
        )}
      </section>
      {d &&
        d.destination_kind === kind &&
        children({
          source: d,
          blocked:
            !!data.error ||
            !d.can_create ||
            d.acceptance_event_id !== acceptance ||
            command.busy ||
            !!command.pending ||
            !command.ready ||
            !!receiptId,
          busy: command.busy,
          error: command.error,
          send: (fields) =>
            command.send(
              path,
              fields,
              intake
                ? `/service/tickets/${fields.id}`
                : deliveryHref(kind, fields.id),
              `Create native ${intake ? "Service request" : kind === "Projects" ? "project" : "Service work order"}`,
              fields.id,
            ),
        })}
    </>
  );
}
