---
title: Phone tab bar takes the rail colours and shows labels
date: 2026-11-10
---

Dean asked for the phone tab bar in the Figma module files to use the desktop rail's colours: a dark bar with light icons, and a lighter current tab with a green top line. He then adopted Claude's recommendation to keep a visible label on every tab. The [decision record](../decisions/phone-tab-bar-labels-and-rail-colours.md) holds rules T1–T8: rail colours; a visible label on every tab; Roboto 11 px; full-height cells; labels that fit a five-cell bar at 320 px without wrapping or truncating; the visible label as the accessible name; and the unchanged current-tab rule. It also holds a phone label for every destination the application's phone bars use. In Figma, the Phone / Tab bar component in the Sales, Estimating, Supply, Engineering, Finance and Projects module files was restyled, with its 76 placed bars, and the Finance labels were shortened to Handoffs and Accounts. The Shell, Library and Reporting files have no phone tab bar, and the Service and Settings files are empty.

The decision supersedes the icon-only tab bar of Dean's 11 October 2026 decision and of ten other records that stated it; all eleven now carry an amendment note. The Sales record gains section 14, because its accepted phone sheets changed. The [application shell specification](../design/development/components/application-shell.md#mobile) states the rule in its Mobile section. A [binding note](../design/development/component-bindings/2026-11-10-phone-tab-bar.md) gives the detail and records the build gap, and the [shell system page](../design/development/systems/shell.md#phone-tab-bar-labels-and-rail-colours--10-november-2026) gains a section.

Checked: a script read back all 99 bars against the colour, cell and current-tab rules, twice, about ten minutes apart. Every bar kept the tab it showed as current. Label widths were measured in Figma. Screenshots of each module's bars were inspected.

Not done: no application code changed, and the application still hides phone bar labels until Codex's build, which is handed over on this pull request. Dean has not yet reviewed the redrawn bars in Figma. The accepted Sales file needs a new named version before the build; the connector cannot save one. The 84 % white on tabs that are not current is an unbound paint, as on the desktop rail, because Figma does not keep an opacity-only change to a bound paint inside an instance. No route, permission, migration, seed or CSS token changes.

<!-- decision-index -->
[Phone tab bar: rail colours and visible labels](../decisions/phone-tab-bar-labels-and-rail-colours.md) (PPO-PHONE-TAB-BAR-DEC) records Dean's 10 November 2026 direction that the phone tab bar take the desktop rail's colours, and his adoption of a visible, fitted label on every tab. It supersedes the icon-only tab bar of the 11 October 2026 estimate reviews decision and the records that followed it.
