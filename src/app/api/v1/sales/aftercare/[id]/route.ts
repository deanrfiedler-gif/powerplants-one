import {
  readAftercare,
  commandAftercare,
} from "../../../../../../sales/aftercare-service";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readAftercare);
export const POST = commandRoute(commandAftercare, false);
