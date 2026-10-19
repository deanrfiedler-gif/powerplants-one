import { readThreadContext } from "../../../../../../conversations/context";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
// The context panel (PPO-CONV-T1C-DESIGN 11): rebuilt for the viewer on every read; nothing is stored (S5).
export const GET = readRoute((p, id) => readThreadContext(p, id));
