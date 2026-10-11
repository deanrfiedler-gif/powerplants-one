import { readRoute } from "../../../../../../../../shared/http";
import { recoverLocalTeam } from "../../../../../../../../access/local-teams";
export const GET = readRoute((p, id) => recoverLocalTeam(p, id));
