import { createProposal } from "../../../../documents/drafts/commands";
import { listProposals } from "../../../../documents/drafts/reads";
import { commandRoute, readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listProposals(p, q));
export const POST = commandRoute((p, _id, b) => createProposal(p, b));
