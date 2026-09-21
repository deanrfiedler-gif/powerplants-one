import { readRoute } from "../../../../../../../shared/http";
import { readConfigurationEvidence } from "../../../../../../../estimating/discovery-reads";
export const GET = readRoute(readConfigurationEvidence);
export const dynamic = "force-dynamic";
