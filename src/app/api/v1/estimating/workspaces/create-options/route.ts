import { readRoute } from "../../../../../../shared/http";
import { discoveryCreationOptions } from "../../../../../../estimating/discovery-creation-context";
export const GET = readRoute((p, _id, q) => discoveryCreationOptions(p, q));
export const dynamic = "force-dynamic";
