import { commandRoute } from "../../../../../../../shared/http";
import { applySourceRefresh } from "../../../../../../../estimating/sources/refresh";
export const POST=commandRoute(applySourceRefresh,false);
export const dynamic="force-dynamic";
