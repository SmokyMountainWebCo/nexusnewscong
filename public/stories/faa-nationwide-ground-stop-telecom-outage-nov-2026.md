---
title: FAA traces nationwide ground stop to data flood on its telecom network; root cause still open
slug: faa-nationwide-ground-stop-telecom-outage-nov-2026
location: United States (nationwide, FAA en route centers)
severity: 6
alert_level: none (no GDACS-type alert for this event)
alert_note: Severity set by Journalist from scope (nationwide stop, thousands of cancellations); no external alert level exists.
source_urls: ["https://www.faa.gov/newsroom/nationwide-ground-stop-questions-and-answers", "https://www.transportation.gov/briefing-room/icymi-us-transportation-secretary-sean-p-duffy-provides-update-restoration-airspace", "https://www.fly.faa.gov/ois/oisedit/adv_oisedit_dis?day=11132026&number=111", "https://abcnews.com/Politics/transportation-secretary-duffy-atc-routers-ability-broadcast-data/story?id=138155545", "https://www.npr.org/2026/11/14/nx-s1-6040952/faa-ground-stop-airplane-travel", "https://www.nbcnews.com/news/us-news/flights-air-traffic-delays-groundstop-faa-duffy-rcna609545", "https://www.investing.com/news/stock-market-news/us-probes-why-a-router-installation-sparked-mass-flight-grounding-5030697", "https://x.com/MSFT365Status/status/2121303408313303423", "https://www.businessinsider.com/smart-system-microsoft-faa-ground-stop-not-their-fault-2026-11", "https://www.geekwire.com/2026/dhs-chief-sees-no-microsoft-link-to-faa-ground-stop-says-possible-ai-role-being-investigated/", "https://www.usaspending.gov/award/CONT_AWD_693KA821F00222_6920_DTFA0102D03006_6920", "https://www.usaspending.gov/award/CONT_IDV_693KA826D00016_6920", "https://www.usaspending.gov/award/CONT_AWD_693KA726C00064_6920_-NONE-_-NONE-", "https://www.usaspending.gov/award/CONT_AWD_692M1526F00218_6920_692M1526A00001_6920", "https://www.oig.dot.gov/sites/default/files/WEB%20FILE2_FTI%20%20Nov%2019%20outage-6-18-10_Final%20Signature%28a%29%20%282%29.pdf", "https://www.gao.gov/products/gao-24-107001"]
timestamp: "2026-11-13T20:54Z"
brief_id: nsb-faa-groundstop-20261113
event_type: infrastructure_outage
status: published
image: /stories/img/faa-anchorage-artcc.jpg
image_alt: Air traffic controllers at the FAA Anchorage Air Route Traffic Control Center operations area
image_credit: US DOT FAA
image_license: Public domain (FAA)
image_source_url: https://commons.wikimedia.org/wiki/File:ZAN-ARTCC-ATOP.jpg
as_of: "2026-11-17T01:55Z (8:55 PM ET Nov 16)"
confidence: [{"conclusion": "Microsoft is not linked to the FAA ground stop by any primary or official source; the two are separate outages.", "level": "High"}, {"conclusion": "The stop came from a data flood on the FAA's FTI telecom network, per the FAA; why the flood started (installer error, a faulty router or something else) is still under investigation.", "level": "High"}, {"conclusion": "No evidence links SMART to the stop, and the timing alone isn't evidence; the FAA, which denies a link, is the agency involved, so its denial is not independent.", "level": "High"}]
canaries: [{"indicator": "FAA or L3Harris publishes a root-cause report separating installer error from a faulty router, and confirms or revises the Amarillo and El Dorado account", "window": "Nov 16, 2026 - Jan 31, 2027", "source": "faa.gov/newsroom/nationwide-ground-stop-questions-and-answers; L3Harris newsroom"}, {"indicator": "NTSB or DOT Inspector General announces an investigation or audit of the Nov 13 event", "window": "Nov 16, 2026 - Feb 15, 2027", "source": "ntsb.gov; oig.dot.gov/active-audits"}, {"indicator": "FBI or DOT discloses a finding on the El Dorado router, including whether tampering was ruled out", "window": "Nov 16, 2026 - Jan 31, 2027", "source": "@SecDuffy; transportation.gov briefing room; fbi.gov news"}]
developing: true
---

# FAA traces nationwide ground stop to data flood on its telecom network; root cause still open

A flood of data on the Federal Aviation Administration's private telecommunications network forced Friday's nationwide ground stop, the FAA said, and every aircraft in the air landed safely. Air traffic resumed at 8:15 p.m. EST the same day. The root cause is still undetermined, Transportation Secretary Duffy said Monday. Microsoft's outage a day earlier was a separate event, according to Microsoft and Homeland Security Secretary Mullin.

## 1. The surface story

The FAA halted all U.S. departures Friday afternoon. Its Command Center advisory listed the event start at 3:53 p.m. EST and took effect at 3:54 p.m. The FAA later said the technical problem began around 3:30 p.m. Online speculation tied the stop to Microsoft's Outlook and Microsoft 365 outage, but no official source has made that link.

## 2. What the records show

In a question-and-answer page dated Nov. 15, the FAA said its "legacy equipment became unstable when data began flooding the FAA FTI network, at a rate of 1,000 connection attempts every 4 to 5 seconds." The agency said the initial investigation points to two sites: a radar site in Amarillo, Texas, and a radio site in El Dorado, Arkansas, where L3Harris, its network provider, had deployed a new router. L3Harris blocked both sites and the network stabilized, the FAA said.

"No, this was not a full outage," the FAA wrote. "Some frequencies and radar feeds remained reliable." Instability began at 17 of its 22 en route centers, and approximately 3,500 aircraft landed safely, it said. The FAA said there was no indication of a cyberattack.

Transportation Secretary Duffy said Saturday investigators had not determined whether the cause was installer error at L3Harris or a faulty router. He said Monday on CNBC that it remains unclear why the router triggered the flood, Reuters reported.

The FAA said operators canceled approximately 12,462 flights Friday, though not all because of the stop. FlightAware counted more than 9,000 Friday cancellations, NPR reported. By 9 a.m. EST Monday, about 1,500 U.S. flights were delayed and nearly 300 canceled, NBC reported, citing FlightAware.

## 3. Who has a stake

L3Harris runs the FTI network, with $2.31 billion obligated under its contract, according to USAspending. AT&T now leads the build of its replacement under an Aug. 12 contract. Microsoft said its own outage stemmed from a network capacity upgrade and "was a technical issue not related to cyber or AI." Federal records show small Microsoft support contracts with the FAA and a $1.1 million AWS and Azure hosting order placed through the reseller Four Points Technology. Nothing ties either to air traffic systems.

The FAA said its SMART planning tool, built by Air Space Intelligence under a contract worth up to $875.95 million, is "not related" and does not feed the air traffic control system.

Analysis: a failure traced to the legacy network could strengthen the administration's push for telecom modernization funding and could benefit the contractors replacing it.

## 4. What coverage is missing

A 2009 failure of the same network disrupted flight plans nationwide, and the Transportation Department's inspector general warned then that "an inherent risk of critical outages remains." The Government Accountability Office found in 2024 that 51 of 138 air traffic systems were unsustainable. The FAA has not explained a 3:21 p.m. equipment advisory at Chicago O'Hare that preceded the stop. The number of similar routers is about 60, per the FAA; 69, per Duffy on ABC.

## 5. Conclusions

- **High confidence:** No evidence links Microsoft to the ground stop.
- **High confidence:** A data flood on the FAA's FTI network caused the stop, per the FAA. Why it started is still under investigation.
- **High confidence:** No evidence links SMART to the stop, and the timing alone isn't evidence; the FAA, which denies a link, is the agency involved, so its denial is not independent.

**Still unknown:** the root cause, whether the NTSB or inspector general will investigate, and any FBI finding. Duffy said the FBI is helping examine the router.
