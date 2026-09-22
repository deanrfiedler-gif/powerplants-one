"use client";
import Link from "next/link";
import { ReadState, useResource } from "./business-ui";
import type { accountLanding, quotationLanding } from "../shell/landing-reads";

export function QuotationsLanding() {
  const r = useResource<Awaited<ReturnType<typeof quotationLanding>>>("navigation/quotations");
  return <section><h1>Quotations</h1><ReadState loading={r.loading} error={r.error} retry={r.reload}/>
    {!r.error && !r.loading && r.data && <><p>{r.data.basis}</p><ul className="business-list">{r.data.items.map(q => <li key={q.id}><Link href={`/estimating/quotes/${q.id}`}>{q.reference} · Revision {q.version} · {q.title}</Link> · {q.state}</li>)}</ul>{!r.data.items.length && <p>No permitted saved quotations in this estimate window.</p>}</>}
  </section>;
}
export function AccountsLanding() {
  const r = useResource<Awaited<ReturnType<typeof accountLanding>>>("navigation/accounts");
  return <section><h1>Customer accounts</h1><p>Choose an authorised synthetic account to review its exact observations.</p><ReadState loading={r.loading} error={r.error} retry={r.reload}/>
    {!r.error && !r.loading && r.data && <><ul className="business-list">{r.data.items.map(a => <li key={a.id}><Link href={`/customers/${a.customer_id}/account?account_id=${a.id}&department=finance`}>{a.label}</Link></li>)}</ul>{!r.data.items.length && <p>No permitted customer accounts.</p>}</>}
  </section>;
}
