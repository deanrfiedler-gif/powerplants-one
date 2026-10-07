import {
  transferLeadOwner,
  leadTransferOptions,
} from "../../../../../../../crm/leads/amendments";
import { commandRoute, readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(transferLeadOwner, false);
export const GET = readRoute((p, id, q) => leadTransferOptions(p, id, q));
