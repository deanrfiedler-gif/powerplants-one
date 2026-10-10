# Every-page technical inspection

<!-- versioning: git; committed history is authoritative -->

Inspector: Codex implementation self-review, 10 October 2026. Independent visual and owner acceptance remain pending. All 89 pages were inspected in 26 four-page contact sheets rendered with Poppler at 100 DPI. This is a content, pagination and clipping inspection, not print, physical-device or PDF/UA acceptance.

Original PDF and HTML bytes and their manifests are retained here. `page-checks.json` records each page image and its SHA-256; page PNGs/contact sheets are reproducible local review products and are not checked into Git. Run `python scripts/check-controlled-output-pages.py docs/testing/evidence/controlled-output-recovery --pdftoppm <installed-pdftoppm>` using a Python environment with pdfplumber and Pillow. Different tool/font versions can change image hashes.

## Observations

No clipping, content overlap or header/footer collision was observed. Automated extraction also found all required markers, none of the four confidential markers, no glyphs outside the paper and a correct page footer on every page. The PDF parser emitted FontBBox warnings; these did not prevent extraction/rendering and are retained in the log.

Layout review remains open: the version-2 issued Service report ends with a mostly empty page containing its template note; the version-2 pack has a sparse final continuation page; individual finding fields and asset rows sometimes split across pages. These observations are not silently labelled accepted. The supported immutable template versions are unchanged. Any refinement needs a separately reviewed successor template, preserving these originals.

| Document | Pages inspected | PDF SHA-256 | Observation |
|---|---|---|---|
| [OUT-09-v1.pdf](OUT-09-v1.pdf) | 1, 2, 3, 4, 5, 6 | `c85bc06ea0f7a1caeb32a8f9bb6db0f3ae8ffd332f998181fac41564ea3d773b` | All nine sections, long names and footers remain visible; equipment note continues onto page 3 and technical-source metadata onto page 4. |
| [OUT-09-v2.pdf](OUT-09-v2.pdf) | 1, 2, 3, 4, 5, 6 | `aaf8339aa41d62bd901a34381356b8a5556afd66220611a38ae68ab198178698` | Long content remains visible. The completion note continues onto a sparsely filled page 6; owner pagination review remains open. |
| [OUT-10-assets-v1.pdf](OUT-10-assets-v1.pdf) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | `3133d2c4aa3d88e692b7ede2e0d86437a99ece7c8e346d09039a3d9cd4b50ac2` | Unissued fixture only. The twenty asset rows span pages 1–4 with repeated table headers. Rows 2 and 17 split at page boundaries; text continues without loss. Findings and final notices remain visible. |
| [OUT-10-assets-v2.pdf](OUT-10-assets-v2.pdf) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | `92060d48229d6e2b6ef27e058fc1ad4b2f3abf23bbe9a6cb7fd29aecb929cbee` | Unissued fixture only. The twenty asset rows span pages 1–4 with repeated table headers. Rows 1 and 16 split at page boundaries; text continues without loss. Findings and final notices remain visible. |
| [OUT-10-v1.pdf](OUT-10-v1.pdf) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 | `769448d62a0da7d59d7885b2b4992b98c1bfe3a204ba68003a6909e10f464ee1` | All findings and material entries remain visible. Some finding fields and a material unit continue across page boundaries; no clipping or overlap observed. |
| [OUT-10-v2.pdf](OUT-10-v2.pdf) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | `21ef6831b64865625a1082dc3af156f9273bae49eb814349f180d5253bec5537` | All findings and material entries remain visible. Page 14 contains only the final template/confidence note above its footer: a visible pagination refinement for future template review. |
| [OUT-14-v1.pdf](OUT-14-v1.pdf) | 1, 2, 3, 4, 5, 6, 7, 8, 9 | `c38890180e20a5021343f3e5bbce8f73bc339c3e4dbff3f64d31480b51333bcc` | Nine quantity rows span pages 2–3 with repeated table headers. The long source manifest continues through page 9; dense small monospace text is present and stays within the page. Full customer/site names remain in the body despite abbreviated header labels. |
| [OUT-14-v2.pdf](OUT-14-v2.pdf) | 1, 2, 3, 4, 5, 6, 7, 8, 9 | `24c7ad00ff179add8d090172667e4a828e771987e165fe48447deb0372760f17` | Nine quantity rows span pages 2–3 with repeated table headers. Remaining-work text continues from page 1 to 2; dense source-manifest text continues through page 9 without visible clipping or overlap. |
