import { commandRoute } from "../../../../../../../shared/http";
import { reviewBackup } from "../../../../../../../equipment/evidence";
export const POST = commandRoute((p, id, b) => reviewBackup(p, id, b));
