import { readRoute } from "../../../../../../shared/http";
import { contactWorkspace } from "../../../../../../shared/contacts/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(contactWorkspace);
