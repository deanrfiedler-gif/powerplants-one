import { coordinateEngineering } from "../../../../../../engineering/service";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute((p,id,b)=>coordinateEngineering(p,id,b));
