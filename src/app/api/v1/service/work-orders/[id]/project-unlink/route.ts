import { unlinkWorkOrderProject } from "../../../../../../../service/project-field-work";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(unlinkWorkOrderProject, false);
