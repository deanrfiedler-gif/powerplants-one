import type { Capability } from "../platform/permissions";

export type RoleProposal = {
  id: string;
  name: string;
  family: string;
  revisions: {
    revision: string;
    state: "Proposed" | "Draft";
    caps: Capability[];
    scopes: string[];
  }[];
};

// Display/comparison proposals from docs/design/access-review/model.js.
// These stable source IDs and issue labels are not assigned roles or policy.
// The hosted tester set stays with operator provisioning, outside this catalogue.
const service: Capability[] = [
  "shared.read",
  "shared.edit",
  "service.ticket.read",
  "service.ticket.edit",
  "service.work_order.read",
  "service.work_order.edit",
  "service.readiness.assess",
  "schedule.read",
  "schedule.manage",
  "pack.read",
  "pack.prepare",
];
export const roleProposals: RoleProposal[] = [
  {
    id: "bundle-service-coordinator",
    name: "Service coordinator",
    family: "Business use",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: [...service, "activity.read", "activity.edit"],
        scopes: ["Company", "Site"],
      },
      {
        revision: "r02",
        state: "Draft",
        caps: [...service, "pack.check", "activity.read", "activity.edit"],
        scopes: ["Company", "Site"],
      },
    ],
  },
  {
    id: "bundle-technician",
    name: "Field technician",
    family: "Business use",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: [
          "field.read.own",
          "field.start.own",
          "field.capture.own",
          "field.correct.own",
          "field.attachment.own",
          "field.completion.own",
          "pack.read",
          "pack.acknowledge",
        ],
        scopes: ["Company"],
      },
    ],
  },
  {
    id: "bundle-finance-preparer",
    name: "Finance preparer",
    family: "Business use",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: ["finance.read", "finance.prepare", "shared.finance.read"],
        scopes: ["Company"],
      },
    ],
  },
  {
    id: "bundle-finance-reviewer",
    name: "Finance reviewer",
    family: "Approval",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: ["finance.read", "finance.review"],
        scopes: ["Company"],
      },
    ],
  },
  {
    id: "bundle-finance-processor",
    name: "Finance processor",
    family: "Business use",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: ["finance.read", "finance.process"],
        scopes: ["Company"],
      },
    ],
  },
  {
    id: "bundle-finance-reconciler",
    name: "Finance reconciler",
    family: "Approval",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: ["finance.read", "finance.reconcile"],
        scopes: ["Company"],
      },
    ],
  },
  {
    id: "bundle-observer",
    name: "Read-only observer",
    family: "Business use",
    revisions: [
      {
        revision: "r01",
        state: "Proposed",
        caps: ["shared.read"],
        scopes: ["Company", "Site"],
      },
    ],
  },
];
