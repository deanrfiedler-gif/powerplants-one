---
title: Service module Figma file keeps the "(proposal)" name
date: 2026-11-14
---

On 14 November 2026 Dean renamed the Service module Figma file "PPO - Service module (proposal)". This follows the convention the file set already uses: a proposal file carries "(proposal)" and an accepted file carries "(accepted)", as "PPO - Shell (accepted)", "PPO - Sales module (accepted)" and "PPO - Estimating module (accepted)" do. The day before, he had confirmed the shorter name "PPO - Service module", and the [alignment audit record](../decisions/service-module-figma-alignment-audit.md) (PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT) and its batch were written to that. The record is now corrected in place. Section 9 records the final name. Batch item SVA-035 needs no change in the file, because the Read me header card already reads the same name. The suggested named version after the batch becomes "PPO - Service module (proposal) · alignment batch 1". When Dean accepts the Service design, the file is renamed "PPO - Service module (accepted)", with a named version and a dated note in the record. No Figma content, other record or code is changed. The file's link is not recorded (ADR-0050, ADR-0053).

Checked: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. The new name was read from the file's link Dean sent on 14 November 2026. The Read me header card was last read on 12 November 2026, and this change did not re-read it in Figma.

<!-- decision-index -->
[Service module Figma alignment audit](../decisions/service-module-figma-alignment-audit.md) (PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT) now records the Service file's final name, "PPO - Service module (proposal)", following the "(proposal)" and "(accepted)" convention of the file set. Batch item SVA-035 needs no change in the file.
