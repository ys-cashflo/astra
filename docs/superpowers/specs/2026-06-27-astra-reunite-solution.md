# Astra Reunite - Proposed Solution

Date: 2026-06-27
Project: Astra Spatial Intelligence Platform
Event: Claude Impact Lab, Mumbai 2026 - Missing Persons at Simhastha Kumbh Mela 2027
Scope: Proposal-ready solution concept for the missing-person reunification module

## One-Line Solution

Astra Reunite is a spatial search compression system for large-event missing-person response: report quickly, verify safely, keep the search bounded, notify the right people nearby, use crowd and camera signals to narrow the radius, and redirect responders before the missing person leaves the area.

## Core Positioning

Astra Reunite is not primarily a QR system, wristband system, face-recognition system, or generic lost-and-found registry.

Those are supporting layers. The hero feature is the spatial intelligence layer:

> Astra does not just identify people. Astra shrinks the search area.

At Kumbh scale, every minute expands uncertainty. If a missing person is reported after 5 minutes, responders can search a small bounded zone. If the report arrives after 45 minutes, the person may have crossed an exit, entered parking, reached a road, moved toward a bus stand, or disappeared into the wider city.

The product is designed to win the first minutes.

```text
Fast Report
-> Verification
-> Spatial Search Radius
-> Exit Monitoring
-> Radius Notification
-> Crowd + Camera Signals
-> Volunteer Redirection
-> Locate + Reunite
```

## The Problem

Large-event missing-person response has three compounding failures:

1. **Reporting is too slow.** Families often need to find the right desk, explain the case repeatedly, and fill incomplete records. Each delay expands the search area.
2. **Search is too broad.** Once a person is missing, volunteers often search based on intuition or announcements rather than a live spatial model.
3. **Signals are fragmented.** Police, medical camps, volunteers, CCTV operators, public sightings, and lost-and-found desks all observe pieces of the truth, but those observations do not become one coordinated search picture.

Astra's answer is to treat missing-person response as a spatial intelligence problem.

## Solution Layers

### 1. Base Layer - Fast Report, Registry, And Tags

The base layer captures cases and supports ordinary reunification.

Capabilities:

- Quick missing-person report.
- Found-person report.
- Lost-item and found-item report.
- Cross-center registry.
- Duplicate and reciprocal report resolution.
- Optional tag, QR, card, badge, or wristband lookup.
- Volunteer or official scan of a tag to locate family.
- Family reporting with tag ID when available.

Tags are useful, but not the hero. The system must still work when there is no tag.

> Tags help identify. Astra helps search.

Tag scan is treated as a strong location-time signal:

```text
TagScan {
  tagId
  scannedAtNodeId
  scannedAt
  scannedByRole
}
```

### 2. Trust Layer - Official Reporting And Verification

Everyone officially managing the event should be equipped to report, verify, or update missing-person cases:

- Police
- Medical staff
- Volunteers
- Support staff
- Security teams
- Crowd marshals
- Lost-and-found desk operators
- Transport and parking staff
- Food and water camp staff
- Control-room operators

They should not all have the same authority. The system needs role-based trust:

```text
Public user         -> submit sighting or missing hint
Registered staff    -> create provisional missing report
Volunteer           -> scan tag, submit sighting, clear an area
Medical staff       -> create found/vulnerable-person report
Police/control room -> verify official missing case
CCTV operator       -> confirm or reject camera observation
```

Case verification states:

```text
draft -> provisional -> verified -> active_search -> located -> reunited
```

Verification signals:

- Reporter is official staff.
- Reporter contact is verified.
- Police or control room approves the case.
- Tag scan matches a known person or family contact.
- Multiple independent reports describe the same person.
- Camera confirms the last-seen point.
- Location and time are plausible.
- Duplicate report is detected across centers.

Low-confidence reports stay provisional. Verified reports activate search, notifications, and volunteer redirection.

### Duplicate, Reciprocal, And Item Reports

Large events will produce messy reports. The registry must treat report matching as a first-class feature, not as cleanup after search starts.

**Multiple reports for the same missing person**

The same person may be reported by a spouse, child, volunteer, police desk, and lost-and-found center. Astra should merge these into one master incident with multiple reporters and observations.

```text
MasterIncident {
  id
  type                  // missing_person | found_person | lost_item | found_item
  linkedReportIds[]
  primaryCaseId
  confidence
  status
  timeline[]
}
```

Duplicate detection should use:

- Tag or QR ID.
- Reporter phone / family contact.
- Name, age band, gender, language, and home district.
- Photo or description, if available.
- Last-seen place and time.
- Spatial overlap of search cones.
- Matching found-person or sighting observations.

The UI should show:

> Possible duplicate: three reports likely describe the same elderly man near Ramkund/Panchavati. Merge into one active incident?

**Two people reporting each other missing**

This is a special case. A husband may report his wife missing, while the wife reports the husband missing at another desk. Astra should detect reciprocal reports and convert them into a **separation incident** rather than two unrelated searches.

Core idea:

> Stop searching for two independent missing people. Treat the event as one group separation problem and route both people toward verified safe rendezvous points.

Detection signals:

- Each report names the other person as companion or reporter.
- Same family contact or tag group.
- Same last-known group location.
- Compatible times and nearby zones.
- Both reports mention separation from family/group.
- Reporter name in one report matches missing-person name in another.
- Shared meeting point, travel group, vehicle, bus, camp, hotel, village, or pilgrimage group.

Separation incident model:

```text
SeparationIncident {
  id
  linkedReportIds[]
  people[]              // each person may be reporter, missing subject, or located subject
  separationPointNodeId
  lastKnownNodeIds[]
  safeRendezvousNodeIds[]
  status                // suspected | linked | reconnecting | reunited | split_back_to_cases
  confidence
  timeline[]
}
```

Operating flow:

```text
reciprocal reports detected
-> flag possible separation incident
-> operator reviews match evidence
-> link reports into one incident
-> stop duplicate search expansion
-> identify shared separation zone
-> identify nearest safe rendezvous/help points
-> notify staff at those points with both descriptions
-> keep any located person at a verified help point
-> route mobile person to nearest official help point
-> verify relationship and handover
-> mark reunited
```

Response strategy:

- Link both people into one incident.
- Search for the pair's likely convergence points: original meeting point, nearest help desk, PA announcement point, police booth, lost-and-found center, and high-visibility landmarks.
- Notify staff with both descriptions.
- Avoid asking both people to keep walking around looking for each other.
- If one person is already at a help point, keep them there and route the other person toward the safest verified rendezvous point.
- Reunite either person with the nearest verified help point before attempting full family handover.

Console behavior:

- Show reciprocal evidence: "Ramesh reports Sita missing" and "Sita reports Ramesh missing."
- Show shared geography: same/nearby last-seen zone, time gap, and likely separation point.
- Recommend one action: "Link as separation incident and route both to Panchavati Help Desk."
- Offer operator controls: `Link as separation incident`, `Keep as separate cases`, `Mark one person located`, `Assign rendezvous point`, and `Notify rendezvous staff`.

**Lost and found items**

Lost-item reporting should be supported, but it should not dilute missing-person urgency.

Item categories:

- Phone.
- Wallet / ID card.
- Bag.
- Keys.
- Religious item.
- Medical item.
- Child/elderly aid item.

Lost-item reports can use the same registry, tag/QR scan, location, and notification primitives, but with lower default priority and stricter notification limits. Exceptions should escalate when the item is safety-critical, such as medicine, ID documents, a child's bag, or an assistive device.

Item reports help the person-search system indirectly:

- A found phone, bag, or ID near an exit can become a spatial clue for a missing-person case.
- A lost phone report can connect to a later found-person report through family contact.
- A found medical item can flag vulnerability and alert nearby medical staff.

Product rule:

> Missing-person incidents drive the hero workflow. Lost-item incidents reuse the base registry and spatial clues, but they do not trigger wide radius alerts unless safety-critical.

### 3. Hero Layer - Spatial Search Compression

The spatial intelligence layer converts a verified report into a live search plan.

The engine computes:

- Last-known point.
- Time elapsed.
- Reachable radius.
- Likely movement cone.
- Crowd-flow direction.
- Attractor points such as medical camps, water points, toilets, seating, ghats, help desks, and shade.
- Exit and perimeter risk.
- Containment confidence.
- Suggested volunteer deployment.

The key operational principle:

> Search is manageable while the missing person is inside a bounded area. Once they cross an exit boundary, uncertainty explodes.

So Astra prioritizes three zones:

1. **Inner Search Zone** - where the person is likely still present.
2. **Exit / Perimeter Nodes** - gates, bridges, parking exits, road crossings, bus stands, railway approaches.
3. **Outside Spillover Routes** - activated when evidence suggests the person may have left the bounded area.

Containment confidence is a first-class output:

```text
ContainmentConfidence {
  caseId
  boundedAreaId
  confidence
  supportingSignals[]
  exitBreachRisks[]
}
```

Example:

> 78% confidence the person is still inside Sector B. No exit sightings reported. Gate 2 and Bridge 1 are cleared. Highest-likelihood cluster is near Medical Camp B.

## Crowd-Based Data Sourcing

Astra turns people on the ground into a coordinated sensing network, without treating every input as equally trusted.

Signal sources:

- Family members
- Pilgrims
- Shopkeepers and vendors
- Police booths
- Medical camps
- Lost-and-found desks
- Food and water camps
- Volunteers
- Support staff
- CCTV operators
- PA or announcement operators
- Transport and parking staff

Signal types:

```text
missing_report
found_person_report
lost_item_report
found_item_report
crowd_sighting
tag_scan
camera_note
volunteer_check
exit_clearance
area_clearance
reunion_confirmation
```

Positive and negative signals both matter. "Seen near Water ATM" increases a cluster. "Gate 3 checked, not seen" lowers exit-breach risk and improves containment confidence.

## Cluster Of Attention

Astra should not display crowd reports as a loose list. It should group them into spatial confidence zones called Clusters of Attention.

A Cluster of Attention forms when multiple signals point to the same person or same search area:

```text
ClusterOfAttention {
  id
  caseId
  centerNodeId
  confidence
  signalCount
  supportingSignals[]
  recommendedAction
}
```

Example:

- Three public sightings near Medical Camp B.
- One shopkeeper sighting near the Water ATM.
- One camera note from the same corridor.
- Gate 2 has been cleared by volunteers.

Astra response:

> High-confidence cluster near Medical Camp B. Send Team 2 to Medical Camp B. Keep Team 1 at Gate 2 perimeter. Ask nearby staff to check seating and water point.

This is the "spatial intelligence" moment: the system is not merely collecting reports; it is compressing uncertainty.

## Camera Feed Usage

Camera feeds should be used, but targeted by the spatial engine.

Astra should not scan every camera for every face. Instead:

```text
Spatial engine narrows the area
-> relevant cameras are checked
-> sightings are verified
-> exits are monitored
-> volunteers are redirected
```

Camera feeds help to:

- Verify the last-seen point.
- Validate crowd-sourced sightings.
- Monitor likely exits.
- Confirm or reject Clusters of Attention.
- Support final location confirmation.

Face or visual matching is an escalation, not the default foundation:

- Operator authorized.
- Scoped only to the predicted search radius or exit corridor.
- Logged.
- Used when tag, staff verification, and crowd/camera context are not enough.
- Mocked in the MVP unless real model access and policy approval exist.

Best framing:

> Astra does not scan every camera looking for a face. Astra first predicts where the person is likely to be, then uses the right cameras to verify that small area.

## Radius-Based Notifications

Once a case is verified, Astra sends targeted notifications inside the likely search area. It does not broadcast everywhere.

Notification groups:

- Official staff inside the search cone.
- Volunteers near high-likelihood zones.
- Police and security at likely exits.
- Medical and help desks near attractor points.
- CCTV operators covering relevant nodes.
- Public opted-in users nearby, only for verified safe cases.

The spatial layer decides who is notified based on:

- Last-known point.
- Reachable radius.
- Drift cone.
- Crowd-flow direction.
- Exit-breach risk.
- Attractor hotspots.
- Staff availability.
- Case priority.

Example official alert:

> Missing elderly male, white kurta, last seen near Gate 3 at 14:10. Likely movement toward Medical Camp B. Check water points, seating, and Gate 2 corridor. Report sighting immediately.

Example public alert:

> Help locate a missing elderly pilgrim near your area. If seen, tap "I saw them" or guide them to the nearest help desk.

Example perimeter alert:

> Possible missing child moving toward Parking Exit 2. Watch exit flow and report matching sighting.

## Operating Workflow

```text
1. Family, staff, or official creates a quick missing report.
2. System assigns provisional status and checks report confidence.
3. Registry checks for duplicate, reciprocal, and related lost/found reports.
4. Official staff or control room verifies the case.
5. Spatial engine computes search radius, drift cone, and containment confidence.
6. Radius notifications go to nearby staff, volunteers, CCTV operators, and selected public users.
7. Exit and perimeter nodes are monitored first.
8. Crowd sightings, tag scans, volunteer checks, and camera notes flow back into Astra.
9. Astra forms or updates Clusters of Attention.
10. Volunteers are redirected to the highest-confidence cluster or exit risk.
11. Person is located.
12. Identity is confirmed through tag, family, staff, or operator review.
13. Case is marked reunited.
14. Full event trail is preserved for accountability and learning.
```

## MVP Demo Story

Seeded scenario:

1. A family reports a 72-year-old man missing near Gate 3, last seen 8 minutes ago, wearing a white kurta.
2. The report is submitted by a registered support staff member and verified by the control room.
3. Astra computes a small bounded search radius and shows 84% containment confidence.
4. The engine ranks Medical Camp B, Water ATM 2, and Seating Zone C as high-likelihood attractors.
5. The system alerts nearby volunteers, medical staff, and the CCTV operator covering the corridor.
6. Gate 2 staff submit "not seen" exit clearance.
7. Two public sightings and one shopkeeper sighting arrive near Medical Camp B.
8. Camera operator confirms a possible match in the same corridor.
9. Astra forms a high-confidence Cluster of Attention near Medical Camp B and redirects Team 2.
10. Team 2 locates the person.
11. A tag scan or family confirmation verifies identity.
12. The operator marks the case reunited and the timeline shows every report, verification, notification, camera note, volunteer action, and outcome.

Demo headline:

> Search radius reduced before the person left the area.

## Nashik Geography Implications

The Nashik-Trimbakeshwar mela should be modeled as a multi-core, corridor-driven geography rather than a single circular event ground.

### Core spatial pattern

**Dual sacred cores**

- Nashik city / Panchavati / Ramkund / Godavari ghats.
- Trimbakeshwar / Kushavart Kund / Trimbak temple approach.

These cores are separated enough that a missing-person workflow must know whether the case belongs to the Nashik city search cell, the Trimbakeshwar search cell, or a corridor between them. A single shared registry is still required, but the spatial search should start inside the correct local cell.

**River and ghat linearity**

The Godavari and ghat approaches create a linear crowd geography. Search zones should follow riverbank paths, bridge crossings, ghat access points, and approach lanes rather than expanding as a simple circle.

**Transit and exit corridors**

Once a person leaves the bounded ghat/search cell, likely outbound movement is not random. It tends to follow exits, parking areas, bus stands, railway stations, road junctions, and major corridors. The current dataset already points to this pattern with locations such as Nashik Road Railway Station, CBS / Central Bus Stand, Thakkar Bazaar, Trimbak Road exit, Adgaon Parking, Madsangvi Transit, Dindori Road Crossing, and Sadhugram gates.

**No-vehicle and pressure zones**

Places like Panchavati / Ramkund access, Godavari ghat approaches, and Sadhugram gates should be treated as pedestrian pressure cells. Search teams should not only be sent to the nearest point; they should be routed along walkable access, with crush-risk and emergency access considered.

### 2027 planning changes to account for

The 2027 setup appears to be actively changing the physical operating graph. Astra should therefore ingest the latest authority layers before the event rather than freezing the model around historic Ramkund/Trimbak assumptions.

Known planning implications:

- **New ghat infrastructure.** Planned new bathing ghats in Nashik city and Trimbakeshwar mean the search graph should include newly created ghat segments, not only legacy Ramkund/Kushavart nodes.
- **Designated entry/exit routes.** Ghat development includes planned entry-exit routes, emergency access, lighting, sanitation, changing rooms, police chowkies, and watch towers. These become first-class SKG nodes for reporting, verification, camera tasking, and perimeter alerts.
- **Linear river stretch.** If the Nashik ghats expand across a longer Godavari stretch, the search cell should become a chain of sub-cells along the river rather than one Ramkund circle.
- **Road and encroachment clearance.** Routes around Malegaon Stand, Ramkund, Godaghat, Sarda Circle, Dwarka Circle, Dindori Road, and Panchavati temple surroundings may become cleaner pedestrian corridors during the event. The graph should treat these as planned movement corridors, not merely generic roads.
- **Parking and transfer reshaping.** Multi-level parking, temporary lots, shuttle routes, bus stands, and Nashik Road railway access should be modeled as spillover cells because missing-person uncertainty rises sharply once someone reaches a transfer point.
- **Telecom hardening.** Planned 5G, Cells on Wheels, network slicing, and emergency communication backhaul should support official staff alerts and radius notifications, but still should not be assumed as person-level phone tracking unless specifically authorized for a verified case.
- **Emergency siren/alert locations.** Sirens and public-alert points can become notification amplifiers and physical landmarks for staff instructions.

Design consequence:

> Nashik Reunite should use an **operational graph version** for each event phase: ordinary day, peak bathing day, route closure, ghat opening, emergency diversion, and post-event dispersal. Missing-person search should run on the graph that is true at that moment.

### What this changes in Astra Reunite

The engine should compute a **bounded search cell** before it computes a radius:

```text
case location
-> identify local search cell
-> identify exits from that cell
-> compute reachable area along walkable graph
-> rank attractors inside the cell
-> monitor exits before expanding outside
```

For Nashik, search cells can be seeded as:

- Ramkund / Panchavati / Godavari ghat cell.
- Trimbakeshwar / Kushavart Kund cell.
- Sadhugram gate cell.
- Nashik Road transfer cell.
- CBS / Thakkar Bazaar bus-transfer cell.
- Parking and outbound-road cells such as Adgaon, Trimbak Road, Dindori Road, and Madsangvi.

Each cell should have:

- Entry nodes.
- Exit nodes.
- Attractor nodes.
- Camera coverage.
- Official staff points.
- Volunteer staging points.
- Escalation route to the next spillover cell.

### Nashik-specific search behavior

If the last-seen point is inside Ramkund/Panchavati:

- Search ghats, water points, medical posts, seating, toilets, and bridge approaches first.
- Put perimeter attention on ghat exits, Panchavati access roads, CBS direction, and Nashik Road transfer direction.
- Treat "not seen at exit" as strong containment evidence.

If the last-seen point is near Trimbakeshwar/Kushavart:

- Search temple approach, kund access, queue lanes, water/medical points, and bus/parking exits first.
- Monitor the Nashik-Trimbak corridor before expanding into Nashik city.

If a case is near a transfer node:

- Reduce containment confidence faster.
- Notify transport staff and perimeter volunteers immediately.
- Check outbound routes before interior attractors, because the person can leave the local cell quickly.

This geography makes the product stronger:

> Astra does not ask "how far could they walk in 20 minutes?" in open space. It asks "which bounded cell are they likely still inside, and which exits must be watched before the search explodes?"

## Why This Is Different

Generic systems:

- Store reports.
- Search names or phone numbers.
- Broadcast announcements.
- Scan tags if present.
- Attempt camera or face matching.

Astra Reunite:

- Creates a live spatial model of where the person can still be.
- Monitors exits before uncertainty explodes.
- Uses official and public signals without trusting them equally.
- Notifies people inside the relevant radius.
- Uses cameras only after the spatial model narrows the search.
- Redirects responders as evidence changes.
- Preserves a full Observation -> Prediction -> Recommendation -> Action -> Outcome trail.

## Proposed Product Layers

```text
Layer 1: Fast Intake
  Quick report, found-person report, optional tag lookup

Layer 2: Trust And Verification
  Role-based reporters, case confidence, official verification

Layer 3: Spatial Search Compression
  Search radius, drift cone, containment confidence, exit breach risk

Layer 4: Signal Fusion
  Crowd sightings, tag scans, camera notes, volunteer checks, exit clearances

Layer 5: Action Coordination
  Radius notifications, volunteer redirection, camera tasking, reunion logging
```

## Public And Open Data Sources To Add

The current dataset is enough for the concept demo, but Astra Reunite becomes more credible if we show how public data can enrich the Spatial Knowledge Graph. These sources should be treated as graph enrichment inputs, not as personal tracking data.

### High-value MVP enrichment

**OpenStreetMap / Overpass**

Use for:

- Walkable roads, paths, alleys, bridges, ghats, and crossings.
- Gates, parking exits, bus stops, railway stations, taxi/auto stands, and other perimeter nodes.
- Attractor points such as drinking water, toilets, hospitals/clinics, police desks, shelters, religious sites, seating areas, and markets.
- Route topology for reachable-radius and exit-breach calculations.

Why it helps:

- Converts the search radius from a circle into a realistic walking graph.
- Helps identify where a missing person can actually move.
- Helps rank exits and rest/help attractors.

**Government open data / data.gov.in**

Use for:

- Official facility lists where available: hospitals, police stations, public services, administrative boundaries, public toilets, transport nodes, and emergency resources.
- Cross-checking OSM-derived points against official sources.
- Adding provenance to operational layers.

Why it helps:

- Makes the graph more authoritative.
- Helps separate official facilities from crowd-contributed map points.
- Supports government-facing credibility.

**Bhuvan / ISRO geoportal**

Use for:

- Administrative boundaries.
- Satellite/map context.
- Terrain and geospatial reference layers where licensing allows.
- Disaster-management or thematic layers if relevant to the event area.

Why it helps:

- Adds official Indian geospatial context.
- Useful for pitch, planning, and map validation.
- Should be used carefully because Bhuvan terms may restrict bulk download, redistribution, or real-time navigation use.

### Useful supporting enrichment

**Census / population density**

Use for:

- Settlement and ward-level density context.
- Expected crowd origin/destination pressure around transit, markets, and residential spillover areas.
- Prioritizing outside spillover routes when a person leaves the event boundary.

Why it helps:

- Improves the outside-area expansion model.
- Helps explain why some outbound corridors are more likely than others.

**GeoNames / gazetteer data**

Use for:

- Alternate names and spellings for places.
- Search aliases for local landmarks.
- Matching user-entered last-seen locations to map nodes.

Why it helps:

- Reporters may describe places with local names, old names, phonetic spellings, or nearby landmarks.
- Better place resolution makes the first search radius smaller.

**Weather and heat data**

Use for:

- Rain, heat, humidity, and severe-weather context.
- Adjusting walking speed assumptions.
- Increasing attractor weights for shade, water, medical camps, and shelters.

Why it helps:

- Vulnerable people are more likely to stop at water, shade, or medical help in heat or rain.
- Weather-aware scoring makes the search model more humane and realistic.

**OpenCelliD / public cell-tower locations**

Use for:

- Public aggregate tower-location context, not person tracking.
- Future telecom-readiness: understanding where coarse tower sectors may map onto event zones.

Why it helps:

- Helps pitch the future telecom layer without needing sensitive user phone data.
- Useful only as infrastructure context unless an authorized telecom emergency feed exists.

### Data-source rule

Every external source should be classified before use:

```text
public static map data       -> safe for MVP enrichment
official facility data       -> safe if license permits
environment/weather data     -> safe for scoring context
aggregate infrastructure data -> safe with attribution and caveats
person-level tracking data   -> future-only, verified case, authorized, audited
```

The MVP should prioritize OpenStreetMap/Overpass plus the provided datasets. That gives the strongest immediate gain: realistic paths, exits, attractors, and perimeter nodes.

## Future Expansion - Telecom Signals

The current hackathon dataset does not include telecom data. It has missing-person records, CCTV locations, police stations, chokepoints/parking points, and zone boundaries. There are no cell-tower pings, call detail records, telecom operator feeds, GPS traces, or phone-location records.

Telecom can still be a future expansion, but it should be framed as a regulated emergency-assistance signal, not an MVP dependency.

Potential future telecom signals:

- Last known cell-tower area for a verified missing person's phone.
- Coarse tower-sector movement, used only to decide whether the person likely left the event area.
- Emergency operator response to a verified police/control-room request.
- SMS or cell-broadcast alerts to users inside a search radius.
- Opt-in family phone sharing during an active missing-person case.

How telecom would help:

- Confirm whether the search should stay inside the bounded mela zone or expand outward.
- Prioritize exit corridors, parking, railway, and bus routes after a boundary breach.
- Send targeted alerts to phones inside the predicted search radius.
- Reduce wasted volunteer search when the person's phone has clearly moved outside the area.

Governance constraints:

- Use only for verified active missing-person cases.
- Prefer coarse location over precise tracking.
- Require control-room or police authorization.
- Log every request, response, actor, and purpose.
- Expire access automatically when the case is located or reunited.
- Never make telecom data the only proof of identity or location.

Product framing:

> Telecom is a future emergency signal that can help decide whether the search remains bounded or must expand. It is not part of the current dataset and not required for the MVP.

## Success Metrics

MVP metrics:

- Time to create a provisional report.
- Time from report to verified active search.
- Size of initial search radius.
- Number of targeted notifications sent.
- Number of exit/perimeter nodes covered.
- Number of signals fused into a Cluster of Attention.
- Time from verified report to located.
- Full timeline completeness.

Pitch metrics:

- Reduce time-to-first-search-zone.
- Keep search bounded for longer.
- Reduce unnecessary wide-area broadcasts.
- Increase useful crowd participation.
- Reduce dependency on tags or biometric identification.
- Improve accountability through event history.

## Final Pitch

Astra Reunite turns missing-person response from a manual search problem into a spatial intelligence problem.

It equips official staff to report and verify cases quickly, uses the spatial graph to keep the search bounded, alerts the right people inside the radius, fuses crowd and camera signals into Clusters of Attention, monitors exits before uncertainty explodes, and redirects responders before the trail goes cold.

The promise is simple:

> Find people faster by shrinking where to look.
