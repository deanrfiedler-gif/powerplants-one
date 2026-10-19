---
title: Compact phone header built in the application
date: 2026-10-19
---

The shared phone header now follows the adopted [Phone header amendment](../decisions/phone-header-amendment.md) (P1–P9) in the application, in draft PR #609: below 780 px every page shows one 56 px row (Menu, the page or view name, Conversations; Back and the record reference on a record), and the menu holds search, the account and working company, notifications, the page guide and Design & build. Pages with a secondary menu show it from the view chooser. Pages can hand over a page action, Filter and record navigation, but none does yet; each adopts them when it is next changed. Desktop and tablet are unchanged. Measured on the running app at 390 and 320 px ([evidence](../testing/evidence/phone-header/README.md)); owner review against Figma `1530:110` and the named Figma version are pending. No migration, permission or parent ID changes.
