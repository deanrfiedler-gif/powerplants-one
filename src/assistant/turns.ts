import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import { loadWorkingCompany, withWorkingCompany } from "../platform/working-company";
import { adapterFor } from "./adapters";
import { checkAnswer, declineBody, renderAnswer } from "./answer";
import { assistantEnabled } from "./config";
import { buildEnvelope } from "./evidence";
import { prepareRequest } from "./request";
import { dispatchCall, endTurn, findTurn, postAnswer, recordCall, retryAccess, startTurn } from "./commands";
import { priceFor } from "./pricing";
import { checkEvaluationEvidence, evaluationContext, loadEvaluation, parseEvaluation, type Evaluation } from "./evaluation";
import { safeMeasurement } from "./measurements";
import { AdapterError, requestTokens, turnLimits, type AdapterRequest, type AdapterResult, type AssistantAdapter, type EvidenceEnvelope, type TurnReason, type TurnState, type Usage } from "./model";

type Deps = { adapter?: AssistantAdapter; env?: Record<string, string | undefined>; now?: () => number; evaluation?: Evaluation };
type Outcome = { state: TurnState; reason: TurnReason | null };
const terminal = (state: TurnState) => state !== "Queued" && state !== "Answering";
const status = (t: Outcome): Outcome => ({ state: t.state, reason: t.reason });
const failure = (reason: TurnReason) => new AppError(409, reason, "The assistant cannot complete this turn.");
function validUsage(value: unknown, allowance: Usage): value is Usage {
  if (!value || typeof value !== "object") return false;
  const u = value as Usage;
  return Number.isSafeInteger(u.input_tokens) && u.input_tokens >= 0 && u.input_tokens <= allowance.input_tokens
    && Number.isSafeInteger(u.output_tokens) && u.output_tokens >= 0 && u.output_tokens <= allowance.output_tokens;
}
async function invoke(adapter: AssistantAdapter, request: AdapterRequest, remaining: number) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => adapter.answer(request, controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new AdapterError("Timeout", null, true));
        }, remaining);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
const errorOutcome = (code: AdapterError["code"]): { state: "Failed" | "Unavailable"; reason: TurnReason } => {
  if (code === "Unavailable") return { state: "Unavailable", reason: "ProviderUnavailable" };
  if (code === "CreditExhausted") return { state: "Unavailable", reason: "CreditExhausted" };
  return { state: "Failed", reason: code };
};

export async function runAssistantTurn(id: string, deps: Deps = {}): Promise<Outcome> {
  let evaluation: Evaluation | undefined;
  try {
    evaluation = deps.evaluation ? parseEvaluation(deps.evaluation.manifest, deps.evaluation.hash, deps.evaluation.stage, deps.evaluation.acceptance)
      : loadEvaluation(deps.env ?? Reflect.get(process, "env"));
  } catch {
    const t = await findTurn(database(), id);
    if (terminal(t.state)) return status(t);
    if (t.state === "Answering") return evaluationContext.run(undefined, () => executeAssistantTurn(id, deps)); // Lease recovery never needs a key.
    const p = { workspace_id: t.workspace_id, actor_id: t.acted_for_id, display_name: "Assistant's tagger" };
    await endTurn(p, t, { state: "Unavailable", reason: "ProviderUnavailable", open: "Released" });
    return status(await findTurn(database(), id));
  }
  return evaluationContext.run(evaluation, () => executeAssistantTurn(id, deps));
}

async function executeAssistantTurn(id: string, deps: Deps): Promise<Outcome> {
  const c = database(), now = deps.now ?? Date.now, deadline = now() + turnLimits.ms;
  let turn = await findTurn(c, id);
  if (terminal(turn.state)) return status(turn);
  const p = { workspace_id: turn.workspace_id, actor_id: turn.acted_for_id, display_name: "Assistant's tagger" };
  const adapter = deps.adapter ?? adapterFor(deps.env), price = priceFor(adapter.label, adapter.model);
  let possiblySent = false;
  const refresh = async () => { turn = await findTurn(c, id); return turn; };
  const finish = async (state: "Unavailable" | "Failed" | "Discarded", reason: TurnReason, open: "Released" | "Unknown" = "Released") => {
    try { await endTurn(p, turn, { state, reason, open }); }
    catch (e) { if (!(e instanceof AppError && e.code === "AssistantLeaseLost")) throw e; }
    return status(await refresh());
  };
  const checkTime = () => { if (now() >= deadline) throw failure("Timeout"); };
  try {
    if (turn.state === "Answering") {
      const expired = (await c.query("SELECT $1::timestamptz<=clock_timestamp() AS expired", [turn.lease_until])).rows[0].expired;
      return expired ? finish("Failed", "Interrupted", "Unknown") : status(turn);
    }
    // Runtime Claude dispatch requires a separately supplied run manifest. Injected adapters
    // remain the existing code-only test seam; no environment mock switch is introduced.
    if (adapter.label === "Claude" && !deps.adapter && !evaluationContext.getStore() && assistantEnabled(deps.env))
      return finish("Unavailable", "ProviderUnavailable");
    const started = await startTurn(p, turn, {
      enabled: assistantEnabled(deps.env), adapter: adapter.label, model: adapter.model, price,
    });
    await refresh();
    if (started.replayed || terminal(turn.state)) return status(turn);
    if (!price) return finish("Unavailable", "PriceMissing");
    const failures = new Map<AdapterError["code"], number>();
    let envelope: EvidenceEnvelope | undefined;
    for (;;) {
      checkTime();
      try {
        if (!envelope) {
          envelope = await withWorkingCompany(p.actor_id, await loadWorkingCompany(c, p), () => buildEnvelope(p, turn));
          checkEvaluationEvidence(turn.trigger_message_id, envelope);
        }
        checkTime();
        if (!envelope.items.length) {
          const entry = (await c.query(
            "SELECT id FROM ppo.assistant_budget_entries WHERE workspace_id=$1 AND turn_id=$2 AND state='Reserved'",
            [p.workspace_id, id],
          )).rows[0]?.id;
          if (entry) { await recordCall(p, turn, entry, price, null, false); await refresh(); }
          await postAnswer(p, turn, { envelope, body: declineBody(), claims: [], sources: [], outcome: "CannotAnswer", reason: "NoEvidence" });
          return status(await refresh());
        }
        const allowance = { input_tokens: turnLimits.input_tokens - turn.input_tokens, output_tokens: turnLimits.output_tokens - turn.output_tokens };
        const prepared = prepareRequest(envelope, allowance, adapter.inputTokens);
        envelope = prepared.envelope;
        const request = prepared.request;
        if (turn.model_calls >= turnLimits.calls || allowance.output_tokens <= 0 || (adapter.inputTokens?.(request) ?? requestTokens(request)) > allowance.input_tokens)
          return finish("Failed", "TurnLimit");
        const entry = await dispatchCall(p, turn, envelope, price);
        await refresh();
        checkTime();
        let result: AdapterResult | undefined, error: AdapterError | undefined;
        possiblySent = true;
        try { result = await invoke(adapter, request, Math.max(1, deadline - now())); }
        catch (e) {
          if (!(e instanceof AdapterError)) {
            await recordCall(p, turn, entry, price, null, true);
            possiblySent = false;
            await refresh();
            return finish("Failed", "InternalError");
          }
          error = e;
        }
        const usage = error ? error.usage : result?.usage;
        if (usage !== null && usage !== undefined && !validUsage(usage, allowance)) {
          await recordCall(p, turn, entry, price, null, true);
          possiblySent = false;
          await refresh();
          return finish("Failed", "TurnLimit");
        }
        if (!error && !validUsage(usage, allowance)) error = new AdapterError("MalformedOutput", null, true);
        const measurement = safeMeasurement(error?.measurement ?? result?.measurement);
        await recordCall(p, turn, entry, price, validUsage(usage, allowance) ? usage : null, error?.sent ?? true, measurement);
        possiblySent = false;
        await refresh();
        checkTime();
        if (evaluationContext.getStore() && usage && (!measurement || measurement.unsupported_usage
          || measurement.inference_geo !== "global" || measurement.speed !== "standard" || measurement.service_tier !== "standard"
          || usage.input_tokens > measurement.estimated_input_tokens))
          return finish("Failed", "MalformedOutput");
        if (!error && result?.kind !== "Answer" && result?.kind !== "Decline")
          error = new AdapterError("MalformedOutput", validUsage(usage, allowance) ? usage : null, true);
        if (error) {
          const retriable = evaluationContext.getStore()?.stage !== "Calibration"
            && ["Unavailable", "RateLimited", "MalformedOutput"].includes(error.code);
          const count = (failures.get(error.code) ?? 0) + 1;
          failures.set(error.code, count);
          // Unknown usage cannot safely fund another attempt. Its maximum remains committed.
          if (!retriable || count > 2 || (error.sent && !error.usage)) {
            const out = errorOutcome(error.code);
            return finish(out.state, out.reason);
          }
          continue;
        }
        if (result!.kind === "Decline") {
          await postAnswer(p, turn, { envelope, body: declineBody(), claims: [], sources: [], outcome: "CannotAnswer", reason: "Declined" });
        } else {
          const checked = checkAnswer(result as Extract<AdapterResult, { kind: "Answer" }>, envelope);
          if (!checked.ok) return finish("Failed", checked.reason);
          await postAnswer(p, turn, { envelope, ...renderAnswer(checked, envelope), outcome: "Answered", reason: null });
        }
        return status(await refresh());
      } catch (e) {
        if (e instanceof AppError && e.code === "AccessChanged") {
          if (turn.attempt >= 1) return finish("Discarded", "AccessChanged");
          await retryAccess(p, turn);
          await refresh();
          envelope = undefined;
          continue;
        }
        throw e;
      }
    }
  } catch (e) {
    if (e instanceof AppError) {
      if (e.code === "AssistantLeaseLost") {
        await refresh();
        if (terminal(turn.state)) return status(turn);
        return finish("Failed", "Interrupted", "Unknown");
      }
      if (["ActorLostAccess", "RecordUnavailable", "Forbidden"].includes(e.code)) return finish("Discarded", "ActorLostAccess", possiblySent ? "Unknown" : "Released");
      if (e.code === "ThreadResolved") return finish("Discarded", "ThreadResolved");
      if (e.code === "BudgetSpent") return finish("Unavailable", "BudgetSpent");
      if (e.code === "ProviderUnavailable") return finish("Unavailable", "ProviderUnavailable");
      if (e.code === "TurnLimit" || e.code === "Timeout") return finish("Failed", e.code, possiblySent ? "Unknown" : "Released");
    }
    // No raw adapter or database error is copied into a turn, audit event, receipt or worker log.
    return finish("Failed", "InternalError", possiblySent ? "Unknown" : "Released");
  }
}

export async function runAssistantTurns(limit: number, deps: Deps = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(422, "InvalidData", "Choose a turn batch from 1 to 100.");
  const run = deps.evaluation ?? loadEvaluation(deps.env ?? Reflect.get(process, "env"));
  // Do not terminally refuse other models/stages merely because this worker selects one.
  const eligible = run ? new Set(run.manifest.turns.filter(t => t.stage === run.stage
    && t.model === (deps.adapter?.model ?? deps.env?.PPO_ASSISTANT_MODEL ?? Reflect.get(process, "env").PPO_ASSISTANT_MODEL)).map(t => t.message_id)) : null;
  const pending = (await database().query(
    `SELECT id FROM ppo.assistant_turns WHERE
      (state='Queued' AND ($2::uuid[] IS NULL OR trigger_message_id=ANY($2::uuid[])))
      OR (state='Answering' AND lease_until<clock_timestamp()
        AND ($3::uuid[] IS NULL OR trigger_message_id=ANY($3::uuid[])))
     ORDER BY created_at,id LIMIT $1`, [run ? 1 : limit, eligible ? [...eligible] : null, run?.manifest.turns.map(t => t.message_id) ?? null],
  )).rows;
  let examined = 0;
  for (const t of pending) {
    if (eligible) {
      const turn = await findTurn(database(), t.id);
      if (turn.state === "Queued" && !eligible.has(turn.trigger_message_id)) continue;
    }
    await runAssistantTurn(t.id, { ...deps, ...(run ? { evaluation: run } : {}) }); examined++;
  }
  return examined;
}
