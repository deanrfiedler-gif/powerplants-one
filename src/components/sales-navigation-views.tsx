"use client";
import Link from "next/link";
import { useState } from "react";
import { ReadState, useResource } from "./business-ui";
import { useShell } from "./shell-provider";
import { ActivityRow, useWorkDialogs } from "../activities/components/client/my-work-list";
import type { listWork, readWorkGaps, readWorkOverdueOpportunities } from "../activities/work-overview";

// Bounded views of existing authorised work. The rows and completion/reschedule
// dialogs are the same objects/handlers used by My Work; no second task store.
function SalesActions({ linked, tasks }: { linked: "Lead" | "Opportunity"; tasks: boolean }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const r = useResource<Awaited<ReturnType<typeof listWork>>>(`work/actions?owner=mine&status=Active&linked=${linked}${tasks ? "&activity_type=Task" : ""}&limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
  const dialogs = useWorkDialogs(r.data?.observed_at ?? new Date().toISOString(), () => r.reload());
  return <section className="business-card" aria-label={`${linked === "Lead" ? "Lead" : "Deal"} ${tasks ? "tasks" : "priorities"}`}>
    <h2>{linked === "Lead" ? "Lead" : "Deal"} {tasks ? "tasks" : "priorities"}</h2>
    <ReadState loading={r.loading} error={r.error} retry={r.reload} />
    {!r.loading && !r.error && r.data && <>
      <p>{r.data.total} active {tasks ? "tasks" : "actions"} · {r.data.counts.overdue} overdue · {r.data.timezone}</p>
      <ul className="mw-rows">{r.data.items.map(row => <ActivityRow key={row.id} row={row} now={r.data!.observed_at} open={dialogs.open} />)}</ul>
      {!r.data.items.length && <p>No active {tasks ? "tasks" : "actions"} in this permitted scope.</p>}
      <div className="project-pagination"><button className="mw-button" disabled={!cursor} onClick={() => setCursor(null)}>First page</button><button className="mw-button" disabled={!r.data.next_cursor} onClick={() => setCursor(r.data!.next_cursor)}>Next page</button></div>
    </>}
    {dialogs.element}
  </section>;
}
function DealAttention() {
  const gaps = useResource<Awaited<ReturnType<typeof readWorkGaps>>>("work/gaps?owner=mine");
  const overdue = useResource<Awaited<ReturnType<typeof readWorkOverdueOpportunities>>>("work/overdue-opportunities?owner=mine");
  return <>{[
    { title: "Deals needing a next step", resource: gaps, panel: gaps.data?.gaps },
    { title: "Deals with overdue follow-up", resource: overdue, panel: overdue.data?.opportunities },
  ].map(({ title, resource, panel }) => <section className="business-card" key={title}>
    <h2>{title}</h2><ReadState loading={resource.loading} error={resource.error} retry={resource.reload}/>
    {!resource.loading && !resource.error && panel && (panel.status === "ok" ? <>
      <p>{panel.total} in your permitted scope{panel.total > panel.items.length ? `; first ${panel.items.length} shown` : ""}.</p>
      <ul>{panel.items.map(row => <li key={row.id}><Link href={`/sales/opportunities/${row.id}`}>{row.display_number} · {row.title}</Link></li>)}</ul>
    </> : <p>{panel.status === "not_permitted" ? "This view is outside your access." : "This view is temporarily unavailable."}</p>)}
  </section>)}</>;
}
export function SalesWorkView({ tasks = false }: { tasks?: boolean }) {
  const shell = useShell(), permitted = shell.context?.navigation ?? [];
  return <section id="ppo-my-work" className="ppo-sales-work">
    <header className="page-header"><h1>{tasks ? "Tasks" : "Pulse"}</h1><p>{tasks ? "Your active tasks linked to leads and deals. Complete or reschedule the original action." : "Your daily Sales attention: lead and deal actions, upcoming work, missing next steps and overdue follow-up."}</p></header>
    <ReadState loading={!shell.context && !shell.error} error={shell.error || null} retry={shell.reload}/>
    {shell.context && !permitted.includes(tasks ? "tasks" : "pulse") ? <p role="alert">This Sales view is outside your access.</p> : <>
      {permitted.includes("leads") && <SalesActions linked="Lead" tasks={tasks}/>}
      {permitted.includes("deals") && <SalesActions linked="Opportunity" tasks={tasks}/>}
      {!tasks && permitted.includes("deals") && <DealAttention/>}
    </>}
  </section>;
}
