import { readRoute } from "../../../../../../shared/http";
import { prepareBookingPolicy } from "../../../../../../scheduling/booking-policy";
export const GET = readRoute(prepareBookingPolicy);
