import { affectedSuccessors, type Baseline } from "./baseline-model";
import { dayNumber, phases, type Task } from "./model";

// Coordination facts, not a score or a new schedule/acceptance authority.
export function overviewSchedule(
  tasks: readonly Task[],
  baseline: Baseline | null,
  today: string,
  target: string | null,
) {
  const undated = tasks.filter((t) => !t.start_date || !t.finish_date).length;
  const completeDates = tasks.length > 0 && undated === 0;
  const first = (dates: string[]) => dates.sort()[0] ?? null;
  const last = (dates: string[]) => dates.sort().at(-1) ?? null;
  const start = completeDates ? first(tasks.map((t) => t.start_date!)) : null;
  const finish = completeDates ? last(tasks.map((t) => t.finish_date!)) : null;
  const baselineFinish = baseline
    ? last(
        baseline.snapshot.flatMap((t) =>
          t.finish_date ? [t.finish_date] : [],
        ),
      )
    : null;
  const roots = tasks.filter(
    (t) =>
      t.status !== "Complete" &&
      (t.status === "AtRisk" ||
        (t.milestone && !!t.finish_date && t.finish_date < today)),
  );
  const successors = affectedSuccessors(
    roots.map((t) => t.id),
    tasks,
  );
  return {
    dates: {
      today,
      start,
      forecast_finish: finish,
      baseline_finish: baselineFinish,
      target_handover: target,
      forecast_minus_baseline_days:
        finish && baselineFinish
          ? dayNumber(finish) - dayNumber(baselineFinish)
          : null,
      target_minus_forecast_days:
        finish && target ? dayNumber(target) - dayNumber(finish) : null,
      undated_tasks: undated,
      completeness: completeDates ? "Complete" : "Incomplete",
    },
    phases: phases.map((phase) => ({
      phase,
      total: tasks.filter((t) => t.phase === phase).length,
      complete: tasks.filter(
        (t) => t.phase === phase && t.status === "Complete",
      ).length,
    })),
    attention: tasks.flatMap((task) => {
      const reasons: string[] = [];
      if (task.status !== "Complete") {
        if (task.milestone && task.finish_date && task.finish_date < today)
          reasons.push("OverdueMilestone");
        if (task.status === "AtRisk") reasons.push("AtRiskTask");
        if (successors.has(task.id)) reasons.push("SuccessorReview");
      }
      return reasons.length ? [{ task, reasons }] : [];
    }),
    milestones: tasks
      .filter((t) => t.milestone)
      .map((task) => {
        const original =
          baseline?.snapshot.find((t) => t.id === task.id) ?? null;
        return {
          task,
          baseline_finish: original?.finish_date ?? null,
          forecast_minus_baseline_days:
            original?.finish_date && task.finish_date
              ? dayNumber(task.finish_date) - dayNumber(original.finish_date)
              : null,
        };
      }),
  };
}
