import assert from "node:assert/strict";
import { test } from "node:test";
import { peopleStatusLine } from "../../src/shared/people-register-model";
import { peopleRegisterFixture } from "../helpers/people-register";

test("People phone summaries preserve missing channels, exact site names and notice exceptions without inventing consent", () => {
  const [ava, dana, grace, leo, , , priya, tom] = peopleRegisterFixture().items;
  assert.match(peopleStatusLine(ava), /2 notice preferences: do not notify/);
  assert.equal(
    peopleStatusLine(dana),
    "Primary contact at SYN Isolation House",
  );
  assert.equal(peopleStatusLine(grace), "No site contact roles");
  assert.equal(peopleStatusLine(leo), "Email not recorded");
  assert.match(peopleStatusLine(priya), /Primary contact at 2 sites/);
  assert.equal(peopleStatusLine(tom), "Phone not recorded");
  assert.equal(
    peopleStatusLine({ ...grace, notices_restricted: true }),
    "Notice preferences restricted",
  );
});
