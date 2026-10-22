import { createHash } from "node:crypto";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { canonical } from "../platform/operations";
import {
  readableSources,
  sourceKey,
  type SourceKey,
} from "../assistant/source-access";

export type HistoryWarning = { count: number; basis: string };
export type ParticipantAcknowledgement = { person_id: string; basis: string };

// R8/U1: callers first check thread and candidate access. Return counts and an opaque basis only; never source labels.
// A basis changes when the cited history or the candidate's access changes. It grants no access and stores no copy.
export async function participantWarnings(
  c: QueryClient,
  p: Principal,
  thread: string,
  people: string[],
) {
  const participants = new Set(
    (
      await c.query<{ user_id: string }>(
        "SELECT user_id FROM ppo.conversation_participants WHERE workspace_id=$1 AND thread_id=$2",
        [p.workspace_id, thread],
      )
    ).rows.map((row) => row.user_id),
  );
  const candidates = [...new Set(people)].filter((id) => !participants.has(id));
  const result = new Map<string, HistoryWarning>();
  if (!candidates.length) return result;
  const sources = (
    await c.query<SourceKey & { message_id: string; number: number }>(
      `SELECT s.message_id,s.number,s.record_type AS type,s.record_id FROM ppo.conversation_message_sources s
     JOIN ppo.conversation_messages m ON (m.workspace_id,m.id)=(s.workspace_id,s.message_id)
     WHERE m.workspace_id=$1 AND m.thread_id=$2 AND m.author_kind='Agent' ORDER BY m.sequence,s.number`,
      [p.workspace_id, thread],
    )
  ).rows;
  for (const person of candidates) {
    const allowed = await readableSources(c, p.workspace_id, person, sources);
    const hidden = new Set(
      sources.filter((s) => !allowed.has(sourceKey(s))).map(sourceKey),
    );
    if (hidden.size)
      result.set(person, {
        count: hidden.size,
        basis: createHash("sha256")
          .update(
            canonical({
              workspace: p.workspace_id,
              actor: p.actor_id,
              thread,
              person,
              sources,
              allowed: [...allowed].sort(),
            }),
          )
          .digest("hex"),
      });
  }
  return result;
}
