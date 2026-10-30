---
title: Voice capture AI-05 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for AI-05, voice capture and transcript review, by choosing "Accept, as recommended". The [design decision](../decisions/voice-capture-figma-design.md) (PPO-AI05-VOICE-CAPTURE-FIGMA-DEC) records D1–D17 and answers Q1–Q7: no hands-free driving mode in AI-05, a 2:00 limit per recording, technician voice notes later and not offline, the transcript discarded unless the person keeps it as a note, tap to start, real-phone tests with Australian speakers in noisy places, and the read-back always shown in the pilot. Nine icon-free captures with hashes are retained in [voice-capture-design-r01](../reference/ui/my-work/voice-capture-design-r01/README.md). The design register page for `scope:AI-05` cites the decision and captures. In Figma the eight new parts moved to Components · Assistant, seven icons moved to Components · Icons, the File index has its row, and the capture copies sit on the Captures page at y = 1,040,000. At lock-in the three AI-02 hand-off frames were aligned, text only, with AI-02's accepted polish.

Checked: no Font Awesome instance is left in the capture copies and no copy carries a prototype link. Instance counts did not change when the parts moved. Not done: the named Figma version "Voice capture — accepted" waits for Dean's yes, and the flows were not played in Present mode. The page is not built, the speech-to-text service is not chosen and no phone, speech or screen-reader test has been run. No application code, route, migration, permission, grant, provider call, real data or parent ID changes.

<!-- decision-index -->
[Voice capture design](../decisions/voice-capture-figma-design.md) (PPO-AI05-VOICE-CAPTURE-FIGMA-DEC) records Dean's 31 October 2026 acceptance of AI-05: push-to-talk only, audio never kept, an editable transcript, a read-back of names, numbers and dates, and the final write left to the AI-02 review. The speech-to-text service and building it are not decided.
