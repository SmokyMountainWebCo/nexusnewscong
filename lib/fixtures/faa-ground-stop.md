---
title: FAA ground stop and a separate Microsoft outage
status: published
event_type: investigation
developing: true
as_of: "2026-11-14T00:30Z (7:30 PM ET Nov 13)"
confidence:
  - conclusion: "Microsoft is not linked to the FAA ground stop by any primary or official source; the two are separate outages."
    level: High
  - conclusion: "The stop stemmed from a failure in the FAA's en route communications layer, most likely the L3Harris-run FTI network after an update, but the FAA has not confirmed the system or cause."
    level: Medium
  - conclusion: "SMART's nationwide expansion three days earlier is, on current evidence, coincidental timing."
    level: Low
canaries:
  - indicator: "FAA or DOT names the failed system and cause, or issues a preliminary review"
    window: "Nov 14-30, 2026"
    source: "faa.gov/newsroom/statements/general-statements; fly.faa.gov ATCSCC advisories"
  - indicator: "Microsoft publishes its post-incident report for EX1550543/MO1550821"
    window: "Nov 14 - Dec 15, 2026"
    source: "status.cloud.microsoft; @MSFT365Status"
---

## 1. The surface story

Two outages shared an evening. The filed record does not make them one event.

## 2. What the records show

Official notices describe an FAA communications failure. They do not name Microsoft.

## 3. Who has a stake

Airlines, the FAA, and Microsoft each have a reason to describe the evening narrowly.

## 4. What coverage is missing

The FAA has not named the failed system or the cause.

## 5. Conclusions

The confidence list is the bottom line until a primary source says more.
