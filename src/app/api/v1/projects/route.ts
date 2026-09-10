import { listProjects, createProject } from "../../../../projects/service";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listProjects(p, q));
export const POST = commandRoute((p, _id, b) => createProject(p, b));
