import { setFacilityPin } from "../../../../../../shared/facilities/commands";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute((p, id, b) => setFacilityPin(p, id, b), false);
