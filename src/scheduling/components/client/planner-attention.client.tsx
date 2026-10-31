"use client";
import Link from "next/link";
import { plannerHeld, plannerHoldReasons } from "../../planner-attention";
import { appointmentHref } from "../../navigation";
import type { ScheduleAppointment } from "./planner-screens.client";

export function PlannerAttention({ items, usable, returnTo }: { items: ScheduleAppointment[]; usable: boolean; returnTo: string }) {
  const held = items.filter(plannerHeld);
  return <section className="pl01-attention" aria-label="Needs attention" aria-busy={!usable}>
    <h2>Needs attention · {usable ? held.length : "Unknown"}</h2>
    {!usable ? <p>Current holds are unknown. Refresh the planner before acting.</p> : held.length ?
      <div className="pl01-attention-rows">{held.map(a => <article key={a.id}>
        <div><strong>{a.scope_summary}</strong><ul>{plannerHoldReasons(a).map(reason => <li key={reason}>{reason}</li>)}</ul></div>
        <Link className="button secondary" href={appointmentHref(a.id, returnTo)}>Review appointment<span className="sr-only"> {a.display_number}</span></Link>
      </article>)}</div> : <p>No held visits in the current planner filter.</p>}
  </section>;
}
