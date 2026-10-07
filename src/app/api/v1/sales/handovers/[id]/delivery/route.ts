import { readRoute, commandRoute } from "../../../../../../../shared/http";
import { readDeliveryBinding, bindDelivery } from "../../../../../../../sales/delivery-binding";
export const dynamic = "force-dynamic";
export const GET = readRoute((p,id,q)=>readDeliveryBinding(p,id!,q));
export const POST = commandRoute((p,id,v)=>bindDelivery(p,id!,v));
