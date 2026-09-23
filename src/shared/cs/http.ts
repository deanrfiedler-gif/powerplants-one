import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  localRequest,
  identity,
  jsonBody,
  reply,
  failure,
} from "../../platform/http";
import {
  createCs,
  saveCs,
  csAction,
  readCs,
  listCs,
  parseKind,
} from "./service";
import { csOptions } from "./options";
import {
  addSurveyPhoto,
  correctSurveyCaption,
  surveyPhotoBytes,
} from "./photos";
type Context = {
  params: Promise<{ kind: string; id?: string; photoId?: string }>;
};
export function csRoute(
  action:
    | "list"
    | "create"
    | "read"
    | "save"
    | "action"
    | "options"
    | "photo"
    | "caption"
    | "bytes",
) {
  return async (request: NextRequest, context: Context) => {
    try {
      const write = ["create", "save", "action", "photo", "caption"].includes(
        action,
      );
      localRequest(request, write);
      const p = await identity(request),
        params = await context.params,
        kind = parseKind(params.kind),
        id = params.id ?? "";
      if (action === "bytes") {
        if (kind !== "Survey") throw Error("Unsupported evidence kind");
        const bytes = await surveyPhotoBytes(p, id, params.photoId ?? "");
        return new NextResponse(new Uint8Array(bytes), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition": 'inline; filename="survey-original.png"',
          },
        });
      }
      if (action === "list")
        return reply(
          await listCs(
            p,
            kind,
            Object.fromEntries(request.nextUrl.searchParams),
          ),
        );
      if (action === "read") return reply(await readCs(p, kind, id));
      if (action === "options")
        return reply(
          await csOptions(
            p,
            kind,
            request.nextUrl.searchParams.get("context_id") ?? "",
          ),
        );
      const body = await jsonBody(
        request,
        action === "photo" ? 5700000 : 262144,
      );
      const result =
        action === "create"
          ? await createCs(p, kind, body)
          : action === "save"
            ? await saveCs(p, kind, id, body)
            : action === "action"
              ? await csAction(p, kind, id, body)
              : kind === "Survey" && action === "photo"
                ? await addSurveyPhoto(p, id, body)
                : kind === "Survey" && action === "caption"
                  ? await correctSurveyCaption(
                      p,
                      id,
                      params.photoId ?? "",
                      body,
                    )
                  : null;
      if (!result) throw Error("Unsupported evidence action");
      return reply(
        result.receipt,
        action === "create" && !result.replayed ? 201 : 200,
      );
    } catch (error) {
      return failure(error);
    }
  };
}
