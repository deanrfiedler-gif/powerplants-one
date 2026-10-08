import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptanceReturn, surveyReturn, equipmentHref, activityHref } from "../../src/shell/context-links";
const one = "10000000-0000-4000-8000-000000000001", two = "10000000-0000-4000-8000-000000000002";
test("canonical contextual targets retain distinct IDs and bounded source identities", () => {
  for (const id of [one, two]) {
    const equipment = new URL(equipmentHref(id, one), "https://ppo.invalid");
    assert.equal(equipment.pathname, `/equipment/${id}`);
    assert.equal(surveyReturn(equipment.searchParams.get("returnTo")), `/surveys/${one}`);
    const activity = new URL(activityHref(id, one, two), "https://ppo.invalid");
    assert.equal(activity.pathname, `/work/${id}`);
    assert.equal(acceptanceReturn(activity.searchParams.get("returnTo")), `/projects/acceptance/stages/${one}#obligation-${two}`);
  }
});
test("source returns refuse foreign origins, protocol relatives, arbitrary queries and malformed IDs", () => {
  for (const unsafe of [null, "https://evil.invalid", `//evil.invalid/surveys/${one}`, `/surveys/${one}?returnTo=https://evil.invalid`, `/surveys/../${one}`, `/surveys/%2f${one}`, `/projects/acceptance/stages/${one}#obligation-bad`]) {
    assert.equal(surveyReturn(unsafe), null);
    assert.equal(acceptanceReturn(unsafe), null);
  }
});
