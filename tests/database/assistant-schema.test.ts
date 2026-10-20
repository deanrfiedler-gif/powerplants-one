import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, beforeEach, test } from "node:test";
import type { PoolClient } from "pg";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recordOperation } from "../../src/platform/operations";
import { begin, code, newDeal, post, principal, profiles, rows, type Who } from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

type Fixture = { p: Who; thread: string; deal: string };
async function fixture(): Promise<Fixture> {
  const p = await principal(profiles.coordinator), deal = await newDeal(p);
  return { p, deal, thread: await begin(p, deal) };
}
// Schema proofs construct the future command's graph inside one transaction. No trigger is disabled.
async function rollback(work: (c: PoolClient) => Promise<void>) {
  const c = await database().connect();
  try {
    await c.query("BEGIN");
    await work(c);
  } finally {
    await c.query("ROLLBACK");
    c.release();
  }
}
async function refused(c: PoolClient, sql: string, args: unknown[], expected = "23514") {
  await c.query("SAVEPOINT refused");
  await assert.rejects(c.query(sql, args), code(expected));
  await c.query("ROLLBACK TO SAVEPOINT refused");
}
async function queued(c: PoolClient, f: Fixture) {
  const message = randomUUID(), operation = randomUUID(), turn = randomUUID();
  const created = (await c.query(
    "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_id,body,operation_id) VALUES($1,$2,$3,2,$4,'SYN @{1} status',$5) RETURNING created_at",
    [message, f.p.workspace_id, f.thread, f.p.actor_id, operation],
  )).rows[0].created_at as Date;
  await c.query("INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind) VALUES($1,$2,1,'Agent')", [f.p.workspace_id, message]);
  await c.query("INSERT INTO ppo.assistant_turns(id,workspace_id,thread_id,trigger_message_id,acted_for_id) VALUES($1,$2,$3,$4,$5)",
    [turn, f.p.workspace_id, f.thread, message, f.p.actor_id]);
  await recordOperation(c, f.p, { operation_id: operation, reason: "SYN schema fixture" },
    { id: message, version: 2, state: "Posted", updated_at: created }, "ConversationMessage", "ConversationChanged", "a".repeat(64),
    { command: "Conversation:PostMessage", thread_id: f.thread, agent_turn_id: turn });
  return { message, turn };
}
async function answering(c: PoolClient, f: Fixture, turn: string) {
  await c.query("UPDATE ppo.assistant_turns SET state='Answering',version=version+1,started_at=clock_timestamp(),lease_until=clock_timestamp()+interval '2 minutes',adapter='Simulated',model='simulated-1' WHERE workspace_id=$1 AND id=$2", [f.p.workspace_id, turn]);
}
async function agent(c: PoolClient, f: Fixture, turn: string, receipt = true) {
  const id = randomUUID(), operation = randomUUID();
  const created = (await c.query(
    "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_kind,acted_for_id,turn_id,agent_outcome,adapter,left_out_count,body,operation_id) VALUES($1,$2,$3,3,'Agent',$4,$5,'CannotAnswer','Simulated',0,'SYN No evidence',$6) RETURNING created_at",
    [id, f.p.workspace_id, f.thread, f.p.actor_id, turn, operation],
  )).rows[0].created_at as Date;
  if (receipt) await recordOperation(c, f.p, { operation_id: operation, reason: "SYN schema answer" },
    { id, version: 3, state: "CannotAnswer", updated_at: created }, "ConversationMessage", "ConversationChanged", "b".repeat(64),
    { command: "Assistant:PostAnswer", thread_id: f.thread, turn_id: turn });
  return id;
}

test("0110 widens checks and adds empty assistant tables", async () => {
  for (const table of ["assistant_turns", "assistant_budget_entries", "conversation_message_claims", "conversation_message_sources"])
    assert.equal((await rows(`SELECT count(*)::int n FROM ppo.${table}`))[0].n, 0, table);
  for (const [table, name, value] of [
    ["permission_grants", "ck_grants_capability", "conversation.agent.ask"],
    ["business_identities", "ck_identities_type", "AssistantTurn"],
    ["audit_events", "ck_audit_object_type", "AssistantTurn"],
  ]) {
    const definition = (await rows("SELECT pg_get_constraintdef(oid) d FROM pg_constraint WHERE conrelid=$1::regclass AND conname=$2", [`ppo.${table}`, name]))[0].d as string;
    assert.ok(definition.includes(value), name);
  }
  assert.deepEqual(await rows("SELECT workspace_id,monthly_ceiling_micro::text AS ceiling FROM ppo.assistant_budget_settings ORDER BY workspace_id"),
    await rows("SELECT id AS workspace_id,'30000000' AS ceiling FROM ppo.workspaces ORDER BY id"));
});

test("an agent message needs an answering turn, an acted-for participant with both duties, and its receipt", async () => {
  const f = await fixture();
  await rollback(async (c) => {
    await refused(c, "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_kind,acted_for_id,agent_outcome,adapter,left_out_count,body,operation_id) VALUES($1,$2,$3,2,'Agent',$4,'CannotAnswer','Simulated',0,'SYN no turn',$5)",
      [randomUUID(), f.p.workspace_id, f.thread, f.p.actor_id, randomUUID()]);
    const q = await queued(c, f);
    await c.query("SAVEPOINT queued_turn");
    await assert.rejects(agent(c, f, q.turn), code("23514"));
    await c.query("ROLLBACK TO SAVEPOINT queued_turn");
    await answering(c, f, q.turn);
    await refused(c, "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_kind,author_id,acted_for_id,turn_id,agent_outcome,adapter,left_out_count,body,operation_id) VALUES($1,$2,$3,3,'Agent',$4,$4,$5,'CannotAnswer','Simulated',0,'SYN invalid author',$6)",
      [randomUUID(), f.p.workspace_id, f.thread, f.p.actor_id, q.turn, randomUUID()]);
    await refused(c, "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_kind,body,operation_id) VALUES($1,$2,$3,3,'Person','SYN missing person',$4)",
      [randomUUID(), f.p.workspace_id, f.thread, randomUUID()]);
    await c.query("SAVEPOINT missing_receipt");
    await agent(c, f, q.turn, false);
    await assert.rejects(c.query("SET CONSTRAINTS ALL IMMEDIATE"), code("23514"));
    await c.query("ROLLBACK TO SAVEPOINT missing_receipt");
    await c.query("SAVEPOINT revoked_duty");
    await c.query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='conversation.agent.ask'", [f.p.actor_id]);
    await assert.rejects(agent(c, f, q.turn), code("23514"));
    await c.query("ROLLBACK TO SAVEPOINT revoked_duty");
    const id = await agent(c, f, q.turn);
    await c.query("UPDATE ppo.assistant_turns SET state='CannotAnswer',reason='NoEvidence',answer_message_id=$2,version=version+1,lease_until=NULL,finished_at=clock_timestamp() WHERE id=$1", [q.turn, id]);
    await c.query("SET CONSTRAINTS ALL IMMEDIATE");
  });
});

test("a person message is unchanged by 0110", async () => {
  const f = await fixture(), id = await post(f.p, f.thread);
  assert.deepEqual(await rows("SELECT author_kind,author_id,acted_for_id,turn_id,adapter FROM ppo.conversation_messages WHERE id=$1", [id]),
    [{ author_kind: "Person", author_id: f.p.actor_id, acted_for_id: null, turn_id: null, adapter: null }]);
});

test("one Agent mention per message, never in an agent message", async () => {
  const f = await fixture();
  await rollback(async (c) => {
    const q = await queued(c, f);
    await refused(c, "INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind) VALUES($1,$2,2,'Agent')", [f.p.workspace_id, q.message]);
    await refused(c, "INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind,person_id) VALUES($1,$2,2,'Agent',$3)", [f.p.workspace_id, q.message, f.p.actor_id]);
    await answering(c, f, q.turn);
    const id = await agent(c, f, q.turn);
    await refused(c, "INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind) VALUES($1,$2,1,'Agent')", [f.p.workspace_id, id]);
  });
});

test("claims and sources are append-only and only on agent messages", async () => {
  const f = await fixture();
  await rollback(async (c) => {
    const q = await queued(c, f);
    await refused(c, "INSERT INTO ppo.conversation_message_claims(workspace_id,message_id,ordinal,kind,text,source_numbers) VALUES($1,$2,1,'Gap','SYN gap','{}')", [f.p.workspace_id, q.message]);
    await answering(c, f, q.turn);
    const id = await agent(c, f, q.turn);
    await c.query("INSERT INTO ppo.conversation_message_sources(workspace_id,message_id,number,record_type,record_id,source_version,retrieved_at) VALUES($1,$2,1,'Opportunity',$3,'1',clock_timestamp())", [f.p.workspace_id, id, f.deal]);
    await c.query("INSERT INTO ppo.conversation_message_claims(workspace_id,message_id,ordinal,kind,text,source_numbers) VALUES($1,$2,1,'Gap','SYN gap','{}')", [f.p.workspace_id, id]);
    for (const table of ["conversation_message_sources", "conversation_message_claims"]) {
      await refused(c, `UPDATE ppo.${table} SET message_id=message_id WHERE message_id=$1`, [id], "55000");
      await refused(c, `DELETE FROM ppo.${table} WHERE message_id=$1`, [id], "55000");
    }
    await refused(c, "UPDATE ppo.conversation_messages SET body='SYN changed' WHERE id=$1", [id], "55000");
    await refused(c, "DELETE FROM ppo.conversation_messages WHERE id=$1", [id], "55000");
  });
});

test("turn transitions are guarded and a finished turn is permanent", async () => {
  const f = await fixture();
  await rollback(async (c) => {
    const q = await queued(c, f);
    await refused(c, "UPDATE ppo.assistant_turns SET state='Answered',version=version+1 WHERE id=$1", [q.turn]);
    await refused(c, "UPDATE ppo.assistant_turns SET state='Answering',started_at=clock_timestamp(),lease_until=clock_timestamp()+interval '2 minutes' WHERE id=$1", [q.turn]);
    await answering(c, f, q.turn);
    const id = await agent(c, f, q.turn);
    await c.query("UPDATE ppo.assistant_turns SET state='CannotAnswer',reason='NoEvidence',answer_message_id=$2,version=version+1,lease_until=NULL,finished_at=clock_timestamp() WHERE id=$1", [q.turn, id]);
    await refused(c, "UPDATE ppo.assistant_turns SET state='Failed',reason='Interrupted',version=version+1 WHERE id=$1", [q.turn], "55000");
    await refused(c, "DELETE FROM ppo.assistant_turns WHERE id=$1", [q.turn], "55000");
  });
});

test("the ceiling cannot exceed US$30 and a reservation cannot pass it", async () => {
  const f = await fixture();
  await rollback(async (c) => {
    await refused(c, "UPDATE ppo.assistant_budget_settings SET monthly_ceiling_micro=30000001 WHERE workspace_id=$1", [f.p.workspace_id]);
    const q = await queued(c, f);
    await answering(c, f, q.turn);
    const sql = "INSERT INTO ppo.assistant_budget_entries(id,workspace_id,turn_id,call_index,period,adapter,model,price_version,max_input_tokens,max_output_tokens,reserved_micro) VALUES($1,$2,$3,$4,date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date,'Simulated','simulated-1','SYN price',48000,8000,$5)";
    const id = randomUUID();
    await c.query(sql, [id, f.p.workspace_id, q.turn, 1, 30000000]);
    await refused(c, sql, [randomUUID(), f.p.workspace_id, q.turn, 2, 1]);
    await c.query("UPDATE ppo.assistant_budget_entries SET state='Unknown' WHERE id=$1", [id]);
    await refused(c, "UPDATE ppo.assistant_budget_entries SET state='Released',settled_at=clock_timestamp() WHERE id=$1", [id]);
    await c.query("UPDATE ppo.assistant_budget_entries SET state='Settled',input_tokens=10,output_tokens=5,settled_micro=100,settled_at=clock_timestamp() WHERE id=$1", [id]);
    assert.equal((await c.query("SELECT settled_micro::text amount FROM ppo.assistant_budget_entries WHERE id=$1", [id])).rows[0].amount, "100");
  });
});

test("seed 110 grants the ask duty to local profiles with conversation.post only", async () => {
  const grants = await rows(`SELECT g.*,u.issuer,source.id AS source_id,source.user_id AS source_user,
    md5('ppo-conversations-t2b:'||source.id::text||':conversation.agent.ask')::uuid AS expected_id
    FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
    LEFT JOIN ppo.permission_grants source ON source.workspace_id=g.workspace_id AND source.user_id=g.user_id AND source.capability='conversation.post'
      AND source.company_id IS NOT DISTINCT FROM g.company_id AND source.scope_type=g.scope_type AND source.scope_id IS NOT DISTINCT FROM g.scope_id
      AND source.site_id IS NOT DISTINCT FROM g.site_id AND source.valid_from=g.valid_from AND source.valid_to IS NOT DISTINCT FROM g.valid_to
    WHERE g.capability='conversation.agent.ask' ORDER BY g.id`);
  assert.ok(grants.length > 0);
  for (const g of grants) {
    assert.equal(g.issuer, "PPO-LocalSynthetic");
    assert.equal(g.id, g.expected_id);
    assert.equal(g.user_id, g.source_user);
  }
  assert.equal(grants.length, (await rows(`SELECT count(*)::int n FROM ppo.permission_grants g
    JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
    WHERE g.capability='conversation.post' AND u.issuer='PPO-LocalSynthetic' AND u.active
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())`))[0].n);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.users WHERE subject_id='Carl' OR subject_id='assistant'"))[0].n, 0);
  const p = await principal(profiles.coordinator);
  await rollback(async c => {
    const ids: string[] = [];
    for (const [name, active, capability, from, to] of [
      ["live", true, "conversation.post", -2, null],
      ["inactive", false, "conversation.post", -2, null],
      ["future", true, "conversation.post", 2, null],
      ["expired", true, "conversation.post", -2, -1],
      ["reader", true, "conversation.read", -2, null],
    ] as const) {
      const user = randomUUID();
      ids.push(user);
      await c.query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active) VALUES($1,$2,'PPO-LocalSynthetic',$3,$3,$4)",
        [user, p.workspace_id, `SYN assistant seed ${name}`, active]);
      await c.query(`INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,valid_from,valid_to)
        VALUES($1,$2,$3,$4,'Workspace',$2,clock_timestamp()+$5::int*interval '1 day',clock_timestamp()+$6::int*interval '1 day')`,
        [randomUUID(), p.workspace_id, user, capability, from, to]);
    }
    await c.query(await readFile("db/seed-conversation-agent.sql", "utf8"));
    assert.deepEqual((await c.query("SELECT user_id FROM ppo.permission_grants WHERE user_id=ANY($1::uuid[]) AND capability='conversation.agent.ask'", [ids])).rows,
      [{ user_id: ids[0] }]);
  });
});
