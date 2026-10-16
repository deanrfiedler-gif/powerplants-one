# ADR-0058 — Outbound customer email: one service, Microsoft Graph from a monitored shared mailbox

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Proposed, 16 October 2026. Not accepted. It authorises no app registration, mailbox, credential, DNS change, dependency, migration, sending code or customer message. **Raised by:** the [D-025 customer communications decision paper](customer-communications-d025.md), which holds the message classes, policy rules, data gaps and sequence. D-025 stays Open until Dean decides.

**Related:**
- Decisions: D-025; D-020 (identity, privacy and external access); D-022 (hosting and integration platform); D-024 (branding and templates).
- Requirements and outputs: CRM-03, DOC-05, PRJ-07, SCM-07, SCM-08, SVC-05; TR-03; OUT-11, OUT-17; IF-09; NFR-11.
- Acceptance: AT-25, AT-36.
- Records: [ADR-0003](ADR-0003-prototype-architecture.md) (retained stack), [ADR-0020](ADR-0020-email-calendar-synthetic-journey.md), [ADR-0021](ADR-0021-gmail-first-real-provider.md) and the [Email & Calendar integration design](../blueprints/email-calendar-integration.md).

## Context

On 16 October 2026 Dean asked for two things:
- an automatic dispatch email to customers, with the freight tracking number;
- regular project update emails from the Projects Department.

The decision paper adds a visit confirmation and a delay notice, and proposes four messages in two classes: automatic factual and reviewed.

PPO sends no email to anyone today:
- staff notification preferences "do not send messages";
- `DistributionAdapter` returns `delivered: false`;
- the DK-03 ledger's channel is constrained to `Synthetic`;
- both mail paths are read-only, ADR-0021 by its `gmail.readonly` scope.

Constraints:

1. **Replies reach the owning team.** Customers will reply, and their replies must reach the team that owns the order, visit or project.
2. **States stay distinct, and failures show.** DOC-05 keeps sent, delivered and acknowledged distinct. BP-01 TR-03 requires a failed customer notification to remain visible.
3. **No unrequested services.** AGENTS.md rules out unrequested services and dependencies, and keeps credentials outside the repository.
4. **Authorities stay where they are.** MYOB remains the ERP authority and SharePoint owns business documents. Outlook and Exchange own message originals (integration design §6).
5. **The tenant is unverified.** The integration design assumes Microsoft 365 and Exchange Online. The tenant, licences, administrator and mailboxes are all unverified.
6. **Volume is low but unmeasured.** It is one company's dispatches, visits and project updates, not bulk mail.
7. **The prototype is synthetic.** It holds no real customer addresses.

## Options

| Option | Cost | Maintenance | Access | Outcome evidence and recovery | Replies |
|---|---|---|---|---|---|
| **A. Microsoft Graph `sendMail` from a monitored shared mailbox** | No new vendor. The licence position is to be confirmed for the tenant | One single-tenant app registration with a certificate to rotate. Graph is already the planned read interface | App-only `Mail.Send` reaches every mailbox unless scoped. Scope it with Exchange Online [RBAC for Applications](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac) to the named mailbox, and remove any unscoped Entra grant, because the two are additive | `sendMail` returns `202 Accepted`, which Microsoft says "doesn't indicate that the request processing has completed" ([reference](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)). Sent is confirmed by finding the copy in Sent Items by PPO's identifier header. Bounces return as non-delivery reports, which PPO reads and matches. There is no delivery event. [Exchange Online limits](https://learn.microsoft.com/en-us/office365/servicedescriptions/exchange-online-service-description/exchange-online-limits) apply | Native: replies arrive in the same mailbox, and sent copies are visible in Outlook |
| **B. Transactional email service** | Per-message fees, vendor onboarding and data-processing terms | DNS SPF and DKIM records for the domain or a subdomain, an API secret, a public webhook endpoint into PPO, and suppression-list handling | The API key can send as any verified address on the domain | Delivery, bounce and complaint events give real Delivered and Failed evidence. Idempotency support varies by vendor | `Reply-To` a monitored mailbox. Sent copies are not in Outlook unless copied in |
| C. SMTP submission (Exchange SMTP AUTH or a relay connector) | None new | A second credential type alongside Graph | Mailbox password or connector trust | No better than A, and weaker error detail | As A |
| D. Gmail API send | — | — | ADR-0021 is deliberately read-only, on Dean's personal labelled mail, on the hosted demo | — | Not a company identity |
| E. Manual send: staff paste PPO's prepared text into Outlook | None | None | Staff mailboxes | Staff record the outcome by hand | Native |
| F. Customer portal only (CP-03) | — | — | Customers must sign in | — | Customers still phone. The portal is a design only |

## Decision (proposed)

1. **One service.** One communications service owns every outbound customer email. Supply, Service and Projects request a message from it and never call a provider. The paper's rules R1–R9 apply to every channel.
2. **A provider-neutral channel.** The service sends through a provider-neutral channel adapter:
   - The **synthetic channel** comes first, in the prototype.
   - **Option A** is the first live channel.
   - **Option B** is the named alternative. It is to be adopted by a successor ADR if any of these holds:
     - the pilot shows bounce visibility under A is inadequate;
     - volume or throttling exceeds Exchange Online limits;
     - the company's mail is not Exchange Online.
   - **Option E** remains the fallback for a held message, never the channel.
3. **Graph configuration constraints.**
   - A single-tenant app, app-only, with a certificate credential held outside the repository in the hosted environment's secret store.
   - `Mail.Send` scoped by RBAC for Applications to the named shared mailbox or mailboxes only.
   - Reading scoped the same way, and only to match Sent Items and non-delivery reports. The minimal read grant is verified in the pilot.
   - No delegated sending, and no send-as for any staff member.
4. **Outcome mapping:**
   - `202` → Submitted.
   - The copy found in Sent Items → Sent.
   - A Graph error or a matched non-delivery report → Failed.
   - Delivered only from positive evidence, such as a message trace.
   - No response → OutcomeUnknown, and PPO searches Sent Items before any retry.
5. **No new runtime dependency.** Graph is called with `fetch`, as ADR-0021 chose over `googleapis`. Token acquisition reuses the existing `openid-client` where it supports the certificate flow. The implementing increment confirms this.

## Rationale

- **Fits the constraints.** Option A meets constraints 1, 3 and 4 without a new vendor.
- **Customer data stays in the tenant.** Customer addresses and content stay in the tenant that already holds staff mail.
- **Staff see what customers see.** Replies and sent copies appear where staff already work.
- **The cost of A is honest delivery reporting.** It gives Submitted and Sent, and Delivered rarely, so the UI must say "Sent — delivery not confirmed". Failures still surface through non-delivery reports, which satisfies DOC-05 and TR-03 without overclaiming.
- **B for evidence, not as the default.** B gives better delivery evidence, but adds a vendor, a public webhook and a third-party copy of customer data before the low volume justifies it.

## Consequences

- **Tenant dependency.** Sending depends on the Microsoft tenant. An outage produces Held or OutcomeUnknown records with owned follow-ups, never silent loss.
- **Security review.** The app registration needs administrator consent and a D-020 security review.
- **A later migration.** A later migration adds the communication record, its ledger and the outbox kinds. That migration follows AGENTS.md's registry and upgrade rules. This record allocates no version.
- **Unchanged.** The DK-03 ledger, staff notifications, the Email & Calendar read paths and ADR-0021 are unchanged. Staff notification email remains a separate, unbuilt decision.
- **Reversal path.**
  - Each message class has its own switch in PPO, off by default. Turning it off stops that class at once.
  - Removing the app's credential or its RBAC assignment stops all live sending. Microsoft notes that app permission changes can take up to two hours to apply.
  - Moving to Option B changes only the channel adapter, not the message classes, records or states.

## Validation evidence and remaining questions

**Planned validation, not executed:**
- On the synthetic channel:
  - idempotent preparation and replay;
  - Held and Failed follow-up Activities;
  - suppression;
  - the template allowlist refusing internal fields.
- In the pilot, to internal addresses only:
  - `202` followed by a matched Sent Items copy;
  - a deliberately invalid address producing a matched non-delivery report and Failed;
  - a send from an out-of-scope mailbox refused by RBAC.

**Remaining questions** (from the decision paper):
- Q1: where freight is booked and where the consignment note lives.
- Q2: whether Projects uses the Smartsheet Customer Update register today.
- Q3: which mailbox to send from, whether it is Exchange Online, and who can grant consent.

Tenant licences, retention (D-020/D-024) and support ownership (D-023) also remain open.
