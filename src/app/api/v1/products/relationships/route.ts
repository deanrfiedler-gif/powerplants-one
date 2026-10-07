import { readRoute, commandRoute } from "../../../../../shared/http";
import { listRelationships } from "../../../../../products/relationships";
export const GET = readRoute((p, _id, q) => listRelationships(p, q));
import { createRelationship } from "../../../../../products/relationships";
export const POST = commandRoute((p, _id, b) => createRelationship(p, b), true);
export const dynamic = "force-dynamic";
