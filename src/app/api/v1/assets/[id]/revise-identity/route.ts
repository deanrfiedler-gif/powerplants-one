import { reviseAssetIdentity } from "../../../../../../shared/commands";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(async (p, id, b) => {
  void id;
  return reviseAssetIdentity(p, id, b);
}, false);
