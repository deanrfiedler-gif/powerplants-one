# Products PR 1 consumer corrections

<!-- versioning: git; committed history is authoritative -->

The existing product-patterns and register-table consumers implement the [governing handover on PR #947](https://github.com/deanrfiedler-gif/powerplants-one/pull/947#issuecomment-6871312916). The [catalogue contract](../../../contracts/products-catalogue.md) holds the shipped vocabulary and API behaviour. This binding adds state examples without changing a shared component specification.

PD-01 retains its labelled lifecycle and Order selects. Friendly lifecycle text has PascalCase values; the bounded footer omits order. PD-04 headings place the selected product before its side label and counterpart, including the accessory’s side. The native form, card layout, wrapping and exact original/candidate revision links stay in place on desktop and phone. The Products browser fixture checks both succession headings and the filter/order/footer states; unit and database fixtures cover accessory direction and unchanged hashes.

Source basis: private file **PPO - Products module (accepted)** (formerly **PPO - Products module**), named version **PPO - Products module (accepted) · alignment batch**; CA01 `14:251`, PC01 `23:296` and PC03 `23:1539`, as cited by the build brief and Products record. No new Figma inspection or captures were made. Paired visual, physical-device and screen-reader review remain pending; no review fingerprint or visual acceptance is added. The reviewed browser is unavailable locally; browser execution is left to CI.
