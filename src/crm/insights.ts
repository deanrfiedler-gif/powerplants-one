import type { WorklistItem } from "./worklist";
import { valueSummary } from "./value-summary";

export type DealFact = {
  version: number;
  at: string;
  from_stage: string | null;
  to_stage: string;
  close_date: string | null;
  close_recorded: boolean;
};
const days = (a: string, b: string) =>
  Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);

// Compare consecutive explicit date snapshots. Events without a date snapshot
// add no date evidence; the first observed date is never counted as a change.
export function dealHistory(facts: readonly DealFact[], as_at: string) {
  let previous: string | null = null,
    known = false,
    changes = 0,
    slipped_days = 0;
  const stages: {
    stage: string;
    entered_at: string;
    exited_at: string | null;
    days: number;
  }[] = [];
  for (const fact of [...facts].sort((a, b) => a.version - b.version)) {
    if (fact.close_recorded) {
      if (known && previous !== fact.close_date) {
        changes++;
        if (previous && fact.close_date)
          slipped_days += Math.max(0, days(previous, fact.close_date));
      }
      previous = fact.close_date;
      known = true;
    }
    if (fact.from_stage !== fact.to_stage) {
      const last = stages.at(-1);
      if (last) {
        last.exited_at = fact.at;
        last.days = Math.max(0, days(last.entered_at, fact.at));
      }
      stages.push({
        stage: fact.to_stage,
        entered_at: fact.at,
        exited_at: null,
        days: Math.max(0, days(fact.at, as_at)),
      });
    }
  }
  return { changes, slipped_days, close_history_available: known, stages };
}

export function pipelineInsights(
  items: readonly WorklistItem[],
  as_at: string,
) {
  const coverage = {
    Upcoming: 0,
    Overdue: 0,
    DueNeeded: 0,
    Needed: 0,
    Unavailable: 0,
  };
  const deals = items.map((item) => {
    coverage[item.next_action_state]++;
    return {
      id: item.id,
      title: item.title,
      stage: item.stage_id,
      stage_days: Math.max(0, days(item.stage_entered_at, as_at)),
      entered_at: item.stage_entered_at,
      ...dealHistory(item.history ?? [], as_at),
    };
  });
  return {
    denominator: items.length,
    coverage,
    values: valueSummary(items),
    deals,
  };
}
