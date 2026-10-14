import { publicationReadiness, publishTemplate } from "../../../../../../documents/publication/service";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(publicationReadiness);
export const POST = commandRoute(publishTemplate);
