import { commandRoute } from "../../../../../../../shared/http";
import { prepareSupplyReturn } from "../../../../../../../maintenance/supply-return";

export const POST = commandRoute(prepareSupplyReturn, false);
