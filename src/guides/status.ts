import type { GuideFrontMatter } from "./model";

export type GuideState = "Draft" | "In review" | "Reviewed" | "Changes awaiting review" | "Superseded" | "Withdrawn";

// A guide reads as Reviewed only while its reviewed content hash still matches the text on disk. The status word
// records an intention; the reviewer, date and matching hash are the evidence, so a missing or stale piece of
// evidence never reads as reviewed. An empty string counts as missing.
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
      const evidenced = Boolean(front.reviewer && front.reviewed_at && front.reviewed_content_hash);
      return evidenced && front.reviewed_content_hash === contentHash ? "Reviewed" : "Changes awaiting review";
    }
  }
}
