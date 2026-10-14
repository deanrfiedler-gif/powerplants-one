import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { estimateContext } from "../context";
import { retainedAuthority } from "./retained";

// An accepted pricing successor refers directly to its immutable workbook basis.
// Import history continues to mean actual uploads; pricing is never another upload.
export async function excelVersionAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  versionId: string,
  edit = false,
) {
  await estimateContext(
    c,
    p,
    id,
    edit ? "estimating.edit" : "estimating.read",
    versionId,
  );
  const direct = (
    await c.query(
      "SELECT 1 FROM ppo.excel_import_history WHERE workspace_id=$1 AND estimate_id=$2 AND estimate_version_id=$3",
      [p.workspace_id, id, versionId],
    )
  ).rowCount;
  if (direct) return retainedAuthority(c, p, id, versionId, edit);
  // Original import/quotation receipts also recover during populated pre-0098 proofs.
  if (
    !(await c.query("SELECT to_regclass('ppo.excel_source_pricings') present"))
      .rows[0].present
  )
    throw unavailable();
  const row = (
    await c.query<{ import_version_id: string; predecessor_id: string }>(
      "SELECT import_version_id,predecessor_id FROM ppo.excel_source_pricings WHERE workspace_id=$1 AND estimate_id=$2 AND estimate_version_id=$3",
      [p.workspace_id, id, versionId],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await estimateContext(
    c,
    p,
    id,
    edit ? "estimating.edit" : "estimating.read",
    row.predecessor_id,
  );
  return retainedAuthority(c, p, id, row.import_version_id, edit);
}
