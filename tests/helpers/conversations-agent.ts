import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { localConfig } from "../../src/platform/config";
import { readThread } from "../../src/conversations/reads";
import {
  begin,
  newDeal,
  person,
  post,
  principal,
  profiles,
} from "./conversations";

// Persisted historical-answer fixture, never a mocked read. The worker is a separate non-production
// local-synthetic process. The HTTP/compiled application keeps its own production/off guard intact.
export async function storedAgentThread(enabled = true, includeReader = true) {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Only disposable ppo_synthetic_test");
  const owner = await principal(profiles.coordinator),
    reader = await principal(profiles.dealReader);
  const deal = await newDeal(owner);
  const thread = await begin(owner, deal, {
    body: includeReader ? "SYN @{1} recorded history" : "SYN recorded history",
    mentions: includeReader ? [person(reader.actor_id)] : [],
  });
  await post(owner, thread, {
    body: "SYN @{1} what is recorded?",
    mentions: [{ ordinal: 1, kind: "Agent" }],
  });
  await promisify(execFile)(
    process.execPath,
    ["--env-file=.env.local", "--import", "tsx", "scripts/document-worker.ts"],
    {
      cwd: process.cwd(),
      timeout: 60000,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PPO_ENV: "local-synthetic",
        PPO_EXPOSURE: "loopback",
        PPO_IDENTITY: "synthetic",
        PPO_ASSISTANT: enabled ? "on" : "off",
      },
    },
  );
  const view = await readThread(owner, thread);
  assert.equal(view.turns[0].state, enabled ? "Answered" : "Unavailable");
  return { owner, reader, deal, thread };
}
