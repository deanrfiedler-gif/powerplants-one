import { listPacks, createPack } from "../../../../documents/packs";
import { readRoute, commandRoute } from "../../../../shared/http";
export const GET = readRoute(listPacks);
export const POST = commandRoute((p,_id,input)=>createPack(p,input));
