import { AdapterError, requestTokens, type AssistantAdapter, type CheckedClaim, type EvidenceValue } from "../model";

// Templates inspect allowed facts only. Question and history text never become instructions.
export const simulatedAdapter: AssistantAdapter = {
  label: "Simulated", model: "simulated-1",
  async answer(request, signal) {
    if (signal.aborted) throw new AdapterError("Timeout");
    const input = requestTokens(request);
    if (input > request.allowance.input_tokens) throw new AdapterError("MalformedOutput");
    const root = request.envelope.items[0];
    if (!root) return { kind: "Decline", usage: { input_tokens: input, output_tokens: 0 } };
    const claims: CheckedClaim[] = [];
    const add = (text: string, id = root.source_id) => claims.push({ text, source_ids: [id] });
    const text = (value: EvidenceValue | undefined) => typeof value === "string" || typeof value === "number" ? String(value) : "not recorded";
    if (request.envelope.anchor_type === "Opportunity") {
      add(`The deal's stage is ${text(root.fields.stage_id)}; its outcome is ${text(root.fields.close_outcome)}.`);
      const activities = request.envelope.items.filter(s => "activity_type" in s.fields);
      const next = activities.find(s => s.fields.is_next_action === true);
      if (next) add(`The next action is ${text(next.fields.summary)}; its status is ${text(next.fields.status)}.`, next.source_id);
      for (const activity of activities.filter(s => s !== next).slice(0, 3))
        add(`A recent Internal Activity records ${text(activity.fields.summary)}; its status is ${text(activity.fields.status)}.`, activity.source_id);
    } else {
      add(`The project is ${text(root.fields.lifecycle)}; ${text(root.fields.completed_tasks)} of ${text(root.fields.task_count)} tasks are complete.`);
      add(`The schedule's forecast finish is ${text(root.fields.forecast_finish)}.`);
      const milestone = root.fields.next_milestone;
      if (milestone && typeof milestone === "object" && !Array.isArray(milestone))
        add(`The next milestone is ${text(milestone.title)}, due ${text(milestone.finish_date)}.`);
      add(`There are ${text(root.fields.open_raid)} open RAID entries.`);
    }
    const gaps = ["This simulated answer summarises the available facts; it does not interpret your question."];
    const output = Math.ceil(JSON.stringify({ claims, gaps }).length / 4);
    if (input > request.allowance.input_tokens || output > request.allowance.output_tokens)
      throw new AdapterError("MalformedOutput");
    return { kind: "Answer", claims, gaps, usage: { input_tokens: input, output_tokens: output } };
  },
};
