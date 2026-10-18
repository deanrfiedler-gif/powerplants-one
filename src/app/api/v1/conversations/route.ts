import { listThreads } from "../../../../conversations/reads";
import { startThread } from "../../../../conversations/commands";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listThreads(p, q));
export const POST = commandRoute((p, _id, b) => startThread(p, b));
