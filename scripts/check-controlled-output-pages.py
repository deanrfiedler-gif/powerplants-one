"""PT-23 retained PDF text/geometry checks and page images for visual review.

Run with the existing PDF review runtime (pdfplumber, Pillow and Poppler).
This is a local evidence tool, not an application dependency or visual approval.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import pdfplumber
from PIL import Image, ImageOps, ImageDraw


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--pdftoppm", default="pdftoppm")
    args = parser.parse_args()
    result = {"review_status": "Automated checks only; inspect every page separately", "documents": [], "failures": []}
    pdfs = sorted(args.directory.glob("OUT-*.pdf"))
    if len(pdfs) != 8:
        result["failures"].append(f"Expected eight v1/v2 issued and asset-stress PDFs; found {len(pdfs)}")
    for path in pdfs:
        manifest = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
        pages = []
        all_text = []
        if sha(path) != manifest["pdf_sha256"]:
            result["failures"].append(f"{path.name}: original PDF hash differs")
        with pdfplumber.open(path) as pdf:
            if len(pdf.pages) != manifest["page_count"]:
                result["failures"].append(f"{path.name}: page count differs")
            for n, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                all_text.append(text)
                escaped = [c for c in page.chars if c.get("text", "").strip() and
                           (c["x0"] < -0.5 or c["x1"] > page.width + 0.5 or c["top"] < -0.5 or c["bottom"] > page.height + 0.5)]
                # Check actual glyph positions, not just the declared paper size.
                # These checks cannot replace inspecting table breaks/overlap.
                if escaped:
                    result["failures"].append(f"{path.name} page {n}: glyphs outside page")
                if f"{n} / {len(pdf.pages)}" not in text:
                    result["failures"].append(f"{path.name} page {n}: page footer missing")
                pages.append({"page": n, "width": page.width, "height": page.height,
                              "characters": len(page.chars), "outside_page": len(escaped),
                              "text_sha256": hashlib.sha256(text.encode()).hexdigest()})
        text = "\n".join(all_text)
        for marker in manifest["expected_text"]:
            if marker not in text:
                result["failures"].append(f"{path.name}: missing content marker {marker}")
        for marker in manifest["forbidden_text"]:
            if marker in text:
                result["failures"].append(f"{path.name}: leaked confidential marker {marker}")
        target = args.directory / "pages" / path.stem
        target.mkdir(parents=True, exist_ok=True)
        subprocess.run([args.pdftoppm, "-r", "100", "-png", str(path), str(target / "page")], check=True, capture_output=True)
        images = sorted(target.glob("page-*.png"))
        if len(images) != len(pages):
            result["failures"].append(f"{path.name}: rendered page count differs")
        for page, picture in zip(pages, images):
            page["image"] = str(picture.relative_to(args.directory)).replace("\\", "/")
            page["image_sha256"] = sha(picture)
        # Every page is present at its full image resolution. Four-page contact
        # sheets are an index for inspection; inspect individual pages as needed.
        for start in range(0, len(images), 4):
            sheet = Image.new("RGB", (1700, 2460), "#d0d0d0")
            draw = ImageDraw.Draw(sheet)
            for offset, picture in enumerate(images[start:start + 4]):
                with Image.open(picture) as im:
                    tile = ImageOps.contain(im.convert("RGB"), (825, 1180))
                    x, y = (offset % 2) * 850 + 12, (offset // 2) * 1230 + 35
                    sheet.paste(tile, (x, y))
                    draw.text((x, y - 25), f"{path.stem} page {start + offset + 1}", fill="black")
            sheet.save(target / f"contact-{start // 4 + 1:02}.png")
        result["documents"].append({"file": path.name, "sha256": sha(path), "pages": pages})
    (args.directory / "page-checks.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"documents": len(result["documents"]), "pages": sum(len(d["pages"]) for d in result["documents"]), "failures": result["failures"]}, indent=2))
    raise SystemExit(bool(result["failures"]))


if __name__ == "__main__":
    main()
