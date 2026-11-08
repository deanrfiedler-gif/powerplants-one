// Frozen main 78fe5732b88a93bb16f1e5ce820fe2828112bbb4 src/activities/work-reviews.ts; import paths only.
// Shared SH-06 projection feeds the overview, navigation and full queue.
import type { Principal } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { reviewSources } from "./review-sources-per-row";
import { inReviewView, type ReviewTask } from "../../src/reviews/model";
export type ReviewItem = ReviewTask;
export async function listWorkReviews(p:Principal, filters:{company_id:string|null;limit:number}) {
  const result=await reviewSources(p,filters.company_id);
  if(result.sources.every(s=>s.state==="denied")) return null;
  // Existing summary surfaces cannot qualify a partial number: withhold it on source failure.
  if(result.sources.some(s=>s.state==="unavailable")) throw new AppError(503,"ReviewSourceUnavailable","A review source could not be checked. Open Reviews & handovers for source status.");
  const items=result.items.filter(t=>inReviewView(t,"mine",p.actor_id) || (t.source==="FinanceHandoff" && t.current && t.actionable && !t.owner_id));
  items.sort((a,b)=>(a.submitted_at??"z").localeCompare(b.submitted_at??"z")||a.id.localeCompare(b.id));
  return {total:items.length,items:items.slice(0,filters.limit),bounded:result.sources.some(s=>s.bounded)};
}
