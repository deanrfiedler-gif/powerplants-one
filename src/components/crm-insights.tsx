"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { pipelineInsights } from "../crm/insights";
import type { listOpportunities } from "../crm/worklist";
import { Stamp } from "./business-ui";

export function PipelineInsights({
  data,
}: {
  data: Awaited<ReturnType<typeof listOpportunities>>;
}) {
  const params = useSearchParams();
  const result = pipelineInsights(data.items, data.window.as_of);
  const back = encodeURIComponent(
    `/sales/opportunities${params.size ? `?${params}` : ""}`,
  );
  return (
    <details className="crm-panel crm-insights">
      <summary>
        Pipeline insights · {result.denominator} permitted deals
      </summary>
      <p>
        {data.completeness === "Complete"
          ? "Complete matching population"
          : "Partial population: current result page only"}{" "}
        · Current filters and outcome apply · As at{" "}
        <Stamp value={data.window.as_of} />
      </p>
      <p>
        Known value {result.values.formatted} AUD excluding GST ·{" "}
        {result.denominator - result.values.unknown} known /{" "}
        {result.denominator} deals · {result.values.unknown} unknown.
        Unweighted; probability policy not configured. Forecast values are not
        revenue.
      </p>
      <dl className="crm-facts">
        {Object.entries(result.coverage).map(([key, count]) => (
          <div key={key}>
            <dt>
              {
                {
                  Upcoming: "Upcoming next action",
                  Overdue: "Overdue",
                  DueNeeded: "Due date needed",
                  Needed: "Next action needed",
                  Unavailable: "Next action unavailable",
                }[key]
              }
            </dt>
            <dd>
              {count} / {result.denominator}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        Age is elapsed calendar days in the current stage. Date slippage sums
        recorded postponements; earlier changes before recorded snapshots are
        unavailable. Unknown or restricted actions are not counted as absent.
      </p>
      {result.deals.map((deal) => (
        <article key={deal.id}>
          <h3>
            <Link
              href={`/sales/opportunities/${deal.id}?section=history&return_to=${back}`}
            >
              {deal.title}
            </Link>
          </h3>
          <p>
            {deal.stage} · entered <Stamp value={deal.entered_at} /> ·{" "}
            {deal.stage_days} days
          </p>
          <p>
            {deal.close_history_available
              ? `${deal.changes} recorded close-date changes · ${deal.slipped_days} days of recorded postponement`
              : "Close-date history unavailable"}
          </p>
          <details>
            <summary>Recorded stage history</summary>
            {deal.stages.length ? (
              <ol>
                {deal.stages.map((stage, i) => (
                  <li key={i}>
                    {stage.stage} · <Stamp value={stage.entered_at} /> ·{" "}
                    {stage.days} days
                    {stage.exited_at
                      ? " before next recorded transition"
                      : " to as-at"}
                  </li>
                ))}
              </ol>
            ) : (
              <p>No recorded transitions available.</p>
            )}
          </details>
        </article>
      ))}
      {!result.denominator && (
        <p>
          No deals match these filters. Percentages are unavailable for an empty
          population.
        </p>
      )}
    </details>
  );
}
