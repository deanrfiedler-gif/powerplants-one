import { listPlannableParents } from "../../../../../crm/planning-gaps";
import { requireCapability } from "../../../../../platform/permissions";
import { database } from "../../../../../platform/database";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p) => {
  await requireCapability(database(), p, "activity.read");
  return listPlannableParents(p);
});
