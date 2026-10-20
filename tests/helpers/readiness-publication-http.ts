import { expect, request, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { ReadinessContent } from "../../src/shared/cs/model";

/** Establish synthetic journey sources through the same independent review as the UI. */
export async function saveReadinessWithReview(
  client: APIRequestContext,
  origin: string,
  id: string,
  input: {
    schema_version: number;
    operation_id: string;
    reason: string;
    expected_version: number;
    name: string;
    owner_id: string;
    content: unknown;
  },
) {
  const call = async (
    actor: APIRequestContext,
    path: string,
    body?: unknown,
  ) => {
    const response = await actor.fetch(`${origin}/api/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { origin },
      data: body,
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    return response.json();
  };
  const path = `cs/Readiness/${id}`;
  const current = await call(client, path);
  expect(current.record.version).toBe(input.expected_version);
  const content = input.content as ReadinessContent;
  const base = () => ({
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN independently reviewed journey requirements",
  });
  await call(client, `${path}/actions`, {
    ...base(),
    expected_version: current.record.version,
    action: "draft_requirements",
    requirements: content.requirements,
  });
  const submitted = await call(client, path);
  const reviewer = await request.newContext();
  try {
    await call(reviewer, "local-session", { profile: "cs-reviewer" });
    await call(reviewer, `${path}/actions`, {
      ...base(),
      expected_version: submitted.record.version,
      action: "publish_requirements",
      snapshot_id: submitted.requirements_draft.id,
    });
  } finally {
    await reviewer.dispose();
  }
  const published = await call(client, path);
  return call(client, `${path}/save`, {
    ...input,
    expected_version: published.record.version,
    content: {
      ...content,
      requirements: published.record.content.requirements,
    },
  });
}
