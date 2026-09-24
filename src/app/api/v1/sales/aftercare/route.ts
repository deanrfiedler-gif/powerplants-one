import {
  listAftercare,
  createAftercare,
} from "../../../../../sales/aftercare-service";
import { readRoute, commandRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listAftercare(p, q.opportunity_id));
export const POST = commandRoute((p, _id, v) => createAftercare(p, v));
