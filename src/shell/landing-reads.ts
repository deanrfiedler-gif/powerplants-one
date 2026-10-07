import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { database } from "../platform/database";
import { requireCapability } from "../platform/permissions";
import { object } from "../shared/validation";
import { listEstimates, readEstimate } from "../estimating/reads";
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
  for (const estimate of estimates.items) {
    try {
      const record = await readEstimate(p, estimate.id);
      for (const quote of record.quotes) {
        await quoteContext(c, p, quote.id);
        items.push({ id: quote.id, reference: quote.display_number, title: estimate.title, version: quote.version, state: quote.render_state });
      }
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
