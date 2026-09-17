---
document_id: PPO-DEAL-WORKSPACE-DEC
title: Deal Workspace design and receiving handover
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: User-authorised standalone build; owner acceptance and runtime integration separate
---

# CR-01 — Deal Workspace r01

Dean instructed the dedicated Sales Deal Workspace HTML build after reviewing the detailed build report. This package implements the standalone design and companion report, with a shared Board/List navigation harness. It preserves the existing CR-01 identity from page coverage register r06 and parents CRM-02, CRM-03, CRM-04, CRM-05, CRM-07 and CRM-08.

## Decision and conformance

Use r20 Record detail, supported by Form / guided workflow and Document & evidence workspace. Reuse the PPO palette, shared Customer 360 fonts/icons, r20 header/facts/tabs/panel composition and r36 detail/task/document/follow-up concepts. The host supplies the global shell; there is no new rail item or repeated masthead.

The full [conformance declaration and actual feature description](../reference/ui/crm/PPO-Deal-Workspace-Report-r01.md) identify source authority, reusable components, inputs, outputs, exceptions and departures. The [HTML](../reference/ui/crm/PPO-Deal-Workspace-r01.html) is generated from [stable sources](../design/deal-workspace/README.md).

## Receiving boundary

The planned runtime destination is the existing opportunity route. It must reuse current CRM scoped reads, expected-version commands and original-operation recovery. Model permissions here are a synthetic review aid, not application authentication.

Keep the current distinction between stage and outcome, original/current owner and individual work ownership. Won is limited to Closing, retains stage and records exact closing accountability. The prepared receiving packet creates no order, project, work order or message. Current terminal guards and immutable captured evidence remain authoritative.

Working scope does not rewrite submitted intake. Estimator acceptance/return is separate from submission. Quote acceptance retains its exact revision/options; the latest draft is not substituted. MYOB and SharePoint keep their intended ERP and business-document authority.

## Departures and remaining work

Contacts move into a supporting view; commercial content receives its own tab. The compact Board/List proves the round trip but does not replace r36 drag/drop, bulk work, insights or complete pipeline administration. This harness supports stage names/probability/rotting settings only. Runtime pipeline configuration requires versioned contracts and migration policy.

All local work is session-only. Destination panels are explanatory previews. Reopening/archive, full receiving acceptance, external providers and durable task/correspondence projections remain separate increments. No dependency, application route, migration, infrastructure change, merge or deployment is part of this design contribution.

## Evidence

[Verification record](../testing/evidence/deal-workspace-r01/README.md) separates model/DOM results, native browser evidence and physical-device/owner acceptance. The exact delivered HTML passes 31 model groups and 22 native browser journeys, with 47 original captures across five widths. Six reviewed originals and the complete manifest are retained. Initial local DOM evidence and the local browser restriction are distinguished from the subsequent native CI pass.
