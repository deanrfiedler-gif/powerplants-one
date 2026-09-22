---
document_id: PPO-DEPARTMENT-NAV-DEC
title: Department navigation icons
revision: r01
date: 2026-09-22
status: Implemented on isolated branch; owner visual acceptance separate
owner: Dean Fiedler
---

# Department navigation icons

Dean's 22 September instruction authorises seven department rails and supersedes only r17's removal of desktop shortcuts. BP-01 sections 8.2 and 20, CRM-08 and NFR-01/NFR-08 remain the parent scope. No migration, permission grant, domain calculation, ES-08 Geometry implementation, production integration or deployment is included.

Implementation authority: supplied `PPO-Department-Navigation-Icons-VS-Code-Implementation-Prompt-r01.md`, with `PPO-Department-Navigation-Icon-Register-r02.md` as design authority, both read completely. Current routes override their historical observations. The user explicitly authorises isolated parallel work despite the older one-writing-session convention.

Starting base: **9fa8bd5a40232e4f432b431a235bdb34a9dbbebe**, verified live head of open draft PR #277. Remote main was **0c95c5af776c97374997623bd1070d9de480cf82**. Branch `feat/department-navigation-icons`, worktree `tmp/en07-change-impact/tmp/department-navigation-icons`. Existing Priva and ES-08 worktrees remain untouched; changes were observed appearing there during inspection.

## Architecture choice

Extend the existing destination catalogue, shared shell provider and local 24×24 SVG components. An explicitly typed semantic catalogue owns outline/active geometry; existing icon APIs delegate semantic names to it and retain unrelated legacy shapes. No icon package or framework is added. Alternatives were a new icon dependency (unnecessary and no matching filled family) and separate rail-only geometry (would diverge from More). New shapes are locally authored against the register's descriptions, not copied vendor assets.

Keep business destination IDs distinct from glyph keys. Canonical department compositions retain every requested position; readiness and current server-derived navigation IDs filter live links. Record routes match specific children before parents. Department preference is scoped to workspace/user identity, and URL context reproduces department selection on shared pages in new tabs. No saved preference grants access.

Logo/More remain outside the scrolling shortcuts. Existing 76px rail, 54px logo, 48px targets, 25px glyphs and 1.7-unit strokes remain. Active glyphs use deliberate body fills with contrasting details and an inset edge; focus and More-open states remain distinct. Mobile/field layouts retain their established structure.

The [handover](../delivery/department-navigation-icons.md) and [coverage register](../delivery/department-navigation-coverage.md) distinguish wired destinations, missing capabilities and executed checks. PR #277 merged on 22 September at final head `876e92ab288b682e85f58773c7b02e340a7ab63e`, merge `d6251b42f5c969f537a6397c1823f8c871e4d4d1`. Current main `c01106a884f50c2060da36333c218f93228563bf` was merged without conflict into this branch as `fb461236615167d36b49dee25662e488ff6b6e6e`; affected checks were rerun after reconciliation. Further main changes require a fresh shared-file review before merge. Navigation has not been merged or deployed.

This amends the [r17 shell integration](application-shell-integration.md) only as explicitly documented there.
