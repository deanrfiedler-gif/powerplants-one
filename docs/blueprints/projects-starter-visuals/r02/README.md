# Projects design review r02

Open `projects-design-review-r02.html` in a browser, then choose **Open worked example**. The file contains its logo and font and needs no server. Changes are temporary and reset on reload. All eight projects and document descriptions are fictional.

Review the worked example: change a forecast with a reason, complete the Activity, explicitly resolve the blocked milestone, plan the next owned action, review history, and return to the filtered register. The default J1 mode covers project coordination. The separate future mode explores scope, documents and receiving review; it is not a current quotation-acceptance capability. On a phone, expand **Review tools** to change modes or simulate failure states.

The six-page `projects-starter-design-r02.pdf` uses actual browser captures. Desktop captures are full page; 390/320 captures show the viewport and continue by scrolling.

## Reproduce the review

`review-check.cjs` requires Playwright from the repository or `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Set `REVIEW_CHROMIUM_PATH` if using a separately provided Chromium. Run `node review-check.cjs` from this directory. It writes 12 captures and `review-check-results.json`. The checked-in result records Chromium 152.0.7977.0, 45 passing checks at 1366 × 900, 390 × 844 and 320 × 844, and zero uncaught page errors.

`render-review.py` uses Python reportlab, Pillow and fontTools, plus the existing repository Roboto font. Run `python3 render-review.py` to rebuild the PDF from these captures. These are optional design-review tools; they add no application dependency.

These checks verify the local interaction model and layout. They do not establish application permissions, database transactions, persistent receipts, source acceptance or native-device behaviour. PA and master AT statuses remain unchanged. The earlier r01 package is outside this r02 publication.
