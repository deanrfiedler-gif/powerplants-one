import { readRoute } from "../../../../../../../shared/http";
import { readEstimateProducts } from "../../../../../../../cpq/reads";
export const GET = readRoute(readEstimateProducts);
export const dynamic = "force-dynamic";
