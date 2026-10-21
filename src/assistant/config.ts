export function assistantEnabled(env: Record<string, string | undefined> = Reflect.get(process, "env")): boolean {
  return env.PPO_ASSISTANT === "on" && env.PPO_ENV === "local-synthetic"
    && env.PPO_EXPOSURE === "loopback" && env.PPO_IDENTITY === "synthetic"
    && env.NODE_ENV !== "production"
    && !env.VERCEL && !env.WEBSITE_INSTANCE_ID && !env.CONTAINER_APP_NAME && !env.RENDER_EXTERNAL_URL;
}
