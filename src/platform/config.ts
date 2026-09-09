import { demoConfig } from "./demo-config";

export function runtimeConfig(env: Record<string, string | undefined> = process.env) {
  return env.PPO_ENV === "azure-demo" ? demoConfig(env) : localConfig(env);
}

export function localConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.NODE_ENV === "production" ||
    env.PPO_ENV !== "local-synthetic" ||
    env.PPO_EXPOSURE !== "loopback" ||
    env.PPO_IDENTITY !== "synthetic" ||
    env.VERCEL ||
    env.WEBSITE_INSTANCE_ID ||
    env.CONTAINER_APP_NAME ||
    env.RENDER_EXTERNAL_URL
  ) {
    throw new Error(
      "Synthetic identity requires an explicitly local, unshared, non-production environment.",
    );
  }
  const port = Number(env.PPO_PORT ?? "3000");
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid local port.");
  let db: URL;
  try {
    db = new URL(env.DATABASE_URL ?? "");
  } catch {
    throw new Error("Set the local synthetic database configuration.");
  }
  if (
    !["postgres:", "postgresql:"].includes(db.protocol) ||
    db.hostname !== "127.0.0.1" ||
    !["/ppo_synthetic", "/ppo_synthetic_test"].includes(db.pathname) ||
    db.search ||
    db.hash ||
    !db.username ||
    !db.password
  )
    throw new Error(
      "Database must be the named disposable synthetic database on 127.0.0.1, without URL options.",
    );
  return {
    port,
    origin: `http://127.0.0.1:${port}`,
    database_url: db.toString(),
    database_name: db.pathname.slice(1),
  };
}
