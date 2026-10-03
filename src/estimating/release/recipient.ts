import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { visibleOpportunity, relationshipContext } from "../../crm/context";
import { canonical } from "../../platform/operations";
import { digest } from "../../documents/store";
import type { Estimate, QuoteRevision, EstimateCap } from "../context";
import type { ReleaseBase } from "./context";

// Applies to every existing quote read/file/render route, not only the new release page.
export async function releaseRecipientAuthority(
  c: QueryClient,
  p: Principal,
  q: QuoteRevision,
  e: Estimate,
  cap: EstimateCap,
) {
  if (q.template_version !== "PPO-SYN-RELEASE-r01") return;
  const b = (
    await c.query<ReleaseBase>(
      "SELECT * FROM ppo.quote_release_bases WHERE workspace_id=$1 AND revision_id=$2",
      [p.workspace_id, q.id],
    )
  ).rows[0];
  if (!b || digest(canonical(b.basis)) !== b.basis_hash) throw unavailable();
  const o = await visibleOpportunity(c, p, e.opportunity_id),
    r = b.basis.recipient;
  await relationshipContext(
    c,
    p,
    {
      ...o,
      organisation_id: r.organisation_id,
      primary_person_id: r.person_id,
      site_id: r.site_id,
    },
    cap,
  );
}
