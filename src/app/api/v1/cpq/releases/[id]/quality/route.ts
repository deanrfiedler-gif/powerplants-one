import { readRoute } from "../../../../../../../shared/http";
import { readQuality } from "../../../../../../../cpq/quality";
export const GET = readRoute(readQuality);
