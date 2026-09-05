import { personContext } from "../../../../../shared/context";
import { readRoute } from "../../../../../shared/http";
import { envelope } from "../../../../../shared/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id) =>
  envelope([await personContext(p, id)]),
);
