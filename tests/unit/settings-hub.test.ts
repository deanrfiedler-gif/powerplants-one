import { test } from "node:test";
import assert from "node:assert/strict";
import { requireIndependentPolicyReviewer } from "../../src/scheduling/policy-authority";
import { configurationAreas } from "../../src/admin/settings";
import {
  livePolicyProposals,
  type ProposalSummary,
} from "../../src/admin/policies";
test("AD-02 refuses a proposer as reviewer without changing historical evidence validators", () => {
  assert.throws(
    () => requireIndependentPolicyReviewer("proposer", "proposer"),
    { code: "IndependentReviewerRequired" },
  );
  assert.doesNotThrow(() =>
    requireIndependentPolicyReviewer("proposer", "reviewer"),
  );
});
test("AD-02 excludes moved-head and expired branches, including an unreviewed expired proposal", () => {
  const now = "2031-10-01T00:00:00.000Z";
  const proposals: ProposalSummary[] = [
    {
      id: "old-head",
      expected_head_version: 1,
      effective_from: "2032-01-01T00:00:00Z",
      reviewed: true,
    },
    {
      id: "start-passed",
      expected_head_version: 2,
      effective_from: "2031-09-01T00:00:00Z",
      reviewed: true,
    },
    {
      id: "unreviewed-at-start",
      expected_head_version: 2,
      effective_from: now,
      reviewed: false,
    },
  ];
  assert.deepEqual(livePolicyProposals(proposals, 2, now), {
    live: [],
    selected: undefined,
  });
});
test("AD-02 selects a reviewed live branch even when an unreviewed branch is newer", () => {
  const proposals: ProposalSummary[] = [
    {
      id: "new-unreviewed",
      expected_head_version: 2,
      effective_from: "2032-01-01T00:00:00Z",
      reviewed: false,
    },
    {
      id: "older-reviewed",
      expected_head_version: 2,
      effective_from: "2032-01-01T00:00:00Z",
      reviewed: true,
    },
  ];
  const selected = livePolicyProposals(
    proposals,
    2,
    "2031-10-01T00:00:00.000Z",
  );
  assert.deepEqual(selected.live, proposals);
  assert.equal(selected.selected?.id, "older-reviewed");
  assert.equal(
    livePolicyProposals(proposals.slice(0, 1), 2, "2031-10-01T00:00:00.000Z")
      .selected?.id,
    "new-unreviewed",
  );
});
test("AD-02 retains nine areas while unbuilt areas have no invented destinations", () => {
  assert.equal(configurationAreas.length, 9);
  assert.deepEqual(
    configurationAreas.filter((a) => a.href).map((a) => a.id),
    ["policies", "access", "health"],
  );
  assert(
    configurationAreas
      .find((a) => a.id === "templates")!
      .status.includes("not yet merged"),
  );
});
