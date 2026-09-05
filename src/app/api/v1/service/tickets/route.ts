import { listTickets } from "../../../../../service/intake";
import { readRoute, commandRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listTickets(p, q));
import { createTicket } from "../../../../../service/intake";
export const POST = commandRoute((p, _id, b) => createTicket(p, b));
