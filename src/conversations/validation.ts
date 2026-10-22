import {
  common,
  commonKeys,
  object,
  choice,
  uuid,
  label,
  narrative,
  dateOnly,
  version,
  invalid,
} from "../shared/validation";
import {
  anchorTypes,
  askSteps,
  maxAsks,
  maxMentions,
  threadFilters,
  type AskInput,
  type MentionInput,
} from "./model";

const tokenPattern = /([@#])\{(\d+)\}/g;

// T1-5: a message is plain text. `@{n}` and `#{n}` stand for mention n, so a record title or a person name is
// never copied into the body: each reader is shown the target from their own access (T1-4).
function composition(body: string, mentionsValue: unknown, asksValue: unknown) {
  const tokens = [...body.matchAll(tokenPattern)].map((m) => ({
    kind: m[1] === "@" ? ("Person" as const) : ("Record" as const),
    ordinal: Number(m[2]),
  }));
  const rawMentions = mentionsValue ?? [];
  if (!Array.isArray(rawMentions) || rawMentions.length > maxMentions)
    invalid("mentions", `Use at most ${maxMentions} mentions.`);
  const mentions: MentionInput[] = (rawMentions as unknown[]).map(
    (raw, index) => {
    const m = object(raw, ["ordinal", "kind", "person_id", "record_type", "record_id"]);
    const ordinal = Number(m.ordinal);
      if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > maxMentions)
        invalid(
          `mentions.${index}`,
          `Number mentions from 1 to ${maxMentions}.`,
        );
      const kind = choice(m.kind, `mentions.${index}.kind`, [
        "Person",
        "Record",
        "Agent",
      ] as const);
      if (kind === "Agent") {
        if ("person_id" in m || "record_type" in m || "record_id" in m)
          invalid(
            `mentions.${index}`,
            "An assistant tag has no user or record identity.",
          );
      return { ordinal, kind };
      }
      if (kind === "Person") {
      if ("record_type" in m || "record_id" in m)
        invalid(`mentions.${index}`, "A person mention names a person only.");
        return {
          ordinal,
          kind,
          person_id: uuid(m.person_id, `mentions.${index}.person_id`),
        };
      }
    if ("person_id" in m) invalid(`mentions.${index}`, "A record link names a record only.");
      return {
        ordinal,
        kind,
        record_type: choice(
          m.record_type,
          `mentions.${index}.record_type`,
          anchorTypes,
        ),
        record_id: uuid(m.record_id, `mentions.${index}.record_id`),
      };
    },
  );
  const seen = new Set<number>();
  if (mentions.filter((m) => m.kind === "Agent").length > 1)
    invalid("mentions", "Tag the assistant at most once in a message.");
  for (const m of mentions) {
    if (seen.has(m.ordinal)) invalid("mentions", "Each mention number is used once.");
    seen.add(m.ordinal);
  }
  const placed = new Map(tokens.map((t) => [t.ordinal, t.kind]));
  if (
    tokens.length !== placed.size ||
    placed.size !== mentions.length ||
    mentions.some((m) => placed.get(m.ordinal) !== (m.kind === "Agent" ? "Person" : m.kind))
  )
    invalid(
      "body",
      "Put each mention in the text once, as @{n} for a person or assistant and #{n} for a record, matching its number.",
    );
  const rawAsks = asksValue ?? [];
  if (!Array.isArray(rawAsks) || rawAsks.length > maxAsks)
    invalid("asks", `Use at most ${maxAsks} asks.`);
  const asks: AskInput[] = (rawAsks as unknown[]).map((raw, index) => {
    const a = object(raw, ["ordinal", "question", "reply_by"]);
    const ordinal = Number(a.ordinal);
    const target = mentions.find((m) => m.ordinal === ordinal);
    if (!target || target.kind !== "Person")
      invalid(`asks.${index}.ordinal`, "An ask is made of a tagged person.");
    return {
      ordinal,
      question: narrative(a.question, `asks.${index}.question`, 500),
      reply_by:
        a.reply_by === undefined || a.reply_by === null
          ? null
          : dateOnly(a.reply_by, `asks.${index}.reply_by`),
    };
  });
  if (new Set(asks.map((a) => a.ordinal)).size !== asks.length)
    invalid("asks", "Ask each tagged person once in a message.");
  return { mentions, asks };
}

export function startThreadInput(value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "anchor_type",
    "anchor_id",
    "title",
    "body",
    "mentions",
    "asks",
  ]);
  const body = narrative(r.body, "body", 4000);
  return {
    ...common(r),
    anchor_type: choice(r.anchor_type, "anchor_type", anchorTypes),
    anchor_id: uuid(r.anchor_id, "anchor_id"),
    title: label(r.title, "title", 200),
    body,
    ...composition(body, r.mentions, r.asks),
  };
}
export function postMessageInput(thread: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "body",
    "mentions",
    "asks",
    "participant_acknowledgements",
  ]);
  const body = narrative(r.body, "body", 4000);
  const composed = composition(body, r.mentions, r.asks);
  const acknowledgements = r.participant_acknowledgements;
  if (
    acknowledgements !== undefined &&
    (!Array.isArray(acknowledgements) || acknowledgements.length > maxMentions)
  )
    invalid(
      "participant_acknowledgements",
      "Confirm only the people tagged in this message.",
    );
  const checked = (acknowledgements as unknown[] | undefined)?.map((raw) => {
    const a = object(raw, ["person_id", "basis"]);
    if (typeof a.basis !== "string" || !/^[a-f0-9]{64}$/.test(a.basis))
      invalid(
        "participant_acknowledgements",
        "Review the current participant warning before sending.",
      );
    return {
      person_id: uuid(a.person_id, "person_id"),
      basis: a.basis as string,
    };
  });
  if (
    checked &&
    new Set(checked.map((a) => a.person_id)).size !== checked.length
  )
    invalid("participant_acknowledgements", "Confirm each person once.");
  if (
    checked?.some(
      (a) =>
        !composed.mentions.some(
          (m) => m.kind === "Person" && m.person_id === a.person_id,
        ),
    )
  )
    invalid(
      "participant_acknowledgements",
      "Confirm only the people tagged in this message.",
    );
  return {
    ...common(r),
    thread_id: uuid(thread, "thread_id"),
    body,
    ...composed,
    // Omission preserves historical command hashes for original-operation recovery.
    ...(checked === undefined ? {} : { participant_acknowledgements: checked }),
  };
}
export function readThroughInput(thread: string, value: unknown) {
  const r = object(value, [...commonKeys, "through_sequence"]);
  const through = Number(r.through_sequence);
  if (!Number.isSafeInteger(through) || through < 1)
    invalid("through_sequence", "Name the latest message you have read.");
  return { ...common(r), thread_id: uuid(thread, "thread_id"), through_sequence: through };
}
export function threadStateInput(thread: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version"]);
  return {
    ...common(r),
    thread_id: uuid(thread, "thread_id"),
    expected_version: version(r.expected_version),
  };
}
export function closeAskInput(ask: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version"]);
  return {
    ...common(r),
    ask_id: uuid(ask, "ask_id"),
    expected_version: version(r.expected_version),
  };
}
export function askDeadlineInput(ask: string, value: unknown) {
  const r = object(value, [...commonKeys, "step"]);
  return { ...common(r), ask_id: uuid(ask, "ask_id"), step: choice(r.step, "step", askSteps) };
}
export function listInput(value: unknown) {
  const r = object(value, ["filter", "anchor_type", "anchor_id", "limit"]);
  const limit = r.limit === undefined ? 100 : Number(r.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200)
    invalid("limit", "Choose a page size from 1 to 200.");
  const anchored = r.anchor_type !== undefined || r.anchor_id !== undefined;
  return {
    filter: r.filter === undefined ? ("All" as const) : choice(r.filter, "filter", threadFilters),
    anchor: anchored
      ? {
          type: choice(r.anchor_type, "anchor_type", anchorTypes),
          id: uuid(r.anchor_id, "anchor_id"),
        }
      : null,
    limit,
  };
}
export function anchorInput(value: unknown) {
  const r = object(value, ["anchor_type", "anchor_id"]);
  return {
    type: choice(r.anchor_type, "anchor_type", anchorTypes),
    id: uuid(r.anchor_id, "anchor_id"),
  };
}
