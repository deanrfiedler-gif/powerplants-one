import assert from "node:assert/strict";
import { test } from "node:test";
import {
  linkRefusal,
  type LinkFacts,
} from "../../src/service/project-field-work-model";

// B1 (project delivery billing decision R1): pure link and unlink rules.
const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const facts = (change: Partial<LinkFacts> = {}): LinkFacts => ({
  work_order: { company_id: id(1), customer_id: id(2), project_id: null },
  project: {
    id: id(3),
    company_id: id(1),
    organisation_id: id(2),
    lifecycle: "Active",
  },
  visit_started: false,
  ...change,
});
const linked = (change: Partial<LinkFacts> = {}) =>
  facts({
    work_order: { company_id: id(1), customer_id: id(2), project_id: id(3) },
    ...change,
  });

test("an unlinked work order links to an Active project of the same company and customer", () => {
  assert.equal(linkRefusal("link", facts()), null);
});

test("a link is refused for another company or customer, with the project field named", () => {
  for (const project of [
    {
      id: id(3),
      company_id: id(9),
      organisation_id: id(2),
      lifecycle: "Active",
    },
    {
      id: id(3),
      company_id: id(1),
      organisation_id: id(9),
      lifecycle: "Active",
    },
  ])
    assert.deepEqual(
      [
        linkRefusal("link", facts({ project }))?.status,
        linkRefusal("link", facts({ project }))?.field,
      ],
      [422, "project_id"],
    );
});

test("at most one project: relinking the same project or another is a conflict, not a duplicate", () => {
  assert.equal(linkRefusal("link", linked())?.code, "AlreadyLinked");
  assert.equal(
    linkRefusal(
      "link",
      facts({
        work_order: {
          company_id: id(1),
          customer_id: id(2),
          project_id: id(8),
        },
      }),
    )?.code,
    "ProjectLinkExists",
  );
});

test("a closed project or a started visit fixes the link both ways", () => {
  const closed = {
    id: id(3),
    company_id: id(1),
    organisation_id: id(2),
    lifecycle: "Closed",
  };
  assert.equal(
    linkRefusal("link", facts({ project: closed }))?.code,
    "ClosedProject",
  );
  assert.equal(
    linkRefusal("unlink", linked({ project: closed }))?.code,
    "ClosedProject",
  );
  assert.equal(
    linkRefusal("link", facts({ visit_started: true }))?.code,
    "FieldWorkStarted",
  );
  assert.equal(
    linkRefusal("unlink", linked({ visit_started: true }))?.code,
    "FieldWorkStarted",
  );
});

test("unlink removes only the current link", () => {
  assert.equal(linkRefusal("unlink", linked()), null);
  assert.equal(linkRefusal("unlink", facts())?.code, "VersionConflict");
});
