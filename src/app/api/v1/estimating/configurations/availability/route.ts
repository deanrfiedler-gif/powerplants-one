import { readRoute } from "../../../../../../shared/http";
import { specialistAvailability } from "../../../../../../estimating/specialist/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p) => specialistAvailability(p));
