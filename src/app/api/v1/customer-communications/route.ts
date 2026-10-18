import { listCustomerCommunications } from "../../../../communications";
import { readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listCustomerCommunications(p, q));
