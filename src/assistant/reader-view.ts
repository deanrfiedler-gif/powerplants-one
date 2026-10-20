import type { QueryClient } from "../platform/permissions";
import { claimLine } from "./answer";
import { sourceRoute } from "./evidence";
import type { SourceType, StoredClaim, StoredSource } from "./model";
import { readableSources, sourceKey } from "./source-access";

export type ReaderClaim = Omit<StoredClaim, "text"> & { text: string | null; withheld: boolean };
export type ReaderSource =
  | { number: number; can_open: true; type: SourceType; record_id: string; label: string; route: string }
  | { number: number; can_open: false };
export const withheldStatement = "A statement from a record you can't open";

// Select names only after checking the source's own visibility. A hidden chip carries just its number.
export async function readerView(
  c: QueryClient, workspace: string, reader: string, claims: StoredClaim[], sources: StoredSource[],
): Promise<{ claims: ReaderClaim[]; sources: ReaderSource[]; body: string }> {
  const allowed = await readableSources(c, workspace, reader, sources);
  const labels: Record<SourceType, string> = {
    Opportunity: "SELECT display_number,title FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2",
    Organisation: "SELECT display_number,display_name AS title FROM ppo.organisations WHERE workspace_id=$1 AND id=$2",
    Activity: "SELECT summary AS title FROM ppo.activities WHERE workspace_id=$1 AND id=$2",
    Project: "SELECT display_number,title FROM ppo.projects WHERE workspace_id=$1 AND id=$2",
    ProjectTask: "SELECT project_id,title FROM ppo.project_tasks WHERE workspace_id=$1 AND id=$2",
    ProjectRaid: "SELECT project_id,kind AS title FROM ppo.project_raid_entries WHERE workspace_id=$1 AND id=$2",
    AcceptanceStage: "SELECT reference AS display_number,title FROM ppo.acceptance_stages WHERE workspace_id=$1 AND id=$2",
  };
  const drawn: ReaderSource[] = [];
  for (const s of sources) {
    const row = allowed.has(sourceKey(s))
      ? (await c.query(labels[s.type], [workspace, s.record_id])).rows[0] : null;
    if (!row) {
      allowed.delete(sourceKey(s));
      drawn.push({ number: s.number, can_open: false });
    } else drawn.push({
      number: s.number, can_open: true, type: s.type, record_id: s.record_id,
      label: [row.display_number, row.title].filter(Boolean).join(" · "),
      route: sourceRoute(s.type, s.record_id, row.project_id),
    });
  }
  const visible = claims.map(claim => {
    const withheld = claim.kind === "Fact" && (!claim.source_numbers.length || claim.source_numbers.some(n => {
      const s = sources.find(source => source.number === n);
      return !s || !allowed.has(sourceKey(s));
    }));
    return { ...claim, text: withheld ? null : claim.text, withheld };
  });
  return {
    claims: visible, sources: drawn,
    body: visible.map(claim => claim.withheld ? withheldStatement : claimLine({ ...claim, text: claim.text! })).join("\n"),
  };
}
