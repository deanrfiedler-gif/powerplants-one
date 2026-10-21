import { recordTicketStatement, ticketStatements } from "../../../../../../../service/statements";
import { commandRoute, readRoute } from "../../../../../../../shared/http";
export const GET = readRoute((p,id)=>ticketStatements(p,id));
export const POST = commandRoute((p,id,b)=>recordTicketStatement(p,id,b));
