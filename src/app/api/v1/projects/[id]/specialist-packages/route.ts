import { commandRoute, readRoute } from "../../../../../../shared/http";
import { commandPackage } from "../../../../../../projects/specialist/commands";
import { readPackages } from "../../../../../../projects/specialist/reads";
export const runtime = "nodejs";
export const GET = readRoute(readPackages);
export const POST = commandRoute(commandPackage);
