import { createDocument } from "../../../../library/commands";
import { listDocuments } from "../../../../library/reads";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listDocuments(p, q));
export const POST = commandRoute((p, _id, b) => createDocument(p, b));
