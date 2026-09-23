import { commandRoute } from "../../../../../../shared/http";
import { revisePerson } from "../../../../../../shared/contacts/commands";
export const POST = commandRoute(revisePerson, false);
