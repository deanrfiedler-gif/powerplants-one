import { createFacilityDetails } from "../../../../../shared/facilities/commands";
import { commandRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(
  (p, id, b) => createFacilityDetails(p, b),
  true,
);
