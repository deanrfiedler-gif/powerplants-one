# ADR-0005 — Independent project naming and repository adoption

**Status:** Adopted by Dean for the private prototype. **Date:** 5 September 2026. **Related:** D-003, D-029, PPO-STD-001; PP-01 API/data/document contracts.

## Context and authority

Dean explicitly confirmed Powerplants One as the product and PPO as its short project code, clarified that the other project's STD-001 and identifiers do not govern this project, and then adopted naming standard r02 and requested repository implementation. He also requested instructions for his dedicated ChatGPT design/development project.

## Decision

Adopt the [independent naming standard](../standards/naming-conventions.md). Preserve the exact [accepted r02](../reference/baselines/PPO-STD-001-naming-conventions-r02.md); working r03 records administrative adoption and implemented documentation changes. The scheme itself remains the user-adopted r02 design.

1. Use Powerplants One / PPO. PPO-STD-001 is the first standard in this project's own namespace. The unrelated STD-001 introduces no approval, retrieval or naming dependency.
2. Use `docs/blueprints/BP-01-master-blueprint.md` and `docs/contracts/document-issue-distribution.md` as canonical paths. Preserve the original issued master/audit bytes and identifiers.
3. Retain useful established BP, ADR, requirement, PP-01, P01–P12 and backlog IDs. D-003 is resolved for the private prototype. D-029 remains partially resolved for future ownership/support controls.
4. Align the unimplemented API design under `/service/work-orders` and `/service/tickets`; retain API-C/API-R IDs and workflow meanings. No aliases or compatibility major change are needed for nonexistent consumers.
5. Adopt the dictionary's explicit SYN-PPO readable-reference allocation rules and output filenames. UUIDs remain identity; new optional future record types remain reserved. No database or runtime behaviour is implemented here.
6. Maintain the [ChatGPT project instructions](../standards/chatgpt-project-instructions.md) in GitHub and provide the same text for the user's settings. A copy in ChatGPT is not automatically synchronised.

## Supersession and alternatives

This supersedes ADR-0002's particular master path and deference to external STD-001/GEN. Its stable-path and preserved-baseline principles remain valid. ADR-0002 retains its historical decision text with a current annotation.

Keeping the original long filename leaves provisional naming in current navigation. Renumbering all current identifiers creates avoidable traceability work. The adopted approach makes two targeted path changes and preserves useful local IDs.

## Consequences and evidence

Update active relative links, source locators, validators, contribution guidance, status and decision notes together. Keep original decision wording/closure-evidence columns tied to the issued master, with current resolution recorded separately. All application acceptance procedures remain Not run.

The [adoption record](../standards/naming-adoption.md) contains the mapping, baseline hashes, validation scope and future obligations. This action does not implement P01, provision hosting, alter external records or change repository visibility.
