import { readPartyNumbers, setPartyNumbers } from "../../../../../../calls/party-numbers";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => readPartyNumbers(p, "Organisation", id));
export const POST = commandRoute((p, id, b) => setPartyNumbers(p, "Organisation", id, b), false);
