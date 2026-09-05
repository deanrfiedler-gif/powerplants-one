import { renameOrganisation } from "../../../../../../shared/commands";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(async (p, id, b) => {
  void id;
  return renameOrganisation(p, id, b);
}, false);
