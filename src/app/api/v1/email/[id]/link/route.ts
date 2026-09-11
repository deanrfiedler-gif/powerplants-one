import { linkEmail } from "../../../../../../email/service";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute((p,id,b)=>linkEmail(p,id,b));
