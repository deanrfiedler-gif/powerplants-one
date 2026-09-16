# Notification inbox and preferences source

SH-03 standalone r01. Open the [HTML](../../reference/ui/notifications/PPO-Notification-Inbox-and-Preferences-r01.html) and [detailed report](../../reference/ui/notifications/PPO-Notification-Inbox-and-Preferences-Report-r01.md).

Edit the template, model, controller and CSS here, then run:

```sh
python3 scripts/build-notifications-design.py
node scripts/check-notifications-model.mjs
node scripts/check-notifications-browser.mjs
```

The deterministic builder embeds all dependencies. The browser check uses the existing repository Playwright/Chrome pins. The focused read-only workflow retains its original screenshots and manifest. No runtime dependency, migration or application route is added.

Embedded Roboto 400/500/700 is retained from the supplied r20 board (Google, Apache License 2.0); icons follow the existing Maintenance/Warranty line-icon assets. Fonts and icons are unchanged copies. The whole model is fictional. Preview identities illustrate scope and are not a security boundary.

The local controller changes only personal notification state and preferences. It exposes no business-completion command. Real source actions, provider sends and application integration remain receiving work described in the report.
