import type { NextRequest } from "next/server";
import { evidenceFile, exportCsv, outputFile, readPreview } from "../../../../../../../engineering/commissioning/reads";
import { failure, identity, localRequest } from "../../../../../../../platform/http";
import { choice } from "../../../../../../../shared/validation";
export const dynamic = "force-dynamic";
// Files, not JSON: the same local-request, identity, scope and duty checks as every other read, then exact bytes.
// An output or a piece of evidence is re-verified against its recorded hash on every download, and nothing is cached.
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "Referrer-Policy": "no-referrer",
};
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    localRequest(request);
    const p = await identity(request), { id } = await context.params, { kind: raw, ...query } = Object.fromEntries(request.nextUrl.searchParams), kind = choice(raw ?? "output", "kind", ["output", "evidence", "preview", "export"] as const);
    if (kind === "export") {
      const file = await exportCsv(p, id, query);
      return new Response(file.body, { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file.name}"` } });
    }
    const file = kind === "output" ? await outputFile(p, id, query) : kind === "evidence" ? await evidenceFile(p, id, query) : await readPreview(p, id, query);
    return new Response(new Uint8Array(file.body), { headers: { ...headers, "Content-Type": file.type, "Content-Disposition": `${file.disposition}; filename="${file.name}"`, ...("sha256" in file ? { "X-Content-SHA256": file.sha256 } : {}) } });
  } catch (error) {
    return failure(error);
  }
}
