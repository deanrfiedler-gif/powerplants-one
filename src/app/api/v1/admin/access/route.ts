import { readRoute } from "../../../../../shared/http";
import { accessPeople } from "../../../../../access/service";
export const GET = readRoute((p, _id, query) => accessPeople(p, query));
