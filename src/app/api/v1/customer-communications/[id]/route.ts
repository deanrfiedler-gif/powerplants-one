import { readCustomerCommunication } from "../../../../../communications";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => readCustomerCommunication(p, id));
