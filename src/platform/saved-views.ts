import type { Principal } from "./identity";
import {
  readPersonal,
  savePersonal,
  expectedVersion,
} from "./personal-preferences";
import { object, invalid } from "../shared/validation";
import {
  parseSavedView,
  teamSharing,
  viewTargets,
  type SavedView,
} from "./view-targets";
export async function readSavedViews(p: Principal) {
  const saved = await readPersonal(p, "platform_view_preferences", {
    views: [] as SavedView[],
  });
  return {
    ...saved,
    team_sharing: teamSharing,
    targets: viewTargets,
    unavailable: saved.settings.views
      .filter((v) => {
        try {
          parseSavedView(v);
          return false;
        } catch {
          return true;
        }
      })
      .map((v) => v.id),
  };
}
export async function saveSavedViews(p: Principal, input: unknown) {
  const b = object(input, ["expected_version", "views"]);
  if (!Array.isArray(b.views) || b.views.length > 12)
    invalid("views", "Save up to twelve platform views.");
  const views = (b.views as unknown[]).map(parseSavedView);
  if (
    new Set(views.map((v) => v.id)).size !== views.length ||
    new Set(views.map((v) => v.name.toLowerCase())).size !== views.length
  )
    invalid("name", "Use unique view IDs and names.");
  return savePersonal(
    p,
    "platform_view_preferences",
    expectedVersion(b.expected_version),
    { views },
  );
}
