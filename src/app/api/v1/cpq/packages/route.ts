import { readRoute, commandRoute } from "../../../../../shared/http";
import { listPackages, savePackage } from "../../../../../cpq/packages";
export const GET = readRoute((p, _id, q) => listPackages(p, q));
export const POST = commandRoute(
  (p, _id, v) => savePackage(p, v),
  true,
  200000,
);
