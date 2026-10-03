import { quoteTemplate, type SafeQuote } from "../template";
import { digest } from "../../documents/store";
import { releasePolicy, releasePolicyHash } from "./policy";

const escape = (v: string | number) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
// Reuse the exact E1 brand assets and document styling; never edit or regenerate an old Draft.
const layout = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{REFERENCE}} synthetic release {{REVISION}}</title><style>{{STYLE}}</style></head><body><header><img src="data:image/png;base64,{{LOGO}}" alt="Powerplants Australia"><span class="draft">SYNTHETIC · NO COMMERCIAL VALIDITY</span></header><h1>{{TITLE}}</h1><p class="ref">{{REFERENCE}} · Quotation revision {{REVISION}}</p><p class="note">{{TERMS}}</p><section><h2>Prepared for</h2><p>{{RECIPIENT}}</p></section><section><h2>Included scope</h2><p>{{INCLUDED}}</p></section><section><h2>Pricing</h2><table><thead><tr><th>Description</th><th>Quantity / unit</th><th class="amount">AUD</th></tr></thead><tbody>{{ROWS}}</tbody></table><p class="total">Synthetic total AUD {{TOTAL}}</p><p>Excluding tax. Tax has not been calculated. Operative commercial terms and validity period: Not configured.</p></section><section><h2>Excluded scope</h2><p>{{EXCLUDED}}</p></section><section><h2>Assumptions</h2><p>{{ASSUMPTIONS}}</p></section><section><h2>Demonstration conditions</h2><p>{{TERMS}}</p><p>Template {{TEMPLATE}} · Conditions {{TERMS_VERSION}}. Preparation, approval, exact issue, simulated distribution and recorded response are separate server facts. This copy alone proves none of those actions.</p></section><footer>Powerplants One · {{REFERENCE}} · Synthetic quotation revision {{REVISION}} · No commercial validity</footer></body></html>`;
const rowLayout =
  '<tr><td>{{DESCRIPTION}}</td><td>{{QUANTITY}}</td><td class="amount">{{AMOUNT}}</td></tr>';
const fill = (s: string, values: Record<string, string>) =>
  s.replace(/\{\{([A-Z_]+)\}\}/g, (_m, k: string) => values[k]);
export async function releaseTemplate(snapshot: SafeQuote) {
  const original = await quoteTemplate(snapshot);
  const { style, logo } = JSON.parse(original.template_definition) as {
    style: string;
    logo: string;
  };
  const definition = JSON.stringify({
    version: releasePolicy.template_version,
    layout,
    rowLayout,
    style,
    logo,
    policy: releasePolicy,
    policy_hash: releasePolicyHash,
  });
  const rows = snapshot.items
    .map((i) =>
      fill(rowLayout, {
        DESCRIPTION: escape(i.description),
        QUANTITY: i.quantity
          ? `${escape(i.quantity)} ${escape(i.unit ?? "")}`
          : "Included",
        AMOUNT: escape(i.amount),
      }),
    )
    .join("");
  const html = fill(layout, {
    STYLE: style,
    LOGO: logo,
    REFERENCE: escape(snapshot.display_number),
    REVISION: String(snapshot.revision),
    TITLE: escape(snapshot.title),
    RECIPIENT: escape(
      `${snapshot.customer}\nSite: ${snapshot.site ?? "Not configured"}\nContact: ${snapshot.contact ?? "Not configured"}`,
    ),
    INCLUDED: escape(snapshot.scope.included),
    EXCLUDED: escape(snapshot.scope.excluded),
    ASSUMPTIONS: escape(snapshot.scope.assumptions),
    ROWS: rows,
    TOTAL: escape(snapshot.total),
    TERMS: escape(releasePolicy.terms),
    TERMS_VERSION: releasePolicy.terms_version,
    TEMPLATE: releasePolicy.template_version,
  });
  return {
    html,
    template_definition: definition,
    template_hash: digest(definition),
    input_hash: digest(html),
    template_version: releasePolicy.template_version,
  };
}
