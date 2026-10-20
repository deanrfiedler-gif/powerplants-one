# Contacts hub — CS-02 implementation contract

<!-- versioning: git; committed history is authoritative -->

Stable entry `route:/contacts`. Owner: Dean Fiedler. Scope **CS-02**, r20 **Register / worklist**. Application owner visual/device review **pending**.

## Desktop

The People view at `/contacts?view=people` uses the [People register contract](route-people.md), including its exact Figma nodes, **PPO - Design**, named **People — accepted**, phone amendment, source captures, permissions, desktop/mobile geometry, retained legacy workflow and open questions. Those requirements apply unchanged inside this hub. The existing People / Organisations switch remains under accepted D2; `people_view` is separate from the hub's `view` query parameter.

## Retained Organisations view

`/contacts?view=organisations` retains `CrmDirectory`. The People decision explicitly does not draw this view, so this PR does not transfer the standalone CS-01 visual design into it. Existing saved filters, columns, scoped reads and exact organisation handovers remain. The People saved-view workflow is available at `people_layout=directory`. The selected hub view remains scoped to actor/workspace and in the URL; the application checks the existing Contacts navigation duty before rendering.

## Mobile

The People view reuses the shared compact phone header with search/filter and its own menu; the hub switch remains accessible. No extra module card is added. Test both hub choices and the exact person receiving route. Failure clears People rows and counts, with retry; no offline storage or new permission is implied.

## Evidence and pending review

[Fixture manifest](../people-native-fixtures.json) and [application evidence](../../../testing/evidence/people-native/README.md). Guide `guide.page.contacts` remains Draft. Source delivery, accepted design, functional proof, visual comparison, owner review and deployment are separate. No owner fingerprint, date or review is invented.
