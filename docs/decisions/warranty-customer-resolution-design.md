---
document_id: PPO-WAR-WORKSPACE-DES
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Proposed HTML design; detailed companion report included; native verification pending
source_commit: d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f
---

# Warranty & Customer Resolution — design and receiving handover

Dean authorised a module-only r20 **MA-06 Warranty & Customer Resolution** workspace with integrated **MA-07 Supplier Recovery**, and a detailed professional Markdown companion. The central question is: **Is the failure covered, what are we doing for the customer, and what recovery remains outstanding?**

Open the [standalone HTML](../reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) with its [detailed companion report](../reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-Report-r01.md). The report inventories all six views, fields, actions, roles, data, receiving links, decision boundaries, recovery behaviour, walkthrough, validation and explicit limits.

## Source and scope decision

This contribution is based on main `d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f`. Maintenance #204 and Service Review #203 are merged at this baseline; Work Orders r01, Service Review r02, Equipment r02 and Finance r02 are available references. BP-01's warranty journey, SVC-12.3/SVC-12.5, BR-24, IF-16, BP-07 and the MA-family briefs in coverage audit r04 inform the design. Supplied theme/shell and issued design sources remain unchanged. Exact attachment hashes are in the report.

[PPO-015 / issue #15](https://github.com/deanrfiedler-gif/powerplants-one/issues/15) remains open. The contribution does not close full AT-19/AT-33 or imply implemented warranty, recurrence or supplier-recovery services. The existing repository technology is reused: standalone HTML, embedded r20 assets, local model and existing native-browser assurance. No new framework, runtime dependency, migration or deployment is introduced.

## Receiving boundaries

The fictional Willowbank journey proceeds through recovered evidence, disputed coverage, separate Commercial goodwill, exact Service work authority and an owned request, an embedded later-step replacement result, customer resolution and an independently outstanding supplier claim. The original asset and maintenance occurrence are retained; the successor has separate identity and unknown warranty dates. No automatic maintenance transfer occurs.

Supplier approval, physical return, Finance credit links and unrecovered disposition have distinct records. Customer acknowledgement never approves billing. A linked GitHub design is a reference, not a live deep link; receiving context can be exported as labelled synthetic JSON. Future SC-08 owns a separately implemented return/claim/credit workflow. MYOB remains Finance's intended transaction authority.

Roles, saves and recovery are interactive client-side design controls, not authentication or production persistence. No customer message, claim, Work Order, booking, stock movement or financial transaction is sent or created externally.

## Verification and publication

See the [verification record](../testing/evidence/warranty-r01/README.md) for exact source/hash, original results, capture review and limits. Initial local verification passed 25 model groups and six non-rendered DOM groups. Native browser verification and final publication are pending at initial preparation; the final report is reconciled to actual evidence before delivery. Owner acceptance and application integration remain separate.
