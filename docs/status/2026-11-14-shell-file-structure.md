---
title: Shell Figma file arranged in the module-file page template; alignment batch 1 and the structure accepted and pinned by a named version
date: 2026-11-14
---

Dean asked whether the Shell file used the same layout template as the module files. It did not, because it was built a day before the Sales file set that template. On his instruction the private Figma file "PPO - Shell" now runs in the template's page order. [Shell decision record section 15](../decisions/shell-refined-concept-design.md#15-file-structure-aligned-with-the-module-template--14-november-2026) records the change. The file's link and key are not recorded (ADR-0050, ADR-0053).

- **Pages added.** A Read me page with the four template cards: page header, page template, a sheet index of every page, section, sheet and component set with its node ID, and the audit. Also "— Accepted —" and "— Proposals —" separators, and an empty Scratch page.
- **Components moved.** The Components section moved to a "Shell and kit" page with its node ID unchanged.
- **Old index removed.** The superseded sheet index on the first page, which no record cites, was removed.
- **Kept by decision.** The sheets A–AN and their grid, the page names, and the absence of phone sheets. The page template card states the reasons.

Checked through the Figma connector:
- All 2,690 instances on the three content pages resolve to their components, with none missing.
- The separators and Scratch are empty.
- No top-level node overlaps another.
- The Read me page was rendered.

Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`.

Accepted: Dean accepted alignment batch 1 and this structure ("I accept all your recommendations") and saved the named version "Shell refined concept — accepted · alignment batch 1 applied" on 14 November 2026. Builds that start after that date cite it, and it also pins the navy primary action. Dean then renamed the file "PPO - Shell (accepted)", the form the module files use; [decision record section 9](../decisions/shell-refined-concept-design.md#9-file-name--9-november-2026) records the name. No sheet, component, rule or application code changed.

<!-- decision-index -->
[Shell refined concept decision record, section 15](../decisions/shell-refined-concept-design.md#15-file-structure-aligned-with-the-module-template--14-november-2026) (PPO-SHELL-REFINED-FIGMA-DEC) records the Shell Figma file arranged in the module-file page template on 14 November 2026. The file gains a Read me with the sheet index, status separators, Shell and kit (holding the Components section with its node ID unchanged) and Scratch; the sheets, page names and rules are unchanged. Dean accepted it with alignment batch 1 on 14 November 2026 and saved the named version "Shell refined concept — accepted · alignment batch 1 applied". It authorises no application code.
