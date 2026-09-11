import { changeDealStage } from "../../../../../../../crm/refinements";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(changeDealStage, false);
