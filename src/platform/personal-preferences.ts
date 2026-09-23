import { database } from "./database";
import { AppError } from "./errors";
import type { Principal } from "./identity";
import { invalid } from "../shared/validation";

type Store = "notification_preferences" | "platform_view_preferences";
export function expectedVersion(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    invalid("expected_version", "Use the current saved version.");
  return Number(value);
}
export async function readPersonal<T>(p: Principal, store: Store, defaults: T) {
  return (
    (
      await database().query<{ version: number; settings: T }>(
        `SELECT version,settings FROM ppo.${store} WHERE workspace_id=$1 AND user_id=$2`,
        [p.workspace_id, p.actor_id],
      )
    ).rows[0] ?? { version: 0, settings: defaults }
  );
}
export async function savePersonal<T>(
  p: Principal,
  store: Store,
  version: number,
  settings: T,
) {
  const row = (
    await database().query<{ version: number; settings: T }>(
      `INSERT INTO ppo.${store}(workspace_id,user_id,version,settings) SELECT $1,$2,1,$3 WHERE $4=0
     ON CONFLICT(workspace_id,user_id) DO NOTHING RETURNING version,settings`,
      [p.workspace_id, p.actor_id, JSON.stringify(settings), version],
    )
  ).rows[0];
  if (row) return row;
  const updated = (
    await database().query<{ version: number; settings: T }>(
      `UPDATE ppo.${store} SET settings=$3,version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND version=$4 RETURNING version,settings`,
      [p.workspace_id, p.actor_id, JSON.stringify(settings), version],
    )
  ).rows[0];
  if (!updated)
    throw new AppError(
      409,
      "VersionConflict",
      "Your preferences changed elsewhere. Keep your draft, reload the current copy, then reconcile before saving.",
    );
  return updated;
}
