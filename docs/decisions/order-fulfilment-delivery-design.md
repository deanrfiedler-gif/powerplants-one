# Order Fulfilment & Customer Delivery workspace — design and receiving handover

**Revision:** r01 · **Date:** 16 September 2026 · **Owner:** Dean Fiedler · **Scope:** SC-05, SC-06, SC-07
**State:** Proposed standalone design. Owner acceptance, application integration, ERP contracts, operational dispatch and deployment are all separate and unresolved.
**Base:** `main` at `0769a16dd842e9dc1c349a853036ab71949e7807` (#209 merged, 16 September 2026).

**Deliverables**

| Artefact | Path |
|---|---|
| Interactive design | [`docs/reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html`](../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html) |
| Detailed companion report | [`…-Workspace-Report-r01.md`](../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md) |
| Maintainable sources | [`docs/design/order-fulfilment/`](../design/order-fulfilment/README.md) |
| Integration requirements | [`docs/contracts/order-fulfilment-integration.md`](../contracts/order-fulfilment-integration.md) |
| Verification evidence | [`docs/testing/evidence/order-fulfilment-r01/`](../testing/evidence/order-fulfilment-r01/README.md) |
| Focused workflow | `.github/workflows/order-fulfilment-design.yml` |

---

## 1. What was designed

A five-view module-only workspace answering one question — *what can we supply, what is ready to dispatch, what has reached the customer, and what remains outstanding?* — across the three existing page scopes SC-05 (stock availability and reservations), SC-06 (picking and dispatch preparation) and SC-07 (customer delivery and proof of delivery).

*Order Fulfilment & Customer Delivery* is a **proposed grouping title**. It replaces no scope identifier, and the page register IDs remain distinct from the 78 parent requirement IDs, all of which are preserved. The governing parent scope is SCM-07 under the candidate contract [PPO-013-READINESS](../contracts/supply-chain-readiness.md).

Views: Fulfilment register · Stock & reservations · Picking & dispatch · Delivery & evidence · Exceptions & follow-through.

---

## 2. Design positions taken

These are the decisions a reviewer should push back on if they disagree. Each was a real choice.

| # | Position | Why | The alternative |
|---|---|---|---|
| 1 | **A reservation may only consume evidenced usable stock**, computed from receipt and inspection evidence, never from the source's "available" figure | A source available figure has an unverified basis. Allocating against it would make PPO's commitments depend on a number nobody has confirmed the meaning of | Trust the source figure. Faster, and wrong the first time the basis differs from what was assumed |
| 2 | **Damaged and missing quantities stay outstanding** | They were dispatched and not accepted; the order still owes them | Treat them as delivered and let the damage live only as an exception. Produces complete-looking orders against goods the customer cannot use. **This is the position most worth challenging** |
| 3 | **Corrections create successors; predecessors are retained and excluded from totals** | Preserves the original capture, author and time without double counting | Edit in place. Loses the original evidence |
| 4 | **Picked and staged are two observations, and a short pick requires a finding** | Staging is a separate physical fact; an unexplained gap between reservation and pick is the thing worth catching | One quantity field. Cheaper, and silently loses the reason |
| 5 | **An empty warehouse grant is no scope, never all warehouses** | A permission bug that reads as a convenience | Fall back to the company's warehouses. This was the actual defect found and fixed during verification |
| 6 | **Restricted values are removed in the projection, not the view** | A view-level hide still leaks through search, counts, exports and cached responses | Hide in the template |
| 7 | **An unknown source outcome blocks further business effect on that line** | A second attempt after a lost response is how duplicate allocations happen | Allow a retry and reconcile later |
| 8 | **A missing lookup result is recorded as evidenced absence, never as failure** | Absence of evidence is not evidence of absence, and here the difference is a duplicate transaction | Treat not-found as failed |
| 9 | **Coordination conditions are labelled as PPO views, not source statuses** | No equivalence to a MYOB order status has been verified | Name them after assumed source statuses |
| 10 | **No conversion between units anywhere** | No versioned accepted conversion basis exists | Convert EA to PACK with a plausible factor. Convenient and unfounded |

Positions 2 and 7 have defensible alternatives. Position 2 is recommended as designed because an order that reports itself complete against damaged goods is the more expensive error; position 7 is recommended as designed because the cost of blocking is a coordinator's minute and the cost of not blocking is a duplicate ERP transaction.

---

## 3. Reused work

Theme board **r20** tokens (via the My Work r01 scoped base, rescoped to `#ppo-fulfilment`) and its verified Roboto faces, byte-identical at SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`. The My Work r01 workspace shell, filter panel, snapshot cards, drawer, toast and page-guide components, and its pure-model / command / receipt pattern. Supply Chain **Material Readiness r03** — confirmed the latest; no r04 exists — for receipt, inspection and quarantine evidence, which is cited rather than re-captured. Products **r04** catalogue items and their declared units. Customers, Sites & Growing Areas **r03** for `SYN-PPO-ORG-000201`, `SYN-PPO-SIT-000301`, Casey Taylor and the "hardstand beside Pack Room 01" receiving point. The My Work fixture's Northbank Nursery, Greenhaven Berries and Cedar Vale Growers, and its `SYN-PPO-OPP-000041`, `SYN-PPO-PRJ-000031` and `SYN-PPO-WO-000245` references.

No existing HTML was renamed, edited or removed. Material Readiness r01, r02, r02a and r03 are unchanged.

---

## 4. Verification performed

| Check | Result |
|---|---|
| Deterministic build | `python3 scripts/build-order-fulfilment.py` reproduces the committed HTML; SHA-256 `ad331e08d6b2bb1fb5a43b3237fe7dcbd6c948a8b631d5569f350d48f5e2dfd7` |
| Model behaviour | **40 groups passed**, `node scripts/check-order-fulfilment-model.mjs` |
| Native browser interaction | **32 groups passed**, no page or console errors |
| Responsive | All five views at 1440, 1024, 820, 390 and 320 px; 25 measurements, maximum horizontal page overflow **0 px** |
| Repository checks | `check_foundation.py`, `check_prototype.py`, `check_naming.py` passed |
| Conflict-marker scan | `git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs` returned nothing |
| Visual review | Register, stock, picking, delivery, correction, partial-source, company-isolation and two phone captures inspected |

Full detail, including what was **not** verified, is in the [evidence record](../testing/evidence/order-fulfilment-r01/README.md).

---

## 5. Receiving boundary

This package delivers documentation and design sources only. It introduces no application code, no database migration, no dependency, no service and no deployment. Role and company selection in the HTML is a presentation of the model's permission projections and is **not** authenticated access control; every rule must be enforced on the server by any future application.

Nothing here authorises a live MYOB Acumatica connection, a credential, a tenant, a licence, a migration, a customer communication, an operational dispatch or a transaction. The [integration record](../contracts/order-fulfilment-integration.md) lists the fourteen source facts that do not yet exist and the eight policy decisions that block implementation; four of those decisions block the first write increment.

---

## 6. Recommended next bounded increment

A **read-only fulfilment register over synthetic data with server-enforced permissions**: schema with permanent internal identifiers and qualified external keys, the server projection implementing the quantity algebra and the information boundaries, the register view and the order drawer, and a synthetic seed reproducing this fixture. No writes until decisions 1, 2, 3 and 6 in the integration record are taken and the availability contract is verified.

Delivery evidence capture is the natural second increment, because it is PPO-owned and needs no ERP write.

---

## 7. Open at handover

The eight policy questions and fourteen unmapped source facts in the integration record. Owner design acceptance. Whether damaged quantities remain outstanding (position 2 above). Whether PPO may request a source reservation at all. No real device, screen reader or print review was performed, and no offline capability is designed or claimed.
