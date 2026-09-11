import {
  listEngineering,
  createEngineeringRequest,
} from "../../../../engineering/service";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listEngineering(p, q));
export const POST = commandRoute((p, _id, b) => createEngineeringRequest(p, b));
