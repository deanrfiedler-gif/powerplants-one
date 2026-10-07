import { readRoute, commandRoute } from "../../../../../../shared/http";
import {
  readSalesFollowup,
  linkSalesFollowup,
} from "../../../../../../sales/followup";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readSalesFollowup(p, id!, q));
export const POST = commandRoute((p, id, v) => linkSalesFollowup(p, id!, v));
