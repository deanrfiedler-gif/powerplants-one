import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { canonical, sharedOperation, type OperationResult } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { loadWorkingCompany, withWorkingCompany } from "../platform/working-company";
import { readableAnchor, visibleThread } from "../conversations/access";
import { conversationOutboxKind } from "../conversations/model";
import { keepUnknown, releaseCall, reserveCall, settleCall } from "./budget";
import { envelopeHash, turnReaders } from "./evidence";
import { readableSources, sourceKey } from "./source-access";
import { turnLimits, type AdapterLabel, type EvidenceEnvelope, type StoredClaim, type StoredSource, type TurnReason, type TurnState, type Usage } from "./model";
import type { Price } from "./pricing";

export type Turn = {
  id: string; workspace_id: string; thread_id: string; trigger_message_id: string; acted_for_id: string;
  state: TurnState; reason: TurnReason | null; adapter: AdapterLabel | null; model: string | null;
  attempt: number; model_calls: number; input_tokens: number; output_tokens: number;
  evidence_count: number; left_out_count: number; version: number; lease_until: Date | null; started_at: Date | null;
};
const columns = `id,workspace_id,thread_id,trigger_message_id,acted_for_id,state,reason,adapter,model,attempt,
  model_calls,input_tokens,output_tokens,evidence_count,left_out_count,version,lease_until,started_at`;
const lost = () => new AppError(409, "AssistantLeaseLost", "This runner no longer owns the turn.");
const stopped = (reason: TurnReason) => new AppError(409, reason, "The assistant cannot continue this turn.");
const digest = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
export function stepOperationId(turn: string, step: string, attempt: number) {
  const h = digest({ turn, step, attempt });
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export async function findTurn(c: QueryClient, id: string): Promise<Turn> {
  const t = (await c.query<Turn>(`SELECT ${columns} FROM ppo.assistant_turns WHERE id=$1`, [id])).rows[0];
  if (!t) throw unavailable();
  return t;
}
async function locked(c: PoolClient, p: Principal, id: string) {
  // sharedOperation already holds the workspace, matching the customer-message worker's lock order.
  const t = (await c.query<Turn>(
    `SELECT ${columns} FROM ppo.assistant_turns WHERE workspace_id=$1 AND id=$2 FOR UPDATE SKIP LOCKED`, [p.workspace_id, id],
  )).rows[0];
  if (!t || t.acted_for_id !== p.actor_id) throw lost();
  return t;
}
async function owned(c: PoolClient, p: Principal, turn: Turn, live = true) {
  const t = await locked(c, p, turn.id);
  if (t.state !== "Answering" || t.lease_until?.getTime() !== turn.lease_until?.getTime()) throw lost();
  if (live && !(await c.query("SELECT $1::timestamptz>clock_timestamp() AS live", [t.lease_until])).rows[0].live) throw lost();
  return t;
}
async function withinDeadline(c: PoolClient, t: Turn) {
  if (!(await c.query(
    "SELECT clock_timestamp()<$1::timestamptz+($2::int * interval '1 millisecond') AS live",
    [t.started_at, turnLimits.ms],
  )).rows[0].live) throw stopped("Timeout");
}
export async function actorAccess(c: QueryClient, p: Principal, t: Turn): Promise<TurnReason | null> {
  return withWorkingCompany(p.actor_id, await loadWorkingCompany(c, p), async () => {
    try {
      const thread = await visibleThread(c, p, t.thread_id);
      await visibleThread(c, p, t.thread_id, "conversation.post");
      const scope = await readableAnchor(c, p, thread.anchor_type, thread.anchor_id, "conversation.post");
      if (!(await hasPermission(c, p, "conversation.agent.ask", scope.company_id, scope.site_id ?? undefined))) return "ActorLostAccess";
      return thread.state === "Open" ? null : "ThreadResolved";
    } catch (e) {
      if (e instanceof AppError && (e.code === "Forbidden" || e.code === "RecordUnavailable")) return "ActorLostAccess";
      throw e;
    }
  });
}
async function evidenceAccess(c: PoolClient, p: Principal, t: Turn, envelope: EvidenceEnvelope) {
  return withWorkingCompany(p.actor_id, await loadWorkingCompany(c, p), async () => {
    const reason = await actorAccess(c, p, t);
    if (reason) throw stopped(reason);
    const readers = await turnReaders(c, p.workspace_id, t.thread_id, p.actor_id);
    if (canonical(readers) !== canonical(envelope.readers)) throw stopped("AccessChanged");
    for (const reader of readers) {
      const open = await readableSources(c, p.workspace_id, reader, envelope.items);
      if (envelope.items.some(s => !open.has(sourceKey(s)))) throw stopped("AccessChanged");
    }
  });
}
const input = (t: Pick<Turn, "id" | "attempt">, step: string) => ({
  operation_id: stepOperationId(t.id, step, t.attempt), reason: "Assistant turn step", turn_id: t.id, attempt: t.attempt,
});
function result(t: Turn, updated: Date, extra: Record<string, unknown> = {}): OperationResult {
  return {
    id: t.id, version: t.version, state: t.state, updated_at: updated,
    audit_details: {
      turn_id: t.id, thread_id: t.thread_id, attempt: t.attempt, model_calls: t.model_calls,
      input_tokens: t.input_tokens, output_tokens: t.output_tokens,
      evidence_count: t.evidence_count, left_out_count: t.left_out_count, ...extra,
    },
  };
}
async function finish(c: PoolClient, t: Turn, state: "Unavailable" | "Failed" | "Discarded", reason: TurnReason) {
  const row = (await c.query<Turn & { finished_at: Date }>(
    `UPDATE ppo.assistant_turns SET state=$2,reason=$3,finished_at=clock_timestamp(),lease_until=NULL,version=version+1
     WHERE id=$1 RETURNING ${columns},finished_at`, [t.id, state, reason],
  )).rows[0];
  return result(row, row.finished_at);
}

export async function startTurn(
  p: Principal, turn: Turn, options: { enabled: boolean; adapter: AdapterLabel; model: string; price: Price | null },
) {
  const command = { ...input(turn, "Start"), adapter: options.adapter, model: options.model };
  return sharedOperation(p, command, "Assistant:StartTurn",
    c => locked(c, p, turn.id), async (c, t) => {
      if (t.state !== "Queued") throw lost();
      const access = await actorAccess(c, p, t);
      if (access) return finish(c, t, "Discarded", access);
      if (!options.enabled) return finish(c, t, "Unavailable", "FeatureOff");
      if (!options.price) return finish(c, t, "Unavailable", "PriceMissing");
      const started = (await c.query<Turn>(
        `UPDATE ppo.assistant_turns SET state='Answering',adapter=$2,model=$3,started_at=clock_timestamp(),
         lease_until=clock_timestamp()+interval '2 minutes',version=version+1 WHERE id=$1 RETURNING ${columns}`,
        [t.id, options.adapter, options.model],
      )).rows[0];
      try {
        const entry = await reserveCall(c, p.workspace_id, t.id, 1, options.price, turnLimits);
        return result(started, started.started_at!, { budget_entry_id: entry });
      } catch (e) {
        if (e instanceof AppError && e.code === "BudgetSpent") return finish(c, started, "Unavailable", "BudgetSpent");
        throw e;
      }
    }, "AssistantTurn", conversationOutboxKind);
}

export async function dispatchCall(p: Principal, turn: Turn, envelope: EvidenceEnvelope, price: Price) {
  const call = turn.model_calls + 1;
  let entry = "";
  const command = {
    ...input(turn, `Dispatch:${call}`), call_index: call, envelope_hash: envelopeHash(envelope),
  };
  const receipt = await sharedOperation(p, command, "Assistant:DispatchCall", async c => {
    const t = await owned(c, p, turn);
    await evidenceAccess(c, p, t, envelope);
    return t;
  }, async (c, t) => {
    await withinDeadline(c, t);
    if (t.model_calls !== call - 1 || call > turnLimits.calls) throw stopped("TurnLimit");
    const allowance = { input_tokens: turnLimits.input_tokens - t.input_tokens, output_tokens: turnLimits.output_tokens - t.output_tokens };
    if (allowance.input_tokens <= 0 || allowance.output_tokens <= 0) throw stopped("TurnLimit");
    entry = await reserveCall(c, p.workspace_id, t.id, call, price, allowance);
    const row = (await c.query<Turn & { at: Date }>(
      `UPDATE ppo.assistant_turns SET model_calls=$2,evidence_count=$3,left_out_count=$4,version=version+1
       WHERE id=$1 RETURNING ${columns},clock_timestamp() AS at`, [t.id, call, envelope.items.length, envelope.left_out],
    )).rows[0];
    return result(row, row.at, { budget_entry_id: entry });
  }, "AssistantTurn", conversationOutboxKind);
  // Replaying a dispatch receipt is evidence of an earlier dispatch, never permission to send twice.
  if (receipt.replayed) throw lost();
  return entry;
}

export async function recordCall(p: Principal, turn: Turn, entry: string, price: Price, usage: Usage | null, sent: boolean) {
  const command = { ...input(turn, `Usage:${turn.model_calls}`), entry, usage, sent };
  return sharedOperation(p, command, "Assistant:RecordCall",
    c => owned(c, p, turn), async (c, t) => {
      // Billing belongs to this acted-for turn even if its person has just lost record access.
      if (usage) await settleCall(c, p.workspace_id, entry, price, usage);
      else if (sent) await keepUnknown(c, p.workspace_id, entry);
      else await releaseCall(c, p.workspace_id, entry);
      const row = (await c.query<Turn & { at: Date }>(
        `UPDATE ppo.assistant_turns SET input_tokens=input_tokens+$2,output_tokens=output_tokens+$3,version=version+1
         WHERE id=$1 RETURNING ${columns},clock_timestamp() AS at`,
        [t.id, usage?.input_tokens ?? 0, usage?.output_tokens ?? 0],
      )).rows[0];
      return result(row, row.at, { budget_entry_id: entry });
    }, "AssistantTurn", conversationOutboxKind);
}

export async function retryAccess(p: Principal, turn: Turn) {
  return sharedOperation(p, input(turn, "RetryAccess"), "Assistant:RetryAccess", c => owned(c, p, turn),
    async (c, t) => {
      if (t.attempt !== 0) throw stopped("AccessChanged");
      const row = (await c.query<Turn & { at: Date }>(
        `UPDATE ppo.assistant_turns SET attempt=1,version=version+1 WHERE id=$1 RETURNING ${columns},clock_timestamp() AS at`, [t.id],
      )).rows[0];
      return result(row, row.at);
    }, "AssistantTurn", conversationOutboxKind);
}

export async function postAnswer(p: Principal, turn: Turn, payload: {
  envelope: EvidenceEnvelope; body: string; claims: StoredClaim[]; sources: StoredSource[];
  outcome: "Answered" | "CannotAnswer"; reason: "Declined" | "NoEvidence" | null;
}) {
  const command = {
    ...input(turn, "Post"), answer_hash: digest({ body: payload.body, claims: payload.claims, sources: payload.sources }),
  };
  return sharedOperation(p, command, "Assistant:PostAnswer", async c => {
    const t = await owned(c, p, turn);
    await evidenceAccess(c, p, t, payload.envelope);
    return t;
  }, async (c, t) => {
    await withinDeadline(c, t);
    const id = randomUUID(), operation = stepOperationId(t.id, "Post", t.attempt);
    const sequence = Number((await c.query(
      "SELECT coalesce(max(sequence),0)+1 AS n FROM ppo.conversation_messages WHERE workspace_id=$1 AND thread_id=$2", [p.workspace_id, t.thread_id],
    )).rows[0].n);
    const created = (await c.query(
      `INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_kind,acted_for_id,turn_id,body,
       operation_id,agent_outcome,adapter,left_out_count) VALUES($1,$2,$3,$4,'Agent',$5,$6,$7,$8,$9,$10,$11) RETURNING created_at`,
      [id, p.workspace_id, t.thread_id, sequence, p.actor_id, t.id, payload.body, operation, payload.outcome, t.adapter, payload.envelope.left_out],
    )).rows[0].created_at as Date;
    for (const s of payload.sources) await c.query(
      "INSERT INTO ppo.conversation_message_sources(workspace_id,message_id,number,record_type,record_id,source_version,retrieved_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [p.workspace_id, id, s.number, s.type, s.record_id, s.source_version, s.retrieved_at],
    );
    for (const claim of payload.claims) await c.query(
      "INSERT INTO ppo.conversation_message_claims(workspace_id,message_id,ordinal,kind,text,source_numbers) VALUES($1,$2,$3,$4,$5,$6)",
      [p.workspace_id, id, claim.ordinal, claim.kind, claim.text, claim.source_numbers],
    );
    await c.query(
      `UPDATE ppo.assistant_turns SET state=$2,reason=$3,answer_message_id=$4,evidence_count=$5,left_out_count=$6,
       finished_at=clock_timestamp(),lease_until=NULL,version=version+1 WHERE id=$1`,
      [t.id, payload.outcome, payload.reason, id, payload.envelope.items.length, payload.envelope.left_out],
    );
    await withinDeadline(c, t);
    // A Carl answer does not use the human reply path and never closes a person's ask (W4).
    return {
      id, version: sequence, state: "Posted", updated_at: created,
      audit_details: {
        turn_id: t.id, thread_id: t.thread_id, sequence, acted_for_id: p.actor_id,
        adapter: t.adapter, model: t.model, claim_count: payload.claims.length, source_count: payload.sources.length,
        left_out_count: payload.envelope.left_out, model_calls: t.model_calls, input_tokens: t.input_tokens, output_tokens: t.output_tokens,
      },
    };
  }, "ConversationMessage", conversationOutboxKind);
}

export async function endTurn(p: Principal, turn: Turn, outcome: {
  state: "Unavailable" | "Failed" | "Discarded"; reason: TurnReason; open: "Released" | "Unknown";
}) {
  const command = { ...input(turn, "End"), outcome };
  return sharedOperation(p, command, "Assistant:EndTurn",
    async c => {
      if (turn.state !== "Queued") return owned(c, p, turn, false);
      const t = await locked(c, p, turn.id);
      if (t.state !== "Queued") throw lost();
      return t;
    }, async (c, t) => {
      const entries = (await c.query(
        "SELECT id FROM ppo.assistant_budget_entries WHERE workspace_id=$1 AND turn_id=$2 AND state='Reserved' ORDER BY call_index",
        [p.workspace_id, t.id],
      )).rows;
      for (const e of entries) {
        if (outcome.open === "Unknown") await keepUnknown(c, p.workspace_id, e.id);
        else await releaseCall(c, p.workspace_id, e.id);
      }
      return finish(c, t, outcome.state, outcome.reason);
    }, "AssistantTurn", conversationOutboxKind);
}
