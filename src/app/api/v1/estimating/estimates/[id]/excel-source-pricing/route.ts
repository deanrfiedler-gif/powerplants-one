import { excelPricingRoute } from "../../../../../../../estimating/import/pricing-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (request: Parameters<typeof excelPricingRoute>[0], context: Parameters<typeof excelPricingRoute>[1]) => excelPricingRoute(request, context, true);
