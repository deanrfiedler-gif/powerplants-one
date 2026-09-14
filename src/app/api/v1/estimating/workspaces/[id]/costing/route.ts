import { commandRoute } from "../../../../../../../shared/http";
import { adoptDiscoveryCosting } from "../../../../../../../estimating/cost-basis-service";
export const POST=commandRoute(adoptDiscoveryCosting,false);
export const dynamic="force-dynamic";
