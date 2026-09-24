"use client";
import Link from "next/link";
import type { listEmail } from "../email/service";
import { ErrorNotice, Stamp } from "./business-ui";
import { useCrmResource } from "./crm-state";
import { Button } from "./ui/button";
export function OpportunityCorrespondence({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof listEmail>>>(
    `email?opportunity_id=${id}`,
    true,
  );
  return (
    <section className="crm-panel">
      <h2>Correspondence</h2>
      <p>
        Explicitly linked messages permitted by the Email service. Message
        content remains in Email; this view sends nothing.
      </p>
      {r.loading && <p role="status">Loading correspondence…</p>}
      <ErrorNotice error={r.error} />
      {!!r.error && <Button onClick={r.reload}>Retry correspondence</Button>}
      {!r.error && r.data && (
        <>
          <p>
            {r.data.truncated
              ? "Partial result: first 100 permitted messages"
              : "Complete permitted result"}{" "}
            · As at <Stamp value={r.data.observed_at} />
          </p>
          <ul>
            {r.data.items.map((m) => (
              <li key={m.id}>
                <Link href={`/email/${m.id}`}>{m.subject}</Link> ·{" "}
                {m.sender_name} · <Stamp value={String(m.received_at)} />
              </li>
            ))}
          </ul>
          {!r.data.items.length && <p>No permitted linked messages.</p>}
        </>
      )}
    </section>
  );
}
