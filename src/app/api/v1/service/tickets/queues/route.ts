import { ticketQueues } from "../../../../../../service/intake";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => ticketQueues(p, q));
