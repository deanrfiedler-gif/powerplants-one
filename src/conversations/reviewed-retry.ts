import type { JournalEntry } from "../shared/lib/command-journal";
import { postMessageInput } from "./validation";
import { agentName } from "../assistant/model";
import type { PeopleRead } from "./picker-options";

export function retainedPost(entry: JournalEntry) {
  if (
    entry.phase !== "pending" ||
    entry.path !== `conversations/${entry.record_id}/messages`
  )
    return null;
  try {
    return postMessageInput(entry.record_id, entry.body);
  } catch {
    return null;
  }
}

// The command's operation lock and prior-receipt check precede this exact refusal.
// Only fresh acknowledgement metadata may change, never the message, tags, asks or operation.
export function reviewedParticipantPatch(
  entry: JournalEntry,
  failure: { status?: number; code?: string; retryable?: boolean },
  review: unknown,
) {
  if (
    failure.status !== 409 ||
    failure.code !== "ParticipantWarningRequired" ||
    failure.retryable
  )
    return null;
  const input = retainedPost(entry);
  if (!input || !input.mentions.some((m) => m.kind === "Person")) return null;
  try {
    const checked = postMessageInput(entry.record_id, {
      ...entry.body,
      participant_acknowledgements: review,
    });
    if (checked.participant_acknowledgements === undefined) return null;
    return {
      participant_acknowledgements: checked.participant_acknowledgements,
    };
  } catch {
    return null;
  }
}

export function originalPostPreview(
  input: NonNullable<ReturnType<typeof retainedPost>>,
  people: PeopleRead["items"],
) {
  const body = input.body.replace(
    /([@#])\{(\d+)\}/g,
    (token, _kind: string, ordinal: string) => {
      const mention = input.mentions.find((m) => m.ordinal === Number(ordinal));
      if (!mention) return token;
      if (mention.kind === "Agent") return `@${agentName} · AI assistant`;
      if (mention.kind === "Person")
        return `@${people.find((p) => p.id === mention.person_id)?.display_name ?? "Person"}`;
      // Recovery never restores a cached record title or link from the journal.
      return "#Linked record";
    },
  );
  return (
    body +
    input.asks
      .map((ask) => {
        const mention = input.mentions.find((m) => m.ordinal === ask.ordinal);
        const name =
          mention?.kind === "Person"
            ? (people.find((p) => p.id === mention.person_id)?.display_name ??
              "Person")
            : "Person";
        return `\nAsk ${name}: ${ask.question}${ask.reply_by ? ` (reply by ${ask.reply_by})` : ""}`;
      })
      .join("")
  );
}
