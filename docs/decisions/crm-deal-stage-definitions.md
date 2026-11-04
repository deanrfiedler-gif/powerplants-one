---
document_id: PPO-CRM-STAGES-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Proposed by Claude under the standing order, 1 November 2026; awaiting Dean's acceptance or amendment; team practice only, changes no application behaviour
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# What each deal stage means

## Context

The synthetic five-stage pipeline orders deals as **Discovery**, **Scoping**, **Quoting**, **Negotiation** and **Closing** (`src/crm/stages.ts`, `db/seed-crm-five-stages.sql`). The application applies only these rules:

- **Forward:** a deal moves forward one stage at a time.
- **Back:** it may move back to any earlier stage.
- **Contact:** outside **Enquiry**, a deal with no customer contact needs an active contact-identification activity.
- **Outcomes:** **Won** can be recorded only from **Closing**.

Nothing in the code says what a stage means. The [CRM Deals guide](../guides/crm-deals.md) therefore could say only where a stage sits in the order, and a business reviewer has to supply its meaning before the guide can be published.

On 1 November 2026 Claude recommended that each stage be defined by the evidence needed to enter and to leave it, rather than by a description, so that a salesperson has a test to apply. Claude then drafted these definitions under the standing order.

## Proposal

**Status: proposed, not accepted.** Dean decides the meanings. Until he accepts or amends this record, it is a proposal.

| Stage | Move the deal here when | Move it on when |
|---|---|---|
| **Discovery** | A new enquiry is worth pursuing. Every new deal starts here. | The customer contact and the need are recorded, and the decision to pursue is made. |
| **Scoping** | The need is understood. | The scope is defined well enough to price. |
| **Quoting** | The scope is ready to price. | A quotation has been issued to the customer. |
| **Negotiation** | The quotation has been issued. | Commercial terms are agreed in principle. |
| **Closing** | Terms are agreed in principle. | An order or acceptance is received (record **Won**), or the deal is lost (record **Lost**). |

Moving a deal back records that an earlier condition no longer holds. For example, a deal returns to **Scoping** when the customer changes the scope after a quotation.

## Enforcement

These entry and exit conditions are **team practice**. The application does not check them, and the guide must say so wherever it uses them.

Promoting a condition to an enforced rule is a later, separate decision. An example would be refusing **Quoting** until a released quotation is linked. Each such rule needs its own ADR, an explicit tested rule, and the data the check depends on. Run the definitions as practice first, and promote only the conditions that prove stable and checkable.

## Scope

This record covers the five-stage pipeline only. Deals still in the original I1 pipeline (**Enquiry**, **Qualified**) keep their earlier rules. Whether to retire that pipeline, and what to do with its remaining deals, is a separate decision. Nothing here authorises any data change.

## Consequences

- **Guide:** the CRM Deals guide uses these conditions in its stage table and marks them as team practice. It stays InReview and hidden until a business reviewer approves it.
- **Changes:** a change to a condition is made here first, and the guide follows.
