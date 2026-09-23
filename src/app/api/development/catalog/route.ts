import type { NextRequest } from "next/server";
import { developmentRequest } from "../../../../development/access";
import {
  buildCatalog,
  readGuides,
  readMaster,
} from "../../../../development/catalog";
import { matchEntry } from "../../../../development/model";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!developmentRequest(request.headers))
    return new Response("Not found", { status: 404 });
  try {
    let key = request.nextUrl.searchParams.get("guide");
    const pathname = request.nextUrl.searchParams.get("pathname");
    if (pathname) {
      key =
        matchEntry((await readMaster(process.cwd())).entries, pathname)
          ?.guide_key || null;
      if (!key) return new Response("Guide unavailable", { status: 404 });
    }
    const value = key
      ? (await readGuides(process.cwd())).find((g) => g.guide_key === key)
      : await buildCatalog(process.cwd());
    if (!value) return new Response("Guide unavailable", { status: 404 });
    return Response.json(value, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "The working register could not be read. Check its schema and references, then retry.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
