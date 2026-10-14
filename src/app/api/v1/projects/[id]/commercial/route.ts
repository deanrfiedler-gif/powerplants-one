import { commandRoute, readRoute } from "../../../../../../shared/http";
import { commandCommercial } from "../../../../../../projects/commercial/commands";
import { readCommercial } from "../../../../../../projects/commercial/reads";
export const runtime="nodejs";
export const GET=readRoute(readCommercial);
export const POST=commandRoute(commandCommercial);
