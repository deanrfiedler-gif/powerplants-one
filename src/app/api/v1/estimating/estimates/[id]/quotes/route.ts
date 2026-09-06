import { commandRoute } from "../../../../../../../shared/http";
import { prepareQuote } from "../../../../../../../estimating/service";
export const POST=commandRoute(prepareQuote);
export const dynamic="force-dynamic";
