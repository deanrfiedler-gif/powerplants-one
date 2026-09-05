import { readIntake } from "../../../../../../service/intake";
import { readRoute } from "../../../../../../shared/http";
import { envelope } from "../../../../../../shared/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id) =>
  envelope([await readIntake(p, id)]),
);
