import { readRoute, commandRoute } from "../../../../../../../shared/http";
import { readNursery, saveNursery } from "../../../../../../../estimating/nursery-automation/service";
export const GET = readRoute(readNursery);
export const POST = commandRoute(saveNursery);
