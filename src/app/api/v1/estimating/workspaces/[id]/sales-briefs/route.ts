import { readRoute } from "../../../../../../../shared/http";
import { readWorkspaceSalesBriefs } from "../../../../../../../sales/estimating-binding";
export const dynamic="force-dynamic";
export const GET=readRoute((p,id)=>readWorkspaceSalesBriefs(p,id!));
