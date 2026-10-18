// The Conversations sidebar (PPO-CONV-T1C-DESIGN 5.3): one read of the viewer's threads, filtered, counted and grouped
// on the device. T1b has no server search, and a hundred threads is enough for T1.
import type { ThreadSummary } from "./reads";
import type { ThreadFilter } from "./model";

export type ThreadGroup = { key: string; heading: string; threads: ThreadSummary[] };

const kind = { Opportunity: "Deal", Project: "Project" } as const;

// The list arrives newest first, so the order a record first appears in is its newest thread's order.
export function groupByRecord(items: ThreadSummary[]): ThreadGroup[] {
  const groups = new Map<string, ThreadGroup>();
  for (const t of items) {
    const key = `${t.anchor.type}:${t.anchor.id}`;
    const group = groups.get(key) ?? {
      key,
      heading: `${kind[t.anchor.type]} ${t.anchor.display_number} · ${t.anchor.title}`,
      threads: [],
    };
    group.threads.push(t);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export const filterCounts = (items: ThreadSummary[]) => ({
  waiting: items.filter((t) => t.waiting_on_you > 0).length,
  mentions: items.filter((t) => t.mentions_you).length,
});

export function applyFilter(items: ThreadSummary[], filter: ThreadFilter, search: string) {
  const q = search.trim().toLocaleLowerCase("en-AU");
  return items.filter(
    (t) =>
      (filter === "All" || (filter === "WaitingOnYou" ? t.waiting_on_you > 0 : t.mentions_you)) &&
      (!q ||
        t.title.toLocaleLowerCase("en-AU").includes(q) ||
        t.anchor.display_number.toLocaleLowerCase("en-AU").includes(q) ||
        t.anchor.title.toLocaleLowerCase("en-AU").includes(q)),
  );
}

export const rowState = (t: ThreadSummary) =>
  t.state === "Resolved" ? "Resolved" : t.waiting_on_you > 0 ? "Waiting on you" : "Open";

export const preferredThread = (items: ThreadSummary[]) =>
  (items.find((t) => t.state === "Open" && t.waiting_on_you > 0) ?? items[0])?.id ?? null;
