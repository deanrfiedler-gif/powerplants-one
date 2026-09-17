# DK-06 template management r01 verification

## Verified outcome

**35 model groups and 38 native-browser groups passed** against the delivered artifact, with **zero page errors and zero console errors** and 43 captures, each recorded here by identity.

[HTML](../../../reference/ui/template-management/PPO-Document-and-Form-Template-Management-r01.html) · [detailed report](../../../reference/ui/template-management/PPO-Document-and-Form-Template-Management-Report-r01.md) · [decision and receiving handover](../../../decisions/document-form-template-management-design.md) · [source](../../../design/template-management/README.md).

| Evidence | Exact identity |
|---|---|
| Authoring main | `a5406a81c02d37c4a23e75c1b71c7653fcec0d80` |
| Delivered HTML | 324,285 bytes |
| HTML SHA-256 | `a8e76cf50dfd844f0bc84b2e16e9f5eb6d78efe2021642b43808e4beb46e6c3d` |
| Local runtime actually used | Node 22.22.2; Playwright 1.63.0; Chromium 141.0.7390.37 through `PPO_CHROMIUM_PATH` |
| Repository pinned runtime | Node 24.21.0; npm 11.19.0; Playwright 1.63.0; Chrome channel — **not** the runtime of the local run below |
| Native manifest | [results.json](results.json): 38 groups, 43 capture identities and hashes, zero page and console errors |
| Model manifest | [model-results.json](model-results.json): 35 groups |
| Pinned source hashes | [source-manifest.json](source-manifest.json): 17 sources verified before assembly |

The local authoring environment could not install the repository's pinned Node 24.21.0 or the Chrome channel, so the browser script was run with an installed Chromium through its documented `PPO_CHROMIUM_PATH` override. The run manifest records the launch method and Node version rather than implying the pinned runtime. **No pinned-runtime pass is claimed here.** The focused workflow on this contribution runs the same scripts on the pinned runtime; its result must be read from that run, not inherited from this record.

## Executed checks

```sh
python3 scripts/build-template-management.py     # deterministic assembly; 17 pinned hashes verified
npx eslint docs/design/template-management/*.js scripts/check-template-management-*.mjs   # clean
node scripts/check-template-management-model.mjs # 35 groups
node scripts/check-template-management-browser.mjs
python3 scripts/check_foundation.py && python3 scripts/check_prototype.py && python3 scripts/check_naming.py
git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs   # no match
```

The three documentation checks passed with 78 parent requirements preserved. These are documentation assurance, not business acceptance.

Model groups exercised: seeded catalogue integrity; the bundled SHA-256 against `node:crypto` and canonical-form ordering; register projections and profile scope; successor lineage and preserved predecessor bytes; unsupported types, duplicate identities, orphan sections, unknown references, self-reference, cycles and unsupported operators; protected-content immutability; the conditional remaining-work panel; section reorder with retained identities; unit, type, cardinality and retired-path mismatches; hidden restricted bindings and unbound mandatory sources; three-valued conditions; distinct zero, false, unanswered, unknown and not applicable; long content and 0, 1 and many repeating items; restricted exclusion and escaped active markup; preview bytes and hash; six evidence-currency conditions; submission preconditions; immutable submissions and open findings; changed-content resubmission and self-review; unconfigured policy; unsupported profile and unknown schema; resolver refusals; approved, published, future effective and eligible now; publication preconditions; lost response and reconciliation; stale expected version; issued bytes and acknowledgement; response compatibility; shared dependency impact; withdrawal; handover and follow-up deduplication; malformed and tampered stored state; the demonstration clock; and unsupported actions.

Native groups exercised: the register and its nine filter projections and empty state; the snapshot drawer; read-only published definitions; read-only and restricted profiles; the unsupported profile; successor creation; structured section and field editing; incompatible units; protected content; document preview across five samples; finding navigation; the scenario matrix and its evidence; evidence going out of date after an edit; a failed local save and retry; submission preconditions and the frozen snapshot; independent review and open findings; return, correction and resubmission; usage impact and the partial lookup; follow-up and handover deduplication; publication succession confirmation; a lost publication response and reconciliation; future effective versus eligible now; no match, missing context and ambiguous match; the unconfigured policy hold; form preview states; unit-change response compatibility; labelled historical reconstruction; withdrawal; reload persistence; export contents; cross-tab conflict; malformed stored state; scoped reset; six views at five widths; the phone snapshot focus trap and Escape; tab keyboard semantics; and a keyboard-only successor, validate and submit journey.

## Visual inspection

Five captures from the passing run were inspected in full before this record was written. Their PNG bytes are **not committed here**: the authoring session's file transfer rewrites image metadata, so a committed copy would no longer match the hash its own run manifest records. Their identities are recorded instead, and the originals are reproduced by rerunning the browser script or taken from the focused workflow, which retains the whole capture set as its run artifact for 14 days.

| Capture | SHA-256 of the inspected original | What was inspected |
|---|---|---|
| `1440-template-rules.png` | `dbc1d68b4b6a2254b61b5a56a8ecd1495374e4085f3c11de6fa1319de6080ee9` | Desktop editing surface: section outline with keyboard reorder controls, per-field binding, requiredness, condition and check columns, the source-binding contract table and the protected block with its owner |
| `desktop-preview-restricted.png` | `a5b0a548d0930a1403a27bdedd7dabf187f73646e504e4c09c00f216c791c027` | Restricted sample: the context strip, the rendered customer document with its own presentation, and five findings including three named exclusions removed before rendering |
| `desktop-impact.png` | `ef8dfa34d559218bf054a55307830a3e822b263af2ba2ae79e310ad65e2a4b48` | Usage impact: consumers by stage with their planned treatment, the incomplete Projects lookup with its source-as-at time, and the difference classification |
| `390-template-register.png` | `a9cf3bc031de021863ffd8085cc787442a7434868623b8f64d695f8860ce4220` | Phone register: labelled cards, readable eligibility and next action, no horizontal page scrolling |
| `320-snapshot.png` | `70ec882662cfdc05d9a16f0524e909c55e14efe0f5500234aadeb7bc7ed193ad` | 320 px snapshot drawer at full width with trapped keyboard focus and Escape return |

All 43 capture identities and hashes from the same run are listed in [results.json](results.json), which the browser script writes directly from the run. Two captures include a transient confirmation toast over the page body; they are evidence of the saved-state message, not primary review images. Because these hashes come from Chromium 141 on the local runtime, a capture rendered by the pinned Chrome channel will legitimately differ; compare the workflow run's own manifest rather than these hashes when reviewing that run.

## Verification findings and repair history

| Stage | Outcome and action |
|---|---|
| First native run | Stopped in the section-and-field editing group. The dialog's submit button was resolved against the whole page rather than the dialog, so the click was intercepted by the open dialog. All dialog interactions in the script were scoped to `#dialog`. |
| Second native run | Stopped in the same group for a real defect: **Add field** opened a form labelled *Save field* with the `save-field` action, because the handler passed a blank field object where the form treated any object as an existing field. The form now takes the section identity separately and a new field genuinely creates. |
| Third native run | Stopped on a test-side lookup: `revision === 'r03'` matched the seeded quotation `DEF-QUOTE-R03` before the report successor. The assertion now selects by definition identity. Two further assertions were corrected for uppercase heading presentation and for generated field identities. |
| Fourth native run | All 38 groups passed with zero page and console errors. |
| Model authoring | An early publication check refused an ordinary succession outright. Succession over an open-ended predecessor is now possible with an explicit confirmation, while an overlap that succession cannot resolve is still refused with no arbitrary winner. A publication whose outcome is unknown no longer records the definition as published. |

## Publication and remaining limits

Documentation assurance passed on the authoring source. Broader application workflows are separate from this component result and no all-repository runtime pass is claimed.

Owner design acceptance, operational template approval, physical-device and screen-reader review, server permissions and atomic concurrency, real source, renderer, provider and retention behaviour, operational form migration, receiving-system acceptance and application integration remain separate. No merge, deployment, access change, live document issue, template activation or business communication was performed.
