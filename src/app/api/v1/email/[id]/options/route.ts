import { emailOptions } from "../../../../../../email/service";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p,id)=>emailOptions(p,id));
