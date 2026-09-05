# Requirement register

[requirements.csv](requirements.csv) indexes all 78 parent requirements from Master Blueprint v02: 66 functional and 12 non-functional. It preserves the exact proposed requirement wording and adds Appendix B evidence, owner role, release allocation, dependency/specification and planned acceptance references.

`initial_backlog_ids` maps each parent to at least one initial discovery/design work package. That mapping is not proof that a single issue fully implements or tests the parent. Split accepted scope into child requirements as the module specifications develop.

The issued master owns the source requirement text. This CSV is a derived index; the foundation check detects missing/duplicate IDs, altered source wording and invalid initial-backlog or acceptance references. GitHub issue status describes work execution. Requirement approval, implementation and test status remain explicit and separate.

All requirements are proposed; none is marked implemented by this foundation. A-min or A-manual delivery does not mean the whole parent is complete.
