import { readRoute } from "../../../../../../../shared/http";
import { readCandidateConstraints } from "../../../../../../../estimating/fertigation/candidate-reads";
export const GET = readRoute(readCandidateConstraints);
export const dynamic = "force-dynamic";
