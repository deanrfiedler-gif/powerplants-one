import { randomUUID } from "node:crypto";
import {
  commercialFixture,
  approvedBasis,
  variation,
  commercialAction,
  commercialContent,
} from "./project-commercial";
import { commandCommercial } from "../../src/projects/commercial/commands";
import { createActivity } from "../../src/activities/activities";
import { raidAction } from "./project-raid";
export async function commercialUIFixture() {
  const f = await commercialFixture();
  await approvedBasis(f);
  const entries: Record<string, string> = { basis: f.create.id };
  const specs = [
    [
      "submitted",
      "Relocate controller to plant room",
      "7400.00",
      "6920.00",
      "Submitted",
    ],
    ["unknown", "Extra mixing tank stand", null, null, "Requested"],
    [
      "disputed",
      "Night-shift install premium",
      "4200.00",
      "3260.00",
      "Disputed",
    ],
    [
      "approved",
      "Second dosing channel for Zone 4",
      "12980.00",
      "12480.00",
      "Approved",
    ],
    [
      "credit",
      "Customer supplies spare EC sensor",
      "-1150.00",
      "-1150.00",
      "Approved",
    ],
    [
      "adjustment",
      "Adjustment: second dosing channel",
      "-480.00",
      "-480.00",
      "Approved",
    ],
    [
      "rejected",
      "Stainless manifold upgrade",
      "2900.00",
      "2750.00",
      "Rejected",
    ],
    ["withdrawn", "Remote monitoring licence", "1800.00", null, "Withdrawn"],
  ] as const;
  for (const [key, title, requested, priced, state] of specs) {
    const v = {
      ...variation(f, requested, priced),
      ...(key === "adjustment" ? { predecessor_id: entries.approved } : {}),
    };
    v.content.title = title;
    entries[key] = v.id;
    await commandCommercial(f.owner, f.project.id, v);
    if (["Submitted", "Approved", "Disputed", "Rejected"].includes(state))
      await commandCommercial(
        f.owner,
        f.project.id,
        commercialAction(v.id, 1, "Submit"),
      );
    if (["Approved", "Disputed", "Rejected"].includes(state))
      await commandCommercial(f.reviewer, f.project.id, {
        ...commercialAction(v.id, 2, "Decide"),
        outcome: state,
      });
    if (state === "Withdrawn")
      await commandCommercial(
        f.owner,
        f.project.id,
        commercialAction(v.id, 1, "Withdraw"),
      );
  }
  const activity = raidAction(f.project.id);
  await createActivity(f.owner, activity);
  const obligation = {
    ...commercialAction(randomUUID(), 0, "Create"),
    kind: "Obligation",
    basis_id: f.create.id,
    content: {
      ...commercialContent(f.owner.actor_id),
      title: "Supply commissioning evidence",
      action_ids: [activity.id],
      due_date: null,
      date_needed: true,
      evidence: "SYN evidence recorded; linked work still open",
    },
  };
  await commandCommercial(f.owner, f.project.id, obligation);
  entries.obligation = obligation.id;
  const notice = {
    ...commercialAction(randomUUID(), 0, "Create"),
    kind: "Notice",
    basis_id: f.create.id,
    content: {
      ...commercialContent(f.owner.actor_id),
      title: "Site access notice recorded",
      occurred_at: "2026-10-01T00:00:00.000Z",
      evidence: "SYN notice record, not delivery verification",
    },
  };
  await commandCommercial(f.owner, f.project.id, notice);
  entries.notice = notice.id;
  return { f, entries };
}
