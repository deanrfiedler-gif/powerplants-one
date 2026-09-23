import { commandRoute } from "../../../../../../shared/http";
import { setSitePrimaryContact } from "../../../../../../shared/contacts/commands";
export const POST = commandRoute(setSitePrimaryContact, false);
