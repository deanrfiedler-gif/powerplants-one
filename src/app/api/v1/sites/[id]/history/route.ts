import { recordHistory } from "../../../../../../shared/commands";
import { siteHistory } from "../../../../../../shared/context";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(async (p, id, b) => {
  void id;
  return recordHistory(p, id, b);
});

export const GET = readRoute((p, id, q) => siteHistory(p, id, q));
