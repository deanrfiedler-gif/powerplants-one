import { discoveryPreviewRoute } from "../../../../../../../../estimating/discovery-http";
import { prepareExcelReview } from "../../../../../../../../estimating/import/service";
export const POST = discoveryPreviewRoute(prepareExcelReview);
export const dynamic = "force-dynamic";
