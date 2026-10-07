import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { database } from "../platform/database";
import { requireCapability } from "../platform/permissions";
import { object } from "../shared/validation";
import { listEstimates } from "../estimating/reads";
import { quoteContext } from "../estimating/context";
import { financeOptions } from "../finance/reads";
import { financeAccount } from "../finance/context";

// Index adapters reuse the same scoped list and exact-record guards as the
// existing workspaces. They neither choose an arbitrary record nor grant access.
export async function quotationLanding(p: Principal, query: unknown) {
  const input = object(query, ["offset", "q"]);
  const c = database();
  await requireCapability(c, p, "estimating.quote.read");
  const estimates = await listEstimates(p, input as Record<string,string>);
  const items: { id: string; reference: string; title: string; version: number; state: string }[] = [];
  const titles = new Map(estimates.items.map(estimate => [estimate.id, estimate.title]));
  // Read only quotation identity/state for this already scoped estimate window.
  // Loading full cost workbooks for 100 estimates is unnecessary for discovery.
  const quotes = estimates.items.length ? (await c.query<{id:string;estimate_id:string;reference:string;version:number;state:string}>(`SELECT q.id,q.estimate_id,h.display_number AS reference,q.version,j.state FROM ppo.draft_quote_revisions q JOIN ppo.draft_quotes h ON (h.workspace_id,h.id)=(q.workspace_id,q.quote_id) JOIN ppo.estimate_quote_jobs j ON j.revision_id=q.id WHERE q.workspace_id=$1 AND q.estimate_id=ANY($2::uuid[]) ORDER BY q.created_at DESC,q.id`,[p.workspace_id,estimates.items.map(e=>e.id)])).rows : [];
  for (const quote of quotes) {
    try {
      await quoteContext(c, p, quote.id);
      items.push({ id: quote.id, reference: quote.reference, title: titles.get(quote.estimate_id)!, version: quote.version, state: quote.state });
    } catch (error) {
      if (!(error instanceof AppError) || ![403, 404].includes(error.status)) throw error;
    }
  }
  return { items, offset: estimates.offset, next_offset: estimates.next_offset, basis: "Permitted saved quotation revisions in this window of up to 100 recently updated estimates. Continue through older estimate windows; this is not a complete quotation register. Draft output is not customer acceptance.", synthetic: true };
}
export async function accountLanding(p: Principal, query: unknown) {
  object(query, []);
  const c = database();
  await requireCapability(c, p, "finance.account.read");
  const options = await financeOptions(p, {}), items: { id: string; customer_id: string; label: string }[] = [];
  for (const account of options.accounts) {
    try {
      await financeAccount(c, p, account.id);
      items.push({ id: account.id, customer_id: account.customer_id, label: `${account.fixture_key} · ${account.currency} · ${account.status}` });
    } catch (error) {
      if (!(error instanceof AppError) || ![403, 404].includes(error.status)) throw error;
    }
  }
  return { items, synthetic: true };
}
