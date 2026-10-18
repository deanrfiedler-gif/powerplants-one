import { customerCommunicationQueue } from "../../../../../communications";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => customerCommunicationQueue(p, q));
