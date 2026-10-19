// The context panel (PPO-CONV-T1C-DESIGN 11): what each item is and why it is there. Shared by the server read, which
// assembles the panel from the viewer's own access, and the page, which draws it. Nothing here reads a database.
import type { AnchorType } from "./model";

export const recordNoun = { Opportunity: "deal", Project: "project" } as const satisfies Record<AnchorType, string>;

// "Alex", "Alex and Sam", "Alex, Sam and Priya", then "Alex, Sam and 3 others" so a reason stays one line.
export function nameList(names: readonly string[]) {
  const unique = [...new Set(names)];
  if (unique.length <= 1) return unique[0] ?? "";
  if (unique.length <= 3) return `${unique.slice(0, -1).join(", ")} and ${unique.at(-1)}`;
  return `${unique.slice(0, 2).join(", ")} and ${unique.length - 2} others`;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// A civil day ("2026-10-30") is shown as written, with no time zone conversion: "30 Oct 2026".
export function civilDate(day: string) {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

export type ContextFact = { label: string; value: string };
// The Record card: the record's stage or state, its owner, customer and key dates, and the reader's own access.
export function recordFacts(r: {
  type: AnchorType;
  state: string;
  owner: string;
  customer: string;
  dates: { label: string; value: string | null }[];
}): ContextFact[] {
  return [
    { label: r.type === "Opportunity" ? "Stage" : "State", value: r.state },
    { label: r.type === "Opportunity" ? "Owner" : "Coordinator", value: r.owner },
    ...(r.customer ? [{ label: "Customer", value: r.customer }] : []),
    ...r.dates.map((d) => ({ label: d.label, value: d.value ? civilDate(d.value) : "Not set" })),
    { label: "Your access", value: `Can open this ${recordNoun[r.type]}` },
  ];
}
export type ContextItem = {
  // Stable within one read: the item's type and ID, so a record linked and mentioned appears once.
  key: string;
  title: string;
  detail: string | null;
  why: string[];
  // An address in PPO, or null when the item has no page the viewer can open.
  href: string | null;
  // Contact details, present only for a reader who may read them.
  phone?: string | null;
  email?: string | null;
};
export type ThreadContext = {
  thread_id: string;
  observed_at: string;
  // "deal" or "project", for the panel's empty-group wording.
  noun: (typeof recordNoun)[AnchorType];
  record: {
    type: AnchorType;
    id: string;
    title: string;
    href: string;
    facts: ContextFact[];
    why: string;
  };
  documents: ContextItem[];
  contacts: ContextItem[];
  related: ContextItem[];
  thread: ContextItem[];
};

// Items found by more than one route keep one entry with every reason, in the order they were found.
export function mergeItems(items: readonly ContextItem[]) {
  const merged = new Map<string, ContextItem>();
  for (const item of items) {
    const seen = merged.get(item.key);
    if (!seen) merged.set(item.key, { ...item, why: [...item.why] });
    else for (const reason of item.why) if (!seen.why.includes(reason)) seen.why.push(reason);
  }
  return [...merged.values()];
}

export const mentionedBy = (authors: readonly string[]) => `Mentioned by ${nameList(authors)}`;
