import { readPeople } from "../../../../../../../engineering/materials/reads";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readPeople(p, id, q));
