---
title: Compiled desktop browser CI partition claimed
date: 2026-10-21
---

Dean requested green CI for Field team #648 with unrelated infrastructure repairs kept separate. Codex owns this separate maintenance branch and draft PR. The compiled desktop job reached its 60-minute limit on unchanged main `78795dd6` and on #648; the complete suite no longer has reliable job margin. The [compiled-browser decision](../decisions/ci-compiled-browser-suite.md) remains the authority for preserving all projects, original test deadlines, warm-up and retained restart proof.

The planned change is limited to `.github/workflows/application-compiled.yml`, that maintenance record and this generated status entry: run the desktop project in two native Playwright shards, each with its own application and disposable `ppo_synthetic_test`, preserve serial execution within a shard, and keep both shards mandatory in the existing aggregate. Mobile and retained jobs stay intact. Compare complete test discovery with the disjoint shard union before execution. No application change, dependency, permission, migration, deployment or business acceptance is proposed. Verification is pending.
