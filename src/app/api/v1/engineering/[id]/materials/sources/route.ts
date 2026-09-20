import { readSources } from "../../../../../../../engineering/materials/reads";
import { sourceCommand } from "../../../../../../../engineering/materials/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readSources(p, id, q));
export const POST = commandRoute((p, id, b) => sourceCommand(p, id, b));
