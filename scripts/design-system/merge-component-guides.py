"""Merge the component catalogue into the design system's component guides (ADR-0051).

Each guide (`components/<Name>/README.md` in the design system) starts from one entry of
docs/design/development/components.json: the summary, catalogue line, implementation, and the
Desktop, Mobile, Keyboard and accessibility, States and Limits sections. Every other section was
written by hand and is kept where it is.

The merge is three-way. A generated part is rewritten only when the catalogue changed it since the
last sync, so a hand edit inside a generated section survives too. OLD_JSON is components.json at
the commit recorded in the design system's tokens.json `meta.ref`; NEW_JSON is the commit being
synced; CURRENT_DIR holds the guides read back from the design system (`project/components`).
Changed and new guides are written to OUT_DIR/<Name>/README.md. Each JSON is read with the
binding files in the `component-bindings` folder beside it, so pass components.json from a
checkout of each commit (a `git worktree` of `meta.ref` works), not a lone copy.

usage: python3 merge-component-guides.py OLD_JSON NEW_JSON CURRENT_DIR OUT_DIR [--check]

--check rebuilds every current guide from OLD_JSON and reports any that the template does not
reproduce: those hold hand edits in generated sections, which the merge keeps.
"""
import json
import re
import sys
from pathlib import Path

GENERATED = ["Desktop", "Mobile", "Keyboard and accessibility", "States", "Limits"]
STATIC = "The preview is a static rendition: markup mirroring the component's output, styled by the repository's own CSS in `bundle.css`."
NONE = "No preview: this component depends on application state and host services; see the live catalogue at `/development/design-system` in the app."
CAPTURED = ("The preview is captured from the running application, and `bundle.css` holds the app's own CSS rules for it, "
            "extracted in the app's cascade order. Regenerate both from the app; never redraw them by hand.")
# Catalogue entries whose design-system guide has a captured preview (scripts/design-system/capture-kit.mjs).
CAPTURED_PARTS = {"ApplicationShell", "Button", "Fields", "Lookup", "ReadState", "Status", "Tabs", "Validation"}


def folder(entry_id):
    if entry_id == "buttons":
        return "Button"
    return "".join(part.capitalize() for part in entry_id.split("-"))


def header(e):
    impl = ", ".join(f"`{i['symbol']}` ({i['path']})" for i in e["implementation"]) or "none: reference only"
    review = "pending" if not e.get("review") else (e["review"].get("status") or "recorded").lower()
    return (f"{e['purpose']}\n\n**Catalogue:** {e['title']} · {e['category']} · coverage {e['coverage']} · review {review}.\n\n"
            f"**Implementation:** {impl}.")


def generated(e):
    return {
        "Desktop": e["desktop"],
        "Mobile": e["mobile"],
        "Keyboard and accessibility": e["keyboard"],
        "States": "\n".join(f"- **{s['label']}**: {s['description']}" for s in e["states"]),
        "Limits": e["limitations"],
    }


def parse(text):
    """Return (head, [(title, body)], note)."""
    text = text.rstrip("\n")
    note = ""
    for candidate in (STATIC, NONE, CAPTURED):
        if text.endswith(candidate):
            note, text = candidate, text[: -len(candidate)].rstrip("\n")
    parts = re.split(r"\n## ", "\n" + text)
    sections = []
    for part in parts[1:]:
        title, _, body = part.partition("\n")
        sections.append((title.strip(), body.strip("\n")))
    return parts[0].strip("\n"), sections, note


def render(head, sections, note):
    out = head + "\n"
    for title, body in sections:
        out += f"\n## {title}\n\n{body}\n"
    return out + f"\n{note}\n"


def build(entry, current_text, name, previous=None):
    gen = generated(entry)
    note = CAPTURED if name in CAPTURED_PARTS else NONE
    if current_text is None:
        return render(header(entry), [(t, gen[t]) for t in GENERATED], note)
    head, sections, old_note = parse(current_text)
    missing = [t for t in GENERATED if t not in [title for title, _ in sections]]
    if missing:
        raise SystemExit(f"{name}: generated sections missing {missing}")
    before = generated(previous) if previous else {}
    merged = [(t, gen[t] if t in gen and before.get(t) != gen[t] else body) for t, body in sections]
    if not previous or header(previous) != header(entry):
        head = header(entry)
    return render(head, merged, old_note or note)


BINDING_LISTS = ("states", "dependencies", "used_on", "gaps")
BINDING_NAME = re.compile(r"\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.json")


def apply_bindings(entries, folder):
    """Apply the binding files beside components.json by the rule in src/development/component-model.ts.

    Canonical order, not landing order: the existing records stay first; then every file's new
    records, then every file's bound items, each in file-name order. All records are known before
    any binding applies, so a binding may name a component defined in any file.
    """
    if not folder.is_dir():
        return entries
    files = []
    for path in sorted((p for p in folder.iterdir() if p.suffix == ".json"), key=lambda p: p.name):
        if not BINDING_NAME.fullmatch(path.name):
            raise SystemExit(f"Component binding name must be YYYY-MM-DD-slug.json: {path}")
        binding = json.loads(path.read_text(encoding="utf-8"))
        if binding.get("schema_version") != 1:
            raise SystemExit(f"{path}: unsupported component binding schema.")
        for key in binding:
            if key not in ("schema_version", "entries", "bindings"):
                raise SystemExit(f"{path}: unknown key: {key}")
        for record in binding.get("entries", []):
            if any(e["id"] == record["id"] for e in entries):
                raise SystemExit(f"{path}: component already defined: {record['id']}")
            entries.append(record)
        files.append((path, binding))
    by_id = {e["id"]: e for e in entries}
    for path, binding in files:
        for entry_id, lists in binding.get("bindings", {}).items():
            if entry_id not in by_id:
                raise SystemExit(f"{path}: unknown component: {entry_id}")
            for key, items in lists.items():
                if key not in BINDING_LISTS:
                    raise SystemExit(f"{path}: {entry_id}: only states, dependencies, used_on and gaps can be bound, not {key}")
                if not isinstance(items, list):
                    raise SystemExit(f"{path}: {entry_id}: {key} must be a list.")
                if not isinstance(by_id[entry_id].get(key), list):
                    raise SystemExit(f"{path}: {entry_id}: the component has no {key} list.")
                by_id[entry_id][key].extend(items)
    return entries


def load(path):
    # components.json on main at d29c020..ed3ccb8 carries double-encoded UTF-8; write the characters themselves.
    text = Path(path).read_text(encoding="utf-8")
    for garbled, char in (("â€“", "–"), ("â€”", "—"), ("â†’", "→")):
        text = text.replace(garbled, char)
    entries = apply_bindings(json.loads(text)["entries"], Path(path).parent / "component-bindings")
    return {e["id"]: e for e in entries}


def main():
    old_path, new_path, current_dir, out_dir = sys.argv[1:5]
    check = "--check" in sys.argv
    old, new = load(old_path), load(new_path)
    for entry_id, entry in (old if check else new).items():
        if entry_id == "foundations":  # the design system's tokens
            continue
        name = folder(entry_id)
        current = Path(current_dir, name, "README.md")
        current_text = current.read_text(encoding="utf-8") if current.exists() else None
        if check:
            if current_text is None:
                print("MISSING", name)
            else:
                print("same   " if build(entry, current_text, name) == current_text else "DIFFERS", name)
            continue
        text = build(entry, current_text, name, old.get(entry_id))
        if current_text == text:
            continue
        target = Path(out_dir, name, "README.md")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8", newline="\n")
        print("new    " if current_text is None else "changed", name)


if __name__ == "__main__":
    main()
