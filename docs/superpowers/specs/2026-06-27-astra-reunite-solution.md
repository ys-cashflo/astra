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
- Cross-center registry.
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
3. Official staff or control room verifies the case.
4. Spatial engine computes search radius, drift cone, and containment confidence.
5. Radius notifications go to nearby staff, volunteers, CCTV operators, and selected public users.
6. Exit and perimeter nodes are monitored first.
7. Crowd sightings, tag scans, volunteer checks, and camera notes flow back into Astra.
8. Astra forms or updates Clusters of Attention.
9. Volunteers are redirected to the highest-confidence cluster or exit risk.
10. Person is located.
11. Identity is confirmed through tag, family, staff, or operator review.
12. Case is marked reunited.
13. Full event trail is preserved for accountability and learning.
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
