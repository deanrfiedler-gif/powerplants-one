import { recoverDocument } from "../../../../../../library/commands";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(recoverDocument);
