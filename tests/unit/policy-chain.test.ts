import assert from "node:assert/strict";
import { test } from "node:test";
import {
  policyReference,
  resolvePinnedPolicy,
  selectPolicyForVisit,
  validatePolicyChain,
} from "../../src/scheduling/policy-chain";
import {
  chainFixture,
  expiry,
  family,
  ref,
  tamper,
  uid,
} from "../helpers/policy-publication";

test("half-open windows select greatest effective instant; ending on boundary keeps predecessor", () => {
  const chain = chainFixture();
  for (const [start, end, index] of [
    ["2029-12-31T23:00:00Z", "2030-01-01T00:00:00Z", 0],
    ["2030-01-01T00:00:00Z", "2030-01-01T01:00:00Z", 1],
    ["2030-12-31T23:00:00Z", "2031-01-01T00:00:00Z", 1],
    ["2031-01-01T00:00:00Z", "2031-01-01T01:00:00Z", 2],
    ["2032-01-01T23:00:00Z", expiry, 2],
  ] as const)
    assert.deepEqual(selectPolicyForVisit(chain, start, end), {
      ...policyReference(chain.members[index].policy),
      family_head_version: 3,
    });
});
test("future selection has no wall-clock input and is independent of record insertion order", () => {
  const chain = chainFixture(),
    reversed = { ...chain, members: [...chain.members].reverse() };
  assert.deepEqual(
    selectPolicyForVisit(
      reversed,
      "2031-06-01T00:00:00Z",
      "2031-06-01T01:00:00Z",
    ),
    { ...chain.head.policy, family_head_version: 3 },
  );
  assert.equal(
    chain.members[0].policy.effective_from,
    "2029-01-01T00:00:00.000Z",
  );
  assert.ok(Object.isFrozen(validatePolicyChain(chain).members[0].policy));
});
for (const [label, start, end] of [
  ["crossing successor", "2030-12-31T23:00:00Z", "2031-01-01T00:00:00.001Z"],
  ["gap before root", "2028-12-31T23:00:00Z", "2029-01-01T00:00:00Z"],
  ["expired", expiry, "2032-01-02T01:00:00Z"],
  ["crossing expiry", "2032-01-01T23:00:00Z", "2032-01-02T00:00:00.001Z"],
  ["empty", "2030-01-01T00:00:00Z", "2030-01-01T00:00:00Z"],
  ["reversed", "2030-01-02T00:00:00Z", "2030-01-01T00:00:00Z"],
  ["invalid date", "2030-02-30T00:00:00Z", "2030-03-01T00:00:00Z"],
  ["offset input", "2030-01-01T00:00:00+01:00", "2030-01-01T01:00:00Z"],
])
  test(`selection refuses ${label}`, () =>
    assert.throws(() => selectPolicyForVisit(chainFixture(), start, end)));

for (const [label, path, value] of [
  ["missing review", "members.1.review_binding", null],
  ["wrong review policy", "members.1.review_binding.selected_policy", ref(800)],
  ["wrong review source", "members.1.review_binding.source", ref(800)],
  ["stale review head", "members.1.review_binding.expected_head_version", 3],
  [
    "wrong predecessor branch",
    "members.2.predecessor",
    chainFixture().seed_root,
  ],
  ["cycle", "members.1.predecessor", chainFixture().head.policy],
  [
    "duplicate time",
    "members.1.policy.effective_from",
    "2029-01-01T00:00:00.000Z",
  ],
  ["duplicate ID", "members.1.policy.id", chainFixture().seed_root.id],
  ["wrong family", "members.2.family", "another-family"],
  ["wrong workspace", "members.2.workspace_id", uid(900)],
  ["unknown root", "root_policy_id", uid(900)],
  ["forged content", "members.1.content_hash", "0".repeat(64)],
  ["wrong head", "head.policy", chainFixture().seed_root],
  ["wrong head version", "head.version", 4],
  ["unpublished", "members.1.status", "Draft"],
  ["non-synthetic", "members.1.synthetic", false],
  ["expiry extension", "members.1.policy.effective_to", "2033-01-01T00:00:00Z"],
  [
    "interior expiry gap",
    "members.1.policy.effective_to",
    "2030-06-01T00:00:00Z",
  ],
  ["unknown field", "members.1.policy.extra", true],
] as const)
  test(`corrupt chain refuses ${label}`, () =>
    assert.throws(() =>
      validatePolicyChain(tamper(chainFixture(), path, value)),
    ));

test("missing chain member and reuse of publication review/proposal are refused", () => {
  const chain = chainFixture();
  assert.throws(() =>
    validatePolicyChain({
      ...chain,
      members: [chain.members[0], chain.members[2]],
    }),
  );
  assert.throws(() =>
    validatePolicyChain(
      tamper(
        chain,
        "members.2.review_binding.review",
        chain.members[1].review_binding!.review,
      ),
    ),
  );
  assert.throws(() =>
    validatePolicyChain(
      tamper(
        chain,
        "members.2.review_binding.proposal",
        chain.members[1].review_binding!.proposal,
      ),
    ),
  );
});
test("historic pin resolves exact predecessor despite later successors; new selection never changes it", () => {
  const chain = chainFixture(),
    original = structuredClone(chain),
    pin = chain.seed_root;
  const snapshot = {
    ...family,
    status: "Published",
    synthetic: true,
    policy: chain.members[0].policy,
    content_hash: pin.content_hash,
  };
  assert.deepEqual(resolvePinnedPolicy(snapshot, pin), chain.members[0].policy);
  assert.notEqual(
    selectPolicyForVisit(chain, "2031-02-01T00:00:00Z", "2031-02-01T01:00:00Z")
      .id,
    pin.id,
  );
  assert.throws(() => resolvePinnedPolicy(snapshot, { ...pin, version: 2 }));
  assert.throws(() => resolvePinnedPolicy(snapshot, ref(999)));
  assert.deepEqual(chain, original);
});

test("rehashed shortened expiry still refuses an interior gap; empty chains refuse", () => {
  const chain = chainFixture(2);
  const policy = {
    ...chain.members[1].policy,
    effective_to: "2030-06-01T00:00:00.000Z",
  };
  const exact = policyReference(policy);
  const altered = {
    ...chain,
    head: { policy: exact, version: 2 },
    members: [
      chain.members[0],
      {
        ...chain.members[1],
        policy,
        content_hash: exact.content_hash,
        review_binding: {
          ...chain.members[1].review_binding!,
          selected_policy: exact,
        },
      },
    ],
  };
  assert.throws(() => validatePolicyChain(altered));
  assert.throws(() => validatePolicyChain({ ...chain, members: [] }));
});
