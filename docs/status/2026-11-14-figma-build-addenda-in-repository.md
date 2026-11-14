---
title: Figma build addenda A1 to A3 held in the repository
date: 2026-11-14
---

On Dean's instruction of 14 November 2026 ("Proceed however you believe is the most professional"), the three addenda pasted with every module's Figma build prompt are now living masters under `docs/standards/`, registered as PPO-FIGMA-ADDENDUM-A1 to A3:

- [Addendum A1](../standards/figma-addendum-a1-shared-record-toolbar.md): the shared record toolbar, accepted 9 November 2026;
- [Addendum A2](../standards/figma-addendum-a2-reference-form.md): the reference form;
- [Addendum A3](../standards/figma-addendum-a3-persona-and-story.md): the single synthetic story, people and reference families, sections A3.1 to A3.13.

Most alignment audits of 12 and 13 November 2026 recorded that they had not been given the addenda's text and had rebuilt A3's facts from the records that cite it. Fifty-seven repository records cite the addenda. Each file keeps its text unchanged in substance, with front matter and a short preface: the prompts it amends stay outside the repository, the shell file is now named "PPO - Shell", and later owner decisions take precedence.

A2 gains section A2.5. It points to the reference-family settlement that PPO-STD-001 section 10.2 adopted on 14 November 2026, and records the asset-tag rule from the Service alignment decision Q11 of 13 November 2026. Test-instrument and certificate tags such as `SYN-MEG-002` are not references. They keep three or four digits, and their prefixes never reuse a record type.

Checked: the addenda were scanned for Figma links, file keys, model names and gendered pronouns, and none was found; every relative link resolves. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `python3 scripts/check_documentation_scope.py`. Not done: no Figma file, design register entry, page guide or code is changed. The addenda remain companions to the prompts, not owner decisions.
