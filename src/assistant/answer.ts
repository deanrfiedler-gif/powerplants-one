import {
  agentName, answerLimits, type AdapterResult, type CheckedClaim, type EvidenceEnvelope,
  type StoredClaim, type StoredSource,
} from "./model";

export type CheckedAnswer = { ok: true; claims: CheckedClaim[]; gaps: string[] };
type Refused = { ok: false; reason: "InvalidCitation" | "UnsafeOutput" };

// Plain prose only. PPO adds its own citation syntax; neither model markup nor tokens are rendered.
export function safeAnswerText(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= limit
    && !/[\p{Cc}\p{Cf}<>`[\]*]|~~|[@#]\s*\{/u.test(value)
    && !/(?:^|\s)_{1,2}\S.*?_{1,2}(?:\s|$)|^\s*(?:[#>+-]|\d+[.)])\s/u.test(value)
    && !/\b(?:[a-z][a-z\d+.-]*:\/\/|https?:|ftp:|file:|data:|javascript:|mailto:|www\.)/iu.test(value);
}

export function checkAnswer(
  result: Extract<AdapterResult, { kind: "Answer" }>,
  envelope: EvidenceEnvelope,
): CheckedAnswer | Refused {
  const unsafe = (): Refused => ({ ok: false, reason: "UnsafeOutput" });
  if (!result || result.kind !== "Answer" || !Array.isArray(result.claims) || !Array.isArray(result.gaps)
    || result.claims.length < 1 || result.claims.length > answerLimits.claims || result.gaps.length > answerLimits.gaps)
    return unsafe();
  const sources = new Set(envelope.items.map(s => s.source_id));
  const claims: CheckedClaim[] = [];
  for (const claim of result.claims) {
    if (!claim || !safeAnswerText(claim.text, answerLimits.claim_chars)) return unsafe();
    if (!Array.isArray(claim.source_ids) || !claim.source_ids.length
      || claim.source_ids.some(id => typeof id !== "string" || !sources.has(id)))
      return { ok: false, reason: "InvalidCitation" };
    claims.push({ text: claim.text, source_ids: [...new Set(claim.source_ids)] });
  }
  if (result.gaps.some(g => !safeAnswerText(g, answerLimits.gap_chars))) return unsafe();
  const checked: CheckedAnswer = { ok: true, claims, gaps: [...result.gaps] };
  return renderAnswer(checked, envelope).body.length <= answerLimits.body_chars ? checked : unsafe();
}

const coverageNames = {
  opportunities: "opportunities", activities: "Internal Activities", tasks: "tasks",
  raid: "open RAID entries", messages: "thread messages", acceptance_stages: "acceptance stages",
} as const;
export function coverageLines(envelope: Pick<EvidenceEnvelope, "coverage" | "left_out" | "history_left_out">): string[] {
  const lines = Object.entries(envelope.coverage).flatMap(([key, c]) => c.more
    ? [`Coverage: ${c.returned} ${coverageNames[key as keyof typeof coverageNames]} shown (limit ${c.limit}; more exist).`] : []);
  const history = envelope.history_left_out ?? 0, access = envelope.left_out - history;
  if (access > 0)
    lines.push(`${access} ${access === 1 ? "source" : "sources"} left out because not everyone here can see them.`);
  if (history > 0)
    lines.push(`${history} earlier ${history === 1 ? "message" : "messages"} left out to fit the request allowance.`);
  return lines;
}
export function claimLine(claim: Pick<StoredClaim, "kind" | "text" | "source_numbers">): string {
  return claim.kind === "Gap" ? `Gap: ${claim.text}` : `${claim.text} ${claim.source_numbers.map(n => `[${n}]`).join(" ")}`;
}
// The immutable body also holds PPO's coverage lines. Preserve only that fixed grammar
// when redrawing claims, never arbitrary trailing text from the original answer.
export function answerFooter(body: string, claims: StoredClaim[]): string {
  const prefix = claims.map(claimLine).join("\n");
  if (!prefix || !body.startsWith(prefix + "\n")) return "";
  const suffix = body.slice(prefix.length);
  const names = Object.values(coverageNames).join("|");
  const coverage = new RegExp(`^Coverage: \\d+ (${names}) shown \\(limit \\d+; more exist\\)\\.$`);
  return suffix.slice(1).split("\n").every(line => coverage.test(line)
    || /^\d+ sources? left out because not everyone here can see them\.$/.test(line)
    || /^\d+ earlier messages? left out to fit the request allowance\.$/.test(line)) ? suffix : "";
}
export function renderAnswer(checked: CheckedAnswer, envelope: EvidenceEnvelope): {
  body: string; claims: StoredClaim[]; sources: StoredSource[];
} {
  const numbers = new Map<string, number>(), sources: StoredSource[] = [];
  const items = new Map(envelope.items.map(s => [s.source_id, s]));
  const claims: StoredClaim[] = checked.claims.map((claim, index) => ({
    ordinal: index + 1, kind: "Fact", text: claim.text,
    source_numbers: claim.source_ids.map(id => {
      if (!numbers.has(id)) {
        const item = items.get(id);
        if (!item) throw new Error("InvalidCitation");
        const number = numbers.size + 1;
        numbers.set(id, number);
        sources.push({
          number, type: item.type, record_id: item.record_id, source_version: item.source_version,
          retrieved_at: item.retrieved_at,
        });
      }
      return numbers.get(id)!;
    }),
  }));
  for (const text of checked.gaps)
    claims.push({ ordinal: claims.length + 1, kind: "Gap", text, source_numbers: [] });
  return { body: [...claims.map(claimLine), ...coverageLines(envelope)].join("\n"), claims, sources };
}
export const declineBody = () => `${agentName} can't help with that request.`;
