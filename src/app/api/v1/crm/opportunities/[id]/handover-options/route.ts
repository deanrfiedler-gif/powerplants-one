import { ownerTransferOptions } from "../../../../../../../crm/owner-transfer";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p,id,q)=>ownerTransferOptions(p,id,q));
