---
title: Documentation contributions without generated index conflicts
date: 2026-10-22
---

Dean authorised extending the existing fragment system, stabilising the root README and enforcing source-only feature contributions. [PR #663](https://github.com/deanrfiedler-gif/powerplants-one/pull/663) implements the [source-isolation decision](../decisions/documentation-source-isolation.md); review and merge remain separate.

Status and decision landing pages retain navigation and their original legacy suffixes. New updates remain individual fragments; combined views render only under ignored `tmp/documentation/`, with read-only CI artifacts linked to an exact clean source commit. The README now provides stable purpose, setup and navigation. Required contract and design-register updates still accompany their implementation.

The PR scope check rejects routine changes to shared landing/history files and committed generated output. A new exact-path maintenance declaration records legitimate repository corrections for review. Local regression fixtures prove independent branches combine without index conflicts, malformed sources fail, legacy identities stay protected, renamed protected files are detected and old declarations cannot exempt later work. Foundation, prototype, naming and final PR checks are recorded in the decision's validation section. This is repository assurance; it changes no application behaviour or business approval.

<!-- decision-index -->
[Documentation sources without shared generated diffs](../decisions/documentation-source-isolation.md) (PPO-DOCUMENTATION-SOURCE-ISOLATION-DEC) replaces per-PR generated status/index commits with stable landing pages, ignored combined views, read-only CI artifacts and explicit maintenance declarations.
