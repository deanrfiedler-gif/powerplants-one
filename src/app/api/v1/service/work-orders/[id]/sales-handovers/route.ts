import { readRoute } from "../../../../../../../shared/http";
import { readDeliverySalesSources } from "../../../../../../../sales/delivery-binding";
export const dynamic = "force-dynamic";
export const GET = readRoute((p,id)=>readDeliverySalesSources(p,"Service",id!));
