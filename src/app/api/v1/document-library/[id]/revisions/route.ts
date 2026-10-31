import { reviseDocument } from "../../../../../../library/commands";
import { documentRevisions } from "../../../../../../library/reads";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(reviseDocument);

export const GET = readRoute(documentRevisions);
