import { readAssignment } from "../../../../../documents/use/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readAssignment(p, id, q));
