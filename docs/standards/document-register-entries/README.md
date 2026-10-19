# Document register entries

The [document register](../document-register.csv) is read together with every `.csv` file in this folder. Register a new document here, one file per change, instead of appending to the shared file. Every design pull request used to append its rows at the same place in the shared file, so each one conflicted with the others ([why](../../decisions/merge-conflict-reduction.md#5-design-pull-requests-no-longer-share-generated-or-appended-files)).

## Add an entry

- Name the file `YYYY-MM-DD-slug.csv`, for example `2026-10-19-calendar-figma-design.csv`. Use the slug of your change, so no two pull requests write the same file.
- The first line is the exact header of `document-register.csv`:

  ```
  document_id,title,canonical_path,revision,status,owner,source_commit,legacy_names,supersedes,versioning,last_labelled_revision
  ```

- Then one row per document, with the same columns and rules as the shared file: a unique `document_id` and `canonical_path`, `versioning` of `git` or `retained-record`, and quotes around any field that contains a comma. A design lock-in usually has two rows, the `-FIGMA-DEC` decision and the `-FIGMA-R01` retained captures.
- `python3 scripts/check_naming.py` reads the shared file and every entry file as one register, so duplicate IDs or paths across files fail just as they would in one file.

## Changing a row

Correct a row where it lives. Rows that were in `document-register.csv` on 19 October 2026 stay there and may still be edited there; a status change to one of them is a narrow edit to that line. The shared file may lose rows but not gain them: `check_naming.py` fails if it holds more than the 730 rows it had when this folder began.

## Finding a document

Search both places, for example `git grep -n "PPO-EC03" docs/standards/document-register.csv docs/standards/document-register-entries/`. Files here sort by date, so the newest registrations are at the end of the folder listing.
