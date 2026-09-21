import { readRoute } from "../../../../../shared/http";
import { specialistPost } from "../../../../../estimating/specialist/http";
import { listConfigurations } from "../../../../../estimating/specialist/reads";
import { createConfiguration } from "../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listConfigurations(p, q));
export const POST = specialistPost(
  (p, _id, v) => createConfiguration(p, v),
  true,
);
