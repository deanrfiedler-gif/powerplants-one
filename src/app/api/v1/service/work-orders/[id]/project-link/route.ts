import { linkWorkOrderProject } from "../../../../../../../service/project-field-work";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(linkWorkOrderProject, false);
