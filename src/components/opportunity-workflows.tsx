"use client";
import Link from "next/link";
import type { listHandovers } from "../sales/handover-service";
import type { listAftercare } from "../sales/aftercare-service";
import { useCrmResource } from "./crm-state";
import { ErrorNotice, Status } from "./business-ui";
export function OpportunityWorkflows({
  id,
  won,
}: {
  id: string;
  won: boolean;
}) {
  const estimating = useCrmResource<Awaited<ReturnType<typeof listHandovers>>>(
    `sales/handovers?kind=Estimating&opportunity_id=${id}`,
    true,
  );
  const receiving = useCrmResource<Awaited<ReturnType<typeof listHandovers>>>(
    won ? `sales/handovers?kind=Won&opportunity_id=${id}` : null,
    true,
  );
  const aftercare = useCrmResource<Awaited<ReturnType<typeof listAftercare>>>(
    `sales/aftercare?opportunity_id=${id}`,
    true,
  );
  return (
    <section className="crm-panel">
      <h2>Linked handovers & aftercare</h2>
      {[
        ["Estimating", estimating, "estimating"],
        ["Won receiving", receiving, "won"],
      ].map(([name, value, route]) => {
        const r = value as typeof estimating;
        if (name === "Won receiving" && !won) return null;
        return (
          <section key={String(name)}>
            <h3>{String(name)}</h3>
            {r.loading && <p role="status">Loading linked workflow…</p>}
            <ErrorNotice error={r.error} />
            {r.data?.items.map((d) => (
              <p key={d.record.id}>
                <Link href={`/sales/handoffs/${route}/${d.record.id}`}>
                  Revision {d.record.revision}
                </Link>{" "}
                · <Status value={d.record.state} />
                {d.source_changed ? " · Renewed source review needed" : ""}
              </p>
            ))}
            <Link href={`/sales/handoffs/${route}?opportunity_id=${id}`}>
              Open {String(name)} workflow
            </Link>
          </section>
        );
      })}
      <h3>Aftercare & renewal</h3>
      {aftercare.loading && <p role="status">Loading aftercare context…</p>}
      <ErrorNotice error={aftercare.error} />
      {aftercare.data?.items.map((d) => (
        <p key={d.record.id}>
          <Link href={`/sales/aftercare/${d.record.id}`}>
            Customer review revision {d.record.revision}
          </Link>{" "}
          · <Status value={d.record.state} />
        </p>
      ))}
      {aftercare.data && !aftercare.data.items.length && (
        <p>No permitted aftercare record linked to this opportunity.</p>
      )}
      <Link href="/sales/aftercare">Open Aftercare worklist</Link>
      <p>
        These are source workflow states. Use each workflow to prepare or review
        its exact revision. Receiving acceptance does not authorise delivery.
      </p>
    </section>
  );
}
