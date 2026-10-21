import { siteOverview } from "../../../../../../shared/sites";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => siteOverview(p, id));
