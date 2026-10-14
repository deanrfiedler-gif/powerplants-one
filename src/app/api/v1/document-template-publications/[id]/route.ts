import { readPublication } from "../../../../../documents/publication/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readPublication);
