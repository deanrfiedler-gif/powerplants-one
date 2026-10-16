# ADR-0057 — Product image renditions

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Proposed, 15 October 2026. Not accepted. It adds no dependency and authorises no code, migration or deployment. **Raised by:** IR4 of the [product image references proposal](product-image-references.md), which drafts how Products Amendment A1 ([section 8 of the Products design](products-figma-design.md#8-amendment-a1--product-image-15-october-2026)) would store, read and show product images.

**Related:** `scope:PD-01`; parents DOC-01, DOC-06, NFR-03, NFR-04 and NFR-05; [ADR-0048](ADR-0048-products-native-catalogue.md) (native Products catalogue); [ADR-0003](ADR-0003-prototype-architecture.md) (prototype architecture); the [SharePoint information architecture](../architecture/sharepoint-information-architecture.md).

## Context

A1 shows each product image at several sizes: 28, 40 and 44 px thumbnails, an 80 px phone row, a 332 × 233 px record panel (249 × 173 px on a tablet) and View full size. The proposal's IR4 has PPO make three renditions (small, panel and full) from the verified exact bytes, strip their metadata and never give the browser the original file, a SharePoint URL or a provider ID. Something on the server must decode, turn upright, resize and re-encode images. Nothing in PPO does that today: `next/image` only serves the static logo in the product navigation and field screens.

Constraints:
- Server code only, on Node 24: Windows on development machines and Debian bookworm-slim linux-x64 in the hosted demo container (1 CPU, 2 GiB; `infra/azure-demo`).
- It must refuse hostile or oversized files and must not hold whole large photographs in memory longer than needed.
- It must work for the `Synthetic` provider now and a `SharePoint` provider later, so it takes bytes, not a provider URL.
- AGENTS.md: no unrequested dependency, and a technology choice needs an ADR first.

## Options

| Option | For | Against |
|---|---|---|
| A. sharp (libvips) as a direct dependency | Already in the lockfile at 0.35.4 as an optional dependency of Next 16.3.4. Prebuilt for win32-x64 and linux-x64 glibc. Apache-2.0. Fast and light on memory. Writes no metadata unless asked, can turn images upright from their orientation tag, and can limit input pixels | A native binary: its platform package must install on every machine, CI runner and container. It must become a direct dependency so PPO pins it rather than relying on Next's optional install. It also reads SVG and other formats, so PPO must check the file type before calling it |
| B. Microsoft Graph thumbnails | No dependency | Graph serves thumbnails for a drive item, which reflects its current version; a specific version exposes only its content stream. The pinned version cannot be guaranteed. Nothing for the `Synthetic` provider |
| C. The Next.js image optimiser (`next/image` pointed at a PPO route) | No new code dependency; uses sharp underneath | Its server cache is keyed by source URL, width and quality rather than by viewer, and a cached result is reused for at least its minimum cache lifetime. A rendition could reach another viewer without PPO's per-request authority check, which IR5 requires |
| D. A pure JavaScript image library | No native binary | Slower and uses more memory on large photographs in a 2 GiB container; format support and input limits would need checking |
| E. Scale the original in the browser | No server work | Sends originals, with their embedded metadata, at megabytes per grid row to phones. Contradicts IR4 |
| F. Authors keep pre-sized files in SharePoint | No server work | Two or three references per image that can drift apart, more work for authors, and no proof that a thumbnail shows the pinned file |

## Proposed decision

Option A. When B1 is authorised, add sharp as a direct dependency at the version already locked (0.35.4 at the time of writing) and use it only in the server code that makes product image renditions.

1. Check the file signature first and pass only JPEG, PNG and WebP to sharp.
2. Set an input pixel limit (proposed 40 megapixels) and fail on a corrupt or truncated file rather than producing part of an image.
3. Turn the image upright from its orientation tag, then write it without metadata.
4. Write WebP for all three renditions; it keeps transparency for cut-out product pictures and every current browser shows it.
5. Make renditions when an image source is registered, off the page request. On a cache miss, make each rendition once per key with a small concurrency limit (proposed two), so a 100-row catalogue cannot start 100 decodes.
6. Put a rendition-specification version in the cache key, so a change of size or quality regenerates renditions instead of mixing old and new.

## Consequences

- B1 changes `package.json` and the lockfile. The dependency checks in force at that time apply, and the build pull request reports them.
- The hosted demo's `npm ci` installs the linux-x64 package and development machines the win32-x64 package; B1 must prove both.
- Renditions are a cache keyed by specification version, so replacing sharp later means emptying the cache and regenerating. No data migration and no stored business record depends on the library.

## Validation required at B1

- Hostile files: a wrong signature, SVG, a decompression bomb above the pixel limit, a truncated file and bytes that fail the SHA-256 check are all refused, with no partial rendition.
- Metadata: a photograph carrying GPS and camera tags produces renditions with none.
- Orientation: a rotated photograph is shown upright.
- Resources: a 40-megapixel image renders within the hosted container's memory.
- Both platform builds: Windows development and the hosted container image.

## Remaining questions

- The final rendition sizes and quality, confirmed against the built pages at 1440, 1024, 390 and 320 px widths.
- Whether this ADR is adopted at all, which is Q10 of the [proposal](product-image-references.md).
