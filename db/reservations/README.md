# Migration number reservations

Claim a migration (and seed) number here before you write the migration, in the draft pull request that claims the work. The file name is the number, so two pull requests that claim the same number add the same path and the second to merge gets a git conflict instead of a silent collision.

```sh
python3 scripts/check_migrations.py --next                    # next free number (add --open-prs to include open pull requests)
python3 scripts/check_migrations.py --reserve "what it is for" # creates db/reservations/NNNN.md on your branch
```

Commit the reservation, push, then run `python3 scripts/check_migrations.py --open-prs` to confirm no other open pull request claims the number. The pull request that adds the migration deletes its reservation file in the same change; `scripts/check_foundation.py` fails on a reservation whose number is already a migration. A seed uses its migration's number, so one reservation covers both. Convention and reasons: [merge-conflict-reduction.md](../../docs/decisions/merge-conflict-reduction.md).
