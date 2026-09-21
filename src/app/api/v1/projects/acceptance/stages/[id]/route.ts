import { readStage } from "../../../../../../../projects/acceptance/reads";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => readStage(p, id));
