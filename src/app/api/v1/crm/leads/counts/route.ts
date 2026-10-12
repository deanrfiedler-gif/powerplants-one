import { countLeads } from "../../../../../../crm/leads/register";
import { readRoute } from "../../../../../../shared/http";

export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => countLeads(p, q));
