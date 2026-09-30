// Test-only loopback server. This is not a launcher, application route or feature flag.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { POST as propose } from "../../src/app/api/v1/schedule/policy-proposals/route";
import { GET as proposalRead } from "../../src/app/api/v1/schedule/policy-proposals/[id]/route";
import { POST as review } from "../../src/app/api/v1/schedule/policy-reviews/route";
import { GET as reviewRead } from "../../src/app/api/v1/schedule/policy-reviews/[id]/route";
import { POST as publish } from "../../src/app/api/v1/schedule/policy-publications/route";
import { GET as publicationRead } from "../../src/app/api/v1/schedule/policy-publications/[id]/route";
import { GET as impactRead } from "../../src/app/api/v1/schedule/policy-impacts/[id]/route";
import { POST as resolve } from "../../src/app/api/v1/schedule/policy-impacts/[id]/resolve/route";
const handlers = {propose,review,publish,resolve,proposalRead,reviewRead,publicationRead,impactRead};
import { closeDatabase, transaction } from "../../src/platform/database";
import { createSession, sessionCookie } from "../../src/platform/identity";
import { localConfig } from "../../src/platform/config";
import { loadPolicyChain } from "../../src/scheduling/policy-persistence";
import { base, rows, setupPolicy, workspace } from "./policy-commands";

test("isolated API-C26 HTTP adapters enforce transport/current authority, no-store, immutable reads and lost-response exact recovery", async () => {
  await setupPolicy();
  const reviewSession = await createSession("scheduling-policy-reviewer"),
    publishSession = await createSession("scheduling-policy-publisher");
  const origin = localConfig().origin,
    gateway = randomUUID();
  process.env.PPO_LOCAL_GATEWAY = gateway;
  const routes = {
    propose: handlers.propose,
    review: handlers.review,
    publish: handlers.publish,
    resolve: handlers.resolve,
    proposal: handlers.proposalRead,
    reviewed: handlers.reviewRead,
    publication: handlers.publicationRead,
    impact: handlers.impactRead,
  };
  let discardPublicationResponse = true;
  const server = createServer(async (req, res) => {
    const [route, record = ""] = (req.url ?? "/").slice(1).split("/");
    const handler = routes[route as keyof typeof routes];
    if (!handler) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const request = new NextRequest(origin + req.url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        ...(req.method === "GET" ? {} : { body: Buffer.concat(chunks) }),
      });
      const response = await handler(request, {
        params: Promise.resolve({ id: record }),
      });
      if (
        route === "publish" &&
        response.status === 201 &&
        discardPublicationResponse
      ) {
        discardPublicationResponse = false;
        res.destroy();
        return;
      }
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      res.writeHead(500);
      res.end("Test harness failed");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`;
  const request = (
    path: string,
    input?: unknown,
    token = reviewSession.token,
    headers: Record<string, string> = {},
  ) =>
    fetch(url + path, {
      method: input === undefined ? "GET" : "POST",
      headers: {
        "x-ppo-local-gateway": gateway,
        origin,
        "content-type": "application/json",
        cookie: `${sessionCookie}=${token}`,
        ...headers,
      },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });
  const checked = async (response: Response, status: number) => {
    assert.equal(response.status, status, await response.clone().text());
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    return response.json();
  };
  try {
    const chain = await transaction((c) => loadPolicyChain(c, workspace));
    const command = {
      ...base(),
      id: randomUUID(),
      source: chain.head.policy,
      expected_head_version: 1,
      predecessor_proposal: null,
      max_visit_minutes: 60,
      effective_from: "2032-01-01T00:00:00.000Z",
    };
    await checked(await request("/propose", command, ""), 401);
    await checked(
      await request("/propose", command, reviewSession.token, {
        origin: "https://invalid.example",
      }),
      403,
    );
    await checked(
      await request("/propose", command, reviewSession.token, {
        "x-ppo-local-gateway": "wrong",
      }),
      403,
    );
    await checked(
      await request("/propose", command, reviewSession.token, {
        "content-type": "text/plain",
      }),
      422,
    );
    await checked(
      await request("/propose", { ...command, site_id: randomUUID() }),
      422,
    );
    const receipt = await checked(await request("/propose", command), 201);
    assert.deepEqual(
      await checked(await request("/propose", command), 200),
      receipt,
    );
    const { proposal } = await checked(
      await request(`/proposal/${receipt.record_id}`),
      200,
    );
    const ref = {
      id: proposal.id,
      version: proposal.version,
      content_hash: proposal.content_hash,
    };
    const reviewReceipt = await checked(
      await request("/review", { ...base(), id: randomUUID(), proposal: ref }),
      201,
    );
    const saved = await checked(
      await request(
        `/reviewed/${reviewReceipt.record_id}`,
        undefined,
        publishSession.token,
      ),
      200,
    );
    const publication = {
      ...base(),
      proposal: ref,
      review: {
        id: saved.review.id,
        version: 1,
        content_hash: saved.review.content_hash,
      },
      source: proposal.source,
      expected_head_version: proposal.expected_head.version,
      selected_policy: saved.selected_policy,
    };
    await assert.rejects(
      request("/publish", publication, publishSession.token),
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
        )
      )[0].n,
      1,
    );
    const original = await checked(
      await request("/publish", publication, publishSession.token),
      200,
    );
    assert.deepEqual(
      await checked(
        await request("/publish", publication, publishSession.token),
        200,
      ),
      original,
    );
    await checked(
      await request(
        "/publish",
        { ...publication, reason: "SYN changed original" },
        publishSession.token,
      ),
      409,
    );
    const published = await checked(
      await request(
        `/publication/${original.record_id}`,
        undefined,
        publishSession.token,
      ),
      200,
    );
    assert.equal(published.publication.receipt_id, original.receipt_id);
    await rows(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.policy.publish'",
      [publishSession.principal.actor_id],
    );
    const denied = await checked(
      await request("/publish", publication, publishSession.token),
      403,
    );
    assert.equal(denied.code, "PolicyAuthorityRequired");
    assert(!JSON.stringify(denied).includes(original.record_id));
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
        )
      )[0].n,
      1,
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    await closeDatabase();
  }
});
