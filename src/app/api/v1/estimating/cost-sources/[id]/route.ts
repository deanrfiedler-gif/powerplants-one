import { readRoute,commandRoute } from "../../../../../../shared/http";
import { readCostSource } from "../../../../../../estimating/sources/reads";
import { reviseCostSource } from "../../../../../../estimating/sources/commands";
export const GET=readRoute(readCostSource);
export const POST=commandRoute(reviseCostSource,false);
export const dynamic="force-dynamic";
