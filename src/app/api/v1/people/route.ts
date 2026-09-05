import { listShared } from "../../../../shared/reads";
import { createPerson } from "../../../../shared/commands";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id, q) => {
  void id;
  void q;
  return listShared(p, "Person", q);
});
export const POST = commandRoute(async (p, id, b) => {
  void id;
  return createPerson(p, b);
});
