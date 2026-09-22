import { readRoute } from "../../../../../../shared/http";
import { fertigationAvailability } from "../../../../../../estimating/fertigation/reads";
export const GET = readRoute((p) => fertigationAvailability(p));
