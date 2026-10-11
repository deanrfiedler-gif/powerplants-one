import { commandRoute } from "../../../../../../../shared/http";
import { reviewRelationship } from "../../../../../../../products/relationships";
export const POST = commandRoute(
  (p, id, b) => reviewRelationship(p, id, b),
  false,
);
export const dynamic = "force-dynamic";
