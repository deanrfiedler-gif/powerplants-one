import type { NextRequest } from "next/server";
import { failure, identity, jsonBody, localRequest, reply } from "../../../../../platform/http";
import { chooseWorkingCompany } from "../../../../../shell/company";
export const dynamic = "force-dynamic";
// NR-18: choosing a working company narrows what this person sees; it grants nothing.
export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    const p = await identity(request);
    return reply(await chooseWorkingCompany(p, await jsonBody(request)));
  } catch (error) {
    return failure(error);
  }
}
