import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation, type OperationResult } from "../platform/operations";
import { hasPermission } from "../platform/permissions";
import { conversationOutboxKind, type AskInput, type MentionInput } from "./model";
import { participantWarnings } from "./participant-warning";
import {
  askDeadlineInput,
  closeAskInput,
  postMessageInput,
  readThroughInput,
  startThreadInput,
  threadStateInput,
} from "./validation";
import {
  personCanReadThread,
  readableAnchor,
  recordOpenable,
  visibleThread,
  type Anchor,
} from "./access";

// T1-6: every write is a typed command through sharedOperation, so the permission check precedes the receipt,
// and the receipt, audit event and outbox job are written with the change. Audit details carry identifiers only:
// no message text is copied into the audit log, which is what the notice projection reads (T1-7).
type Composition = {
  body: string;
  mentions: MentionInput[];
  asks: AskInput[];
  operation_id: string;
};
const today = async (c: PoolClient) =>
  (await c.query("SELECT (clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date::text AS today")).rows[0].today as string;
const refused = (code: string, message: string, field: string) =>
  new AppError(422, code, message, [{ field, message }]);

async function agentAuthority(c: PoolClient, p: Principal, anchor: Pick<Anchor, "type" | "id">, input: Composition) {
  const index = input.mentions.findIndex(m => m.kind === "Agent");
  if (index < 0) return;
  const scope = await readableAnchor(c, p, anchor.type, anchor.id, "conversation.post");
  if (!(await hasPermission(c, p, "conversation.agent.ask", scope.company_id, scope.site_id ?? undefined)))
    throw refused("TagNotPermitted", "You do not hold the duty to ask the assistant on this record.", `mentions.${index}`);
}

// Checks run before any row is written, so a refused message leaves nothing behind.
async function checkComposition(c: PoolClient, p: Principal, anchor: Pick<Anchor, "type" | "id">, input: Composition) {
  await agentAuthority(c, p, anchor, input);
  for (const [index, m] of input.mentions.entries()) {
    if (m.kind === "Person") {
      if (m.person_id === p.actor_id && input.asks.some((a) => a.ordinal === m.ordinal))
        throw refused("SelfAsk", "You cannot ask yourself a question.", `asks.${m.ordinal}`);
      // T1-3: only a person who can already read the record can be tagged. Sharing is T6.
      if (!(await personCanReadThread(c, p.workspace_id, m.person_id, anchor.type, anchor.id)))
        throw refused(
          "TagNotPermitted",
          "That person cannot open this record, so they cannot be tagged in its thread.",
          `mentions.${index}`,
        );
    } else if (m.kind === "Record" && !(await recordOpenable(c, p.workspace_id, p.actor_id, m.record_type, m.record_id)))
      throw refused("LinkNotPermitted", "You can only link a record you can open.", `mentions.${index}`);
  }
  const current = await today(c);
  for (const a of input.asks)
    if (a.reply_by && a.reply_by < current)
      throw refused("ReplyByInPast", "The reply-by date cannot be in the past.", `asks.${a.ordinal}`);
}

async function addParticipant(
  c: PoolClient,
  p: Principal,
  thread: string,
  user: string,
  role: "Creator" | "Tagged" | "Participant",
) {
  await c.query(
    `INSERT INTO ppo.conversation_participants(workspace_id,thread_id,user_id,role,added_by) VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(workspace_id,thread_id,user_id) DO UPDATE SET role='Participant' WHERE ppo.conversation_participants.role='Tagged' AND EXCLUDED.role='Participant'`,
    [p.workspace_id, thread, user, role, p.actor_id],
  );
}

// Writes one message with its mentions, tagged participants and asks. U4: posting adds the author as a participant.
async function writeMessage(
  c: PoolClient,
  p: Principal,
  thread: string,
  sequence: number,
  input: Composition,
  authorRole: "Creator" | "Participant",
) {
  await addParticipant(c, p, thread, p.actor_id, authorRole);
  const id = randomUUID();
  const created = (
    await c.query(
      `INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_id,body,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING created_at`,
      [id, p.workspace_id, thread, sequence, p.actor_id, input.body, input.operation_id],
    )
  ).rows[0].created_at as Date;
  for (const m of input.mentions)
    await c.query(
      `INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind,person_id,record_type,record_id) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [
        p.workspace_id,
        id,
        m.ordinal,
        m.kind,
        m.kind === "Person" ? m.person_id : null,
        m.kind === "Record" ? m.record_type : null,
        m.kind === "Record" ? m.record_id : null,
      ],
    );
  // Tagging adds the person so the thread appears in their sidebar (U4).
  for (const m of input.mentions)
    if (m.kind === "Person" && m.person_id !== p.actor_id) await addParticipant(c, p, thread, m.person_id, "Tagged");
  const asks: { id: string; asked_id: string }[] = [];
  for (const a of input.asks) {
    const asked = input.mentions.find((m) => m.ordinal === a.ordinal) as Extract<MentionInput, { kind: "Person" }>;
    const ask = randomUUID();
    await c.query(
      `INSERT INTO ppo.conversation_asks(id,workspace_id,thread_id,message_id,ordinal,asker_id,asked_id,question,reply_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [ask, p.workspace_id, thread, id, a.ordinal, p.actor_id, asked.person_id, a.question, a.reply_by],
    );
    asks.push({ id: ask, asked_id: asked.person_id });
  }
  const agentTurn = input.mentions.some(m => m.kind === "Agent") ? randomUUID() : null;
  if (agentTurn)
    await c.query(
      "INSERT INTO ppo.assistant_turns(id,workspace_id,thread_id,trigger_message_id,acted_for_id) VALUES($1,$2,$3,$4,$5)",
      [agentTurn, p.workspace_id, thread, id, p.actor_id],
    );
  return {
    id,
    created,
    mentioned: [...new Set(input.mentions.flatMap((m) => (m.kind === "Person" ? [m.person_id] : [])))],
    asks,
    agent_turn_id: agentTurn,
  };
}

export async function startThread(p: Principal, value: unknown) {
  const input = startThreadInput(value);
  return sharedOperation(
    p,
    input,
    "Conversation:StartThread",
    // U1: any reader who holds the post capability may start a thread.
    async (c) => {
      await readableAnchor(c, p, input.anchor_type, input.anchor_id, "conversation.read");
      const anchor = await readableAnchor(c, p, input.anchor_type, input.anchor_id, "conversation.post");
      await agentAuthority(c, p, anchor, input);
      return anchor;
    },
    async (c, anchor): Promise<OperationResult> => {
      await checkComposition(c, p, { type: anchor.type, id: anchor.id }, input);
      const thread = randomUUID();
      const main = !(
        await c.query(
          "SELECT 1 FROM ppo.conversation_threads WHERE workspace_id=$1 AND anchor_type=$2 AND anchor_id=$3",
          [p.workspace_id, anchor.type, anchor.id],
        )
      ).rowCount;
      const created = (
        await c.query(
          `INSERT INTO ppo.conversation_threads(id,workspace_id,company_id,anchor_type,anchor_id,title,is_main,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING created_at`,
          [thread, p.workspace_id, anchor.company_id, anchor.type, anchor.id, input.title, main, p.actor_id],
        )
      ).rows[0].created_at as Date;
      const message = await writeMessage(c, p, thread, 1, input, "Creator");
      return {
        id: thread,
        version: 1,
        state: "Open",
        updated_at: created,
        audit_details: {
          thread_id: thread,
          message_id: message.id,
          sequence: 1,
          anchor_type: anchor.type,
          anchor_id: anchor.id,
          main,
          mentioned: message.mentioned,
          asked: message.asks.map((a) => a.asked_id),
          ask_ids: message.asks.map((a) => a.id),
          ...(message.agent_turn_id ? { agent_turn_id: message.agent_turn_id } : {}),
        },
      };
    },
    "ConversationThread",
    conversationOutboxKind,
  );
}

export async function postMessage(p: Principal, thread: string, value: unknown) {
  const input = postMessageInput(thread, value);
  return sharedOperation(
    p,
    input,
    "Conversation:PostMessage",
    async (c) => {
      const thread = await visibleThread(c, p, input.thread_id, "conversation.post");
      await agentAuthority(c, p, { type: thread.anchor_type, id: thread.anchor_id }, input);
      return thread;
    },
    async (c, row): Promise<OperationResult> => {
      if (row.state !== "Open")
        throw new AppError(409, "ThreadResolved", "Reopen the thread before posting in it.");
      await checkComposition(c, p, { type: row.anchor_type, id: row.anchor_id }, input);
      const taggedPeople = input.mentions.flatMap((m) =>
        m.kind === "Person" ? [m.person_id] : [],
      );
      const warnings = await participantWarnings(c, p, row.id, taggedPeople);
      if (
        [...warnings].some(
          ([person, warning]) =>
            !input.participant_acknowledgements?.some(
              (a) => a.person_id === person && a.basis === warning.basis,
            ),
        )
      )
        throw new AppError(
          409,
          "ParticipantWarningRequired",
          "Earlier assistant answers cite records a new participant cannot open. Review the current warning before sending.",
        );
      const sequence =
        Number(
          (
            await c.query(
              "SELECT coalesce(max(sequence),0) AS n FROM ppo.conversation_messages WHERE workspace_id=$1 AND thread_id=$2",
              [p.workspace_id, row.id],
            )
          ).rows[0].n,
        ) + 1;
      // A reply by the asked person closes their earlier open asks in this thread. Reading never does.
      const message = await writeMessage(c, p, row.id, sequence, input, "Participant");
      const answered = (
        await c.query(
          `UPDATE ppo.conversation_asks SET state='Answered',closed_by=asked_id,closed_at=clock_timestamp(),closing_message_id=$3,version=version+1
           WHERE workspace_id=$1 AND thread_id=$2 AND asked_id=$4 AND state='Open' AND message_id<>$3 RETURNING id`,
          [p.workspace_id, row.id, message.id, p.actor_id],
        )
      ).rows.map((r) => r.id as string);
      return {
        id: message.id,
        version: sequence,
        state: "Posted",
        updated_at: message.created,
        audit_details: {
          thread_id: row.id,
          message_id: message.id,
          sequence,
          anchor_type: row.anchor_type,
          anchor_id: row.anchor_id,
          mentioned: message.mentioned,
          asked: message.asks.map((a) => a.asked_id),
          ask_ids: message.asks.map((a) => a.id),
          answered_asks: answered,
          ...(message.agent_turn_id ? { agent_turn_id: message.agent_turn_id } : {}),
        },
      };
    },
    "ConversationMessage",
    conversationOutboxKind,
  );
}

export async function markRead(p: Principal, thread: string, value: unknown) {
  const input = readThroughInput(thread, value);
  return sharedOperation(
    p,
    input,
    "Conversation:MarkRead",
    async (c) => visibleThread(c, p, input.thread_id),
    async (c, row): Promise<OperationResult> => {
      const newest = Number(
        (
          await c.query(
            "SELECT coalesce(max(sequence),0) AS n FROM ppo.conversation_messages WHERE workspace_id=$1 AND thread_id=$2",
            [p.workspace_id, row.id],
          )
        ).rows[0].n,
      );
      if (input.through_sequence > newest)
        throw refused("MessageNotFound", "That message does not exist in this thread yet.", "through_sequence");
      const mine = (
        await c.query(
          "SELECT last_read_sequence FROM ppo.conversation_participants WHERE workspace_id=$1 AND thread_id=$2 AND user_id=$3",
          [p.workspace_id, row.id, p.actor_id],
        )
      ).rows[0];
      if (!mine) throw new AppError(409, "NotAParticipant", "Only a participant keeps a read position in a thread.");
      // Last-read only advances: reading an older message again records the command and changes nothing.
      const through = Math.max(Number(mine.last_read_sequence), input.through_sequence);
      const updated = (
        await c.query(
          `UPDATE ppo.conversation_participants SET last_read_sequence=$4,last_read_at=clock_timestamp()
           WHERE workspace_id=$1 AND thread_id=$2 AND user_id=$3 AND last_read_sequence<$4 RETURNING last_read_at`,
          [p.workspace_id, row.id, p.actor_id, through],
        )
      ).rows[0];
      return {
        id: row.id,
        version: row.version,
        state: row.state,
        updated_at: (updated?.last_read_at as Date | undefined) ?? new Date(),
        audit_details: { thread_id: row.id, through_sequence: through },
      };
    },
    "ConversationThread",
    conversationOutboxKind,
  );
}

// Resolving belongs to the thread's creator or a participant with the post right (scope section 3).
async function changeState(p: Principal, thread: string, value: unknown, to: "Resolved" | "Open") {
  const input = threadStateInput(thread, value);
  return sharedOperation(
    p,
    input,
    `Conversation:${to === "Resolved" ? "ResolveThread" : "ReopenThread"}`,
    async (c) => visibleThread(c, p, input.thread_id, "conversation.post"),
    async (c, row): Promise<OperationResult> => {
      const participant = (
        await c.query(
          "SELECT 1 FROM ppo.conversation_participants WHERE workspace_id=$1 AND thread_id=$2 AND user_id=$3",
          [p.workspace_id, row.id, p.actor_id],
        )
      ).rowCount;
      if (row.created_by !== p.actor_id && !participant) throw unavailable();
      if (row.version !== input.expected_version)
        throw new AppError(409, "VersionConflict", "Read the current thread version first.");
      if (row.state === to)
        throw new AppError(409, "AlreadyInState", `The thread is already ${to === "Resolved" ? "resolved" : "open"}.`);
      const result = (
        await (to === "Resolved"
          ? c.query(
              `UPDATE ppo.conversation_threads SET state='Resolved',version=version+1,resolved_by=$3,resolved_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING version,state,resolved_at AS updated_at`,
              [p.workspace_id, row.id, p.actor_id],
            )
          : c.query(
              `UPDATE ppo.conversation_threads SET state='Open',version=version+1,resolved_by=NULL,resolved_at=NULL WHERE workspace_id=$1 AND id=$2 RETURNING version,state,clock_timestamp() AS updated_at`,
              [p.workspace_id, row.id],
            ))
      ).rows[0];
      return { id: row.id, ...result, audit_details: { thread_id: row.id, to } };
    },
    "ConversationThread",
    conversationOutboxKind,
  );
}
export const resolveThread = (p: Principal, thread: string, value: unknown) => changeState(p, thread, value, "Resolved");
export const reopenThread = (p: Principal, thread: string, value: unknown) => changeState(p, thread, value, "Open");

type AskRow = {
  id: string;
  thread_id: string;
  asker_id: string;
  asked_id: string;
  state: string;
  version: number;
  reply_by: string | null;
  reminded_at: Date | null;
  asker_told_at: Date | null;
};
async function askFor(c: PoolClient, p: Principal, id: string) {
  const ask = (
    await c.query<AskRow>(
      `SELECT id,thread_id,asker_id,asked_id,state,version,reply_by::text AS reply_by,reminded_at,asker_told_at FROM ppo.conversation_asks WHERE workspace_id=$1 AND id=$2`,
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!ask) throw unavailable();
  // The thread must still be readable by this person: present access, then the ask.
  await visibleThread(c, p, ask.thread_id);
  return ask;
}

// "No answer needed": only the person asked can say so. Reading an ask closes nothing.
export async function closeAsk(p: Principal, ask: string, value: unknown) {
  const input = closeAskInput(ask, value);
  return sharedOperation(
    p,
    input,
    "Conversation:NoAnswerNeeded",
    async (c) => askFor(c, p, input.ask_id),
    async (c, row): Promise<OperationResult> => {
      if (row.asked_id !== p.actor_id)
        throw new AppError(403, "Forbidden", "Only the person asked can mark an ask as needing no answer.");
      if (row.version !== input.expected_version)
        throw new AppError(409, "VersionConflict", "Read the current ask version first.");
      if (row.state !== "Open") throw new AppError(409, "AskClosed", "This ask is already closed.");
      const result = (
        await c.query(
          `UPDATE ppo.conversation_asks SET state='NoAnswerNeeded',closed_by=asked_id,closed_at=clock_timestamp(),version=version+1
           WHERE workspace_id=$1 AND id=$2 RETURNING version,state,closed_at AS updated_at`,
          [p.workspace_id, row.id],
        )
      ).rows[0];
      return {
        id: row.id,
        ...result,
        audit_details: { thread_id: row.thread_id, ask_id: row.id, asker_id: row.asker_id, asked_id: row.asked_id, step: "NoAnswerNeeded" },
      };
    },
    "ConversationAsk",
    conversationOutboxKind,
  );
}

// N7: one reminder to the person asked on the reply-by date, then the asker is told. There is no escalation chain.
// Nothing schedules these steps in T1b: this command records one when it falls due, and the notice projection
// turns the audit event into a notice for the right person. A later job or a person opening the thread may run it.
export async function recordAskDeadline(p: Principal, ask: string, value: unknown) {
  const input = askDeadlineInput(ask, value);
  return sharedOperation(
    p,
    input,
    `Conversation:AskDeadline:${input.step}`,
    async (c) => {
      const row = await askFor(c, p, input.ask_id);
      if (![row.asker_id, row.asked_id].includes(p.actor_id)) throw unavailable();
      return row;
    },
    async (c, row): Promise<OperationResult> => {
      if (row.state !== "Open") throw new AppError(409, "AskClosed", "This ask is already closed.");
      if (!row.reply_by) throw new AppError(409, "NoReplyBy", "This ask has no reply-by date.");
      const current = await today(c);
      const remind = input.step === "Remind";
      const due = remind ? current >= row.reply_by : current > row.reply_by;
      const done = remind ? row.reminded_at : row.asker_told_at;
      if (done) throw new AppError(409, "StepRecorded", "This step has already been recorded; there is one reminder only.");
      if (!remind && !row.reminded_at)
        throw new AppError(409, "ReminderFirst", "The asker is told only after the single reminder.");
      if (!due) throw new AppError(409, "NotDue", "The reply-by date has not been reached for this step.");
      const result = (
        await c.query(
          `UPDATE ppo.conversation_asks SET ${remind ? "reminded_at" : "asker_told_at"}=clock_timestamp(),version=version+1
           WHERE workspace_id=$1 AND id=$2 RETURNING version,state,clock_timestamp() AS updated_at`,
          [p.workspace_id, row.id],
        )
      ).rows[0];
      return {
        id: row.id,
        ...result,
        audit_details: { thread_id: row.thread_id, ask_id: row.id, asker_id: row.asker_id, asked_id: row.asked_id, step: input.step },
      };
    },
    "ConversationAsk",
    conversationOutboxKind,
  );
}
