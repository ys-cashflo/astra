# Astra Reunite - System Design And MVP Scope

Date: 2026-06-27
Project: Astra Spatial Intelligence Platform
Event: Claude Impact Lab, Mumbai 2026 - Missing Persons at Simhastha Kumbh Mela 2027
Scope: Buildable system breakdown, feature list, MVP boundary, and extended search algorithm for Astra Reunite

## Product Goal

Astra Reunite should help responders find missing people faster by shrinking where to look and by connecting found people to family, companions, or known groups using spatial context.

The MVP should prove five things:

1. A missing report can be created quickly by family or official staff.
2. The report can be verified before full search activation.
3. The spatial engine can compute a bounded search cell, radius, exits, and likely attractors.
4. Crowd, camera, tag, volunteer, and item signals can narrow the search into a Cluster of Attention.
5. A found or unidentified person can be connected to family or known people using identity, relationship, origin, and co-location signals.

## Core System Modules

### 1. Intake And Reporting System

Purpose: capture the first useful signal quickly.

Inputs:

- Missing-person report.
- Found-person report.
- Lost-item report.
- Found-item report.
- Crowd sighting.
- Tag/QR scan.
- Volunteer area check.
- Camera operator note.

MVP features:

- Quick report form with person type, age band, clothing, last-seen location, last-seen time, intended destination/activity, reporter role/contact, optional photo ref, optional tag ID.
- Found-person form with current location, approximate description, communication status, and optional tag/item/photo ref.
- Lost/found item form with category, location, description, and linked person/case if known.
- Input role label: public, family, volunteer, police, medical, support, camera operator, control room.
- Progressive enrichment flow: create the case quickly first, then ask follow-up questions that narrow search and matching.

Missing-person intake should specifically capture:

```text
MissingPersonReport {
  subjectProfile       // child | elderly | adult, age band, gender if known
  clothing             // color, type, distinctive markers
  lastSeenLocation
  lastSeenTime
  intendedDestination  // where they were supposed to go
  intendedActivity     // snan | food | toilet | medical | rest | shopping | transport | meeting_point | unknown
  plannedRouteHint     // optional: "from Ramkund to food stall near Gate 2"
  groupContext         // family, travel group, camp, bus, village, meeting point
  reporterContact
  reporterRole
  optionalTagId
  optionalPhotoRef
}
```

The report should support staged completion:

```text
stage1_critical      // enough to create provisional case and initial search cell
stage2_narrowing     // enough to improve radius, destination, and semantic matching
stage3_connection    // enough to identify family/known people and safe handover
stage4_safety        // enough to raise priority or route to medical/police support
```

### Stage 1 - Critical Fields

These fields create the report in under 30 seconds:

```text
personType            // child | elderly | adult | disabled | medically_vulnerable
approxAgeOrAgeBand
genderIfKnown
clothingColor
clothingType
lastSeenLocation
lastSeenTime
intendedActivity      // snan | food | toilet | medical | rest | shopping | transport | meeting_point | unknown
reporterName
reporterContact
relationshipToPerson
```

If only these fields are known, Astra can still:

- Create a provisional case.
- Identify the search cell.
- Estimate elapsed time and reachable area.
- Rank initial Areas of Interest.
- Start verification.

### Stage 2 - Search-Narrowing Fields

These fields should be requested after the case exists, or by another staff member while search begins:

```text
intendedDestination
plannedRouteHint
mobility              // normal | slow | wheelchair | needs_support | injured | unknown
mentalState           // calm | confused | memory_loss | distressed | nonverbal | unknown
lostBehaviorProfile   // waits_where_lost | goes_to_help_desk | follows_crowd | returns_to_bus | searches_for_family | goes_to_destination | likely_to_panic | unknown
spokenLanguages[]
canReadSigns          // yes | no | unknown
familiarWithArea      // local | visited_before | first_time | unknown
hasPhone              // yes | no | unknown
phoneReachable        // reachable | no_answer | switched_off | not_with_person | unknown
hasMoney              // none | small_cash | enough_for_food | enough_for_transport | unknown
hasIDCard             // yes | no | unknown
hasTagOrQR            // yes | no | unknown
```

How these narrow search:

- `spokenLanguages` routes alerts to matching-language staff and helps identify regional groups.
- `canReadSigns` changes whether help desks/signage are strong attractors.
- `hasPhone` and `phoneReachable` decide whether this is a call-guided rendezvous or field search.
- `hasMoney` changes transport-exit risk. Enough money for transport raises bus, parking, auto/taxi, and railway priority.
- `mobility` changes reachable radius.
- `mentalState` changes attractor weights toward help desks, water, shade, medical, police, and seated areas.
- `lostBehaviorProfile` converts family intuition into search behavior: some people wait, some follow crowds, some return to transport, and some go to the planned destination.
- `familiarWithArea` changes whether the person may navigate to known landmarks versus follow crowd flow.

Behavior profile options:

```text
waits_where_lost       -> boost last-seen micro-area, nearby shade/seating, nearby help desk
goes_to_help_desk      -> boost help desks, police booths, PA points, medical camps
follows_crowd          -> boost dominant crowd-flow direction and high-flow paths
returns_to_bus         -> boost bus stands, parking, shuttle points, group camp, outbound gates
searches_for_family    -> boost original route, meeting point, last family location, landmarks
goes_to_destination    -> boost intended destination/activity nodes
likely_to_panic        -> boost nearby safe staff points; reduce assumption of planned route
unknown                -> rely on person type, mobility, intent, crowd flow, and signals
```

### Stage 3 - Connection Fields

These fields help identify family, known people, and travel groups:

```text
homeState
homeDistrict
villageOrCity
primaryLanguage
otherLanguages[]
travelGroupName
campOrStayLocation
busOrVehicleInfo
tourOperatorOrGroupLeader
plannedMeetingPoint
knownCompanionNames[]
familyMemberNames[]
familyPhoneNumbers[]
sameVillageOrGroupContacts[]
recentPhotoRef
```

How these help:

- Connect found people to family even without tag/phone.
- Detect reciprocal separation incidents.
- Rank known contacts from same village, bus, camp, or travel group.
- Let a help desk ask the right question: "Are you with the Patna bus group?" instead of only "What is your name?"

### Stage 4 - Safety And Priority Fields

These fields affect urgency, routing, and who should respond:

```text
medicalCondition      // diabetes | heart | epilepsy | dementia | pregnancy | injury | other | none | unknown
medicationNeeded      // yes | no | unknown
lastMealOrWater       // recent | long_time | unknown
hasAssistiveDevice    // cane | wheelchair | hearing_aid | glasses | none | unknown
visionOrHearingIssue  // yes | no | unknown
panicRisk             // low | medium | high | unknown
specialCareNotes
```

How these help:

- Medical risk boosts urgency and medical-camp search.
- Missing glasses/hearing aid changes communication strategy.
- Dementia/memory loss increases rest/help/medical attractor priority.
- Medication need can turn a normal search into critical priority.

Each new field should re-run:

```text
search compression
semantic report search
relationship-aware matching
notification/task recommendation
```

Why this matters:

- If the family was going for food, food stalls and dining areas become high-priority Areas of Interest.
- If the family was going for snan, ghats, queue lanes, changing areas, and river approaches become high-priority.
- If the person was going to a toilet, medical camp, bus, parking, or meeting point, the search radius should be biased toward those destination nodes.
- Destination intent turns a broad radius into a smaller ranked set of places the person was likely trying to reach.

Out of scope for MVP:

- Real authentication.
- Real file uploads.
- Real multilingual speech intake.

### 2. Trust And Verification System

Purpose: prevent false reports from triggering unnecessary mobilization.

Case states:

```text
draft -> provisional -> verified -> active_search -> located -> reunited
```

MVP features:

- Confidence score for each report.
- Mock staff role selector.
- Control-room verify action.
- Report evidence panel: reporter role, contact present, tag present, duplicate reports, camera confirmation, plausible location/time.
- Different behavior by confidence:
  - Low: store only, ask for more info.
  - Medium: show to officials for verification.
  - High: activate search.
  - Critical: activate search and perimeter alerts.

Out of scope for MVP:

- Real OTP.
- Real identity provider.
- Legal case management.

### 3. Unified Registry And Incident Graph

Purpose: keep reports, people, items, relationships, and events connected.

Entities:

```text
PersonCase
FoundPersonCase
ItemCase
MasterIncident
SeparationIncident
Reporter
KnownPerson
TravelGroup
Tag
Observation
ReuniteEvent
```

MVP features:

- Master incident creation.
- Duplicate report detection.
- Reciprocal separation detection.
- Lost/found item linking.
- Timeline of events for every incident.
- Registry search by name, tag, phone/contact, location, age band, item category, and status.

Out of scope for MVP:

- Backend persistence.
- Multi-user conflict resolution.
- Large-scale dedupe across millions of records.

### 4. Semantic Report Search System

Purpose: let operators search messy reports using natural language.

Example queries:

```text
"elderly man in red shirt missing since 2 PM from Ramkund"
"child blue dress last seen near Gate 2"
"woman from Bihar found near medical camp"
"bag with medicines lost near Nashik Road station"
"person speaking Maithili looking for son Ramesh"
```

The goal is not chatbot behavior. The goal is fast recall over incomplete reports, sightings, found-person notes, item reports, and relationship clues.

MVP approach:

```text
natural language query
-> normalize text
-> extract structured hints
-> run fuzzy text search
-> apply spatial/time filters
-> rank cases, incidents, sightings, and known contacts
-> show reasons
```

Structured hints to extract:

- Person type: child, elderly, adult, woman, man.
- Clothing colors: red, white, blue, saffron, green, black.
- Clothing type: shirt, kurta, saree, dress, dhoti, jacket.
- Time: "since 2 PM", "30 minutes ago", "morning", "after snan".
- Location: Ramkund, Gate 2, Medical Camp, Nashik Road, Panchavati.
- Destination/activity intent: food, snan, toilet, medical help, rest, shopping, bus, parking, meeting point.
- Origin: state, district, village, language.
- Relation: son, daughter, husband, wife, mother, father, group leader.
- Item clues: bag, phone, wallet, medicine, ID card.

Searchable records:

- Missing-person reports.
- Found-person reports.
- Crowd sightings.
- Camera notes.
- Tag scans.
- Lost/found item reports.
- Separation incidents.
- Known-person and group records.

Ranking should combine:

```text
semanticTextScore
+ structuredFieldMatch
+ spatialCellMatch
+ timeWindowMatch
+ destinationIntentMatch
+ relationshipHintMatch
+ sourceTrustWeight
+ activeIncidentBoost
```

MVP implementation can be deterministic:

- Token normalization.
- Synonym map.
- Color and clothing dictionaries.
- Time parser for simple phrases.
- Location alias map.
- Fuzzy token matching.
- Field-level scoring.

Future implementation can add embeddings or an LLM parser, but the demo should not depend on a remote AI service.

MVP features:

- Global search bar in the Lost & Found console.
- Parsed-query preview: "red shirt", "since 2 PM", "Ramkund".
- Ranked results across reports, sightings, incidents, and items.
- Reason badges: "same color", "same cell", "within 20 minutes", "mentions son Ramesh".
- One-click action: open case, link as evidence, create new report from query, or merge candidate.

Out of scope for MVP:

- Full multilingual semantic search.
- Live speech-to-search.
- Vector database.
- Remote embedding service.

### 5. Spatial Graph And Nashik Cell System

Purpose: represent the event as bounded search cells and movement corridors.

Core concepts:

```text
SearchCell {
  id
  name
  type                 // ghat | temple | gate | transit | parking | outbound_corridor
  nodeIds[]
  entryNodeIds[]
  exitNodeIds[]
  attractorNodeIds[]
  volunteerStagingNodeIds[]
  cameraIds[]
}
```

MVP Nashik cells:

- Ramkund / Panchavati / Godavari ghat cell.
- Trimbakeshwar / Kushavart Kund cell.
- Sadhugram gate cell.
- Nashik Road transfer cell.
- CBS / Thakkar Bazaar transfer cell.
- Adgaon / Trimbak Road / Dindori Road / Madsangvi outbound cells.

MVP features:

- Seeded graph nodes and edges.
- Cell lookup from last-seen location.
- Exit list for each cell.
- Attractor list for each cell.
- Neighbor/spillover cell list.

Out of scope for MVP:

- Live authority GIS updates.
- Real-time road closures.
- Full Overpass ingestion pipeline.

### 6. Search Compression Engine

Purpose: compute where to look first.

Inputs:

- Verified case.
- Search cell.
- Last-seen node and time.
- Intended destination and activity.
- Lost behavior profile.
- Current time.
- Walkable graph.
- Crowd-flow direction.
- Attractor nodes.
- Destination-specific nodes such as food stalls, ghats, toilets, medical camps, parking, bus stands, and meeting points.
- Exit nodes.
- Signal observations.

Outputs:

```text
SearchPrediction {
  caseId
  originNodeId
  searchCellId
  elapsedMinutes
  containmentConfidence
  rankedAreasOfInterest[]
  rankedAttractors[]
  rankedExitRisks[]
  reachableNodes[]
  suggestedVolunteerTasks[]
  suggestedCameraTasks[]
}
```

MVP features:

- Compute elapsed time.
- Compute reachable nodes along graph edges.
- Use intended destination/activity to rank Areas of Interest inside the reachable graph.
- Use behavior profile to reshape area priorities and exit risk.
- Rank attractors: medical, water, toilets, seating, help desks, ghats, police.
- Rank exits by distance, flow direction, and transfer risk.
- Calculate containment confidence.
- Suggest volunteer and camera tasks.

Destination-aware Area of Interest logic:

```text
if intendedActivity = food:
  boost food stalls, langar/bhandara points, dining tents, water points, shaded seating

if intendedActivity = snan:
  boost ghats, river approaches, queue lanes, changing areas, bridge approaches

if intendedActivity = toilet:
  boost toilets, wash areas, water points, nearby help desks

if intendedActivity = medical:
  boost medical camps, ambulances, first-aid booths, shaded rest areas

if intendedActivity = transport:
  boost parking, bus stands, railway approaches, shuttle points, exit gates

if intendedActivity = meeting_point:
  boost original meeting point, help desks, PA points, landmarks, police booths
```

The engine should combine reachable radius with destination intent:

```text
areaOfInterestScore =
  reachabilityScore
  + destinationIntentScore
  + behaviorProfileScore
  + attractorScore
  + flowAlignmentScore
  + signalSupportScore
  - safetyRiskPenalty
```

Behavior-aware scoring:

```text
if lostBehaviorProfile = waits_where_lost:
  boost lastSeenNode, adjacent safe nodes, shade, seating, nearby help desk
  reduce far exit scores unless sightings support them

if lostBehaviorProfile = goes_to_help_desk:
  boost help desks, police booths, PA points, medical camps, official signage

if lostBehaviorProfile = follows_crowd:
  boost dominant crowd-flow paths and downstream nodes
  watch high-flow exits earlier

if lostBehaviorProfile = returns_to_bus:
  boost bus stands, parking, shuttle points, group camp, transport exits
  reduce containment confidence faster

if lostBehaviorProfile = searches_for_family:
  boost original route, last family location, meeting point, landmarks

if lostBehaviorProfile = goes_to_destination:
  boost intendedDestination and intendedActivity nodes

if lostBehaviorProfile = likely_to_panic:
  boost nearby official staff points, medical/help desks, low-risk containment areas
  avoid over-weighting long planned routes
```

Example:

> Missing elderly man last seen near Ramkund at 2 PM. Family was going for food near Gate 2. The engine should prioritize reachable food stalls and seating/water points along the Ramkund -> Gate 2 route before generic nearby nodes.

Behavior example:

> Missing adult came by bus and family says he usually returns to the bus if separated. Astra should raise transport-exit risk and prioritize shuttle points, bus stands, parking, and the group's camp over generic ghat attractors.

Out of scope for MVP:

- Real crowd-flow ingestion.
- Probabilistic simulation.
- Optimization across hundreds of teams.

### 7. Signal Fusion And Cluster Of Attention System

Purpose: turn many messy signals into actionable spatial confidence.

Signals:

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

MVP features:

- Add observations to a case.
- Score signal trust by source role.
- Group nearby, compatible signals into a Cluster of Attention.
- Use negative signals such as exit clearance to improve containment.
- Show cluster confidence and recommended action.

Out of scope for MVP:

- Real public mobile app.
- Real geofenced push delivery.
- High-volume spam prevention.

### 8. Relationship-Aware Match Engine

Purpose: identify a missing/found person and connect them to family, companions, or known people.

This extends the search algorithm beyond "match a missing case to a found person." Astra should also ask:

> Who is likely connected to this person, based on identity, origin, group, route, and co-location?

This is especially important when:

- A found person cannot speak clearly.
- The person has no tag.
- The person does not know a phone number.
- Two people are reporting each other missing.
- A found item provides a clue but not full identity.
- Multiple families from the same village/camp/vehicle are moving together.

#### Candidate Relationship Types

```text
guardian
spouse
child
parent
sibling
travel_companion
same_group_member
same_camp_member
same_vehicle_member
same_village_or_district
reporter
found_with_item_owner
unknown_possible_contact
```

#### Relationship-Aware Search Inputs

- Direct identity: tag ID, name, phone/contact, photo ref, age band, gender.
- Origin identity: state, district, village, language, camp, lodging, travel group, bus/vehicle, organizer.
- Spatial identity: last-seen cell, current found cell, nearby sightings, same route, same transfer node.
- Temporal identity: reports within the same time window, separation time, arrival/departure time.
- Social identity: reporter names, companion names, reciprocal reports, known group contacts.
- Object clues: found phone, bag, ID, medicine, ticket, receipt, religious item.

#### Scoring Model

The match engine should produce two ranked lists:

1. **Person match candidates** - "Who might this found/missing person be?"
2. **Known-contact candidates** - "Who nearby or in the registry might know this person?"

Score components:

```text
identityScore =
  tagMatch
  + nameSimilarity
  + phoneOrContactMatch
  + ageGenderLanguageCompatibility

relationshipScore =
  companionNameMatch
  + reciprocalReportMatch
  + sameFamilyOrTagGroup
  + sameTravelGroupOrCamp
  + sameVillageDistrictLanguage

spatialScore =
  sameSearchCell
  + adjacentSearchCell
  + sameRouteOrCorridor
  + coLocatedWithinTimeWindow
  + sharedClusterOfAttention

evidenceScore =
  officialReportWeight
  + cameraConfirmationWeight
  + tagScanWeight
  + itemClueWeight
  + multipleIndependentSignals

finalScore =
  identityScore * 0.35
  + relationshipScore * 0.25
  + spatialScore * 0.25
  + evidenceScore * 0.15
```

Weights can be tuned, but the principle matters: **same place and known relationship can be as valuable as a weak name match.**

#### Example: Found Elderly Person With No Tag

Input:

- Found elderly woman at Medical Camp B.
- Speaks Maithili.
- Says "Patna" and "son Ramesh."
- No tag.
- Found near Ramkund/Panchavati cell.

Astra ranks:

1. Missing report for elderly woman from Bihar/Patna, last seen Ramkund, reporter Ramesh.
2. Nearby report from a family group from Bihar whose mother separated near Godavari ghat.
3. Known travel group/camp from Bihar currently assigned to Panchavati help desk.

Recommended action:

> Keep person at Medical Camp B. Notify Panchavati Help Desk and reporter Ramesh. Ask Bihar/Patna group contact to verify.

#### Example: Person Found Before Family Reports

Input:

- Medical staff logs an unidentified elderly man at Water ATM 2.
- No missing report exists yet.
- He mentions village, camp, or bus group.

Astra should:

- Create found-person case.
- Search registry for known groups, recent arrivals, item reports, and nearby family contacts.
- Notify official staff in the same cell.
- Wait for or prompt matching missing report.
- If later a family reports similar person, merge into one incident.

#### MVP Features

- Rank missing/found cases against each other.
- Rank possible known contacts or groups for a found person.
- Show match reasons in plain language.
- Support reciprocal separation incidents.
- Use same/nearby location as a major signal.
- Use item clues as weak relationship signals.

Out of scope for MVP:

- Real face recognition.
- Real NLP transliteration across all Indian languages.
- Real group pre-registration at scale.
- Automated public disclosure of family contacts.

### 9. Notification And Tasking System

Purpose: tell the right people what to do.

MVP features:

- Mock radius notifications.
- Staff task cards.
- Volunteer task cards.
- Camera task cards.
- Exit watch requests.
- Rendezvous-point notifications for separation incidents.
- Item-owner or help-desk notification for item cases.

Out of scope for MVP:

- Real SMS.
- Real push notifications.
- WhatsApp integration.
- Live dispatch integration.

### 10. Camera Review System

Purpose: use cameras as targeted verification, not mass surveillance.

MVP features:

- Show cameras covering a ranked node or exit.
- Add camera note to a case.
- Confirm/reject a sighting cluster.
- Mock visual escalation with operator authorization.

Out of scope for MVP:

- Live camera feeds.
- Real biometric matching.
- Automatic person re-identification.

### 11. Audit And Timeline System

Purpose: preserve operational memory.

MVP features:

- Append-only events for report creation, verification, prediction, notification, sighting, merge, tasking, located, reunited.
- Timeline visible in case detail.
- Actor and role on every event.
- Reason text for major recommendations.

Out of scope for MVP:

- Tamper-proof backend storage.
- Exportable legal case packets.

## MVP Console Features

### Must Build

- Lost & Found console route/view.
- Active incident list with priority and status.
- Quick report intake.
- Verification panel.
- Registry search and duplicate detection.
- Semantic search bar for natural-language report lookup.
- Reciprocal separation incident detection.
- Lost/found item basic reporting.
- Map or map-like panel with search cells, last-known node, exits, attractors, and clusters.
- Search prediction panel with containment confidence.
- Cluster of Attention panel.
- Relationship-aware match panel.
- Task panel for volunteers, cameras, exits, and rendezvous points.
- Event timeline.
- Seeded end-to-end demo data.

### Should Build If Time Allows

- Public sighting simulation.
- Camera note simulation.
- Tag scan simulation.
- Item clue linking.
- Multiple Nashik search cells.
- Role-based UI filtering.
- Parsed-query preview and "create report from search" action.
- Simple metric dashboard: open, verified, located, reunited, containment.

### Defer

- Real backend.
- Auth.
- Real-time feeds.
- Live camera streams.
- Face recognition.
- Telecom integration.
- Real public notifications.
- Multilingual voice intake.
- Full OpenStreetMap ingestion.

## MVP Demo Scenarios

### Scenario 1 - Missing Elderly Person, Search Compression

1. Official staff files quick report near Ramkund.
2. Control room verifies.
3. Engine identifies Ramkund/Panchavati search cell.
4. Search prediction ranks Medical Camp, Water ATM, Seating Zone, and ghat exits.
5. Notifications/tasks go to nearby staff.
6. Crowd sighting and camera note create Cluster of Attention.
7. Volunteer locates person.
8. Family confirms.
9. Timeline closes as reunited.

### Scenario 2 - Found Person, Relationship-Aware Match

1. Medical staff logs unidentified elderly person at Water ATM 2.
2. No tag is present.
3. Found person mentions district/language/relative name.
4. Relationship-aware engine ranks likely family reports, travel groups, and nearby known contacts.
5. Operator notifies the highest-ranked help desk/family contact.
6. Family confirms and case closes.

### Scenario 3 - Reciprocal Separation

1. Person A reports Person B missing near Panchavati.
2. Person B reports Person A missing at another desk.
3. Registry flags reciprocal evidence.
4. Operator links reports into SeparationIncident.
5. System assigns safe rendezvous at Panchavati Help Desk.
6. Both sides are guided there.
7. Case closes as reunited without expanding two separate searches.

### Scenario 4 - Lost Item As Clue

1. Volunteer logs found bag near Gate 2.
2. Bag contains medicine and a tag/card.
3. Registry links item to a provisional missing-person case.
4. Search engine treats Gate 2 as a clue and updates exit-breach risk.
5. Medical/help-desk staff are notified.

### Scenario 5 - Semantic Search

1. Operator searches: "elderly man red shirt missing since 2 PM from Ramkund."
2. Search system extracts age/person type, red clothing, time, and Ramkund/Panchavati cell.
3. Results rank matching missing reports, crowd sightings, camera notes, and found-person cases.
4. Operator opens the top result and links a nearby sighting as evidence.
5. Search prediction updates the Cluster of Attention.

## Build Order Recommendation

1. Data model and seeded Reunite dataset.
2. Registry and incident graph.
3. Semantic report search.
4. Verification state machine.
5. Spatial cell model and search compression engine.
6. Relationship-aware match engine.
7. Signal fusion and Cluster of Attention.
8. Console UI.
9. Mock notifications, camera notes, tag scans, and item clues.
10. Demo scenarios and tests.

## Testing Requirements

Unit tests:

- Verification transitions.
- Duplicate report merge.
- Reciprocal separation detection.
- Lost/found item linking.
- Semantic query parsing.
- Semantic report ranking.
- Search cell lookup.
- Reachable node calculation.
- Attractor ranking.
- Exit-risk ranking.
- Containment confidence.
- Relationship-aware match scoring.
- Cluster of Attention creation.

Browser smoke tests:

- Create and verify missing report.
- Generate search prediction.
- Add crowd sighting and camera note.
- Create Cluster of Attention.
- Resolve case as reunited.
- Run reciprocal separation scenario.
- Run found-person relationship match scenario.

## MVP Definition

The MVP is complete when a judge can see:

1. A verified report becomes a bounded Nashik search cell.
2. The system shows where to search, which exits to watch, and why.
3. Crowd/camera/tag/item signals update the search.
4. A found person can be connected to family or known people without relying on face recognition.
5. Duplicate and reciprocal reports are handled cleanly.
6. Every action is visible in an operational timeline.
