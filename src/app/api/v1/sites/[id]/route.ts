import { envelope, siteContext } from "../../../../../shared/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id, q) => {
  void id;
  void q;
  return envelope([await siteContext(p, id)]);
});
