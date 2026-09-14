import { createHash } from "node:crypto";
import { applicableQuestions } from "./discovery-questions";
import { canonical } from "../platform/operations";
import { choice, invalid, narrative, object, uuid } from "../shared/validation";

import {
  discoveryDefinition,
  systemTags,
  freeze,
  type Definition,
  type Question,
  type SystemTag,
} from "./discovery-definition";
export { discoveryDefinition, systemTags } from "./discovery-definition";
export type { Definition, Question, SystemTag } from "./discovery-definition";
const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export const discoveryDefinitionHash = hash(discoveryDefinition);
export type FollowUp = { owner_id: string; reason: string };
export type AnswerValue = string | number | { choice: "NoneDeclared" } | null;
export type Answer = {
  question_id: string;
  state: "Empty" | "Deferred" | "Answered" | "Confirmed" | "Assumed";
  value: AnswerValue;
  source: string | null;
  follow_up: FollowUp | null;
};
export type DiscoveryScope = {
  mode: "Site" | "NoSiteRequired" | "Unknown";
  site_id: string | null;
  site_reason: string | null;
  follow_up: FollowUp | null;
  facility_ids: string[];
  equipment_ids: string[];
  systems: { tag: SystemTag; facility_ids: string[] }[];
  unsupported_scope: FollowUp | null;
};
export type DiscoveryInput = {
  definition_id: string;
  definition_revision: string;
  definition_hash: string;
  effort: {
    value: "Full" | "Express" | "Unknown";
    source: string | null;
    follow_up: FollowUp | null;
  };
  scope: DiscoveryScope;
  answers: Answer[];
};
function followUp(value: unknown, field: string): FollowUp | null {
  if (value === null || value === undefined) return null;
  const r = object(value, ["owner_id", "reason"]);
  return {
    owner_id: uuid(r.owner_id, `${field}.owner_id`),
    reason: narrative(r.reason, `${field}.reason`, 1000),
  };
}
function ids(value: unknown, field: string, max: number) {
  if (!Array.isArray(value) || value.length > max)
    invalid(field, `Use a duplicate-free list of at most ${max} existing IDs.`);
  const values = value.map((v) => uuid(v, field));
  if (new Set(values).size !== values.length)
    invalid(field, "Duplicate membership is not accepted.");
  return values.sort();
}
function parseScope(value: unknown): DiscoveryScope {
  const r = object(value, [
    "mode",
    "site_id",
    "site_reason",
    "follow_up",
    "facility_ids",
    "equipment_ids",
    "systems",
    "unsupported_scope",
  ]);
  const mode = choice(r.mode, "scope.mode", [
    "Site",
    "NoSiteRequired",
    "Unknown",
  ] as const);
  const site_id = r.site_id == null ? null : uuid(r.site_id, "scope.site_id");
  const facility_ids = ids(r.facility_ids, "scope.facility_ids", 10);
  const equipment_ids = ids(r.equipment_ids, "scope.equipment_ids", 100);
  const site_reason =
    r.site_reason == null
      ? null
      : narrative(r.site_reason, "scope.site_reason", 1000);
  const follow_up = followUp(r.follow_up, "scope.follow_up");
  if (
    mode === "Site"
      ? !site_id || site_reason !== null || follow_up !== null
      : site_id !== null ||
        facility_ids.length ||
        equipment_ids.length ||
        !site_reason
  )
    invalid(
      "scope",
      "Select one existing Site, or record an explicit no-site/unknown reason without Site, Facility or equipment IDs.",
    );
  if (mode === "Unknown" && !follow_up)
    invalid(
      "scope.follow_up",
      "Assign the unresolved Site question to an owner.",
    );
  if (mode === "NoSiteRequired" && follow_up)
    invalid(
      "scope.follow_up",
      "A no-site declaration must not masquerade as an unresolved Site choice.",
    );
  if (!Array.isArray(r.systems) || !r.systems.length || r.systems.length > 3)
    invalid("scope.systems", "Select one to three supported work systems.");
  const systems = r.systems
    .map((value) => {
      const s = object(value, ["tag", "facility_ids"]);
      const tag = choice(s.tag, "scope.systems.tag", systemTags);
      const members = ids(s.facility_ids, "scope.systems.facility_ids", 10);
      if (members.some((id) => !facility_ids.includes(id)))
        invalid(
          "scope.systems",
          "A system can refer only to explicitly selected Facilities.",
        );
      return { tag, facility_ids: members };
    })
    .sort((a, b) => a.tag.localeCompare(b.tag));
  if (new Set(systems.map((s) => s.tag)).size !== systems.length)
    invalid("scope.systems", "Use each work-system tag once.");
  return {
    mode,
    site_id,
    site_reason,
    follow_up,
    facility_ids,
    equipment_ids,
    systems,
    unsupported_scope: followUp(r.unsupported_scope, "scope.unsupported_scope"),
  };
}
function parseValue(q: Question, value: unknown): AnswerValue {
  if (value === null || value === undefined) return null;
  if (q.type === "Integer") {
    if (
      !Number.isSafeInteger(value) ||
      Number(value) < q.minimum! ||
      Number(value) > q.maximum!
    )
      invalid(
        q.id,
        `Enter a whole ${q.unit} count from ${q.minimum} to ${q.maximum}.`,
      );
    return Number(value);
  }
  if (q.type === "Choice") return choice(value, q.id, q.choices!);
  if (q.type === "TextOrNone" && typeof value === "object") {
    const r = object(value, ["choice"]);
    return { choice: choice(r.choice, q.id, ["NoneDeclared"] as const) };
  }
  return narrative(value, q.id, q.max_length!);
}
export function activeQuestions(
  scope: DiscoveryScope,
  answers: readonly Answer[],
  definition: Definition = discoveryDefinition,
) {
  return applicableQuestions(scope, answers, definition);
}
export function parseDiscovery(value: unknown): DiscoveryInput {
  let encoded: string | undefined;
  try {
    encoded = JSON.stringify(value);
  } catch {
    invalid("payload", "Use a bounded JSON discovery object.");
  }
  if (!encoded || Buffer.byteLength(encoded) > 64 * 1024)
    invalid(
      "payload",
      "Discovery is limited to 64 KiB; nothing was truncated.",
    );
  const r = object(value, [
    "definition_id",
    "definition_revision",
    "definition_hash",
    "effort",
    "scope",
    "answers",
  ]);
  if (
    r.definition_id !== discoveryDefinition.id ||
    r.definition_revision !== discoveryDefinition.revision ||
    r.definition_hash !== discoveryDefinitionHash
  )
    invalid(
      "definition_hash",
      "Compare the current published question definition before saving.",
    );
  const e = object(r.effort, ["value", "source", "follow_up"]);
  const effort = {
    value: choice(e.value, "effort.value", [
      "Full",
      "Express",
      "Unknown",
    ] as const),
    source: e.source == null ? null : narrative(e.source, "effort.source", 500),
    follow_up: followUp(e.follow_up, "effort.follow_up"),
  };
  if (
    effort.value === "Unknown"
      ? !effort.follow_up
      : !effort.source || effort.follow_up !== null
  )
    invalid(
      "effort",
      "Record the declared effort source, or an owned unresolved effort item.",
    );
  const scope = parseScope(r.scope);
  if (!Array.isArray(r.answers) || r.answers.length > 10)
    invalid("answers", "Use at most ten explicitly identified answers.");
  const answers: Answer[] = r.answers
    .map((value) => {
      const a = object(value, [
        "question_id",
        "state",
        "value",
        "source",
        "follow_up",
      ]);
      const q = discoveryDefinition.questions.find(
        (q) => q.id === a.question_id,
      );
      if (!q)
        invalid(
          "question_id",
          "This question is not in the published definition.",
        );
      const state = choice(a.state, q.id, [
        "Empty",
        "Deferred",
        "Answered",
        "Confirmed",
        "Assumed",
      ] as const);
      const answer = {
        question_id: q.id,
        state,
        value: parseValue(q, a.value),
        source:
          a.source == null ? null : narrative(a.source, `${q.id}.source`, 500),
        follow_up: followUp(a.follow_up, `${q.id}.follow_up`),
      };
      if (
        state === "Empty" &&
        (answer.value !== null || answer.source !== null)
      )
        invalid(q.id, "An Empty answer retains no invented value or source.");
      if (
        ["Answered", "Confirmed", "Assumed"].includes(state) &&
        (answer.value === null || !answer.source)
      )
        invalid(q.id, "Attribute the explicit answer to its source.");
      if (answer.value !== null && !answer.source)
        invalid(q.id, "A retained value requires source attribution.");
      if (
        state === "Confirmed" &&
        (answer.value === "Unknown" || answer.follow_up !== null)
      )
        invalid(q.id, "Unknown or unresolved answers cannot be confirmed.");
      const unresolved =
        state === "Empty" ||
        state === "Deferred" ||
        state === "Assumed" ||
        answer.value === "Unknown" ||
        (q.required && state !== "Confirmed");
      if (unresolved && !answer.follow_up)
        invalid(
          `${q.id}.follow_up`,
          "Retain an eligible owner and reason for this unresolved item.",
        );
      return answer;
    })
    .sort((a, b) => a.question_id.localeCompare(b.question_id));
  if (new Set(answers.map((a) => a.question_id)).size !== answers.length)
    invalid("answers", "Use each question once.");
  const active = activeQuestions(scope, answers);
  if (answers.some((a) => !active.some((q) => q.id === a.question_id)))
    invalid(
      "answers",
      "Submit active answers only; removed/hidden answers are retained from accepted history.",
    );
  for (const q of active)
    if (!answers.some((a) => a.question_id === q.id))
      invalid(q.id, "Record an answer or an explicit owned unresolved item.");
  if (
    scope.mode === "NoSiteRequired" &&
    answers.some((a) => a.question_id === "Q07" && a.value === "Yes")
  )
    invalid(
      "scope.mode",
      "On-site work requires a Site or an owned unknown Site question.",
    );
  return {
    definition_id: discoveryDefinition.id,
    definition_revision: discoveryDefinition.revision,
    definition_hash: discoveryDefinitionHash,
    effort,
    scope,
    answers,
  };
}

// Structural compilation is not a permission check or a saved revision.
export function compileDiscovery(value: unknown) {
  const input = parseDiscovery(value);
  const questions = activeQuestions(input.scope, input.answers);
  const open_items: {
    key: string;
    follow_up: FollowUp;
    blocks_scope: boolean;
  }[] = [];
  for (const answer of input.answers)
    if (answer.follow_up)
      open_items.push({
        key: answer.question_id,
        follow_up: answer.follow_up,
        blocks_scope: questions.find((q) => q.id === answer.question_id)!
          .required,
      });
  if (input.scope.follow_up)
    open_items.push({
      key: "Site",
      follow_up: input.scope.follow_up,
      blocks_scope: true,
    });
  if (input.scope.unsupported_scope)
    open_items.push({
      key: "UnsupportedScope",
      follow_up: input.scope.unsupported_scope,
      blocks_scope: true,
    });
  if (input.effort.follow_up)
    open_items.push({
      key: "Effort",
      follow_up: input.effort.follow_up,
      blocks_scope: false,
    });
  const scope_readiness = open_items.some((i) => i.blocks_scope)
    ? "Incomplete"
    : "Complete";
  return freeze({
    input,
    scope_readiness,
    open_items,
    delivery_routing: {
      status: "NotConfigured",
      reason: "No delivery routing rule set has been adopted.",
    },
    content_hash: hash(input),
  });
}

// Definitions supplied here are trusted published definitions/comparison fixtures,
// never arbitrary command input. Only r01 is executable by parseDiscovery.
export function compareDefinitions(previous: Definition, next: Definition) {
  for (const d of [previous, next]) {
    if (new Set(d.questions.map((q) => q.id)).size !== d.questions.length)
      invalid(
        "definition",
        "Duplicate question identities are not comparable.",
      );
  }
  const meaning = (q: Question) => {
    const rest = Object.fromEntries(
      Object.entries(q).filter(([key]) => !["label", "required"].includes(key)),
    );
    return hash(rest);
  };
  return [
    ...new Set([...previous.questions, ...next.questions].map((q) => q.id)),
  ]
    .sort()
    .map((id) => {
      const before = previous.questions.find((q) => q.id === id),
        after = next.questions.find((q) => q.id === id);
      const disposition = !after
        ? "Removed"
        : !before
          ? after.required
            ? "NewRequired"
            : "Added"
          : meaning(before) !== meaning(after)
            ? "Incompatible"
            : !before.required && after.required
              ? "NewRequired"
              : before.required !== after.required
                ? "RequirementChanged"
                : before.label !== after.label
                  ? "LabelChanged"
                  : "Unchanged";
      return freeze({
        question_id: id,
        disposition,
        previous: before ? structuredClone(before) : null,
        next: after ? structuredClone(after) : null,
      });
    });
}

function membership(scope: DiscoveryScope, q: Question) {
  return hash({
    mode: scope.mode,
    site_id: scope.site_id,
    site_reason: scope.site_reason,
    equipment_ids: scope.equipment_ids,
    ...(q.system
      ? { system: scope.systems.find((s) => s.tag === q.system) ?? null }
      : { facility_ids: scope.facility_ids, systems: scope.systems }),
  });
}
export function compareDiscovery(
  previousValue: unknown,
  proposedValue: unknown,
) {
  const previous = compileDiscovery(previousValue),
    proposed = compileDiscovery(proposedValue);
  const questions = discoveryDefinition.questions.map((q) => {
    const before = previous.input.answers.find((a) => a.question_id === q.id),
      after = proposed.input.answers.find((a) => a.question_id === q.id);
    const disposition =
      before && !after
        ? "Hidden"
        : !before && after
          ? "BecameActive"
          : !before
            ? "Inactive"
            : membership(previous.input.scope, q) !==
                membership(proposed.input.scope, q)
              ? "MembershipChanged"
              : hash(before.value) !== hash(after!.value)
                ? "ValueChanged"
                : "Unchanged";
    return {
      question_id: q.id,
      disposition,
      previous: before ?? null,
      proposed: after ?? null,
      requires_confirmation: Boolean(
        after && !["Unchanged", "Inactive"].includes(disposition),
      ),
    };
  });
  return freeze({
    previous_hash: previous.content_hash,
    proposed_hash: proposed.content_hash,
    questions,
    effort_changed: hash(previous.input.effort) !== hash(proposed.input.effort),
    retained_hidden_answers: questions
      .filter((q) => q.disposition === "Hidden")
      .map((q) => q.previous!),
    delivery_routing: proposed.delivery_routing,
  });
}

export function inheritDiscovery(
  value: unknown,
  sourceSnapshotId: string,
  confirmation: FollowUp,
) {
  const previous = compileDiscovery(value);
  const snapshot_id = uuid(sourceSnapshotId, "source_snapshot_id");
  const follow_up = followUp(confirmation, "confirmation")!;
  if (!follow_up)
    invalid("confirmation", "Assign inherited confirmation explicitly.");
  const input = {
    ...previous.input,
    answers: previous.input.answers.map((a) =>
      a.state === "Confirmed"
        ? { ...a, state: "Answered" as const, follow_up }
        : { ...a },
    ),
  };
  const proposed = compileDiscovery(input);
  return freeze({
    ...proposed,
    copied_from: { snapshot_id, content_hash: previous.content_hash },
    copied_questions: previous.input.answers
      .filter((a) => a.value !== null)
      .map((a) => a.question_id),
  });
}
