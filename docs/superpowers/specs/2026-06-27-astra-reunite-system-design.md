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

- Quick report form with person type, age band, clothing, last-seen location, last-seen time, reporter role/contact, optional photo ref, optional tag ID.
- Found-person form with current location, approximate description, communication status, and optional tag/item/photo ref.
- Lost/found item form with category, location, description, and linked person/case if known.
- Input role label: public, family, volunteer, police, medical, support, camera operator, control room.

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

### 4. Spatial Graph And Nashik Cell System

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

### 5. Search Compression Engine

Purpose: compute where to look first.

Inputs:

- Verified case.
- Search cell.
- Last-seen node and time.
- Current time.
- Walkable graph.
- Crowd-flow direction.
- Attractor nodes.
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
- Rank attractors: medical, water, toilets, seating, help desks, ghats, police.
- Rank exits by distance, flow direction, and transfer risk.
- Calculate containment confidence.
- Suggest volunteer and camera tasks.

Out of scope for MVP:

- Real crowd-flow ingestion.
- Probabilistic simulation.
- Optimization across hundreds of teams.

### 6. Signal Fusion And Cluster Of Attention System

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

### 7. Relationship-Aware Match Engine

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

### 8. Notification And Tasking System

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

### 9. Camera Review System

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

### 10. Audit And Timeline System

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

## Build Order Recommendation

1. Data model and seeded Reunite dataset.
2. Registry and incident graph.
3. Verification state machine.
4. Spatial cell model and search compression engine.
5. Relationship-aware match engine.
6. Signal fusion and Cluster of Attention.
7. Console UI.
8. Mock notifications, camera notes, tag scans, and item clues.
9. Demo scenarios and tests.

## Testing Requirements

Unit tests:

- Verification transitions.
- Duplicate report merge.
- Reciprocal separation detection.
- Lost/found item linking.
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
