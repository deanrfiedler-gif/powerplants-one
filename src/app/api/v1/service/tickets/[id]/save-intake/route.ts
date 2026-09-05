import { saveIntake } from "../../../../../../../service/intake";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => saveIntake(p, id, b), false);
