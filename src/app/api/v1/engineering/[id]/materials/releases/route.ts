import { readReleases } from "../../../../../../../engineering/materials/reads";
import { releaseCommand } from "../../../../../../../engineering/materials/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readReleases(p, id, q));
export const POST = commandRoute((p, id, b) => releaseCommand(p, id, b));
