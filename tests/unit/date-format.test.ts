import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatCivilDay,
  formatDate,
  formatDateTime,
  formatRange,
  formatTime,
  formatTimestamp,
  zoneAbbreviation,
  zoneDisplayName,
  zoneLabel,
  zoneOffset,
} from "../../src/shell/date-format";

// S6 examples from the phase 00 refinement decision (9 October 2026).
test("dates always carry the year and use fixed short month names", () => {
  assert.equal(formatDate("2026-09-04T00:00:00Z"), "4 Sep 2026");
  assert.equal(formatDate("2026-09-04T00:00:00Z", undefined, { weekday: true }), "Fri 4 Sep 2026");
  assert.equal(formatCivilDay("2031-09-22", { weekday: true }), "Mon 22 Sep 2031");
  // The local day, not the UTC day: 15:00 UTC on 3 Sep is 4 Sep in Brisbane.
  assert.equal(formatDate("2026-09-03T15:00:00Z"), "4 Sep 2026");
});

test("times are 24-hour with two-digit hours", () => {
  assert.equal(formatTime("2026-09-04T00:00:00Z"), "10:00");
  assert.equal(formatTime("2026-10-09T07:19:42Z"), "17:19");
  assert.equal(formatTime("2026-09-03T23:30:00Z"), "09:30");
  assert.equal(formatTime("2026-09-03T14:05:00Z"), "00:05");
});

test("a scheduled time names its zone and offset", () => {
  assert.equal(formatDateTime("2026-09-04T00:00:00Z"), "4 Sep 2026, 10:00 AEST (UTC+10)");
  assert.equal(zoneLabel("2026-01-15T00:00:00Z", "Australia/Sydney"), "AEDT (UTC+11)");
  assert.equal(zoneLabel("2026-07-15T00:00:00Z", "Australia/Sydney"), "AEST (UTC+10)");
  assert.equal(zoneLabel("2026-01-15T00:00:00Z", "Australia/Adelaide"), "ACDT (UTC+10:30)");
  assert.equal(zoneLabel("2026-07-15T00:00:00Z", "Australia/Perth"), "AWST (UTC+8)");
  assert.equal(zoneLabel("2026-07-15T00:00:00Z", "UTC"), "UTC");
  assert.equal(zoneOffset("2026-07-15T00:00:00Z", "America/Sao_Paulo"), "UTC−3");
});

test("a numeric locale zone name gives way to the offset", () => {
  const abbreviation = zoneAbbreviation("2026-07-15T00:00:00Z", "America/Sao_Paulo");
  assert.ok(abbreviation === null || !/^(GMT|UTC)[+−-]/.test(abbreviation));
  assert.equal(zoneLabel("2026-07-15T00:00:00Z", "America/Sao_Paulo").endsWith("UTC−3"), true);
});

test("an Updated timestamp carries the abbreviation only", () => {
  assert.equal(formatTimestamp("2026-10-09T07:19:42Z"), "9 Oct 2026, 17:19 AEST");
});

test("ranges state the date once on one day and both dates across days", () => {
  assert.equal(
    formatRange("2031-09-22T00:00:00Z", "2031-09-22T02:00:00Z"),
    "Mon 22 Sep 2031 · 10:00–12:00 AEST (UTC+10)",
  );
  assert.equal(
    formatRange("2031-09-22T00:00:00Z", "2031-09-23T02:00:00Z"),
    "22 Sep 2031, 10:00 – 23 Sep 2031, 12:00 AEST (UTC+10)",
  );
  // Sydney leaves daylight saving on 5 April 2026: each end keeps its own label.
  assert.equal(
    formatRange("2026-04-04T00:00:00Z", "2026-04-06T00:00:00Z", "Australia/Sydney"),
    "4 Apr 2026, 11:00 AEDT (UTC+11) – 6 Apr 2026, 10:00 AEST (UTC+10)",
  );
});

test("people see a city and a zone label, never an internal zone name", () => {
  assert.equal(zoneDisplayName("Australia/Brisbane", "2026-10-09T00:00:00Z"), "Brisbane · AEST (UTC+10)");
  assert.equal(zoneDisplayName("UTC", "2026-10-09T00:00:00Z"), "UTC");
  assert.doesNotMatch(formatDateTime("2026-09-04T00:00:00Z"), /Australia\//);
});
