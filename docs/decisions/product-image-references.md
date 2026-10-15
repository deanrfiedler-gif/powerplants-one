---
document_id: PPO-PD01-IMAGE-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Proposed for owner review; nothing in it is adopted, and it authorises no code, migration, seed, permission, integration or deployment
source_commit: d070a61ff17e04ffa0f0d37c16052c24a0bb0e26
versioning: git
---

# Product image references — proposed decision

On 15 October 2026 Dean accepted Amendment A1 to the [Products design](products-figma-design.md): an image of the actual product on the record, thumbnails in the catalogue grid, phone list and snapshot, and a No image placeholder. A1 is recorded in section 8 of that decision by [PR #501](https://github.com/deanrfiedler-gif/powerplants-one/pull/501), which is not yet merged, with rules A1.1 to A1.6 and the named Figma version "Products — product image amendment A1". Rule A1.6 says a product image is a business document and SharePoint owns business documents, so PPO stores a reference to the exact file revision rather than becoming an image library. A1 left storing and reading real images undecided: the reference on the product revision, a scoped SharePoint read, thumbnails and an access rule.

The session that recorded A1 asked Claude to draft that decision for Dean to review before anything is built. This record is the draft. Each item is classified as a **user decision** (Dean has already made it), a **proposal** (Claude's recommendation, not adopted) or an **open question**. Nothing here is adopted until Dean says so.

Scope: `scope:PD-01` and the routes `/products` and `/products/[id]`, within the [Products contract](../contracts/products-catalogue.md) (PD-01 to PD-05) and [ADR-0048](ADR-0048-products-native-catalogue.md). The parents it serves most directly are DOC-01 (link controlled documents by stable identifiers), DOC-02 (keep exact revisions), DOC-06 (enforce access to files in the app and the repository), NFR-01 (server-side authorisation), NFR-03 (protect device caches) and NFR-05 (show unavailable data without false success). No parent requirement ID is added, renamed or closed; all 78 remain. The technology for making thumbnails is a separate proposed ADR, [ADR-0057](ADR-0057-product-image-renditions.md).

## 1. Summary

| ID | Item | Classification | In one line |
|---|---|---|---|
| — | Show an image of the actual product, placed as A1.1 to A1.4, with the No image rule A1.5 | User decision, 15 October 2026 | The accepted design; this record does not change it |
| — | A product image is a SharePoint business document referenced by exact file revision; PPO is not an image library (A1.6) | User decision, 15 October 2026, consistent with AGENTS.md and ADR-0048 | Taken as fixed |
| IR1 | Where the reference lives | Proposal | On the immutable product revision, inside its content, so it is reviewed and published with the revision |
| IR2 | What it points at | Proposal | An immutable PPO image source holding the exact file version key and SHA-256 in the existing `DocumentKey` shape; provider IDs never reach the browser |
| IR3 | How revision changes affect the image | Proposal | A successor revision names its own image; a newer SharePoint version is never adopted automatically |
| IR4 | Thumbnails | Proposal | PPO makes re-encoded renditions from the verified exact bytes: a disposable cache, not a copy of record |
| IR5 | Access | Proposal | Whoever may read that exact product revision may see its image; no new capability; the file must sit in an approved location of the product's company |
| IR6 | Missing or unreadable file | Proposal | The placeholder with "Image unavailable" wording, distinct from "None linked"; never another image |
| IR7 | Read model | Proposal | Image state and opaque rendition paths on catalogue rows, snapshot and record, and one image endpoint |
| IR8 | Linking an image | Proposal, for later | An author links it in a draft; it is reviewed with the revision; strict file checks; needs its own design |
| IR9 | Build order | Proposal | B1 synthetic read and display; B2 linking; B3 SharePoint after the read pilot |
| Q1–Q10 | Questions for Dean | Open questions | Section 5, each with a recommended answer |

## 2. Constraints taken as fixed

- **A1 rules.** A1.1 to A1.4 fix where images appear. A1.5 fixes that a product never borrows an image from a similar product, its family or another revision, and that stock photographs are not used.
- **Authority.** SharePoint owns business-file originals; PPO owns business records and their document relationships; MYOB keeps ERP items ([SharePoint information architecture](../architecture/sharepoint-information-architecture.md), section 1; ADR-0048). Provider tenant, site, drive, item and version IDs belong in PPO's integration records (section 4) and resolved provider IDs in private configuration (section 2). Direct SharePoint access, downloads, search, thumbnails and PPO previews must agree (section 6).
- **Immutable revisions.** A product revision is an immutable, hashed snapshot, and review and publication bind its exact content (ADR-0048). Each catalogue row shows the product's current revision (`src/products/reads.ts`).
- **Synthetic catalogue.** `ppo.product_revisions.content` is constrained to `data_mode = 'Synthetic'` (migration 0052). Real catalogue content, real images included, needs its own production decision.
- **No SharePoint connection.** The read pilot N2 in the [naming and SharePoint pilot](../delivery/naming-sharepoint-pilot.md) has not run, and no tenant, site, identity or resource grant is decided (information architecture, section 9).
- **Existing parts.** `DocumentKey` in `src/adapters/contracts.ts` already carries a provider (`Synthetic` or `SharePoint`), tenant, site, drive, item, version and SHA-256, and `DocumentStoreAdapter` reads exact bytes by that key. The private write-once document store holds synthetic bytes locally and in the hosted demo.

## 3. Proposals

### IR1 Where the reference lives — on the product revision

Add one optional `image` entry to the product revision content: zero or one image per revision. It sits beside the existing `documents` metadata and is covered by the content hash, so submission, review and publication bind the exact image with the rest of the revision. A revision without the entry has no image, which A1.5 already words as "None linked to this revision".

**Reason.** A1 shows the image as a property of a revision ("Image rev A"; "None linked to this revision"), and ADR-0048 already keeps controlled-document references in the immutable revision. Historical revisions then keep the image they were reviewed with.

**Alternatives rejected.**
- *On the product record (the mutable aggregate).* Every historical revision would show today's picture, and a change would bypass review.
- *A sidecar binding table*, as PD-03 binds cost sources. An image could then change without a new revision, but that adds a table, commands, events and a capability, and the image would escape the revision's review. Worth revisiting only if image changes prove frequent and review is judged unnecessary for them.
- *An entry in the existing `documents` list with type "Product image".* Those entries are metadata only (the contract says they are not connected downloads), up to 20 are allowed, and they have no place for an exact file key or hash.

Existing revisions are not rewritten. Their stored content and hashes stay as they are, and a missing entry reads as None.

### IR2 What it points at — an immutable image source with an exact file version

A new immutable table, proposed name `ppo.product_image_sources`, holds one row per exact file version: a PPO UUID, workspace and company, the `DocumentKey` (provider, tenant, site, drive, item, version and SHA-256), byte count, media type, pixel width and height, who registered it and the operation that did. A row is never updated, and never deleted while a revision references it. The revision's `image` entry holds that UUID plus the facts the page shows: title, source label (such as the library and document type), the revision label the business uses ("rev A"), basis (where the image came from, such as "photographed by Powerplants" or "supplied by the manufacturer"), source date and alternative text.

A separate, mutable projection records availability: Available, Unavailable or Unknown, when it was last confirmed and why it failed. Job-pack sources already split identity from availability this way (immutable `pack_sources`, mutable `pack_source_locations`; see [document identity and recovery](document-identity-recovery.md)), and the Document library reports availability separately from review ([backend decision](document-library-backend.md)).

**Reason.** SharePoint IDs stay on the server, as the information architecture requires and as the [Document library contract](../contracts/document-library.md) does for exact source keys. The content hash binds an exact file through the source UUID, and the SHA-256 lets every read prove it received the same bytes.

**Alternatives rejected.**
- *PPO keeps the image bytes as its copy of record.* PPO would become the image library A1.6 rules out.
- *A SharePoint URL or sharing link.* It changes when the file moves, does not name a version, and Microsoft documents that a version's download URL needs no authentication for about an hour and may survive the removal of a user's permission. The Document library decision rejected mutable URLs for the same reason.
- *Register each image as a Document library (DK-01) document and bind its revision.* This is the right family of pattern, but today a library document must belong to a customer organisation (`organisation_id` is required by migration 0090), its declared links do not include Product, `document.read` is default-denied with no grants, and each image would go through two independent reviews. Revisit when the library holds company-level technical reference documents.

### IR3 How revision changes affect the image

- **A new product revision** is a full draft successor. The authoring form pre-fills the predecessor's `image` entry, and the author keeps, replaces or clears it. Whatever the successor saves is its own and is reviewed with it. That is an explicit carry-forward, not borrowing: nothing is inferred when the page is read.
- **The published revision** keeps its image until a successor is published, like the rest of its content.
- **A historical revision** keeps its own image. Selecting it (`revision_id`) never shows a newer one.
- **An import (PD-05)** cannot add, replace or clear an image. A draft successor made by an import copies the target's current entry unchanged, and the change set shows it, so the reviewer sees it.
- **A newer version of the file in SharePoint** is never adopted automatically. When a read observes that the item's current version differs from the pinned one, the record may say that a newer image version exists in SharePoint. Adopting it means a new product revision. That note is not drawn in A1 (Q2).
- **The pinned version disappears**, because it was deleted, trimmed by version limits, moved out of reach or its permissions withdrawn: the image becomes Unavailable (IR6). PPO never falls back to the item's current version.

### IR4 Thumbnails — derived renditions made by PPO

PPO makes three renditions from the verified exact bytes:

| Rendition | Serves | Proposed size |
|---|---|---|
| Small | The 28 px grid, 40 px snapshot and 44 px phone list thumbnails | 96 px square, so they stay crisp at twice the size |
| Panel | The 332 × 233 px and 249 × 173 px record panel and the 80 px phone image row | 664 × 466 px, fitted |
| Full | View full size | Longest edge 2,048 px |

Each is decoded, turned upright, resized, re-encoded and stripped of metadata such as camera details and GPS location. The browser never receives the original bytes, a SharePoint URL or a provider ID.

Renditions are a cache, not a record. They are keyed by the source SHA-256 and a rendition-specification version, kept in the existing private document store, regenerated when missing, never offered as a source for another product, and deleted when no revision references the source or the source is confirmed Unavailable. They are made when an image source is registered and again on demand after a cache loss.

**Reason.** Microsoft Graph serves thumbnails for a drive item, which reflects its current version; a specific version (driveItemVersion) exposes only its content stream. A Graph thumbnail could therefore show a newer file than the one pinned. Serving originals to the grid would send megabytes per row to phones and pass on embedded location data. Re-encoding also discards anything other than the picture that a file might carry.

The library that resizes and re-encodes is a technology choice in its own right, proposed in [ADR-0057](ADR-0057-product-image-renditions.md).

### IR5 Access — the product revision's own rule, inside the product's company

- **Who.** A viewer may see an image, at any size, exactly when they may read that product revision: `products.read` and `shared.read` in the product's company and workspace scope, as the [Products contract](../contracts/products-catalogue.md) sets out. The image is technical, so `products.commercial.read` is neither needed nor enough. There is no new capability, so the access-review model, seeds and grant suites are untouched.
- **Every request.** Authority is checked on each image request, before storage is read and again after, as the [submitted photo inspection](report-photo-inspection.md) and the Document library content read already do. A product or revision the viewer cannot read returns the contract's 404, not a placeholder.
- **Company and entity.** The image source's company must be the product's company, and its SharePoint location must be one of the approved image locations mapped to that company in private configuration. A file from another company, or from a restricted commercial or customer location, cannot be linked. A shared PPO app gives one company's users no access to another company's files (information architecture, section 2).
- **SharePoint agreement.** For PPO previews and direct SharePoint access to agree, the approved location's SharePoint audience must include everyone PPO lets read products in that company. That is checked when a location is approved, not on each request (Q6).
- **Caching.** Responses are private and `no-store`, with a fixed image media type, `nosniff` and a sandboxed content security policy. Images are not kept in local storage, IndexedDB, the offline queue or any service-worker cache, as for submitted photos.

**Alternatives rejected.**
- *A new `products.image.read` capability.* It would grant the same audience and change the access-review model and grant suites for nothing.
- *Also requiring `document.read`.* It is default-denied with no grants, so every Products reader would lose the images.
- *Each viewer's own Microsoft sign-in for every thumbnail.* The grid would need every viewer signed in to Microsoft and could not use a shared cache. Which identity reads SharePoint is Q6.

### IR6 Missing or unreadable — the placeholder, never another image

Every read gives an image one of three states:

| State | Meaning | Shown as |
|---|---|---|
| Linked | The revision has an image and its exact bytes are confirmed | The image, with its caption |
| None | The revision has no image entry | The accepted placeholder: "No image · None linked to this revision" |
| Unavailable | The revision has an image entry, but its exact bytes cannot be read, fail the SHA-256 check, are not an allowed image, or the source is confirmed missing | The same placeholder, proposed wording "Image unavailable · The linked revision can't be read"; the caption keeps the linked title and revision so someone can fix it |

- No state ever shows an image from another revision, the family, a similar product or a stock source, and a missing exact image never falls back to the item's current SharePoint version.
- One unavailable image never fails the catalogue or record read. The row or panel shows Unavailable and the rest of the page stands (NFR-05).
- The record and View full size read through to the source and confirm it. The grid, snapshot and phone list use the availability projection and show a rendition only when the source was confirmed within a window, proposed 24 hours (Q4). With the synthetic provider the source is the private store, so the check is immediate.
- A1 drew Linked and None only. Unavailable needs a small design amendment (Q2).

### IR7 The read model the pages need

Field names are indicative.

| Surface | Addition to the existing read | Notes |
|---|---|---|
| Catalogue grid and phone list (`GET /api/v1/products`) | Per row: `image.state` (Linked, None or Unavailable) and `image.small`, an opaque path to that row's revision rendition | The same bounded 100-row read. The image belongs to the revision the row shows, today the current revision, so a row never mixes facts from two revisions (Q3) |
| Snapshot | As the grid, plus the caption facts | Uses `image.small` at 40 px |
| Record (`GET /api/v1/products/{id}?revision_id=`) | For the selected revision: state, title, source label, revision label, basis, source date, alternative text, `image.panel` and `image.full`, and a newer-version flag when one has been observed | A historical selection shows that revision's image only |
| Image (`GET /api/v1/products/{id}/image?revision_id=&size=small\|panel\|full`) | Rendition bytes | Requires an exact `revision_id`; there is no "latest" form. Private, `no-store`, `nosniff`, fixed image type. 404 when the product or revision is not readable; a distinct unavailable error when the exact image cannot be produced |

No SharePoint ID, URL or file name leaves the server. The read never claims an image exists when it cannot prove it, and a failed image never becomes an empty success.

### IR8 Linking an image — later, with its own design

A1.6 says linking or replacing an image belongs with the Documents tab and the authoring form, which are not drawn. It is outside the first build. When it is designed:

- An author with `products.edit` links an image in a draft revision, and it is reviewed and published with that revision under the existing duties. No new capability.
- The author picks a file version from an approved image location through a SharePoint read (after N2), never by pasting a URL or path.
- Registration checks the file before anything is saved: allowed types by file signature rather than extension (JPEG, PNG and WebP; SVG is excluded because it can carry script, and HEIC and TIFF because browsers cannot show them reliably), a byte limit (20 MB, the existing document-store bound), a pixel limit against decompression bombs (40 megapixels), the same company and an approved location. PPO computes the SHA-256 itself.
- Uploading a new file into SharePoint, replacing, renaming or deleting one stays out. Those are writes, which the N3 pilot covers under its own authorisation.

### IR9 Build order

- **B1 — synthetic read and display.** The `image` entry, the image source and availability tables (one migration), renditions, the endpoint and read additions in IR7, and the A1 page changes, using the existing `Synthetic` provider and private store. Synthetic images reach the store through a fixture or seed path only; nothing is uploaded.
- **B2 — linking.** The authoring form and Documents tab, once designed (IR8), using synthetic sources until SharePoint exists.
- **B3 — SharePoint.** A read-only `SharePoint` provider for `DocumentKey`, after the N2 read pilot, the tenant and identity decisions and a decision allowing real catalogue content.

Each needs Dean's go-ahead. B1's migration falls under the AGENTS.md migration rules: the registry assertions in every listed suite, the Products upgrade suite and the hosted-demo upgrade gate. If B1 seeds images, the AGENTS.md seed rules apply too; B1 adds no grant.

## 4. Out of scope

- Uploading, replacing, renaming or deleting images, in SharePoint or in PPO.
- A PPO image library, gallery or browse page, and more than one image per revision.
- Cropping, editing or generating images in PPO, and stock photographs (A1.5).
- Taking an image from a family, model, similar product or another revision (A1.5).
- Product images in quotations, job packs or other issued outputs, which is a DK-03 and DK-06 template question.
- Images on the Inventory, CPQ or Estimating pages.
- Images offline.
- Real catalogue content and any live SharePoint connection, until their own decisions.

## 5. Open questions for Dean

| ID | Question | Recommended answer |
|---|---|---|
| Q1 | Adopt IR1 to IR9 as the basis for building A1? | Yes, with the answers below |
| Q2 | A1 drew the placeholder for "None linked" only. Add "Image unavailable" wording and a "newer version in SharePoint" note to the design? | Yes, as a small Amendment A2: an Unavailable variant on Product image `829:3490` and Product thumbnail `829:3461`, and the note on the record |
| Q3 | Should the catalogue thumbnail follow the revision the row shows (the current revision, possibly a draft) or the published revision? | The row's revision, so one row never mixes two revisions. Making the whole row published-first is a separate catalogue question |
| Q4 | How old may an availability confirmation be before the grid stops showing a rendition? | 24 hours; the record always confirms |
| Q5 | Which SharePoint location holds product images? | The proposed Technical Reference library, with a "Product image" document type, one per company and no shared library across companies |
| Q6 | Read SharePoint with an application identity limited to that library, or with each viewer's own Microsoft sign-in? | An application identity with selected, read-only access to the approved library, provided the library's audience covers PPO's Products readers. For the Microsoft administrator to confirm at N2 |
| Q7 | SharePoint version limits can trim a pinned version. Keep pinned versions, or accept Unavailable? | Ask the company records owner to keep versions that published revisions reference; PPO keeps no copy and shows Unavailable if one goes |
| Q8 | Alternative text: typed by the author or derived? | Prefilled as "Product image: {title}", editable by the author and required |
| Q9 | Use the six A1 concept images (CP-40, CC-8, DP-12, ECP-2, FV-20 and SM-90) as B1's synthetic fixtures? | Yes, exported from Figma with their provenance. They are synthetic images of fictional equipment and already appear in the r02 captures that PR #501 retains |
| Q10 | Adopt sharp to make renditions ([ADR-0057](ADR-0057-product-image-renditions.md))? | Yes, when B1 is authorised |

## 6. Consequences

- **Now:** none. This record changes no application code, read model, route, migration, seed, permission, capability, dependency or deployment. A1, its captures and all 78 parent IDs are unchanged.
- **If adopted and B1 is authorised:** one migration (image sources and availability), an optional `image` entry in revision content, the read additions and endpoint in IR7, and the sharp dependency from ADR-0057. The [Products contract](../contracts/products-catalogue.md) would gain the image entry and endpoint when they are built, and the Products design record's "Not decided" paragraph would point here.
- **Reversal:** before B1 nothing needs reversing. After B1, renditions are a disposable cache, and the `image` entry is optional content, so later revisions can drop it without touching earlier ones.

## 7. Sources and verification

- **Read for this draft:** the Products design record and the r02 captures README as recorded in PR #501; ADR-0048; the Products contract; `src/products/model.ts` and `src/products/reads.ts`; migrations 0052 and 0090; `src/adapters/contracts.ts`, `src/documents/blob-store.ts` and `src/library/types.ts`; the Document library backend decision, contract, standalone design and Figma decision; the naming and SharePoint decision, pilot and information architecture; the document identity and recovery and submitted photo inspection decisions; parent requirements DOC-01 to DOC-06 and NFR-01 to NFR-11.
- **Microsoft Graph,** checked on Microsoft Learn on 15 October 2026: the driveItemVersion resource (a content stream only; its download URL lasts about an hour, needs no authentication and may survive a permission removal) and "Retrieve thumbnails for a file or folder" (thumbnails belong to the drive item).
- **Repository checks** were run on this change; the results are in its pull request.
- Nothing is built, so there is no application, provider or device evidence.
