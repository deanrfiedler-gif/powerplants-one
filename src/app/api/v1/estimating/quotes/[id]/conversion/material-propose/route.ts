import { commandRoute } from "../../../../../../../../shared/http";
import { executeMaterial } from "../../../../../../../../estimating/supply-followup/material-service";
export const POST = commandRoute(
  (p, id, value) => executeMaterial(p, id, "MaterialPropose", value),
  false,
);
export const dynamic = "force-dynamic";
