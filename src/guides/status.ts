import type { GuideFrontMatter } from "./model";

export type GuideState = "Draft" | "In review" | "Reviewed" | "Changes awaiting review" | "Superseded" | "Withdrawn";

// Text with at least one character a reader can see. Whitespace, control and invisible format characters do not
// count, nor do combining marks on their own, the Hangul fillers and the blank braille pattern, which display as blank.
export const hasVisibleText = (value: unknown): value is string =>
  typeof value === "string" && /[^\s\p{Cc}\p{Cf}\p{M}ᅟᅠㅤﾠ⠀]/u.test(value);

// A guide reads as Reviewed only while its reviewed content hash still matches the text on disk. The status word
// records an intention; the reviewer, date and matching hash are the evidence, so a missing or stale piece of
// evidence never reads as reviewed. A value with no visible character, or that is not text, counts as missing.
export function guideStateFor(front: GuideFrontMatter, contentHash: string): GuideState {
  switch (front.status) {
    case "Draft":
      return "Draft";
    case "InReview":
      return "In review";
    case "Superseded":
      return "Superseded";
    case "Withdrawn":
      return "Withdrawn";
    case "Reviewed":
    case "Published": {
      const evidenced = hasVisibleText(front.reviewer) && hasVisibleText(front.reviewed_at) && hasVisibleText(front.reviewed_content_hash);
      return evidenced && front.reviewed_content_hash === contentHash ? "Reviewed" : "Changes awaiting review";
    }
  }
}
