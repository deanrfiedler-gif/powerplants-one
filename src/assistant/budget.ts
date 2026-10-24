import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { AppError } from "../platform/errors";
import type { QueryClient } from "../platform/permissions";
import { turnLimits, type Usage } from "./model";
import { costMicro, maxCallMicro, type Price } from "./pricing";
import { checkEvaluationReservation } from "./evaluation";

const spent = () => new AppError(409, "BudgetSpent", "The assistant budget is unavailable or spent.");
const invalid = () => new AppError(409, "InvalidReservation", "This reservation cannot make that transition.");
const conflict = () => new AppError(409, "OperationConflict", "An original reservation cannot change.");
const limit = () => new AppError(409, "TurnLimit", "The call exceeds its token or call allowance.");
type Entry = {
  id: string; adapter: string; model: string; price_version: string; max_input_tokens: number; max_output_tokens: number;
  reserved_micro: string; state: "Reserved" | "Unknown" | "Settled" | "Released";
  input_tokens: number | null; output_tokens: number | null; settled_micro: string | null;
};
const projection = "id,adapter,model,price_version,max_input_tokens,max_output_tokens,reserved_micro,state,input_tokens,output_tokens,settled_micro";
const periodNow = async (c: QueryClient) => (await c.query(
  "SELECT date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date::text AS period",
)).rows[0].period as string;

async function spendAt(c: QueryClient, workspace: string, period: string) {
  const row = (await c.query(
    `SELECT s.monthly_ceiling_micro,coalesce((SELECT sum(CASE WHEN e.state IN ('Reserved','Unknown') THEN e.reserved_micro
      WHEN e.state='Settled' THEN e.settled_micro ELSE 0 END) FROM ppo.assistant_budget_entries e
      WHERE e.workspace_id=s.workspace_id AND e.period=$2::date),0) AS committed
     FROM ppo.assistant_budget_settings s WHERE s.workspace_id=$1`,
    [workspace, period],
  )).rows[0];
  if (!row) throw spent();
  return { ceiling: Number(row.monthly_ceiling_micro), committed: Number(row.committed) };
}
export async function monthSpend(c: QueryClient, workspace: string) {
  return spendAt(c, workspace, await periodNow(c));
}
async function lock(c: PoolClient, workspace: string) {
  // A repeatable-read snapshot predating this lock could miss another turn's committed spend.
  // Writes use the shared operation path's read-committed transaction; evidence uses read-only RR.
  if ((await c.query("SHOW transaction_isolation")).rows[0].transaction_isolation !== "read committed") throw invalid();
  await c.query("SELECT pg_advisory_xact_lock(hashtextextended('assistant-budget:'||($1::uuid)::text,0))", [workspace]);
}
function tokens(value: Usage) {
  if (!Number.isSafeInteger(value.input_tokens) || value.input_tokens < 0 || value.input_tokens > turnLimits.input_tokens
    || !Number.isSafeInteger(value.output_tokens) || value.output_tokens < 0 || value.output_tokens > turnLimits.output_tokens) throw limit();
}
function matches(entry: Entry, price: Price, allowance: Usage) {
  if (entry.adapter !== price.adapter || entry.model !== price.model || entry.price_version !== price.version
    || entry.max_input_tokens !== allowance.input_tokens || entry.max_output_tokens !== allowance.output_tokens
    || Number(entry.reserved_micro) !== maxCallMicro(price, allowance)) throw conflict();
}
async function byId(c: PoolClient, workspace: string, id: string) {
  const row = (await c.query<Entry>(
    `SELECT ${projection} FROM ppo.assistant_budget_entries WHERE workspace_id=$1 AND id=$2`, [workspace, id],
  )).rows[0];
  if (!row) throw invalid();
  return row;
}

// Called inside the caller's transaction, before dispatch. The trigger takes the same lock
// and rechecks the ceiling, including writes that do not use this helper.
export async function reserveCall(c: PoolClient, workspace: string, turn: string, call: number, price: Price, allowance: Usage) {
  tokens(allowance);
  if (!Number.isInteger(call) || call < 1 || call > turnLimits.calls) throw limit();
  const amount = maxCallMicro(price, allowance);
  await lock(c, workspace);
  const prior = (await c.query<Entry>(
    `SELECT ${projection} FROM ppo.assistant_budget_entries WHERE workspace_id=$1 AND turn_id=$2 AND call_index=$3`,
    [workspace, turn, call],
  )).rows[0];
  await checkEvaluationReservation(c, workspace, turn, price.model, call, amount, !!prior);
  if (prior) {
    matches(prior, price, allowance);
    if (prior.state !== "Reserved") throw invalid();
    return prior.id;
  }
  const period = await periodNow(c), spend = await spendAt(c, workspace, period);
  // A spent ceiling stops even a zero-cost simulation, so it exercises the real unavailable path.
  if (spend.committed >= spend.ceiling || amount > spend.ceiling - spend.committed) throw spent();
  const id = randomUUID();
  try {
    await c.query(
      `INSERT INTO ppo.assistant_budget_entries(id,workspace_id,turn_id,call_index,period,adapter,model,price_version,max_input_tokens,max_output_tokens,reserved_micro)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, workspace, turn, call, period, price.adapter, price.model, price.version, allowance.input_tokens, allowance.output_tokens, amount],
    );
  } catch (error) {
    if ((error as { constraint?: string }).constraint === "assistant_monthly_ceiling") throw spent();
    throw error;
  }
  return id;
}

export async function settleCall(c: PoolClient, workspace: string, id: string, price: Price, usage: Usage) {
  tokens(usage);
  await lock(c, workspace);
  const entry = await byId(c, workspace, id);
  matches(entry, price, { input_tokens: entry.max_input_tokens, output_tokens: entry.max_output_tokens });
  if (usage.input_tokens > entry.max_input_tokens || usage.output_tokens > entry.max_output_tokens) throw limit();
  const amount = costMicro(price, usage);
  if (amount > Number(entry.reserved_micro)) throw limit();
  if (entry.state === "Settled") {
    if (entry.input_tokens !== usage.input_tokens || entry.output_tokens !== usage.output_tokens || Number(entry.settled_micro) !== amount) throw conflict();
    return;
  }
  if (entry.state === "Released") throw invalid();
  await c.query(
    `UPDATE ppo.assistant_budget_entries SET state='Settled',input_tokens=$3,output_tokens=$4,settled_micro=$5,settled_at=clock_timestamp()
     WHERE workspace_id=$1 AND id=$2`, [workspace, id, usage.input_tokens, usage.output_tokens, amount],
  );
}
export async function releaseCall(c: PoolClient, workspace: string, id: string) {
  await lock(c, workspace);
  const entry = await byId(c, workspace, id);
  if (entry.state === "Released") return;
  if (entry.state !== "Reserved") throw invalid();
  await c.query("UPDATE ppo.assistant_budget_entries SET state='Released',settled_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2", [workspace, id]);
}
export async function keepUnknown(c: PoolClient, workspace: string, id: string) {
  await lock(c, workspace);
  const entry = await byId(c, workspace, id);
  if (entry.state === "Unknown") return;
  if (entry.state !== "Reserved") throw invalid();
  await c.query("UPDATE ppo.assistant_budget_entries SET state='Unknown' WHERE workspace_id=$1 AND id=$2", [workspace, id]);
}
