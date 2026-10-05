import { commandRoute } from "../../../../../../../../shared/http";
import { receiveAllocationEffect } from "../../../../../../../../estimating/supply-followup/shortfall-service";
export const POST = commandRoute(receiveAllocationEffect, false);
export const dynamic = "force-dynamic";
