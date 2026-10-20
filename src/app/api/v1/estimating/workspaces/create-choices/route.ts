import { readRoute } from "../../../../../../shared/http";
import { discoveryCreationChoices } from "../../../../../../estimating/discovery-creation-reads";
export const GET = readRoute(p => discoveryCreationChoices(p));
export const dynamic = "force-dynamic";
