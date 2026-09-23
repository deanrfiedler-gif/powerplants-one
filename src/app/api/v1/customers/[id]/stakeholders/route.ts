import { readRoute } from "../../../../../../shared/http";
import { stakeholders } from "../../../../../../shared/contacts/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(stakeholders);
