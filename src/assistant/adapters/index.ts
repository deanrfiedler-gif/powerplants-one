import type { AssistantEnvironment } from "../config";
import { AdapterError, type AssistantAdapter } from "../model";
import { createClaudeAdapter } from "./claude";
import { simulatedAdapter } from "./simulated";

export function adapterFor(env: AssistantEnvironment = Reflect.get(process, "env")): AssistantAdapter {
  if (!env.PPO_ASSISTANT_PROVIDER || env.PPO_ASSISTANT_PROVIDER === "simulated") return simulatedAdapter;
  if (env.PPO_ASSISTANT_PROVIDER === "claude") return createClaudeAdapter({ env });
  return { label: "Claude", model: "unconfigured", async answer() { throw new AdapterError("Unavailable"); } };
}
