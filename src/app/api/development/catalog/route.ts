import type { NextRequest } from "next/server";
import { developmentRequest } from "../../../../development/access";
import {
  developmentCatalog,
  developmentGuide,
  developmentPageGuide,
} from "../../../../development/runtime";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!(await developmentRequest(request.headers)))
    return new Response("Not found", { status: 404 });
  try {
    const key = request.nextUrl.searchParams.get("guide");
    const pathname = request.nextUrl.searchParams.get("pathname");
    const value = pathname
      ? await developmentPageGuide(pathname)
      : key
        ? await developmentGuide(key)
        : await developmentCatalog();
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
