---
title: Desktop shell selection reaches both rail edges
date: 2026-11-05
---

Dean requested that the selected workspace reach both outside edges of the desktop rail. In the Figma trial the 3 px green stripe now starts at the left edge and the slate background reaches the right edge across the full 72 px compact or 240 px expanded rail. The keyboard focus example places its white outline inside the row so the green stripe stays visible.

All 31 compact and 31 expanded screens passed checks for row bounds, workspace identity, icon and label positions, footer position and prototype links. Rendered Sales and Service rails confirmed the edge treatment. The [design decision](../decisions/shell-concept-prototype.md#adopted-desktop-active-workspace) records the geometry for implementation.
