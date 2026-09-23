import { readRoute } from "../../../../../../../shared/http";
import { primaryContactOptions } from "../../../../../../../shared/contacts/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(primaryContactOptions);
