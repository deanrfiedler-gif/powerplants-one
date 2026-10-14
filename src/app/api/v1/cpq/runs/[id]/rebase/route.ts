import { commandRoute } from "../../../../../../../shared/http";
import { rebaseRun } from "../../../../../../../cpq/rebase";
import { decisionBodyBytes } from "../../../../../../../cpq/http-limits";
export const POST = commandRoute(rebaseRun, true, decisionBodyBytes);
