# Knowledge search and article detail source

DK-04 is a module-only r20 design. The [standalone HTML](../../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html), [companion report](../../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-Report-r01.md) and [handover](../../decisions/knowledge-search-article-design.md) describe its scope and limits.

Maintain the template, CSS, model and controller here, then regenerate the self-contained artifact:

```sh
python3 scripts/build-knowledge-design.py
node scripts/check-knowledge-model.mjs
```

The optional non-rendered DOM harness uses an existing jsdom installation via `PPO_JSDOM_PATH`; it adds no application dependency. The native harness uses the repository's maintained Playwright and Chrome installation:

```sh
node scripts/check-knowledge-dom.mjs
node scripts/check-knowledge-browser.mjs
```

Local DOM evidence is not native-browser, accessibility, device or business acceptance. See the [actual verification record](../../testing/evidence/knowledge-r01/README.md).

Embedded Roboto 400/500/700 is retained from the supplied r20 board (Google, Apache License 2.0) through the existing Warranty source. Line icons retain the existing workspace lineage. No replacement company logo or application shell is introduced. All article content, equipment, firmware/software labels, reviewers, sources and growing situations are synthetic and are not operational technical instructions.
