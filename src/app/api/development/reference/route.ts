import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { developmentRequest } from "../../../../development/access";
import {
  buildCatalog,
  readReference,
  resourcesFor,
} from "../../../../development/catalog";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!developmentRequest(request.headers))
    return new Response("Not found", { status: 404 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    const item = resourcesFor(await buildCatalog(process.cwd())).find(
      (r) => r.id === id && !r.missing,
    );
    if (!item) return new Response("Reference unavailable", { status: 404 });
    if (
      request.nextUrl.searchParams.has("sha") &&
      request.nextUrl.searchParams.get("sha") !== item.sha256
    )
      return new Response(
        "This reference changed. Close the reader and refresh the working register.",
        { status: 409 },
      );
    const bytes = await readReference(process.cwd(), item.path);
    if (createHash("sha256").update(bytes).digest("hex") !== item.sha256)
      return new Response(
        "Reference changed during reading. Refresh the register.",
        { status: 409 },
      );
    const mime =
      item.type === "html"
        ? "text/html; charset=utf-8"
        : item.type === "image"
          ? item.path.endsWith(".png")
            ? "image/png"
            : item.path.endsWith(".webp")
              ? "image/webp"
              : "image/jpeg"
          : "text/plain; charset=utf-8";
    const sandbox =
      "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": sandbox,
        "Content-Disposition": `${request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="${item.path
          .split("/")
          .at(-1)!
          .replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      },
    });
  } catch {
    return new Response("Reference unavailable", { status: 404 });
  }
}
