import {
  auditClosedOrphans,
  cleanupClosedOrphan,
} from "../src/estimating/fertigation/orphan-maintenance";
import { closeDatabase } from "../src/platform/database";
try {
  const [action, workspace, actor, operation, hash, ...extra] =
    process.argv.slice(2);
  if (
    action === "audit" &&
    workspace &&
    !operation &&
    (actor === undefined || /^\d+$/.test(actor))
  )
    console.log(
      JSON.stringify(
        await auditClosedOrphans(
          workspace,
          actor === undefined ? 0 : Number(actor),
        ),
        null,
        2,
      ),
    );
  else if (
    action === "cleanup" &&
    workspace &&
    actor &&
    operation &&
    hash &&
    !extra.length
  )
    console.log(
      JSON.stringify(
        await cleanupClosedOrphan(workspace, actor, operation, hash),
        null,
        2,
      ),
    );
  else
    throw Error(
      "Use fertigation-orphans.ts audit <workspace UUID> [offset] or cleanup <workspace UUID> <original actor UUID> <closed operation UUID> <audited SHA-256>.",
    );
} catch (error) {
  console.error(
    error instanceof Error && !("code" in error)
      ? error.message
      : "Local orphan audit failed; retain the files and investigate privately.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
