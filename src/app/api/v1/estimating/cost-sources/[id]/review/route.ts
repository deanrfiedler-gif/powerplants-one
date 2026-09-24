import { commandRoute } from "../../../../../../../shared/http";
import { decideCostSource } from "../../../../../../../estimating/sources/commands";
export const POST=commandRoute(decideCostSource,false);
export const dynamic="force-dynamic";
