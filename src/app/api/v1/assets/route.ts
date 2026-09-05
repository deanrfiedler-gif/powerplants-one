import { listShared } from "../../../../shared/reads";
import { createAsset } from "../../../../shared/commands";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id, q) => {
  void id;
  void q;
  return listShared(p, "Asset", q);
});
export const POST = commandRoute(async (p, id, b) => {
  void id;
  return createAsset(p, b);
});
