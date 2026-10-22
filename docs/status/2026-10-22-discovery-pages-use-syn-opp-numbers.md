---
title: Discovery pages use SYN-OPP- numbers
date: 2026-10-22
---

Dean, 22 October 2026: "I have been removing PPO from the numbers. So it would just be "SYN-OPP-"." The three accepted ES-02 Discovery pages in Figma (Discovery register, Create discovery workspace, Discovery costing) now show `SYN-OPP-000nnn`, matching the application's new-reference format since migration 0114. Layout, content and decisions are unchanged.

- New r02 capture folders hold the 20 images that changed (register 3, Create discovery workspace 9, Discovery costing 8). Every re-export was compared by SHA-256 with r01, which is retained byte for byte.
- The three design decisions gain a dated row and a section 8 recording the change, the r02 captures and the new named versions. Each saved in the Figma desktop app on Dean's yes and seen in version history.
- No application code, migration or test changed. Owner visual review of the r02 images is pending.
