"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ReadState, useResource } from "./business-ui";
import type { accountLanding, quotationLanding } from "../shell/landing-reads";

export function QuotationsLanding() {
  const params = useSearchParams(), router = useRouter(), [query, setQuery] = useState(params.get("q") ?? "");
  const request = new URLSearchParams();
  for (const key of ["offset", "q"]) if (params.has(key)) request.set(key, params.get(key)!);
  const r = useResource<Awaited<ReturnType<typeof quotationLanding>>>(`navigation/quotations?${request}`);
  const href = (offset: number) => `/estimating/quotes?${new URLSearchParams({ offset: String(offset), q: params.get("q") ?? "" })}`;
  return <section><h1>Quotations</h1><ReadState loading={r.loading} error={r.error} retry={r.reload}/>
    <form onSubmit={event => { event.preventDefault(); router.push(`/estimating/quotes?${new URLSearchParams({ q: query })}`); }}><label>Estimate reference or title <input value={query} maxLength={100} onChange={event => setQuery(event.target.value)} /></label><button>Filter estimate windows</button></form>
    {!r.error && !r.loading && r.data && <><p>{r.data.basis}</p><ul className="business-list">{r.data.items.map(q => <li key={q.id}><Link href={`/estimating/quotes/${q.id}`}>{q.reference} · Revision {q.version} · {q.title}</Link> · {q.state}</li>)}</ul>{!r.data.items.length && <p>No permitted saved quotations in this estimate window.</p>}</>}
    {r.data && !r.loading && !r.error && <nav aria-label="Quotation estimate windows">{r.data.offset > 0 && <Link href={href(Math.max(0, r.data.offset - 100))}>Newer estimate window</Link>} {r.data.next_offset !== null && <Link href={href(r.data.next_offset)}>Continue to older estimates</Link>}</nav>}
  </section>;
}
export function AccountsLanding() {
  const r = useResource<Awaited<ReturnType<typeof accountLanding>>>("navigation/accounts");
  return <section><h1>Customer accounts</h1><p>Choose an authorised synthetic account to review its exact observations.</p><ReadState loading={r.loading} error={r.error} retry={r.reload}/>
    {!r.error && !r.loading && r.data && <><ul className="business-list">{r.data.items.map(a => <li key={a.id}><Link href={`/customers/${a.customer_id}/account?account_id=${a.id}&department=finance`}>{a.label}</Link></li>)}</ul>{!r.data.items.length && <p>No permitted customer accounts.</p>}</>}
  </section>;
}
