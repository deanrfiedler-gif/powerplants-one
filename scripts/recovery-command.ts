import {
  createCheckpoint,
  inspectCheckpoint,
  restoreCheckpoint,
} from "./recovery";

// Connection credentials are read only from the private environment, never CLI arguments.
try {
  const [action, directory, ...extra] = process.argv.slice(2);
  if (
    !directory ||
    extra.length ||
    !["checkpoint", "inspect", "restore"].includes(action)
  )
    throw Error(
      "Use recovery-command.ts checkpoint|inspect|restore /absolute/private/checkpoint-directory.",
    );
  const backend =
    process.env.PPO_RECOVERY_CLIENT === "docker" ? "docker" : "native";
  if (
    process.env.PPO_RECOVERY_CLIENT &&
    !["docker", "native"].includes(process.env.PPO_RECOVERY_CLIENT)
  )
    throw Error("PPO_RECOVERY_CLIENT must be native or docker.");
  if (action === "inspect") {
    const m = await inspectCheckpoint(directory);
    console.log(
      JSON.stringify({
        checkpoint_id: m.id,
        created_at: m.created_at,
        tables: m.database.tables.length,
        files: m.roots.reduce((n, r) => n + r.files.length, 0),
        exact_archive_and_file_hashes: true,
        restored: false,
      }),
    );
  } else {
    const options = {
      directory,
      documents: process.env.PPO_DOCUMENT_DIRECTORY ?? "",
      profile: process.env.PPO_RECOVERY_PROFILE_DIRECTORY,
      stopped:
        process.env.PPO_RECOVERY_STOPPED ===
        "application-worker-browser-stopped",
      backend,
    } as const;
    if (action === "checkpoint") {
      const m = await createCheckpoint({
        ...options,
        sourceUrl: process.env.DATABASE_URL ?? "",
      });
      console.log(
        JSON.stringify({
          checkpoint_id: m.id,
          created_at: m.created_at,
          tables: m.database.tables.length,
          files: m.roots.reduce((n, r) => n + r.files.length, 0),
          restore_verified: false,
        }),
      );
    } else
      console.log(
        JSON.stringify(
          await restoreCheckpoint({
            ...options,
            targetUrl: process.env.PPO_RECOVERY_TARGET_DATABASE_URL ?? "",
          }),
        ),
      );
  }
} catch (e) {
  // Only controlled operator guidance is displayed; driver/process details may include private data.
  const known = e instanceof Error && !("code" in e) && !("query" in e);
  console.error(
    known
      ? e.message
      : "Recovery failed. Keep both environments stopped and preserve the private checkpoint for investigation.",
  );
  process.exitCode = 1;
}
