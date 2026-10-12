import { readRoute } from "../../../../../../../shared/http";
import { localTeamContext } from "../../../../../../../access/local-teams";
export const GET = readRoute((p) => localTeamContext(p));
