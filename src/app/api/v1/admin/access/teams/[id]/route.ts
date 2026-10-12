import { readRoute } from "../../../../../../../shared/http";
import { localTeam } from "../../../../../../../access/local-teams";
export const GET = readRoute((p, id) => localTeam(p, id));
