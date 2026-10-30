---
document_id: PPO-AD09-OPERATIONAL-HEALTH-FIGMA-R01
revision: r01
date: 2026-10-31
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
---

# Operational health design r01 — retained captures

These eighteen images retain the Operational health design (AD-09) that Dean accepted on 31 October 2026. `/foundation` and `/admin` are built; the Overview, Incidents and Release readiness views are not, and the design defines the build. They cover:
- the health overview;
- an incident record and a recovery item with a safe retry;
- the release readiness review, Not ready and Ready for demo upgrade;
- Foundation checks;
- tablet 1024, phone 390 and 320, and seven states.

The decisions, conformance declaration and departures D1–D10 are in [the design decision](../../../decisions/operational-health-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own, from the [logo pack r01](../ppo-logo-pack/README.md). The people, incidents, reports, releases, run results and migration numbers are synthetic fixtures. The images are design compositions, not captures of the application, and they claim no production readiness, real uptime or business acceptance.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Health overview, Tue 13 Oct 09:00 | [PPO-Operational-Health-01-Desktop-Health-Overview-r01.png](PPO-Operational-Health-01-Desktop-Health-Overview-r01.png) | 1440 × 2353 | 424,843 | `3aac8b3fcd57a1842cfe2f5b39c347b63a0935e2a6d30d645142c155fde70871` |
| 02 · Desktop · Incident SYN-INC-000007, Mitigated, owned | [PPO-Operational-Health-02-Desktop-Incident-Record-r01.png](PPO-Operational-Health-02-Desktop-Incident-Record-r01.png) | 1440 × 2481 | 372,612 | `8241bdc40b880ef3a40cf904cdf013dadff2373c9138b140337e85603ff1a3ca` |
| 03 · Desktop · Recovery item SYN-RPT-000067, safe retry | [PPO-Operational-Health-03-Desktop-Recovery-Item-r01.png](PPO-Operational-Health-03-Desktop-Recovery-Item-r01.png) | 1440 × 1296 | 229,861 | `b7e281288378b4fcdd500796d2ea78c191627ea1152e243b6b6e8bfa25f983aa` |
| 04 · Desktop · Release readiness SYN-REL-000004, Not ready | [PPO-Operational-Health-04-Desktop-Release-Not-Ready-r01.png](PPO-Operational-Health-04-Desktop-Release-Not-Ready-r01.png) | 1440 × 2136 | 402,526 | `690030e339456c6216d2b398c4aa317f4811cc5e8587970685f6f0bc3f18dad8` |
| 05 · Desktop · Release readiness SYN-REL-000004, Ready for demo upgrade, signed off | [PPO-Operational-Health-05-Desktop-Release-Ready-r01.png](PPO-Operational-Health-05-Desktop-Release-Ready-r01.png) | 1440 × 2082 | 408,839 | `72afbe19031446d14147bef247ca5dd1266dd5a9448c108c4f69bb2d1bb774d6` |
| 06 · Desktop · Foundation checks, local synthetic copy | [PPO-Operational-Health-06-Desktop-Foundation-Checks-r01.png](PPO-Operational-Health-06-Desktop-Foundation-Checks-r01.png) | 1440 × 1084 | 222,649 | `87b1026b0b7840a9e759f55282f663ec4a717a1266fbbf67ab9a9ce61bdd2e69` |
| 07 · Tablet 1024 · Health overview | [PPO-Operational-Health-07-Tablet-Health-Overview-r01.png](PPO-Operational-Health-07-Tablet-Health-Overview-r01.png) | 1024 × 1654 | 248,493 | `d04dcc043ace4b5d9c1b9329f910c66fd920edac54c049782b7c130f6320b007` |
| 08 · Phone 390 · Overview after the 06:10 alert | [PPO-Operational-Health-08-Phone390-Overview-Alert-r01.png](PPO-Operational-Health-08-Phone390-Overview-Alert-r01.png) | 390 × 844 | 57,492 | `0504184ffe65fa1fec68124494155f1a30c61636e4a79e1b86938feb720e8882` |
| 09 · Phone 320 · Overview after the 06:10 alert | [PPO-Operational-Health-09-Phone320-Overview-Alert-r01.png](PPO-Operational-Health-09-Phone320-Overview-Alert-r01.png) | 320 × 844 | 52,597 | `f91ff627745ebc581db3b5e68b47bcbc8bed9c23da21a471336cb634961e882a` |
| 10 · Phone 390 · Incident, Acknowledge alert | [PPO-Operational-Health-10-Phone390-Incident-r01.png](PPO-Operational-Health-10-Phone390-Incident-r01.png) | 390 × 844 | 59,202 | `2e358908a7541ef0e453305dc0ba6f0390a94edbbe113df58c13a76d50fd8974` |
| 11 · Phone 320 · Incident, Acknowledge alert | [PPO-Operational-Health-11-Phone320-Incident-r01.png](PPO-Operational-Health-11-Phone320-Incident-r01.png) | 320 × 844 | 54,331 | `bb4482b54054ebe2a13a24edfd1b4b3039702592d810f63799763ffd63a8ab7b` |
| 12 · State · Phone 390 · Loading | [PPO-Operational-Health-12-State-Loading-r01.png](PPO-Operational-Health-12-State-Loading-r01.png) | 390 × 844 | 22,048 | `befb6fa00c678c1ce02673b37c82a9bfa46fcdad1cc57ffea24788a63987e979` |
| 13 · State · Phone 390 · All healthy | [PPO-Operational-Health-13-State-All-Healthy-r01.png](PPO-Operational-Health-13-State-All-Healthy-r01.png) | 390 × 844 | 54,035 | `47c4d2d9960061f78ad8e91dbf62747d29f89f437f310f71fc670cc2bb42ae4a` |
| 14 · State · Phone 390 · A check failing | [PPO-Operational-Health-14-State-Check-Failing-r01.png](PPO-Operational-Health-14-State-Check-Failing-r01.png) | 390 × 844 | 51,342 | `6e801ccc0c490979507712f6ce3d54b8f9dbe58a15464c2204ece7409fc35ca9` |
| 15 · State · Phone 390 · Results stale | [PPO-Operational-Health-15-State-Results-Stale-r01.png](PPO-Operational-Health-15-State-Results-Stale-r01.png) | 390 × 844 | 45,203 | `67813d405687e67fadd762606cc259ec16a8086fdd075a1b8c8a1b07a01b8a90` |
| 16 · State · Phone 390 · Incident unowned, Take ownership | [PPO-Operational-Health-16-State-Incident-Unowned-r01.png](PPO-Operational-Health-16-State-Incident-Unowned-r01.png) | 390 × 844 | 59,724 | `d6fd63c7ba3ec713a05491de6d29945c57ed8c9275c591f700d611b2208d5837` |
| 17 · State · Desktop · Release blocked by an open incident | [PPO-Operational-Health-17-State-Release-Blocked-r01.png](PPO-Operational-Health-17-State-Release-Blocked-r01.png) | 1440 × 2079 | 408,974 | `740f81de75d665b81efc72d7b1bfba6b41961358746d6eca9070c7946760f084` |
| 18 · State · Desktop · Foundation checks on the hosted demo, not run | [PPO-Operational-Health-18-State-Local-Only-On-Hosted-r01.png](PPO-Operational-Health-18-State-Local-Only-On-Hosted-r01.png) | 1440 × 1184 | 221,216 | `a1154d25ff773dc1a35b0e5ac18334d82c3c919e8ae480798a619b15c3444a67` |
