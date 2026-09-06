---
title: Customer portal - private design and staged direction
revision: r01
date: 2026-09-06
status: User-authorised direction; detailed design proposed for review
owner: Dean Fiedler
related: D-027; D-028; D-011; D-012; D-022; D-024; D-025
---

# Customer portal direction

Dean requested a customer portal covering support tickets, project updates, knowledge and possible later capabilities. After the recommendation, he instructed: “design it now and implement it in bounded stages as the supporting workflows become ready.”

## Decision and rationale

Design a customer-facing channel over PPO's existing seven domains with explicit customer organisation/site/record grants, customer-safe publications and canonical support records. Proceed with a synthetic design now and bounded local implementation after the actual supporting workflow dependencies. Maintain [CP1–CP5](../delivery/customer-portal-implementation-plan.md) and a [CP1 starter](../delivery/customer-portal-cp1-starter.md). Preserve the existing P01–P12 order; no new P13 or parent requirements.

The portal can reduce repeated context gathering and make customer actions and published information easier to find. Its value depends on current information, accountable service responses and real customer isolation. A broad internal Company grant is unsuitable for customers sharing that company. Reusing existing domain services and controlled issue history keeps one source of business truth.

This private scope selection resolves only the portal-direction portion of D-027. Its original wider optional-capability question remains open. Operational corporate approval, customer delegation, D-028 aftercare, D-011 customer relationships, D-012 retention, D-022 hosting/identity and D-024 customer wording still need their own evidence. No new technical ADR or migration number is allocated during design, avoiding concurrent P10/E1 reservations.

## Options and consequences

The proposed native PPO customer area best connects site/equipment and project/service context. Assess actual MYOB Acumatica portal capabilities/licence and supported integrations before selecting the operational delivery approach. An external helpdesk may be useful if support capacity and requirements justify it; no product is selected now. Preserve assisted support during coexistence.

Initial runtime scope is text-based support with a local synthetic external-principal model. Attachments, exact reports/responses, knowledge, projects and commercial views have separate readiness/verification. Existing staff-mediated customer response UI is not an external login capability. The preview demonstrates future interactions in browser memory and cannot confer access or business authority.

This instruction authorises necessary reversible design/implementation preparation and reviewable repository delivery, including a normal checked merge. Do not require repeated approval for this same bounded synthetic scope. It does not authorise paid services, hosting, access changes for real people, invitations/messages, live integrations, transactions or production migration. Future background execution requires an explicitly configured task; the plan itself does not schedule work.

## Evidence

[Design and source assessment](../blueprints/customer-portal-design.md), [acceptance](../testing/customer-portal-acceptance.md) and [handover](../delivery/customer-portal-handover.md). Baseline main `94289a20fc609e47af647b29ca8170557da312bb`; concurrent PRs #47/#48/#49 were open. Original master issue and 78-parent/29-decision registers remain preserved; this linked current decision records the new authority without rewriting issued evidence.
