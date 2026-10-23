export type AssistantEnvironment = Record<string, string | undefined>;
export function assistantEnabled(env: AssistantEnvironment = Reflect.get(process, "env")): boolean {
  return env.PPO_ASSISTANT === "on" && env.PPO_ENV === "local-synthetic"
    && env.PPO_EXPOSURE === "loopback" && env.PPO_IDENTITY === "synthetic"
    && env.NODE_ENV !== "production"
    && !env.VERCEL && !env.WEBSITE_INSTANCE_ID && !env.CONTAINER_APP_NAME && !env.RENDER_EXTERNAL_URL;
}
