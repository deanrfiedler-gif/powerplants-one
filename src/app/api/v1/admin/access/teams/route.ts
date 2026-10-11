import { readRoute, commandRoute } from "../../../../../../shared/http";
import {
  localTeams,
  createLocalTeam,
} from "../../../../../../access/local-teams";
export const GET = readRoute((p, _id, query) => localTeams(p, query));
export const POST = commandRoute((p, _id, input) => createLocalTeam(p, input));
