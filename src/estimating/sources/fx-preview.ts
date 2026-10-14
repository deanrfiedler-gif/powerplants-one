import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { companyContext } from "../../shared/authority";
import { object, uuid, invalid } from "../../shared/validation";
import { sourceContent } from "./validation";
import { fxReviewHash } from "./fx";

export async function previewFxSource(p: Principal, value: unknown) {
  const input = object(value, ["company_id", "content"]),
    company = uuid(input.company_id, "company_id"),
    content = sourceContent(input.content);
  if (!content.fx)
    invalid("fx", "Retain explicit original foreign prices and rate evidence.");
  const fx_review_hash = fxReviewHash(content.fx);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await companyContext(c, p, company, null, "estimating.read");
    await companyContext(c, p, company, null, "estimating.edit");
    return {
      company_id: company,
      content,
      fx_review_hash,
      synthetic: true,
      saved: false,
    };
  });
}
