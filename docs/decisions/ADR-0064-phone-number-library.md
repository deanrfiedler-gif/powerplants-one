# ADR-0064: Reading phone numbers with libphonenumber-js

<!-- versioning: git; committed history is authoritative -->

Status: implemented with calling stage 1b. Dean adopted the choice as Q7 of the calling paper on 23 October 2026: "Proceed with your recommended answers to Q1 to Q12 of the calling paper, and start stage 1 (1a Figma proposal and 1b server core)."
Date: 23 October 2026. Owner: Dean Fiedler. Builder: Claude.

Related: [Calling, caller ID and call logging](calling-and-caller-id-design.md) (PPO-CALLS-CALLER-ID-PROP), rule R6 and Q7 and Q9; [ADR-0056](ADR-0056-dependency-update-and-audit-gates.md) (dependency gates); [ADR-0006](ADR-0006-p01-local-foundation.md) (exact pins); CRM-03.

## Context

The call core matches incoming and outgoing calls to people and organisations by number. That needs every stored number in one international form (E.164, such as `+61412345678`), while the text a person typed is kept exactly (R6). Staff type numbers in many shapes:
- Australian mobiles and landlines, with or without the area code in brackets;
- 13, 1300 and 1800 numbers;
- numbers with a `+` and a country code.

A later subscription version would need every country's rules. Whether a number is valid depends on per-country numbering plans that change several times a year.

## Decision

Use **libphonenumber-js 1.13.15**, pinned exactly, through its `max` metadata entry point. `src/calls/numbers.ts` is the only module that imports it.

- `readPhoneNumber(entered, region)` keeps the trimmed entered text. It returns an E.164 number only when the library reports the number valid for the region. Otherwise it returns no number, which is shown as **Number needs checking**.
- The region comes from the company, `ppo.companies.default_phone_region` (Q9, default `AU`). Nothing hard-codes Australia.
- The `max` metadata is used because the `min` set cannot tell a valid number from a merely well-shaped one.

The package is MIT-licensed and has no runtime dependencies of its own. Version 1.13.15 was published on 8 October 2026, fifteen days before adoption.

## Options considered

- **libphonenumber-js** (chosen): a maintained JavaScript port of Google's libphonenumber metadata, regularly updated, small, typed, and with no dependencies.
- **PPO's own rules:** this could handle Australian numbers, but every country's plan would have to be maintained by hand, and the rules would fall out of date. Rejected under Q7.
- **google-libphonenumber** (the closure-compiled port): it is complete, but larger, with a dated API. It offers nothing more for reading and validating. Rejected.

## Consequences

- **Dependency gates (ADR-0056).** `npm audit --omit=dev --audit-level=high` reports no vulnerabilities, and `scripts/check-npm-audit.mjs` reports no unexcepted high or critical advisory (the one recorded `braces` exception is unchanged). Dependabot's weekly group will propose metadata updates. Each update can change whether a stored number reads as valid; stored rows are re-read only when they are saved again.
- **DK-06 template fingerprint.** `package-lock.json` is one of the DK06-OUT09-1 fingerprinted files. As with every lockfile change, managed template publications made before this change read `DefinitionChanged`, and Job pack preparation refuses with `TemplateUnavailable` until they are republished. This is the existing documented behaviour (ADR-0056, consequences), not a new risk. It must be mentioned when the pull request merges.
- **Legacy numbers.** Migration 0118 cannot run JavaScript, so existing `people.phone` values are copied across unread and flagged as needing checking. They are read the next time the person's numbers are saved.
- **Reversal.** Remove the package and `src/calls/numbers.ts`. Stored E.164 values stay usable as plain text.

## Validation

`tests/unit/calls-numbers.test.ts` proves the following:
- Australian mobile, landline, 13, 1300 and 1800 numbers read correctly;
- a `+64` number reads under the AU region;
- a number reads differently under another region;
- free text, `000` and two numbers in one field are kept unread;
- empty and over-long text and malformed regions are refused.
