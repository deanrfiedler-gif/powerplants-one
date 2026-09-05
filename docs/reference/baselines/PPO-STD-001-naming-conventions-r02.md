# Powerplants One — Naming, Identification & Information Organisation Standard

**Recommended project standard · Revised edition · 5 September 2026**

| Document control | Value |
|---|---|
| Document ID | **PPO-STD-001** |
| Short title | Naming Standard |
| Revision | **r02** |
| Status | **Proposed for project adoption** |
| Prepared for | Dean Fiedler — private prototype owner |
| Applies to | Powerplants One — Design & Development |
| Intended authoritative path | `docs/standards/naming-conventions.md` after repository adoption |
| Download filename | `powerplants-one-naming-standard.md` |
| Source baseline inspected | `deanrfiedler-gif/powerplants-one`, commit `c44321e8cbbe205a482e38499016f396e2f6374d` |
| Scope of this edition | Naming policy, terminology, examples, exceptions and implementation plan |
| Adoption state | Document prepared; repository renames, application changes and external-system changes have not been performed by this edition |
| Authority and independence | Independently designed for Powerplants One. The user confirmed that the other project's `STD-001` and identifiers do not govern this project. Existing PPO decisions are retained or refined on their merits |

## Executive recommendation

Use the user-confirmed **Powerplants One** application and project identity and **PPO** short code, with a naming system based on readable words, stable references and explicit context.

This is an independent Powerplants One standard. The `STD` element in **PPO-STD-001** means “standard”; `001` is the first entry in this project's own standards catalogue. It does not inherit the rules, numbering authority or approval process of another project's STD-001.

Working files should have short, stable names. Document identity, revision, status, owner and source belong in document metadata. Issued copies should retain a revision in both their metadata and their filename. Business records should use permanent internal identifiers and separate readable references. External MYOB, SharePoint, CAD and legacy-system identities must remain intact.

For the current master blueprint, the recommended working path is:

`docs/blueprints/BP-01-master-blueprint.md`

This is clearer than `GEN_SPC_PPABusinessPlatform_MasterBlueprint.md`, aligns with the established BP-01 to BP-09 catalogue, and removes the provisional `GEN` prefix. Its existing issued v02 baseline should remain unchanged at its current historical path.

The design deliberately preserves useful identifiers already established within Powerplants One: BP-01–BP-09, ADR numbers, parent requirements, PP-01, P01–P12 and existing backlog references. They are retained because they are clear and already support this project's traceability, not because another project mandates them. Any unsuitable local identifier can be replaced through an explicit old-to-new mapping that preserves its historical meaning.

## Contents

1. [Purpose, scope and authority](#1-purpose-scope-and-authority)
2. [Core rules](#2-core-rules)
3. [Project and product names](#3-project-and-product-names)
4. [Business domains and terminology](#4-business-domains-and-terminology)
5. [Names, identities and versions](#5-names-identities-and-versions)
6. [Document catalogue and working filenames](#6-document-catalogue-and-working-filenames)
7. [Revisions, snapshots and issued copies](#7-revisions-snapshots-and-issued-copies)
8. [Repository and information structure](#8-repository-and-information-structure)
9. [Requirements, decisions and delivery identifiers](#9-requirements-decisions-and-delivery-identifiers)
10. [Business-record references](#10-business-record-references)
11. [Business documents, drawings and evidence](#11-business-documents-drawings-and-evidence)
12. [Interface language and reporting](#12-interface-language-and-reporting)
13. [Source code and configuration](#13-source-code-and-configuration)
14. [Database fields and schemas](#14-database-fields-and-schemas)
15. [APIs, events and integration mappings](#15-apis-events-and-integration-mappings)
16. [GitHub workflow and software releases](#16-github-workflow-and-software-releases)
17. [Environments and infrastructure](#17-environments-and-infrastructure)
18. [ChatGPT work and handovers](#18-chatgpt-work-and-handovers)
19. [Compatibility and naming limits](#19-compatibility-and-naming-limits)
20. [Adoption and migration plan](#20-adoption-and-migration-plan)
21. [Ownership, exceptions and verification](#21-ownership-exceptions-and-verification)
22. [Quick reference and worked example](#22-quick-reference-and-worked-example)
23. [Evidence and references](#23-evidence-and-references)

## 1. Purpose, scope and authority

This standard defines how to name and identify the information used to design, develop, test and operate the Powerplants One prototype. It covers all seven business domains and their shared platform capabilities.

Its practical objectives are to make information easy to find, prevent conflicting meanings, preserve links over time, support reliable integration and allow another developer or business reviewer to understand an item without interpreting an unexplained code.

| In scope | Application of this standard |
|---|---|
| Project identity | Product name, project name, repository and development roadmap |
| Specifications | Blueprints, contracts, standards, decisions, plans and registers |
| Development | Source files, modules, tests, APIs, database objects and configuration |
| Delivery | Issues, branches, pull requests, releases, environments and evidence |
| Business information | Proposed local record references, field labels, outputs and document metadata |
| Collaboration | Chat titles, handover records and reference copies |
| Migration | Mapping existing names, retaining aliases, checking references and preserving historical evidence |

**Authority:** the user has confirmed Powerplants One and PPO and authorised independent design of the naming system with full creative discretion. This edition records the recommended conventions for the private prototype. Repository implementation and live-system changes remain separate actions; this document does not claim they have occurred.

**Rule precedence:** current user instructions govern the task. Verified external identifiers, platform-required names and approved contractual document controls must be preserved. Within Powerplants One, the adopted naming standard governs new names; a specific approved contract or documented exception governs an intentional deviation. Resolve conflicts explicitly rather than silently changing schemas or corporate records.

The `STD-001` references in CONTRIBUTING, ADR-0002 and the document contract are inherited references to a different project. The user's clarification removes them as a naming dependency. During repository adoption, replace active instructions that defer to that standard with this independent Powerplants One convention, and annotate prior decisions where needed to preserve their chronology. No review of, approval under, or crosswalk to the other project's STD-001 is required.

Actual vendor identifiers, framework syntax and customer-specific contractual requirements still need accurate handling because other systems or recipients depend on them. That interoperability requirement is distinct from adopting another project's naming policy.

## 2. Core rules

| Rule | Requirement | Example or consequence |
|---|---|---|
| N01 | Use the recognised product identity consistently. | Powerplants One; code PPO; repository `powerplants-one` |
| N02 | Prefer specific business words to unexplained abbreviations. | `service-report`, not `svc-rpt-new` in an ordinary working filename |
| N03 | Keep one stable path for each current working document. | `BP-01-master-blueprint.md`; no `_v03` on the working file |
| N04 | Separate identity, revision, status and display name. | A report can retain its ID, receive revision r02 and become Issued |
| N05 | Preserve assigned references permanently. | Retire a requirement ID; never allocate it to a different requirement |
| N06 | Preserve external source identities exactly. | MYOB company and document key are stored independently of a local title |
| N07 | Make synthetic records recognisable outside the application. | `SYN-PPO-WO-000001` and a visible Synthetic data label |
| N08 | Use stable business capabilities for module names. | `service`, even if the departmental reporting structure changes |
| N09 | Use explicit units, dates and financial meanings. | `duration_seconds`; UI “Invoice amount including GST” where that basis is known |
| N10 | Treat filename changes as reference changes. | Update links, manifests where applicable, validators and consuming scripts together |
| N11 | Honour framework and supplier conventions. | Preserve `page.tsx`, `README.md`, vendor part numbers and linked CAD names |
| N12 | Apply controls in proportion to impact. | Ordinary prose fixes need normal review; published contract changes need compatibility handling |

Do not use `final`, `final-final`, `latest`, `new`, `copy`, personal initials or a person's name as a substitute for revision or ownership metadata. Avoid mutable status words in permanent IDs and folder names. Descriptive historical titles can be retained as evidence.

## 3. Project and product names

| Purpose | Canonical name | Usage |
|---|---|---|
| Application | **Powerplants One** | Interface, design discussions and product documentation |
| Formal initiative descriptor | **Powerplants One — Business Operations Platform** | Executive and programme-level descriptions |
| Project | **Powerplants One — Design & Development** | Current ChatGPT project and design/development context |
| Short project code | **PPO** | Cross-document references, local numbering and technical resource prefixes |
| Repository | `powerplants-one` | Retain the existing name |
| Current repository owner | `deanrfiedler-gif` | Current personal owner; do not embed the account name in permanent product IDs |
| Development roadmap | **Powerplants One — Development Roadmap** | Recommended board title if a board is later created |
| Private prototype label | **Private prototype** | Context label, kept separate from product identity |
| First prototype package | **PP-01 — Planned Service Prototype** | Short descriptive package label; retains the existing PP-01 identity |

The formal initiative descriptor is a proposed refinement of “Powerplants Business Operations Platform”. Preserve that earlier phrase as a search alias and in issued historical titles. Do not rewrite the frozen blueprint to make later decisions appear to have existed when it was issued.

Use **PPO** consistently; do not introduce competing project codes such as `PPOne`, `PP1` or `PPAOne`. The prefix is local to this project. It does not establish a registered company programme number or replace ERP/customer project references.

`GEN` is a legacy provisional document prefix. `SOL008` belongs to the separate PPA Smartsheet Project Delivery System reference and must not identify Powerplants One. Similar Powerplants initiatives are distinct unless a later documented decision establishes a relationship.

## 4. Business domains and terminology

### 4.1 Canonical domain catalogue

Use the established requirement prefixes in specifications and short capability names in code. A domain is a business capability, not an instruction to create a separate service or repository.

| Domain title | Primary UI label | Domain key | Existing requirement prefix | Blueprint |
|---|---|---|---|---|
| Customer Relationship Management | CRM | `crm` | CRM | BP-03 |
| Estimating & Quotation | Estimating | `estimating` | EST | BP-04 |
| Engineering & Design Control | Engineering | `engineering` | ENG | BP-05 |
| Projects & Commercial Delivery | Projects | `projects` | PRJ | BP-06 |
| Service Operations | Service | `service` | SVC | BP-07 |
| Supply Chain Management | Supply Chain | `supply-chain` | SCM | BP-08 |
| Finance & Commercial Controls | Finance | `finance` | FIN | BP-09 |

Shared capabilities use descriptive names: `identity`, `customer-context`, `documents`, `integrations`, `audit` and `reporting`. Their physical placement is an architecture decision. Do not create seven folders containing duplicate customer, site or equipment implementations.

Use Australian English in project-authored prose and ordinary domain identifiers: **organisation, authorise, labour, catalogue, licence**. Retain exact vendor terminology, imported payload keys, library APIs and existing published contracts when their spelling differs.

### 4.2 Business vocabulary

| Preferred term | Precise meaning | Compatibility or usage rule |
|---|---|---|
| Organisation | A legal or relationship organisation; may be a prospect, customer, supplier or other party | Keep existing logical entity `Organisation` |
| Customer | An organisation in the customer relationship context | Existing `/customers` projection does not imply every Organisation is a debtor |
| ERP account | A financial account identified within the source ERP company | Never identify it by customer display name alone |
| Contact | A person's relationship to an organisation/site | Existing `Person` identity remains separate from relationship records |
| Site | A physical customer/service location | Distinguish from SharePoint site and web hosting site in technical text |
| Equipment | Installed or serviced equipment, as a user-facing collection label | Retain logical entity `Asset` and existing `/assets` contracts |
| Service request | Customer-facing or plain-language description of service intake | `Ticket` remains the existing data-contract entity; label mapping must be explicit |
| Work order | Authorised scope of service work | Not interchangeable with request, appointment, purchase order or invoice |
| Appointment | Planned attendance and allocation of resources | Scheduling term; one work order can have several appointments |
| Visit | An occurrence of attendance, discussed in field-work language | PP-01 records visit execution against Appointment; this standard does not add a new Visit table |
| Job pack | Exact controlled information issued for an appointment | Use `PackRevision` and `PackIssue` as established technical concepts |
| Service report | Reviewed record of work and findings | Separate from the customer acknowledgement and from financial processing |
| Finance handoff | Reviewed information submitted for financial processing | Not an invoice or proof of ERP posting |
| Variation | Proposed or authorised change to commercial scope | Keep approval state and ERP references separate |
| Item | Catalogue/stock/service item identified by its authoritative source | Equipment identity and inventory item identity are different |
| Document issue | Formal release of exact document content | In developer discussions say “GitHub issue” for backlog items |
| Release | A defined software distribution or delivery scope | Say “document issue” for published business documents |

“My jobs” can remain a useful technician navigation label. Within a job screen, identify the **work order** and **appointment** explicitly. Generic labels such as “Job status” or “Reference” are insufficient when several different records are displayed.

## 5. Names, identities and versions

### 5.1 Five separate concepts

| Concept | Example | Change rule |
|---|---|---|
| Display name | Irrigation controller service | Can change through an audited edit |
| Permanent internal ID | UUID | Does not change after allocation |
| Readable record reference | `SYN-PPO-WO-000001` | Stable; unique in its declared scope |
| Content revision | `r02` on an issued report | New revision when controlled content changes |
| Workflow state | `Issued` | Changes only through the defined workflow |

Store each concept separately. Do not use a filename, person name, customer name, email address or manufacturer serial as the database primary key. URLs are locators and may change; an immutable ID plus provider/version context identifies the referenced record or document.

### 5.2 Namespaces and uniqueness

Every identifier catalogue must state its scope. Examples are repository-wide ADR IDs, master-wide requirement IDs, package-local screen IDs and workspace-specific business references. The same short number in two namespaces does not identify the same object.

For cross-package references use a qualified label such as **PPO / PP-01 / PT-08**. Within an unambiguous package, keep the existing **PT-08**. Do not rewrite the stored ID simply to add context that belongs in a separate field.

Document IDs can similarly use **BP-01** inside the repository and **PPO-BP-01** in a cross-project register or exported filename. These are qualified and short forms of the same identity; they must resolve to one document record.

## 6. Document catalogue and working filenames

### 6.1 Working filename rule

Use a descriptive lowercase hyphenated filename. Where a document already has a formal catalogue ID, place that uppercase ID first:

`<DOCUMENT-ID>-<short-description>.<extension>`

Examples: `BP-01-master-blueprint.md`, `ADR-0003-prototype-architecture.md`, `service-data-dictionary.md` and `naming-conventions.md`.

This is an intentional distinction: catalogue IDs remain recognisable; ordinary words use lowercase. Do not put the organisation name, every taxonomy code, revision, date, owner and status into a repository filename. The repository and folder already supply much of that context.

Preserve conventional filenames such as `README.md`, `AGENTS.md`, `CONTRIBUTING.md` and the existing `STATUS.md`. Registers use descriptive stable names such as `requirements.csv`. A document and its derived register may share a subject without sharing an ID.

### 6.2 Blueprint catalogue

The table defines target working paths. Planned blueprints are reservations, not delivered documents. BP-02 and BP-07 paths already comply.

| ID | Authoritative document title | Target working path | Current position |
|---|---|---|---|
| BP-01 | Master Business & Build Blueprint | `docs/blueprints/BP-01-master-blueprint.md` | Existing master; rename proposed |
| BP-02 | Platform Solution Architecture | `docs/architecture/BP-02-platform-architecture.md` | Existing path; retain |
| BP-03 | CRM Functional & Build Blueprint | `docs/blueprints/BP-03-crm.md` | Planned |
| BP-04 | Estimating & Quotation Functional & Build Blueprint | `docs/blueprints/BP-04-estimating-quotation.md` | Planned |
| BP-05 | Engineering & Design Control Functional & Build Blueprint | `docs/blueprints/BP-05-engineering-design-control.md` | Planned |
| BP-06 | Projects & Commercial Delivery Functional & Build Blueprint | `docs/blueprints/BP-06-projects-commercial-delivery.md` | Planned |
| BP-07 | Service Operations Functional & Build Blueprint | `docs/blueprints/BP-07-service-operations.md` | Existing path; retain |
| BP-08 | Supply Chain Management Functional & Build Blueprint | `docs/blueprints/BP-08-supply-chain.md` | Planned |
| BP-09 | Finance & Commercial Controls Functional & Build Blueprint | `docs/blueprints/BP-09-finance-commercial-controls.md` | Minimum subset exists separately; full blueprint planned |

Keep BP-02 in `docs/architecture/`; central discoverability is provided by the blueprint register. Moving it merely to put every BP file in one folder would add unnecessary link changes.

### 6.3 Supporting documents and types

| Type | Naming approach | Example |
|---|---|---|
| Standard | Descriptive filename; qualified standard ID in metadata | `docs/standards/naming-conventions.md` / PPO-STD-001 |
| Architecture decision | `ADR-<4-digit-number>-<description>.md` | `ADR-0003-prototype-architecture.md` |
| Interface/data contract | Descriptive stable filename | `service-api.md`, `finance-handoff.md` |
| Delivery plan | Descriptive stable filename | `prototype-implementation-plan.md` |
| Register | Subject noun and appropriate format | `decision-register.csv`, `source-manifest.json` |
| Test specification | Scope plus purpose | `prototype-acceptance.md` |
| Test evidence | Scenario plus unique run context | `PT-08-booking-conflict-run-20260905T031522Z-01.md` |
| Handover | Work package and subject | `P01-application-foundation-handover.md` |
| Template | Subject plus `template` | `service-report-template.docx`; existing `ADR-template.md` retained |
| Historical source | Original controlled name and manifest | Existing v01, v02 and audit filenames remain unchanged |

Do not allocate a new document code to every note. Formal IDs are warranted when an item is referenced across specifications, issued, governed or repeatedly revised.

### 6.4 Minimum metadata

New controlled documents should contain:

| Field | Required content |
|---|---|
| Title and ID | Readable title plus stable short or qualified document ID |
| Revision | Current controlled revision, independent of Git commit count |
| Status | Draft, In review, Approved, Superseded or Withdrawn, according to actual evidence |
| Owner | Accountable role or named private prototype owner |
| Updated date | Unambiguous date |
| Scope | Relevant product, package or domain |
| Authority/source | Canonical path and applicable source baseline/decision |
| Change record | Material change, reason and linked decision/PR when available |

For this revised proposal, **Proposed for project adoption** describes the overall standard's adoption status; **r02** identifies the prepared edition. Powerplants One and PPO are user-confirmed. The remaining naming recommendations are ready for repository adoption. A revision can be prepared and reviewed before formal issue.

## 7. Revisions, snapshots and issued copies

### 7.1 Use the right version for the right object

| Object | Convention | Example |
|---|---|---|
| Working specification | Stable filename; controlled revision in metadata | `BP-01-master-blueprint.md`, revision r03 after a deliberate later issue |
| New controlled document revision | `r` plus at least two decimal digits, starting at r01 | r01, r02, r99, r100 |
| Existing issued blueprint | Retain exact existing v01/v02 notation and bytes | `GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md` |
| Application release | Semantic version with `v` prefix in release tag | `v0.1.0` |
| API compatibility version | Versioned route namespace | `/api/v1` |
| Payload schema | Explicit integer `schema_version` | `1` |
| Mutable record concurrency | Increasing `version` / `expected_version` | `7` |
| SharePoint file version | Exact provider version reference | Store the returned value; do not invent one |
| CAD engineering revision | Existing controlled engineering scheme | Preserve the drawing register's assigned revision |

These values are not interchangeable. A document revision is not the database row version; an application patch release does not automatically issue every document again.

Legacy `v02` is a historical label. Record it as such. The next deliberately issued successor to that master may use `r03`, with the transition noted in its control table and register. Do not create a second “r02” historical baseline that appears to be a different issue of the same v02 content.

Existing v01 edition labels in BP-02, BP-07 and the PP-01 contracts also remain valid historical metadata. Introduce the new revision notation at a deliberate subsequent revision and record the predecessor; do not relabel every existing edition as a new issue. Render integer content revisions as r01/r02 for users while retaining the dictionary's integer storage type. Compare revisions numerically, not by alphabetic filename order.

### 7.2 Working and issued file patterns

| Use | Pattern | Example |
|---|---|---|
| Working Git document | `<ID>-<description>.md` | `BP-01-master-blueprint.md` |
| Issued project document | `PPO-<ID>-<description>-rNN.ext` | `PPO-BP-01-master-blueprint-r03.pdf` |
| Issued naming standard | `PPO-STD-001-naming-conventions-rNN.ext` | `PPO-STD-001-naming-conventions-r02.pdf` |
| Unissued review export | Issued pattern plus `-draft` | `PPO-STD-001-naming-conventions-r02-draft.pdf` |
| Dated working reference copy | Working stem plus snapshot timestamp | `BP-01-master-blueprint-snapshot-20260905T031522Z.md` |
| Future issued design-package tag | `docs-<package-lowercase>-rNN` | `docs-pp-01-r02` |

The examples do not indicate that any PDF, issue or tag already exists. The downloadable Markdown for this task is a stable working copy with its status inside the document.

Git records committed content. GitHub provides file history and commit attribution; uncommitted edits and separately uploaded copies are outside that history. Keep issued evidence recoverable by exact commit and content hash as well as human-readable revision. [GitHub file history](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files)

For every issued package record the document IDs/revisions, full source commit SHA, file hashes, issue date, issuer and issue purpose in a manifest. Do not move an existing issue tag to different content. A correction receives a new issue and a supersession link.

Once issued, content is immutable. The same revision may be distributed again with a new distribution event; changed content requires a new revision. Approval, issue, sent, delivered and acknowledged remain separate facts.

## 8. Repository and information structure

### 8.1 Documentation structure

Use the existing structure with one new standards area. Each document has one canonical home; indexes link to it.

| Path | Purpose | Treatment |
|---|---|---|
| `docs/standards/` | Project conventions and their registers | New when this standard is adopted |
| `docs/blueprints/` | Working master and module specifications | Retain |
| `docs/architecture/` | Architecture and technical design | Retain |
| `docs/contracts/` | Data, API, Finance and document contracts | Retain |
| `docs/prototype/` | PP-01 scope, traceability and package assurance | Retain for PP-01 |
| `docs/decisions/` | ADRs and decision register | Retain |
| `docs/requirements/` | Requirement definitions and traceability | Retain |
| `docs/testing/` | Acceptance specifications and approved evidence | Retain |
| `docs/delivery/` | Roadmap, build sequence and handovers | Retain |
| `docs/reference/` | Preserved source material and provenance | Retain original names |
| `docs/reference/baselines/` | Exact issued source snapshots | Preserve hashes and identity |

Do not create empty folders for every future module. When a second prototype package exists, decide whether `docs/prototypes/PP-02/` is warranted and map PP-01 deliberately; the current naming task does not require moving its whole package.

Suggested supporting registers are `docs/standards/document-register.csv` and `docs/standards/naming-exceptions.csv`. They are implementation recommendations, not additional files delivered by this edition.

### 8.2 Future application structure

The following are naming reservations for P01, subject to the selected framework structure. They do not assert that application folders exist.

| Location | Responsibility |
|---|---|
| `src/app/` | Next.js pages, layouts and route handlers |
| `src/modules/service/` | Service domain implementation |
| `src/modules/customer-context/` | Shared customer/site/equipment context, if that boundary is adopted |
| `src/components/` | Shared presentation components with clear ownership |
| `src/integrations/` | MYOB/document adapter implementations |
| `src/lib/` | Small shared technical utilities; avoid an unstructured business-logic collection |
| `tests/` | Cross-module integration and acceptance tests |
| `scripts/` | Repository/development utilities |
| `infra/` | Infrastructure definitions only when provisioning is in scope |

Keep migrations in the directory required by the selected migration tool. Do not invent a parallel migration tree solely to satisfy this table.

### 8.3 SharePoint and business folders

GitHub owns working code, technical specifications and development decisions. SharePoint remains the intended business-document authority. A shared subject does not justify copying every controlled business file into Git.

For a new synthetic demonstration folder use a readable record reference plus short subject, for example **SYN-PPO-WO-000001 - Irrigation controller service**. Keep status, owner and scheduled date in metadata; they should not cause the folder to be repeatedly renamed.

Existing operational folders should retain their source identity until an approved mapping and link assessment exists. Use provider item IDs and version references for integration. Folder labels alone cannot guarantee reliable retrieval after moves or renames.

## 9. Requirements, decisions and delivery identifiers

### 9.1 Preserve established catalogues

| Catalogue | Existing form or examples | Naming rule |
|---|---|---|
| Blueprints | BP-01–BP-09 | Retain identities and current numbering |
| Parent functional requirements | CRM-01, EST-01, ENG-01, PRJ-01, SVC-01, SCM-01, FIN-01, DOC-01 | Retain all 66 existing functional IDs |
| Non-functional requirements | NFR-01–NFR-12 | Retain all 12 existing IDs |
| Business decisions | D-001–D-029 | Continue the existing three-digit sequence |
| Architecture decisions | ADR-0001 onward | Continue four-digit sequence; never edit an old decision to pretend it was the new one |
| Initial discovery backlog | PPO-001–PPO-016 | Retain; distinct from GitHub issue numbers |
| Prototype package | PP-01 | Preserve package identity |
| Implementation packages | P01–P12 | Package-local; qualify as PP-01 / P01 outside context |
| Screen/component/rule/validation | SC-01, CMP-01, SR-01, VAL-01 | Existing PP-01-local identifiers |
| Prototype acceptance | PT-01–PT-30 | Package-local, distinct from historical source identifiers that may use similar prefixes |
| Master acceptance | AT-01–AT-38 | Preserve source acceptance catalogue |
| API commands/reads | API-C01, API-R01 | Preserve existing contract IDs |
| Event catalogue | EVT-01 onward | Identifies catalogue rows; actual event types are separate names |

The original master also contains the namespaces **SRC, J, DAT, PAR, REP, CRE, OUT, FD, KPI, BR, TR, IF, MIG, DEV, R, WP, AP and F**. Preserve their meanings and existing references in their source catalogues. Do not allocate a new namespace by guessing what an abbreviation might mean. Evidence identifiers such as E-04 remain scoped to their originating report.

There are **78 original parent requirements**. A naming migration must preserve their identities, counts and traceability. A filename rename is not permission to change their source wording or classify them as implemented.

### 9.2 New identifiers

Allocate the next unused number from the authoritative catalogue. Reserve it when work begins; record withdrawn IDs rather than reusing them. Gaps are acceptable. Numeric widths are minimum formatting widths; extend them when required without renumbering earlier records.

For a requirement decomposition, retain the parent reference in a field. Existing child forms such as `SVC-12.1` remain valid; use the same parent-dot-child convention within an agreed catalogue. A child does not replace the original parent requirement.

GitHub issue numbers are allocated by GitHub and share sequencing with pull requests. Do not try to keep issue #19, work package P19 and backlog PPO-019 numerically aligned. Store their explicit relationship.

Reserve **PPO-STD** for project standards. This document is **PPO-STD-001**. The local N01–N12 rule labels in this document are referenced as **PPO-STD-001 / N01**, not as a new global requirement catalogue.

## 10. Business-record references

### 10.1 Proposed local reference format

For platform-owned records use:

`PPO-<TYPE>-<SEQUENCE>`

For synthetic records use:

`SYN-PPO-<TYPE>-<SEQUENCE>`

The sequence contains at least six digits, starts at 000001 and is allocated atomically. Use a separate counter for each workspace, record type and synthetic/operational namespace. Do not reset it annually. Reference gaps are acceptable; reused identities are not.

The synthetic format is the only enabled proposal for the current prototype. The operational format is reserved for later review of actual authority and source-system ownership.

### 10.2 Reference type catalogue

| Record | Type | Synthetic example | Treatment |
|---|---|---|---|
| Organisation | ORG | `SYN-PPO-ORG-000001` | Local relationship identity; ERP account remains separate |
| Person | PER | `SYN-PPO-PER-000001` | Optional readable reference; UUID is sufficient where users do not need one |
| Site | SITE | `SYN-PPO-SITE-000001` | Physical site identity |
| Equipment / Asset | AST | `SYN-PPO-AST-000001` | Existing Asset logical entity |
| Opportunity | OPP | `SYN-PPO-OPP-000001` | Future CRM record; preserve actual legacy opportunity reference separately |
| Estimate | EST | `SYN-PPO-EST-000001` | Future local estimate identity |
| Quotation | QUO | `SYN-PPO-QUO-000001` | Future local quote identity; exact issue revision separate |
| Project | PRJ | `SYN-PPO-PRJ-000001` | Synthetic project only; actual ERP project code remains authoritative |
| Service request / Ticket | TKT | `SYN-PPO-TKT-000001` | Existing Ticket logical entity |
| Work order | WO | `SYN-PPO-WO-000001` | Authority mode explicitly recorded |
| Appointment | APT | `SYN-PPO-APT-000001` | One attendance booking identity |
| Job pack | PACK | `SYN-PPO-PACK-000001` | Revision identifies a particular controlled content set |
| Service report | RPT | `SYN-PPO-RPT-000001` | Revision and customer response remain separate |
| Finance handoff | FH | `SYN-PPO-FH-000001` | Does not replace ERP transaction numbers |
| Requisition | REQ | `SYN-PPO-REQ-000001` | Future local demand/approval identity; not an ERP purchase order |
| Variation | VAR | `SYN-PPO-VAR-000001` | Future local scope-change identity |
| Document transmittal | TRN | `SYN-PPO-TRN-000001` | Future exact issue/distribution package |

These type codes are a proposed registry. Adding optional references to existing Organisation, Person, Site or revision records requires an explicit dictionary amendment. Do not silently add fields because a naming example mentions them. Existing `display_number` fields should use the common format where applicable.

Counter allocation must be transaction-safe with a uniqueness constraint; do not use row count plus one. Offline creation uses a stable client UUID. A permanent readable number is allocated by the server when accepted, unless a separately designed reservation scheme exists. The user sees “Pending reference” until allocation; a temporary local number must not masquerade as a confirmed reference.

### 10.3 Source-system keys

Preserve the exact source identifier, source system, connection/tenant, company, entity type and source version where relevant. Store local mapping identity separately.

| Source | Retain |
|---|---|
| MYOB Acumatica | Company and entity context, actual document/account/item/project keys and source statuses |
| SharePoint | Tenant/site/drive/item identity as applicable, version and content hash for controlled issues |
| Pipedrive | Account/connection scope and original entity ID |
| Smartsheet | Region/connection, workspace/sheet/row identifiers as applicable |
| CAD or supplier system | Drawing/item number, revision, file dependencies and original supplier identity |

Never convert `000123` to the number `123` unless the source contract explicitly defines that equivalence. Preserve meaningful case and punctuation. Treat identifier fields in CSV/spreadsheets as text and verify round-trip fidelity; do not introduce formula wrappers to force display.

External invoice, sales order, purchase order and stock transaction numbers must not be replaced by invented PPO numbers. If a local request exists before ERP processing, label it as a request or handoff and show the ERP reference separately when verified.

### 10.4 Synthetic data and entity changes

Retain the dictionary's `synthetic` boolean and environment context alongside the visible SYN prefix. A prefix alone does not enforce isolation or permissions. Example names should be fictional and identifiable, such as **Example Nursery — Synthetic**.

Renaming a customer or moving equipment changes descriptive/effective-dated attributes. It does not change its UUID. A merge records a surviving identity, retired aliases, source mappings and redirect behaviour; it must preserve historical reports and relationships. Synthetic records must not be converted into operational records by deleting `SYN-`.

## 11. Business documents, drawings and evidence

### 11.1 Proposed synthetic output naming

For synthetic generated outputs use:

`<RECORD-REFERENCE>-<output-description>-rNN.<extension>`

| Output | Example | Identity rule |
|---|---|---|
| Job pack | `SYN-PPO-PACK-000001-job-pack-r01.pdf` | Pack identity + exact pack revision |
| Service report | `SYN-PPO-RPT-000001-service-report-r02.pdf` | Report identity + exact report revision |
| Finance evidence | `SYN-PPO-FH-000001-finance-evidence-r01.pdf` | Handoff identity + evidence revision |
| Quotation | `SYN-PPO-QUO-000001-quotation-r01.pdf` | Quote identity + exact issued offer revision |
| Transmittal | `SYN-PPO-TRN-000001-transmittal-r01.pdf` | Transmittal lists each included document/revision |

The referenced pack/report/handoff must appear inside the document, together with its work order/appointment relationship, title, revision, status and issue date. A file separated from its folder should remain intelligible. Synthetic outputs must visibly state **Synthetic example — not for operational use**.

Customer names, addresses, financial amounts and technician names belong in appropriately controlled content/metadata, not long permanent filenames. Original upload filenames should be retained as metadata where useful; sanitised display filenames must not be used as storage object keys or uniqueness guarantees.

For new Powerplants One-owned operational outputs, use this project's reference, output-description and revision pattern once the record authority and output workflow are implemented. The other project's STD-001 has no role in this decision. Where an actual customer contract or external system requires a different format, record that specific interface requirement. An existing source document can retain its original filename while the platform provides consistent metadata and search aliases.

### 11.2 Engineering and supplier files

Native CAD assemblies, references, drawing numbers and supplier part numbers can have dependencies outside the visible file. Rename them only through a verified engineering workflow and supported tools. For prototype documentation, preserve source identity and store a published reference.

A future drawing register should distinguish drawing number, title, discipline, content revision, issue purpose, approval state, source file and source version. **Drawing title changes must not reallocate the drawing number.** Do not impose this standard's rNN convention on an established engineering revision scheme without a controlled engineering decision.

### 11.3 Images, attachments and test evidence

Use descriptive display filenames such as `SYN-PPO-APT-000001-controller-terminal-photo-01.jpg`. The attachment record's UUID, hash and parent relationship provide identity; `01` is only a local description sequence.

For test evidence, include scenario and unique run context: `PT-08-booking-conflict-run-20260905T031522Z-01.png`. The evidence index records the full code commit, environment, test data version, outcome and supporting files. A screenshot filename saying “passed” is not proof that a test passed.

Keep operational evidence in its authorised business repository. Only synthetic or specifically approved redacted evidence belongs in GitHub. This rule follows the existing repository guidance.

### 11.4 Data exports and import batches

Name a reusable dataset definition by subject, such as `service-appointments`. Name a generated extract with its subject, synthetic marker where applicable and extraction timestamp: `SYN-PPO-service-appointments-20260905T031522Z.csv`. Add a stable batch suffix only when distinct extracts could otherwise collide.

The export manifest records the dataset definition/version, filters, source system/company, business as-at time, extraction time, currency/unit basis, completeness, row count and hash. An extraction timestamp must not be presented as the business cutoff date. CSV headers follow the relevant declared schema; preserve external source headers in raw source files and map them explicitly into canonical staging fields.

Use a UUID for an import run or an explicit registered batch identifier. Filenames, timestamps and row positions are not deduplication keys. A corrected extract is a new batch with a predecessor reference; preserve its reconciliation trail.

## 12. Interface language and reporting

### 12.1 Labels and actions

Use sentence case for field labels, buttons and state labels: **Work order**, **Issue job pack**, **Ready for review**. Product names and domain navigation retain their canonical display styling. Use verbs that describe the actual result.

| Context | Preferred label | Avoid |
|---|---|---|
| Work reference | Work order number | ID, where several IDs are visible |
| Schedule change | Reschedule appointment | Update job |
| Offline persistence | Saved on this device | Saved, when server receipt is absent |
| Queue state | Waiting to sync | Completed |
| Controlled document | Issue job pack | Send, if only issuing to storage |
| Financial submission | Submit Finance handoff | Create invoice, for a simulated/manual handoff |
| External result unknown | ERP outcome unknown | Failed, when processing may have succeeded |
| Customer response | Customer acknowledgement | Approved, unless that is the actual captured meaning |

### 12.2 Canonical state values

Preserve current PascalCase contract values and present friendly labels. Do not run a global case conversion over enumerations.

| Existing contract value | UI label | Meaning retained |
|---|---|---|
| `Authorised` | Authorised | Work-order authority recorded |
| `InProgress` | In progress | State belongs to its named lifecycle |
| `CompletedPendingReview` | Completed — awaiting review | Appointment execution submitted; review outstanding |
| `ReadyForReview` | Ready for review | Finance handoff ready for a reviewer |
| `AwaitingERP` | Awaiting ERP processing | No implied posting success |
| `OutcomeUnknown` | ERP outcome unknown | Reconciliation required before safe retry |
| `LocalSaved` | Saved on this device | Local durable persistence only |
| `CustomerApproved` | Approved for customer access | Access classification; still requires recipient scope |

The service dictionary owns exact values and permitted transitions. This table is a label mapping, not a new lifecycle. New enum values should follow the same PascalCase style and be explicitly introduced into the relevant contract.

### 12.3 Reports and measures

Name reports for their business question: **Service readiness**, **Technician schedule**, **Open Finance handoffs**, **Project profitability** and **Integration exceptions**. Define each measure before using it.

Use `REP-xx`, `FD-xx` and `KPI-xx` catalogue references where they already exist. A report can display several separately governed measures; report title and metric ID are different concepts.

| Ambiguous label | More precise naming requirement |
|---|---|
| Revenue | State recognised revenue, invoiced amount or another approved definition |
| Cost | State actual, committed or forecast cost and applicable basis |
| Hours | Distinguish captured, approved, billable and ERP-processed hours |
| Balance | State account, company, currency, as-at date and source completeness |
| Available stock | State item, warehouse, unit, source definition and observation time |
| Profit | State gross margin, contribution or net result according to the defined measure |

Dates in prose use **5 September 2026**; date fields/exports use `2026-09-05`. Store instants in UTC and carry the site's IANA timezone separately for scheduling. Do not infer an Australian timezone from the date or substitute server time for the site calendar.

## 13. Source code and configuration

The rules below are selected project conventions for the proposed TypeScript/Next.js implementation. They do not imply that the application has been built.

| Item | Convention | Example |
|---|---|---|
| Ordinary TypeScript file | Lowercase kebab-case | `work-order-service.ts` |
| React component file | Lowercase kebab-case, `.tsx` | `appointment-planner.tsx` |
| React component / class / type | PascalCase | `AppointmentPlanner`, `WorkOrder` |
| Function / local variable | camelCase; verb for actions | `confirmAppointment`, `workOrderId` |
| Boolean local variable | Clear predicate | `isReady`, `hasConflicts`, `canIssuePack` |
| Hook | `use` plus descriptive name | `useAppointmentPlanner` in `use-appointment-planner.ts` |
| Module/domain folder | Canonical domain key | `src/modules/service/` |
| Unit test | Subject plus `.test.ts` | `work-order-service.test.ts` |
| Browser acceptance test | Behaviour plus `.spec.ts` | `appointment-rescheduling.spec.ts` |
| Constant | UPPER_SNAKE_CASE when representing a fixed named constant | `MAX_PAGE_SIZE` |
| Environment variable | UPPER_SNAKE_CASE | `PPO_ENVIRONMENT` |
| JSON/CSV contract keys | Preserve snake_case contract convention | `work_order_id`, `source_system` |
| Python utility | snake_case file/function names | Existing `check_foundation.py` |

Do not prepend type markers such as `I` to every interface or `str` to string variables. Use business meaning. Acronyms within new TypeScript identifiers should be word-cased: `erpAccountId`, `ErpAdapter`, `apiClient`; retain exact external names when binding to a vendor API.

Avoid catch-all names such as `utils2`, `data-final`, `manager` and `helper` when a responsibility can be named directly. Test names should describe behaviour, for example “rejects an appointment move that overlaps a confirmed booking”.

Framework-required files are exceptions to generic style. Next.js uses named file conventions including `page.tsx`, `layout.tsx` and `route.ts`; preserve the convention for the pinned version. Route groups and dynamic segments retain framework syntax. [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)

Environment variable names supplied by the runtime or provider remain exact. For browser-visible configuration, follow the framework's public-variable convention and allow only non-sensitive values. A naming prefix cannot make a secret safe to expose.

### 13.1 Roles, permissions and feature flags

Name roles for enduring responsibilities, such as **Service coordinator**, **Technician** and **Finance reviewer**. Proposed new role keys use lowercase snake_case: `service_coordinator`, `technician`, `finance_reviewer`. Preserve any more specific role/grant names already defined by an adopted permission contract until they are deliberately mapped.

New permission keys should identify a capability and action, for example `service.work_order.authorise` or `documents.job_pack.issue`. Maintain an explicit permission catalogue and server-side enforcement; never infer permissions from a job title, UI label or role name alone. A technical administrator role must not implicitly become a financial or engineering approver.

Use positive feature-flag names such as `enable_offline_capture`, with owner, purpose, default and retirement criteria in metadata. Avoid double negatives such as `disable_no_sync`. A feature flag, integration-mode string or environment name does not confer transaction authority.

### 13.2 Design assets and reusable components

Name reusable UI components by purpose, such as `StatusBadge`, `RecordReference` and `AppointmentPlanner`. Name ordinary repository design assets `powerplants-one-wordmark.svg` or `service-empty-state.svg` where those assets are actually created. Preserve approved existing brand assets and licences.

For new design tokens, use semantic names such as `--color-text-primary` and `--color-status-warning`. Avoid tying a business meaning directly to an arbitrary colour label such as `green-thing`. A badge's text/state contract remains authoritative; colour is supporting presentation.

## 14. Database fields and schemas

### 14.1 General convention

Use lowercase snake_case for database objects and fields. Use plural nouns for new tables and singular logical TypeScript entity names.

| Item | Example | Rule |
|---|---|---|
| Table | `work_orders`, `appointments`, `pack_revisions` | Specific plural noun |
| Primary key | `id` | UUID internal identity |
| Foreign key | `work_order_id` | Referenced entity plus `_id` |
| Readable reference | `display_number` | Retain current dictionary field name |
| Concurrency | `version`, `expected_version` | Preserve existing contract meaning |
| Timestamp | `created_at`, `issued_at` | Instant; timezone-aware storage |
| Calendar date | `due_date` | Date without pretending it is an instant |
| Duration | `duration_seconds` | Unit explicit |
| Money | `amount` plus `currency_code` and defined basis | Avoid ambiguous cross-currency totals |
| Source observation | `source_as_at`, `observed_at` | Distinguish source time from fetch time |

Existing dictionary exceptions such as `created_by`, `updated_by`, `active` and `synthetic` retain their exact names and documented types. Do not rename them purely to add `_id` or `is_`. New fields should follow the relevant existing aggregate pattern or use the general rule where no pattern exists.

Mapping between database/JSON `work_order_id` and TypeScript `workOrderId` must be explicit in a typed boundary. Do not apply an uncontrolled generic conversion that changes source keys, enum values or opaque payloads.

### 14.2 Constraints and indexes

| Object | Pattern | Example |
|---|---|---|
| Primary-key constraint | `pk_<table>` | `pk_work_orders` |
| Foreign-key constraint | `fk_<table>_<reference>` | `fk_appointments_work_order` |
| Unique constraint | `uq_<table>_<purpose>` | `uq_work_orders_workspace_display_number` |
| Check constraint | `ck_<table>_<rule>` | `ck_appointments_positive_duration` |
| Exclusion constraint | `ex_<table>_<rule>` | `ex_reservations_resource_time` |
| Non-unique index | `ix_<table>_<purpose>` | `ix_appointments_workspace_start` |

Use a project target of **60 ASCII characters or fewer** for database identifiers. PostgreSQL's default identifier limit is 63 bytes; the smaller project target leaves modest headroom and avoids silent truncation collisions. This is a selected project limit, not a different vendor maximum. [PostgreSQL identifier rules](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)

For long generated names, use a shortened descriptive stem plus a deterministic hash suffix, document the shortening rule and check collisions. Do not rely on database truncation. Applied migration filenames/IDs are immutable; use the selected tool's native ordering and checksum conventions.

## 15. APIs, events and integration mappings

### 15.1 API resources

Use the existing `/api/v1` contract namespace. Resource path segments are lowercase, hyphenated nouns: `/service/work-orders`, `/appointments` and `/finance/handoffs`. Existing intent-specific actions such as `/appointments/:id/confirm` remain valid.

`:id` is documentation notation; actual request URLs contain a validated stable identifier. Framework dynamic folder syntax can differ without changing the external route.

The current service contract uses `/service/work-orders/:id` for some reads and `/work-orders/:id/authorise` for commands; it similarly mixes `/service/tickets` and `/tickets/:id/...`. Before implementation, recommend consolidating these families under **`/service/work-orders`** and **`/service/tickets`**, while retaining the API-C/API-R catalogue IDs. This is a targeted proposed contract amendment, not a claim that the present specification already uses uniform routes.

Change every affected command/read, client reference, test and documentation link together. If consumers already exist when this is implemented, introduce explicit aliases/deprecation or a compatibility version as appropriate. Do not rename a consumed endpoint as if it were an ordinary filename.

### 15.2 Payloads, operations and errors

Preserve snake_case wire keys: `operation_id`, `expected_version`, `schema_version`, `correlation_id` and `work_order_id`. The operation ID identifies one intended command across retries; the correlation ID groups related diagnostic activity. They are not interchangeable.

For newly introduced machine error codes use **UPPER_SNAKE_CASE**, qualified by a useful business subject: `APPOINTMENT_CONFLICT` or `PACK_REVISION_STALE`. These examples are proposals, not assertions that those exact codes already exist. Keep VAL-xx as specification message IDs and map them to any machine codes explicitly.

### 15.3 Events

Retain the existing PascalCase event names such as `AppointmentConfirmed`, `PackIssued` and `HandoffReconciled`. Event names describe something that occurred. A request event such as `PackIssueRequested` must not be substituted for successful issue.

Separate the event catalogue ID, event type, event instance UUID and schema version. EVT-04 currently covers both `PackIssueRequested` and `PackIssued`; do not use EVT-04 alone as the serialized event type.

If external message topics are later required, use a documented transport mapping such as `ppo.service.appointment-confirmed.v1`. This is a future topic convention, not a reason to rename existing internal event types or deploy a message broker.

### 15.4 Adapter and source names

| Concept | Proposed name | Rule |
|---|---|---|
| ERP adapter interface | `ErpAdapter` | Technology boundary; actual authority remains explicit |
| MYOB implementation | `MyobAcumaticaAdapter` | Provider identified precisely |
| Synthetic implementation | `SyntheticErpAdapter` | Visible simulation mode; never imply live connectivity |
| Document provider | `SharePointDocumentAdapter` | Provider-specific implementation behind the chosen interface |
| Source-system code | `myob-acumatica`, `sharepoint`, `pipedrive`, `smartsheet` | Proposed controlled values; preserve legacy values until mapped |

A source code is not sufficient identity: retain its connection, company/entity and external record key. Preserve raw statuses alongside any verified local mapping; a source word such as “Released” must not automatically become local “Issued”.

## 16. GitHub workflow and software releases

### 16.1 Branches, commits and pull requests

Keep `main` as the reviewed baseline. Branch names use a purpose prefix and short hyphenated description.

| Branch prefix | Purpose | Example |
|---|---|---|
| `docs/` | Documentation | `docs/naming-standard` |
| `feature/` | New application capability | `feature/p01-application-foundation` |
| `fix/` | Defect correction | `fix/appointment-conflict-check` |
| `refactor/` | Internal restructuring | `refactor/service-permissions` |
| `test/` | Test-only changes | `test/offline-replay` |
| `chore/` | Maintenance | `chore/dependency-update` |
| `spike/` | Bounded investigation | `spike/reservation-constraints` |

An actual issue number may be included, for example `fix/42-appointment-conflict`, when #42 exists and is the correct work item. Do not invent issue references for a naming example and then treat them as live backlog records.

Use concise commit and PR subjects such as `docs(standards): add project naming conventions` or `feat(service): confirm appointments atomically`. This lightweight type/scope convention is recommended for readability; no automated release tooling is assumed.

The PR body should state the problem, changed behaviour or information, validation and remaining limitations. Link the actual issue and requirement/decision references in the body. A filename-only PR should not include unrelated requirement or behaviour changes.

### 16.2 Backlog titles and labels

Use a clear action/outcome in issue titles: **P01 — Establish the application foundation**. Keep existing PPO-001–PPO-016 discovery IDs in metadata or titles where currently used. When a work item spans domains, record one accountable primary area and its dependencies.

Suggested labels, when adopted, use lowercase names and a colon namespace:

| Dimension | Examples |
|---|---|
| Type | `type:feature`, `type:defect`, `type:decision`, `type:documentation` |
| Area | `area:service`, `area:finance`, `area:platform`, `area:documents` |
| Priority | `priority:high`, `priority:normal`, `priority:low` |

Use one authoritative work-status field; avoid maintaining conflicting status in labels, issue titles and a board. Retain existing labels until explicitly mapped. No board or new labels are created by this document.

### 16.3 Release naming

Use software tags such as `v0.1.0` and pre-release tags such as `v0.1.0-alpha.1`. The version records application compatibility/change scope; the release notes explain what users can do and what is incomplete. A `v1.0.0` tag does not itself constitute production approval.

Semantic Versioning defines major/minor/patch meaning around a declared public interface. Adopt it deliberately for the application's declared compatibility contract; do not use it to renumber business documents. [Semantic Versioning specification](https://semver.org/)

Keep document-package tags distinct, such as `docs-pp-01-r02`. Tie both software and document releases to immutable commits and clear manifests. A deployed environment should display application version, commit/build reference and environment in an appropriate support/about view.

## 17. Environments and infrastructure

### 17.1 Environment vocabulary

| Code | Meaning | Current relevance |
|---|---|---|
| `local` | Developer workstation or local runtime | Intended first build environment |
| `test` | Automated or shared integration testing | Create only when needed |
| `preview` | Temporary review deployment for a branch/PR | Future optional deployment |
| `demo` | Controlled synthetic demonstration | Future optional deployment |
| `staging` | Release rehearsal matching operational deployment | Future |
| `prod` | Approved operational service | Future; name alone grants no operational approval |

Avoid using “prototype” to mean simultaneously an application release, dataset, database and host. Record these dimensions separately: environment, application version, dataset version, synthetic flag and integration mode.

### 17.2 Resource names

Use `ppo-<environment>-<component>[-<instance>]`, for example `ppo-demo-web-01` or `ppo-test-worker-01`. If a provider requires a region token, use that provider's documented region code after hosting selection. Do not encode a guessed region or vendor-specific location into this standard.

Provider character, length and uniqueness rules take precedence. Where hyphens are unavailable, record the explicit provider-safe transformation and resource ID in the infrastructure inventory. Do not infer access controls, billing ownership or region from the name alone.

For a temporary preview, a label such as `ppo-preview-pr-42` is appropriate only for an actual PR #42. Record its expiry/cleanup owner in deployment metadata. This standard does not provision hosting or prescribe a live domain name.

## 18. ChatGPT work and handovers

Retain **Powerplants One — Design & Development** as the project name. Name chats for the outcome being worked on, not for a vague continuation.

| Workstream | Suggested chat title |
|---|---|
| Programme direction | Powerplants One — Direction & Decisions |
| Naming standard | Powerplants One — Naming & Information Standards |
| Architecture | Powerplants One — Architecture & Data Contracts |
| Service specification | Powerplants One — Service Workflow & Screens |
| First implementation | Powerplants One — P01 Application Foundation |
| Acceptance work | Powerplants One — Prototype Testing & Assurance |

Create workstream chats as work starts. Do not create a separate chat for every module, document or decision before it is useful.

A handover should state current repository/branch/commit, completed work, open work, decisions, applicable constraints, validation and the next bounded task. Use stable requirement/package references so a future session can verify the source.

Uploaded reference copies should record their repository path, source commit and export date. GitHub remains the intended authority for committed development content; conversation memory or a filename containing “latest” is insufficient to establish currency.

## 19. Compatibility and naming limits

### 19.1 Project limits

These are selected project guardrails, not claims that every platform has the same limit.

| Name class | Project rule |
|---|---|
| Ordinary filename | Target at most 80 characters; project maximum 120 including extension unless an exception is recorded |
| Folder segment | Target at most 40 characters; keep hierarchy shallow |
| Repository-relative path | Target at most 180 characters; assess anything longer before adoption |
| SharePoint decoded path | Project target at most 200 characters including library/folders/filename; verify the actual target and sync clients |
| Database identifier | At most 60 ASCII characters under this standard |
| Git branch | Target at most 80 characters |
| Business display label | Preserve current dictionary limit of 1–200 characters; UI must handle long names |
| Readable reference | Controlled pattern and unique scope; never truncate the identity to satisfy a screen width |

Use ASCII letters, digits and hyphens for newly generated portable business filenames; use dots for extensions and underscores where a tool/language convention requires them. Unicode remains valid in human names and document content. Do not strip or transliterate a customer's real name merely to make a filename.

### 19.2 Platform constraints

SharePoint/OneDrive disallow several filename characters and reserved names, including separators, colon, asterisk and question mark. Leading/trailing spaces are also disallowed. Microsoft's documented decoded full-path maximum is 400 characters; client/application restrictions still need checking. The smaller project targets provide headroom. [Microsoft filename restrictions](https://support.microsoft.com/en-us/onedrive/restrictions-and-limitations-in-onedrive-and-sharepoint), [SharePoint limits](https://learn.microsoft.com/en-us/office365/servicedescriptions/sharepoint-online-service-description/sharepoint-online-limits)

Reject reserved device names, control characters, path traversal segments and leading/trailing dots or spaces in generated portable filenames. Screen uploaded originals separately and retain their original name as metadata where appropriate. Never construct a filesystem path by blindly concatenating a supplied filename.

Detect filenames that collide when case is ignored. For a required case-only rename, use an intermediate temporary filename through Git and verify the result on supported systems. Ordinary descriptive names must remain identical across references; do not rely on a case-insensitive workstation hiding errors.

When shortening a filename, keep the stable ID and revision intact; shorten the description. Resolve collisions with a stable content/object suffix, not repeated `(1)`, `(2)` additions. If a generated name cannot meet the rule safely, fail with an actionable message or record an approved exception.

## 20. Adoption and migration plan

### 20.1 Migration schedule for inspected files

These are recommendations based on the inspected commit. Re-inventory current `main` before applying them.

| Existing item | Proposed target or disposition | Reason |
|---|---|---|
| `docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint.md` | Rename to `docs/blueprints/BP-01-master-blueprint.md` | Remove provisional prefix; align with blueprint catalogue |
| `docs/architecture/BP-02-platform-architecture.md` | Retain | Complies with the ID-plus-description rule |
| `docs/blueprints/BP-07-service-operations.md` | Retain | Complies with the ID-plus-description rule |
| `docs/contracts/documents-and-issues.md` | Rename to `docs/contracts/document-issue-distribution.md` | Distinguish document issue/distribution from GitHub issue management |
| `docs/contracts/service-data-dictionary.md` | Retain; amend only where reference design is adopted | Already clear; schema changes require explicit mapping |
| `docs/contracts/service-api.md` | Retain path; review the ticket/work-order route consistency | Contract problem is internal route naming, not the filename |
| `docs/contracts/finance-handoff.md` | Retain | Clear business purpose |
| `docs/decisions/ADR-0001...` through `ADR-0004...` | Retain existing IDs, names and decision history | Existing catalogue convention is professional and consistent |
| `docs/decisions/ADR-0002-stable-specification-filenames.md` | Preserve decision; link an adopting/superseding decision for its specific master path | Retain rationale and chronology |
| `docs/prototype/` and `docs/delivery/prototype-implementation-plan.md` | Retain | No competing package yet requires restructuring |
| `docs/reference/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v01.md` | Preserve exact path/content | Historical source |
| `docs/reference/baselines/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md` | Preserve exact path/content | Hash-protected issued baseline |
| `docs/reference/GEN_RPT_PPABlueprint_Audit_v01.md` | Preserve exact path/content | Historical audit evidence |
| `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/STATUS.md` | Retain names; update active guidance/links during adoption | Conventional repository files |
| `scripts/check_foundation.py`, `scripts/check_prototype.py` | Retain names; update affected path references only | Python convention and existing checks |

### 20.2 Implementation sequence

| Step | Action | Completion evidence |
|---|---|---|
| 1. Adopt the design | Record a naming ADR with this independent standard and the user's clarification | Decision links to PPO-STD-001; Powerplants One and PPO confirmed; unrelated STD-001 dependency removed |
| 2. Add the standard | Add `docs/standards/naming-conventions.md`; link from indexes and contribution guidance | One canonical working document; metadata consistent |
| 3. Make the two targeted path changes | Rename the master and document issue/distribution contract in one bounded PR | Old/new mapping and source content comparison |
| 4. Repair references | Update active links, validators, register locators and current instructions; remove deference to the other project's STD-001 | No broken current links, obsolete active paths or unrelated naming dependencies |
| 5. Preserve source evidence | Verify baseline bytes/hashes and original identifiers | Source manifest checks pass; 78 parent IDs retained |
| 6. Resolve contract naming before build | Adopt or explicitly defer route consolidation, display-reference formats and enum/label mappings | Dictionary/API/tests agree; compatibility implications documented |
| 7. Build with the conventions | Apply code/database/test/environment naming during P01 and later packages | Implementation review against adopted standard |
| 8. Validate operational interfaces | Confirm actual record authority and any required ERP, SharePoint, CAD or customer interface formats before live outputs | External identities preserved; only genuine interface exceptions recorded; no dependency on another project's naming standard |

A content-preserving rename commit should be separate from substantive editorial changes where practical. Add new working metadata and links in a subsequent reviewable change, preserving the issued source bytes. Update derived indexes only according to their declared source contract.

Historical source paths embedded in issued documents remain historical evidence, not broken-current-link defects to rewrite. Active navigation should point to the new canonical path. Record old paths in a searchable alias/migration register; do not maintain two editable copies of the master.

GitHub permits file renames through committed changes. Validate link and reference effects as part of the PR; record the mapping rather than depending entirely on UI rename inference. [GitHub renaming guidance](https://docs.github.com/en/repositories/working-with-files/managing-files/renaming-a-file)

### 20.3 Migration checks and rollback

Before merge, check internal Markdown links/anchors, case-insensitive path collisions, JSON/CSV source locators, scripts, issue/PR references that are actively maintained and document indexes. Use the repository's existing foundation and prototype checks as applicable.

For later schema/API migrations, also inspect imports, serialized values, persisted offline payloads, fixtures, permission strings, integrations, dashboard queries and exported references. Add explicit aliases/adapters or migrations when consumers depend on the old name.

Rollback should revert the coherent change set, including its links and mappings. Reverting filenames alone is incomplete. Once external consumers depend on a new contract, use a compatibility correction rather than a blind rollback that breaks them.

No Git history rewriting, deletion of issued sources, renumbering of original requirements or operational source-system rename is needed for the recommended repository adoption.

## 21. Ownership, exceptions and verification

### 21.1 Responsibilities

| Responsibility | Current or proposed owner |
|---|---|
| Private prototype naming decisions | Dean Fiedler |
| Repository naming implementation | Developer/maintainer carrying out the authorised task |
| Business vocabulary and labels | Relevant process owner when appointed; Dean for prototype decisions |
| Data and integration contracts | Technical/data owner when appointed |
| Operational drawings and issued documents | Actual authorised Engineering/document-control owner; not assumed appointed |

These are responsibilities, not company appointments. Routine compliant naming choices can be made by the maintainer; they do not require a new approval every time.

### 21.2 Document and exception registers

The document register should record `document_id`, `title`, `canonical_path`, `revision`, `status`, `owner`, `source_commit`, `legacy_names` and `supersedes`. Record full commit hashes for evidence; shortened hashes may be used only in display.

An exception entry should record affected item/pattern, reason, source requirement, decision owner, date, scope, replacement mapping if any and review trigger. Standing exceptions include conventional GitHub files, framework files, Python names, frozen source baselines, external identifiers and the existing schema fields noted above.

An exception is not permission to disregard record identity or fabricate an approval. If a name is ambiguous, resolve its business meaning first; a cleaner spelling will not correct a faulty data model.

### 21.3 Adoption acceptance criteria

1. Every new controlled working document has a stable path and appropriate metadata.
2. BP-01–BP-09 and all 78 parent requirements retain their identities.
3. Exact issued baseline hashes remain unchanged.
4. Current links and register locators resolve after any path migration.
5. Local record IDs, readable references and external keys are modelled separately.
6. Synthetic references and outputs remain visibly synthetic when exported.
7. Code, database and wire-format naming rules have explicit mappings and exceptions.
8. Issued revision, workflow state, file version, schema version and software release are distinguishable.
9. The API naming review records the existing route inconsistencies and their disposition.
10. Active guidance identifies PPO-STD-001 as the independent Powerplants One naming standard; the other project's STD-001 does not impose naming or approval dependencies.

Start enforcement with documentation review and focused lint checks on changed files. Do not fail the whole repository because a preserved historical filename differs from the new style. Automated checks can detect patterns and broken links; they cannot verify business approval or semantic correctness.

## 22. Quick reference and worked example

### 22.1 Daily quick reference

| You are naming… | Use… |
|---|---|
| Product | Powerplants One |
| Short project reference | PPO |
| Working master | `BP-01-master-blueprint.md` |
| New supporting Markdown document | Short lowercase hyphenated subject |
| Issued project export | PPO + document ID + description + rNN |
| New code file | `appointment-planner.tsx` |
| Type/component | `AppointmentPlanner` |
| Local variable/function | `appointmentId`, `confirmAppointment` |
| Database/wire field | `appointment_id` |
| Existing enum/event value | Preserve PascalCase contract value |
| Synthetic work order | `SYN-PPO-WO-000001` |
| External ERP reference | Exact source value plus company/entity context |
| Documentation branch | `docs/naming-standard` |
| Software release | `v0.1.0` |
| Design-package issue tag | `docs-pp-01-r02` |
| Timestamp in a portable filename | `20260905T031522Z` |

### 22.2 One complete service example

All references below are synthetic examples. Several optional display references require the dictionary amendment identified in Section 10.

| Object | Reference/name | Relationship or control |
|---|---|---|
| Organisation | `SYN-PPO-ORG-000001` — Example Nursery — Synthetic | Organisation UUID remains primary identity |
| Site | `SYN-PPO-SITE-000001` — Example propagation site | Linked to organisation through the appropriate relationship |
| Equipment | `SYN-PPO-AST-000001` — Irrigation controller | Asset UUID distinct from manufacturer serial |
| Service request | `SYN-PPO-TKT-000001` — Investigate irrigation alarm | Existing Ticket entity |
| Work order | `SYN-PPO-WO-000001` — Irrigation controller service | Authorised scope; synthetic authority mode |
| Appointment | `SYN-PPO-APT-000001` | Attendance booking linked to work order |
| Job pack | `SYN-PPO-PACK-000001`, revision r01 | Exact appointment/scope/source manifest |
| Job-pack file | `SYN-PPO-PACK-000001-job-pack-r01.pdf` | Immutable issued content after successful issue |
| Service report | `SYN-PPO-RPT-000001`, revision r01 | Reviewed appointment evidence |
| Revised report | Same report reference, revision r02 | Supersedes r01; does not inherit the prior acknowledgement |
| Finance handoff | `SYN-PPO-FH-000001` | References exact approved source revisions |
| ERP target | Separate simulated source mapping | Handoff reference is not an invoice number |

For the developer, `AppointmentPlanner` in `appointment-planner.tsx` can call the existing `/api/v1/appointments/:id/confirm` contract using `operation_id` and `expected_version`. The database can store `appointments.work_order_id`. The accepted operation can emit `AppointmentConfirmed`. Each name describes the same business concept in the style appropriate to its layer.

For traceability, the work remains linked to established identifiers such as SVC-04, API-C04, EVT-02 and the applicable PP-01 acceptance procedures. These specification IDs are not substituted for the appointment UUID or its readable number.

## 23. Evidence and references

### 23.1 Repository evidence

The repository tree and selected governing documents were read at commit **c44321e8cbbe205a482e38499016f396e2f6374d** on 5 September 2026. This is a naming/design inspection of the documentation baseline, not an application implementation audit.

| Evidence | What it supports |
|---|---|
| [Repository guidance](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/AGENTS.md) | Private prototype scope, stable IDs, preserved sources and validation expectations |
| [Current status](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/STATUS.md) | Documentation stage, 78 requirements and existing package boundaries |
| [Contribution guidance](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/CONTRIBUTING.md) | Existing branch examples and inherited references to the other project's STD-001; later user clarification overrides their applicability |
| [ADR-0002](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/decisions/ADR-0002-stable-specification-filenames.md) | Stable working master and exact issued baseline |
| [Blueprint catalogue](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/blueprints/README.md) | BP-01–BP-09 identities, titles and current/planned distinctions |
| [Working master at inspected commit](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint.md) | Parent requirements, original registers and provisional GEN naming |
| [Service data dictionary](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/contracts/service-data-dictionary.md) | UUID identity, snake_case fields, PascalCase states and revision semantics |
| [Service API contract](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/contracts/service-api.md) | Routes, commands, operation IDs and event names |
| [Document contract](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/contracts/documents-and-issues.md) | Exact issued content, distribution events and synthetic outputs; its inherited STD-001 naming reference is superseded by the user's clarification |
| [Implementation plan](https://github.com/deanrfiedler-gif/powerplants-one/blob/c44321e8cbbe205a482e38499016f396e2f6374d/docs/delivery/prototype-implementation-plan.md) | P01–P12 and relationship to existing discovery issues |

### 23.2 Interpretation and limits

The user-provided conversation establishes the selected product name, personal/private repository and completed repository foundation. The subsequent user clarification explicitly confirms Powerplants One and PPO and establishes independence from the other project's STD-001 and identifiers. The inspected repository evidence establishes the earlier names and references; it does not override that later direction.

The other project's STD-001 is out of scope and is not an unresolved prerequisite. No SharePoint tenant, MYOB numbering configuration or native CAD dependency graph was inspected for this naming task. Actual interfaces will need validation when implemented; the project naming design can proceed independently.

### 23.3 International standards and established practice

The recommended approach uses relevant standards for particular concerns, alongside conventions selected for this software project. It does not treat any one records-management or engineering standard as a universal filename grammar.

| Reference | Relevant principle | Application in Powerplants One |
|---|---|---|
| [ISO 15489 — Records management](https://committee.iso.org/sites/tc46sc11/home/projects/published/iso-15489-records-management.html) | Records management addresses metadata, responsibilities, controls and the context in which records are created and managed | Keep identity, revision, status, provenance and ownership explicit rather than relying on a filename alone |
| [ISO 8601 — Date and time format](https://www.iso.org/iso-8601-date-and-time-format.html) | Standardised year-month-day representations reduce date ambiguity | Use `YYYY-MM-DD` dates in fields/exports and explicit timezone context for instants |
| [RFC 9562 — UUIDs](https://www.rfc-editor.org/info/rfc9562/) | Defines UUIDs for computer-system identification | Keep UUID internal identity separate from readable references; select a supported generation method during implementation and enforce uniqueness |
| [Semantic Versioning](https://semver.org/) | Software version meaning relates to a declared compatibility contract | Use application release versions separately from document revisions and business-record versions |
| [GitHub file history](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files) | Committed file changes have inspectable history | Keep working paths stable and identify issued evidence by revision, commit and hash |

ISO's public descriptions and the linked technical sources were reviewed for their relevant scope. This is an informed project design, not a clause-by-clause ISO conformance assessment or certification claim. The `PPO` prefix, BP catalogue, rNN document revisions, type codes, case styles and filename limits are explicit Powerplants One design choices; these sources do not mandate those exact spellings or formats.

The existing scheme is retained because it balances readability, traceability and practical software conventions. A wholesale renumbering would not improve those outcomes. Future changes remain possible where a specific ambiguity or integration need justifies them.

### 23.4 Revision record

| Revision | Date | Change | Adoption |
|---|---|---|---|
| r01 | 2026-09-05 | Initial project-wide standard, current-state mapping, code/data conventions and adoption plan | Proposed; repository implementation pending |
| r02 | 2026-09-05 | Confirmed Powerplants One/PPO; removed the unrelated STD-001 dependency; clarified independent identifier selection and added international-practice rationale | Recommended independent standard; repository implementation pending |
