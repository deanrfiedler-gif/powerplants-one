import { saveTask } from "../../../../../../projects/service";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute((p, id, b) => saveTask(p, id, b), false);
