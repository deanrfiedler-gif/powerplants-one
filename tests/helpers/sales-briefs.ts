import { emptyHandover } from "../../src/sales/handover-model";
import {
  matchesReceivingView,
  receivingViews,
  type ReceivingQueue,
  type ReceivingSnapshot,
  type ReceivingState,
} from "../../src/sales/receiving-queue-model";
export const briefActor = "e2000000-0000-4000-8001-000000000001";
const id = (n: number) =>
  `f2000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function briefsFixture(): ReceivingQueue {
  const stories: [number, string, string, ReceivingState, string | null][] = [
    [
      31,
      "Boiler house heat recovery study",
      "SYN Riverbend Nursery",
      "Submitted",
      "2026-11-14",
    ],
    [
      30,
      "Nutrient room dosing upgrade",
      "SYN Hillview Growers",
      "ClarificationAnswered",
      null,
    ],
    [
      28,
      "Packhouse cold room expansion",
      "SYN Coastal Berries",
      "Submitted",
      "2026-11-28",
    ],
    [
      29,
      "Glasshouse 5 energy screens",
      "SYN Northbank Farm",
      "ClarificationRequested",
      "2026-12-05",
    ],
    [
      33,
      "Seedling house bench irrigation",
      "SYN Greenhouse Demonstration",
      "Submitted",
      "2026-11-21",
    ],
    [27, "Mother stock house misting", "SYN Coastal Berries", "Returned", null],
    [
      26,
      "Substrate dosing review",
      "SYN Isolation Nursery",
      "Accepted",
      "2026-10-30",
    ],
    [
      19,
      "Controls upgrade assessment",
      "SYN Greenhouse Demonstration",
      "Accepted",
      "2026-10-25",
    ],
  ];
  const items = stories.map(
    ([number, title, customer, state, requested_date], i) => ({
      id: id(number),
      revision: number === 19 ? 2 : 1,
      submission_id: id(number + 1000),
      token: String(i + 1).repeat(64),
      opportunity: {
        id: id(number + 2000),
        reference: `SYN-PPO-OPP-${String(number).padStart(6, "0")}`,
        title,
      },
      customer: {
        id: id(
          3000 +
            [
              "SYN Riverbend Nursery",
              "SYN Hillview Growers",
              "SYN Coastal Berries",
              "SYN Northbank Farm",
              "SYN Greenhouse Demonstration",
              "SYN Isolation Nursery",
            ].indexOf(customer),
        ),
        name: customer,
      },
      site: {
        id: id(4000 + number),
        name: number === 30 ? "Nutrient room" : "Synthetic growing site",
      },
      receiving_owner: {
        id: i === 4 || i === 7 ? id(5001) : briefActor,
        name: i === 4 || i === 7 ? "Riley James" : "Sasha Cole",
      },
      sales_owner: {
        id: id(6001 + (i % 2)),
        name: i % 2 ? "Morgan Hale" : "Jamie Park",
      },
      state,
      source_changed: i === 2,
      updated_at: `2026-10-${String(11 - Math.floor(i / 2)).padStart(2, "0")}T00:35:00.000Z`,
      submitted_at: "2026-10-09T01:30:00.000Z",
      requested_date,
      date_reason: requested_date
        ? "Customer request"
        : "The grower sets a date after the site walk",
    }),
  );
  return {
    items,
    counts: Object.fromEntries(
      receivingViews.map((v) => [
        v.id,
        items.filter((r) => matchesReceivingView(r, v.id, briefActor)).length,
      ]),
    ) as ReceivingQueue["counts"],
    total: 8,
    permitted_total: 8,
    customers: [
      ...new Map(items.map((r) => [r.customer.id, r.customer])).values(),
    ],
    owners: [items[0].receiving_owner, items[4].receiving_owner],
    offset: 0,
    limit: 50,
    has_more: false,
    basis: "synthetic-eight-briefs",
    completeness: "Complete",
    observed_at: "2026-10-11T00:42:00.000Z",
  };
}
export function briefSnapshotFixture(number = 30): ReceivingSnapshot {
  const brief = briefsFixture().items.find((r) => r.id === id(number))!;
  return {
    brief,
    content: {
      ...emptyHandover(),
      problem: "Manual dosing cannot hold EC across tanks A to C",
      outcome: "Stable EC and pH",
      included_scope: "Automated EC and pH dosing with alarms for tanks A to C",
      exclusions: "Tank replacement and civil works",
      assumptions: "Existing services remain available",
      unknowns: "Confirm the shutdown date with the grower",
      requested_date: brief.requested_date,
      date_reason: brief.date_reason,
      next_activity_id: id(7001),
    },
    next_action: {
      id: id(7001),
      summary: "Site walk with the grower",
      due_at: "2026-10-14T00:00:00.000Z",
      owner: brief.sales_owner,
    },
    history: [
      {
        id: id(8001),
        revision: brief.revision,
        action: "Submit",
        note: "SYN submitted brief",
        question_id: null,
        recorded_at: brief.submitted_at,
        actor: brief.sales_owner,
      },
      {
        id: id(8002),
        revision: brief.revision,
        action: "Clarify",
        note: "Is tank C staying on manual dosing during the changeover?",
        question_id: null,
        recorded_at: "2026-10-10T05:10:00.000Z",
        actor: brief.receiving_owner!,
      },
      {
        id: id(8003),
        revision: brief.revision,
        action: "Answer",
        note: "No, the grower wants all three tanks automated in one shutdown.",
        question_id: id(8002),
        recorded_at: brief.updated_at,
        actor: brief.sales_owner,
      },
    ],
    observed_at: "2026-10-11T00:42:00.000Z",
  };
}
