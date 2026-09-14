"use client";
import Link from "next/link";
import type { opportunityCommercial } from "../estimating/reads";
import { ErrorNotice, Status } from "./business-ui";
import { useCrmResource } from "./crm-state";
export function OpportunityCommercial({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof opportunityCommercial>>>(`crm/opportunities/${id}/commercial`, true);
  return <section className="crm-panel"><h2>Estimates and quotations</h2>
    {r.loading && <p role="status">Loading permitted commercial records…</p>}
    <ErrorNotice error={r.error} />
    {!!r.error && <button className="secondary" onClick={r.reload}>Retry commercial records</button>}
    {r.data && <>{r.data.estimate ? <>
      <Status value={r.data.estimate.state} />
      <h3><Link href={`/estimating/estimates/${r.data.estimate.id}`}>{r.data.estimate.display_number} · {r.data.estimate.title}</Link></h3>
      <p>{r.data.estimates?.find(e=>e.id===r.data!.estimate!.id)?.discovery_basis?.option_label?`Option ${r.data.estimates.find(e=>e.id===r.data!.estimate!.id)!.discovery_basis!.option_label}`:"Option A"} · Saved version {r.data.estimate.version}</p>
      <p>Saved sell: {r.data.estimate.sell_total == null ? "Not estimated" : `AUD ${r.data.estimate.sell_total} · excluding tax`}</p>
      <p>Site: {r.data.site_name ?? "To be confirmed"}</p>
      <h3>Draft quotations</h3>
      {r.data.quotes.map(q => <p key={q.id}><Link href={`/estimating/quotes/${q.id}`}>{q.display_number} · Draft revision {q.version}</Link></p>)}
      {!r.data.quotes.length && <p>No draft quotations available in this view.</p>}
    </> : <p>No estimate available in this view.</p>}
    {r.data.can_create && <Link className="button" href={`/estimating/new?opportunity=${id}`}>Create estimate</Link>}
    {!!r.data.estimates?.length&&<section><h3>Saved option estimates</h3><p>Each alternative has separate costs and draft quotations. These amounts are not added to the opportunity forecast.</p>{r.data.estimates.map(e=><p key={e.id}><Link href={`/estimating/estimates/${e.id}`}>Option {e.discovery_basis?.option_label??"A"} · {e.display_number} · {e.title}</Link> · Saved version {e.version} · {e.sell_total===null?"Not estimated":`AUD ${e.sell_total} excluding tax`}</p>)}</section>}
    <p className="scope-note">Draft quotations have not been issued or accepted.</p></>}
  </section>;
}

export function OpportunityFiles({id}:{id:string}) {
  const r = useCrmResource<Awaited<ReturnType<typeof opportunityCommercial>>>(`crm/opportunities/${id}/commercial`, true);
  return <section className="crm-panel"><h2>Deal documents</h2><ErrorNotice error={r.error}/>{r.loading && <p role="status">Loading permitted documents…</p>}{!!r.error && <button className="secondary" onClick={r.reload}>Retry documents</button>}{r.data && <>{r.data.quotes.length ? <ul className="crm-document-list">{r.data.quotes.map(q=><li key={q.id}><div><strong>{q.display_number}</strong><p>Draft quotation · revision {q.version}</p></div><Link className="secondary button" href={`/estimating/quotes/${q.id}`}>Open document</Link></li>)}</ul> : <p className="empty-state">No linked quotations are available. Create an estimate in Commercial to prepare a draft quotation.</p>}<p className="scope-note">Open a document to check its generation status and available PDF or HTML output.</p></>}</section>;
}
