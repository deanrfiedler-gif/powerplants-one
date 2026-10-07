import { readRoute,commandRoute } from "../../../../../../../shared/http";
import { readEstimatingBinding,bindEstimatingWorkspace } from "../../../../../../../sales/estimating-binding";
export const dynamic="force-dynamic";
export const GET=readRoute((p,id)=>readEstimatingBinding(p,id!));
export const POST=commandRoute((p,id,v)=>bindEstimatingWorkspace(p,id!,v));
