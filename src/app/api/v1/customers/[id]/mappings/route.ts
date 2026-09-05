import { envelope, mappingViews } from "../../../../../../shared/reads";
import { proposeMapping } from "../../../../../../shared/commands";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id, q) => {
  void id;
  void q;
  return envelope(await mappingViews(p, id));
});
export const POST = commandRoute(async (p, id, b) => {
  void id;
  return proposeMapping(p, id, b);
});
