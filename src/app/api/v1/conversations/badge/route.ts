import { conversationBadge } from "../../../../../conversations/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
// The top-bar badge (D7, PPO-CONV-T1C-DESIGN 10.1): threads the viewer takes part in with an unread message.
export const GET = readRoute((p) => conversationBadge(p));
