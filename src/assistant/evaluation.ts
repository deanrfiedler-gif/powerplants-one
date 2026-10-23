import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import type { PoolClient } from "pg";
import { AppError } from "../platform/errors";
import { canonical } from "../platform/operations";
import { assistantEnabled, type AssistantEnvironment } from "./config";
import { isClaudeModel, type ClaudeModel } from "./claude-models";
import type { EvidenceEnvelope } from "./model";

export type EvaluationStage = "Calibration" | "Evaluation";
export type EvaluationManifest = {
  schema_version: 1; run_id: string; workspace_id: string; source_commit: string; fixture_hash: string; approval_reference: string;
  cap_micro: number; calibration_cap_micro: number;
  turns: { message_id: string; evidence_hash: string; model: ClaudeModel; stage: EvaluationStage; case_id: string; repetition: number }[];
};
export type Evaluation = { manifest: EvaluationManifest; hash: string; stage: EvaluationStage; acceptance?: string };
export const evaluationContext = new AsyncLocalStorage<Evaluation | undefined>();
const refused = () => new AppError(409, "ProviderUnavailable", "The evaluation is unavailable or stopped.");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const hashPattern = /^[0-9a-f]{64}$/;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).sort().join() === keys.sort().join();
export const evaluationHash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
export const evaluationEvidenceHash = (e: EvidenceEnvelope) => evaluationHash({ ...e,
  items: e.items.map(s => ({ source_id: s.source_id, type: s.type, record_id: s.record_id,
    source_version: s.source_version, fields: s.fields, untrusted_fields: s.untrusted_fields })),
}); // Retrieval instants/routes do not change approved content; identities/versions/readers do.

export function checkEvaluationEvidence(message: string, envelope: EvidenceEnvelope) {
  const run = evaluationContext.getStore();
  if (run && run.manifest.turns.find(t => t.message_id === message)?.evidence_hash !== evaluationEvidenceHash(envelope)) throw refused();
}

// A hash binds configuration bytes; it is not proof that Dean approved a run.
export function parseEvaluation(value: unknown, hash: string, stage: string, acceptance?: string): Evaluation {
  if (!object(value) || !exact(value, ["schema_version", "run_id", "workspace_id", "source_commit", "fixture_hash", "approval_reference", "cap_micro", "calibration_cap_micro", "turns"])
    || value.schema_version !== 1 || !uuid.test(String(value.run_id)) || !uuid.test(String(value.workspace_id))
    || !/^[0-9a-f]{40}$/.test(String(value.source_commit)) || !hashPattern.test(String(value.fixture_hash))
    || !hashPattern.test(String(value.approval_reference)) || !hashPattern.test(hash) || evaluationHash(value) !== hash
    || !Number.isSafeInteger(value.cap_micro) || Number(value.cap_micro) < 1 || Number(value.cap_micro) > 5_000_000
    || !Number.isSafeInteger(value.calibration_cap_micro) || Number(value.calibration_cap_micro) < 1
    || Number(value.calibration_cap_micro) > Math.min(Number(value.cap_micro), 1_650_000)
    || !["Calibration", "Evaluation"].includes(stage) || (stage === "Evaluation" && !hashPattern.test(acceptance ?? ""))
    || !Array.isArray(value.turns) || !value.turns.length || value.turns.length > 117) throw refused();
  const ids = new Set<string>(), cases = new Set<string>();
  for (const t of value.turns) {
    if (!object(t) || !exact(t, ["message_id", "evidence_hash", "model", "stage", "case_id", "repetition"])
      || !uuid.test(String(t.message_id)) || ids.has(String(t.message_id)) || !hashPattern.test(String(t.evidence_hash)) || !isClaudeModel(t.model)
      || !["Calibration", "Evaluation"].includes(String(t.stage)) || !Number.isInteger(t.repetition)
      || Number(t.repetition) < 1 || Number(t.repetition) > 3
      || !(t.stage === "Calibration" ? /^C0[1-3]$/ : /^L(0[1-9]|1[0-2])$/).test(String(t.case_id))
      || (t.stage === "Calibration" && t.repetition !== 1)) throw refused();
    const key = `${t.model}:${t.stage}:${t.case_id}:${t.repetition}`;
    if (cases.has(key)) throw refused();
    ids.add(String(t.message_id)); cases.add(key);
  }
  // Snapshot to prevent caller mutation after validation or between reservations.
  const manifest = JSON.parse(JSON.stringify(value)) as EvaluationManifest;
  for (const t of manifest.turns) Object.freeze(t);
  Object.freeze(manifest.turns); Object.freeze(manifest);
  return Object.freeze({ manifest, hash, stage: stage as EvaluationStage, ...(acceptance ? { acceptance } : {}) });
}

export function loadEvaluation(env: AssistantEnvironment): Evaluation | undefined {
  const path = env.PPO_ASSISTANT_EVALUATION_MANIFEST, hash = env.PPO_ASSISTANT_EVALUATION_HASH;
  const stage = env.PPO_ASSISTANT_EVALUATION_STAGE, acceptance = env.PPO_ASSISTANT_CALIBRATION_ACCEPTANCE;
  if (![path, hash, stage, acceptance].some(Boolean)) return undefined;
  if (!assistantEnabled(env) || !path || !hash || !stage) throw refused();
  try {
    // An explicitly selected bounded JSON configuration, never an environment/secret file.
    if (!path.endsWith(".json") || !statSync(path).isFile() || statSync(path).size > 64_000) throw refused();
    const run = parseEvaluation(JSON.parse(readFileSync(path, "utf8")), hash, stage, acceptance);
    const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    const changed = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    if (head !== run.manifest.source_commit || changed) throw refused();
    return run;
  } catch { throw refused(); } // No path, file bytes or Git diagnostic enters worker logs.
}

export async function assertEvaluationRunning(c: PoolClient, workspace: string) {
  const run = evaluationContext.getStore();
  if (run && (await c.query(`SELECT 1 FROM ppo.audit_events WHERE workspace_id=$1
    AND details->>'evaluation_run_id'=$2 AND details->>'evaluation_stopped'='true' LIMIT 1`, [workspace, run.manifest.run_id])).rowCount) throw refused();
}

export function evaluationDetails() {
  const run = evaluationContext.getStore();
  return run ? { evaluation_run_id: run.manifest.run_id, evaluation_manifest_hash: run.hash,
    ...(run.stage === "Evaluation" ? { calibration_acceptance_hash: run.acceptance } : {}) } : {};
}

// Called under the EXISTING workspace budget lock, within a read-committed transaction.
// Membership is by immutable human message ID, fixed before any worker starts. Sum ALL months.
export async function checkEvaluationReservation(c: PoolClient, workspace: string, turn: string, model: string, call: number, amount: number, prior: boolean) {
  const run = evaluationContext.getStore();
  if (!run) {
    // A restart without run configuration must not bypass an already bound turn.
    if ((await c.query("SELECT 1 FROM ppo.audit_events WHERE workspace_id=$1 AND object_id=$2 AND details ? 'evaluation_run_id' LIMIT 1", [workspace, turn])).rowCount) throw refused();
    return;
  }
  const { manifest: m } = run;
  const trigger = (await c.query("SELECT trigger_message_id FROM ppo.assistant_turns WHERE workspace_id=$1 AND id=$2", [workspace, turn])).rows[0]?.trigger_message_id;
  const member = m.turns.find(t => t.message_id === trigger);
  if (m.workspace_id !== workspace || !member || member.model !== model || member.stage !== run.stage
    || (member.stage === "Calibration" && call !== 1)) throw refused();
  const ids = m.turns.map(t => t.message_id);
  // Immutable audit rows bind the run ID AND each turn to its original complete manifest.
  const bindings = (await c.query(`SELECT details FROM ppo.audit_events WHERE workspace_id=$1
    AND (details->>'evaluation_run_id'=$2 OR (object_id IN
      (SELECT id FROM ppo.assistant_turns WHERE workspace_id=$1 AND trigger_message_id=ANY($3::uuid[]))
      AND details ? 'evaluation_run_id'))`, [workspace, m.run_id, ids])).rows;
  if (bindings.some(r => r.details.evaluation_run_id !== m.run_id || r.details.evaluation_manifest_hash !== run.hash || r.details.evaluation_stopped === true
    || (r.details.calibration_acceptance_hash && r.details.calibration_acceptance_hash !== run.acceptance))) throw refused();
  const state = (await c.query(`SELECT t.id,t.trigger_message_id,t.state,t.model,e.state AS ledger_state,
      CASE WHEN e.state IN ('Reserved','Unknown') THEN e.reserved_micro WHEN e.state='Settled' THEN e.settled_micro ELSE 0 END AS committed
    FROM ppo.assistant_turns t LEFT JOIN ppo.assistant_budget_entries e ON (e.workspace_id,e.turn_id)=(t.workspace_id,t.id)
    WHERE t.workspace_id=$1 AND t.trigger_message_id=ANY($2::uuid[])`, [workspace, ids])).rows;
  const calibrationIds = new Set(m.turns.filter(t => t.stage === "Calibration").map(t => t.message_id));
  if (state.some(r => r.ledger_state === "Unknown" || ["Failed", "Unavailable", "Discarded"].includes(r.state)
    || (calibrationIds.has(r.trigger_message_id) && r.state === "CannotAnswer")
    || (r.state === "Answering" && r.id !== turn))) throw refused();
  // Existing unbound calls cannot be swept into a new manifest as a fresh allowance.
  if (state.some(r => r.ledger_state && !bindings.some(b => b.details.turn_id === r.id)) && !prior) throw refused();
  const committed = state.reduce((n, r) => n + Number(r.committed ?? 0), 0);
  const calibration = state.filter(r => calibrationIds.has(r.trigger_message_id)).reduce((n, r) => n + Number(r.committed ?? 0), 0);
  const added = prior ? 0 : amount;
  // BudgetSpent's accepted UI specifically means the monthly ceiling. A smaller run cap
  // makes this evaluation unavailable; it must not falsely report monthly exhaustion.
  if (added > m.cap_micro - committed || (member.stage === "Calibration" && added > m.calibration_cap_micro - calibration)) throw refused();
  if (member.stage === "Evaluation") {
    if (!run.acceptance || calibrationIds.size !== 9 || [...calibrationIds].some(id => !state.some(r => r.trigger_message_id === id && r.state === "Answered" && r.ledger_state === "Settled"))) throw refused();
  }
}
