import { readRoute, commandRoute } from "../../../../../shared/http";
import { listReleases } from "../../../../../cpq/reads";
import { saveRelease } from "../../../../../cpq/releases";
export const GET = readRoute((p, _id, q) => listReleases(p, q));
export const POST = commandRoute((p, _id, v) => saveRelease(p, v));
