import { readEmail } from "../../../../../email/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p,id)=>readEmail(p,id));
