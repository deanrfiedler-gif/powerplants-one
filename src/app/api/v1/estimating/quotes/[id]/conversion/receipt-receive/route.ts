import { commandRoute } from "../../../../../../../../shared/http";
import { receiveReceiptEffect } from "../../../../../../../../estimating/supply-followup/receipt-service";
export const POST = commandRoute(receiveReceiptEffect, false);
export const dynamic = "force-dynamic";
