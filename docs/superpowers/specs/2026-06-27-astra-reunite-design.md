# Astra Reunite - Missing-Person Search And Reunification Design

Date: 2026-06-27
Project: Astra Spatial Intelligence Platform
Event: Claude Impact Lab, Mumbai 2026 - Missing Persons at Simhastha Kumbh Mela 2027 (Nashik-Trimbakeshwar)
Scope: Design-and-demo MVP for a runnable, deterministic lost-and-found console over the existing Astra Spatial Knowledge Graph

## Objective

Build Astra Reunite: a missing-person command console that uses the Spatial Knowledge Graph (SKG) to predict where a vulnerable missing person is likely to be, recommend the next search action, and preserve an audited reunification trail.

This is not a generic lost-and-found app. The obvious hackathon build is "upload photo, face-match cameras, found." Astra should win by doing what a standalone app cannot do: reason over place, time, crowd flow, chokepoints, rest points, sensors, and operational actions in one graph.

The demo should communicate one clear story:

> A 74-year-old is reported missing near Sangam Ghat. Astra starts from the last wristband scan, projects a likelihood-graded drift cone through the crowd-flow graph, ranks rest points such as a Water ATM and Medical Camp, auto-tasks the cameras covering those nodes, recommends a volunteer search node, gates visual matching behind operator authorization, receives a wristband re-scan, and logs the reunion end to end.

The emotional claim is reunification. The technical claim is prediction plus accountable action over the SKG.

## Design Principles

1. **Differentiate through the platform.** Keep only the capabilities that are structurally enabled by Astra's SKG and flow engine. Anything a standalone registry app could do just as well is support, not the headline.
2. **Predictive before reactive.** The system should not wait for a camera hit. It should estimate where to search next from last-known location, elapsed time, route topology, and crowd movement.
3. **Privacy-safe by default.** Default matching uses an issued wristband token, case attributes, and spatial context. It never requires a face.
4. **Human-in-loop escalation.** Visual matching is disabled by default, scoped to the predicted search cone, operator-authorized, mocked in the MVP, and logged as an auditable escalation.
5. **Extensible by ontology.** Reunite is another Observe -> Predict -> Recommend -> Act loop over the same graph, not a separate product. Airports, disaster camps, railway stations, and pilgrim gatherings should change the graph data, not the engine shape.

## Problem Framing

The current lost-and-found gap has two layers.

The first layer is the cross-center registry problem: a person found at Center A may be invisible to a family searching at Center B. The existing registry-and-match cascade remains necessary.

The second layer is the search-time problem: when a vulnerable adult is missing in a dense crowd, minutes matter and the most valuable question is often not "who do they look like?" but "where are they likely to have drifted?" Astra should treat reunification as a spatial prediction problem:

```text
Report -> Predict Search Cone -> Task Sensors/Volunteers -> Locate -> Reunite -> Learn
```

That framing ties directly to Astra's broader thesis. The same SKG that predicts crowd pressure can also predict the likely dispersion of a missing person through that crowd. The missing-person module therefore becomes a proof that Astra is a general operational intelligence platform, not only a crowd-density dashboard.

## What The Data Tells Us

The provided `data/` files still matter and should drive the demo constraints.

### Synthetic_Missing_Persons_2500.csv

- 2,500 synthetic records across 10 centers.
- 86.0% Reunited, 8.4% Pending, 2.9% Transferred to hospital, 2.7% Unresolved.
- Vulnerability skews old: age 61-70 = 27.9%, 71-80 = 21.3%, 80+ = 9.0%. Roughly 58% are 61+.
- Identity keys are incomplete: 14.8% have no name, 19.7% have no reporter mobile.
- 8.1% are labelled cross-center duplicates. About 85% of those carry name or mobile and are catchable by deterministic keys; the remaining tail needs fuzzy identity plus spatial context.
- Report volume spikes on Amrit Snan days.
- Resolution baseline is median 2.7 hours, mean 4.0 hours, max 28.9 hours.

### Geography and sensor files

- `Zone_Boundaries.csv` provides administrative zones and centroids.
- `CCTV_Locations.csv` provides 1,280 cameras across 32 zones.
- `Police_Stations.csv` provides 14 real help points.
- `Chokepoints_Parking.csv` provides 85 transfer nodes, chokepoints, and parking locations.

For the improved Reunite design, these are not just map overlays. They become graph nodes, sensor coverage, attractor points, and volunteer dispatch anchors.

### Physical description is a decoy field

`physical_description` is deliberately excluded from automatic matching:

- Only 24 distinct templated strings appear across all 2,500 records.
- About 30% contradict the record's own gender.

The demo should say this plainly. Astra improves precision by refusing a noisy field, not by pretending every available attribute is useful.

## Research Grounding

The research posture stays conservative:

- The real Kumbh lost-and-found model is symmetric intake: both lost reports and found-person reports are recorded, searched, announced, and reconciled.
- Facial-recognition reunification claims from Maha Kumbh 2025 did not survive verification. Face search can be an escalation path, not the default foundation.
- Dense-crowd re-identification is weak when based on appearance alone; context, motion, social pattern, and environment improve accuracy.
- The 29 January 2025 crowd crush showed that sensing is not enough. The missing layer is coordinated action with an accountable event trail.
- DPDP Act 2023 Section 7 gives a lawful emergency-assistance basis for processing personal data during disaster or public-order breakdown, but biometric processing should still be treated as sensitive and minimized.

Positioning: Astra Reunite is the intelligence layer between intake and rescue. It uses the graph to narrow the search, keeps identity-sensitive tools scoped and auditable, and records the operational memory needed for after-action accountability.

## Architecture

The MVP remains dependency-light and local-first, matching the existing Astra app shape. It should run from deterministic seed data with no live feeds, backend, or build step.

New route/screen:

- `lost-and-found` - a standalone command-center console, separate from the crowd-flow map screen, but importing the same SKG node, edge, sensor, and event concepts.

New modules under `src/reunite/`:

| Module | Purpose | Depends on |
|---|---|---|
| `seedData.js` | Deterministic lost cases, found cases, wristband scans, and demo events | Local static data |
| `registry.js` | Unified lost/found registry, dedupe helpers, and cross-center candidate search | `seedData.js` |
| `findEngine.js` | Pure graph reasoner that emits ranked search predictions | SKG nodes, edges, sensors, cases, scans |
| `caseState.js` | Case lifecycle transitions and immutable event creation | `registry.js` |
| `visualEscalation.js` | Mocked, scoped, operator-authorized visual-match escalation | `findEngine.js`, `caseState.js` |
| `view.js` | Lost & Found console UI: case list, map overlays, detail panel, actions | All modules above plus existing app shell |

No changes should be required in the crowd-flow code path beyond exporting or reusing the shared graph-like data shapes. Reunite is an additional reasoner over the SKG, not a rewrite of the crowd MVP.

## SKG Extension

Reunite adds new entity types to the future SKG shape.

```text
LostPersonCase {
  id
  subjectName
  age
  description
  photoRef
  wristbandId
  reportedByName
  reportedAtNodeId
  reportedAt
  lastScanNodeId
  lastScanAt
  priority              // low | medium | high | critical
  status                // open | searching | located | reunited | escalated
  searchPredictionId
  assignedVolunteerTeam
}

FoundPersonCase {
  id
  foundAtNodeId
  foundAt
  wristbandId
  description
  matchedCaseId
  status                // open | matched | handed_over | closed
}

WristbandScan {
  id
  wristbandId
  nodeId
  timestamp
  scannerType           // gate | booth | patrol
}

SearchPrediction {
  id
  caseId
  originNodeId
  elapsedMinutes
  rankedZones[]         // { nodeId, likelihood, etaWalkSeconds, reasonCodes[] }
  taskedCameraIds[]
  suggestedVolunteerNodeId
  generatedAt
}

ReuniteEvent {
  id
  caseId
  type                  // report_created | prediction_generated | camera_tasked | volunteer_suggested | visual_escalated | wristband_rescanned | located | reunited
  actor                 // system | operator | volunteer | scanner
  timestamp
  payload
}
```

The event log is append-only. Every state change writes a `ReuniteEvent` so the console can show the same operational-memory story as the core Astra dashboard.

## Find Engine

`findEngine.js` is the differentiator. It is a deterministic, pure-function reasoner over the graph.

Inputs:

- SKG nodes with `nodeId`, coordinates, type, capacity, and optional `attractorType`.
- Flow edges with distance, direction, and crowd-flow strength.
- Sensors/cameras with observed node IDs.
- Lost case with last scan or report location.
- Current timestamp.
- Tunable options such as drift speed, attractor weights, and search horizon.

Algorithm:

1. **Choose origin.** Use `lastScanNodeId` if present; otherwise use `reportedAtNodeId`.
2. **Compute elapsed time.** Use `now - lastScanAt` or `now - reportedAt`.
3. **Set reachable radius.** Default vulnerable-adult drift speed is `0.6 m/s * elapsedMinutes`. This is an operational prior, not a medical claim. Future profiles can tune speed by age, mobility, crowd density, and terrain.
4. **Walk the graph.** Traverse outward over flow edges within the reachable radius. Directed flow edges are favored when they align with dominant crowd movement.
5. **Score each reachable node.** Combine:
   - Distance decay from origin.
   - Alignment with dominant crowd-flow direction.
   - Attractor bonus for rest and help points such as ghats, medical camps, water ATMs, toilets, seating, police desks, shaded areas, and lost-and-found booths.
   - Safety/risk adjustment so search recommendations do not send volunteers into crush-risk nodes without warning.
6. **Task sensors.** Select cameras and drones covering the highest-likelihood nodes.
7. **Suggest field action.** Choose a volunteer search node with high likelihood, manageable risk, and good coverage.
8. **Emit prediction.** Return a `SearchPrediction` with ranked zones, tasked cameras, ETA estimates, and reason codes.

The elderly drift model should be visible in the UI: slow movement, flow-following drift, and pooling around rest/help attractors. That gives the demo a humane, plausible operational model instead of a generic "AI found them" claim.

## Registry And Matching

The unified registry remains the baseline service underneath the predictive console.

Given a lost or found report, `registry.js` ranks opposite-type candidates through a cascade:

1. **Deterministic identity.** Exact wristband token, exact mobile, or exact normalized name plus compatible age band.
2. **Fuzzy identity.** Name similarity, age band, gender compatibility, language, and reporting context.
3. **Spatial-temporal context.** Zone proximity, time-window overlap, chokepoint plausibility, and search-prediction overlap.

Wristband match is the preferred high-confidence path. A wristband re-scan inside the prediction cone can mark a case `located` without any biometric processing.

The cascade should produce plain-language reasons:

- "Same wristband token scanned at Medical Camp B."
- "Same mobile number on file across two centers."
- "Same age band, same language, and both reports near Ramkund within 40 minutes."
- "No identity key match; prediction overlap only. Operator review required."

## Console UI

The screen should feel like an operational console, not a marketing page.

```text
+----------------------------------------------------------------+
| Lost & Found Console | Open cases | Located | Reunited | SLA    |
+----------------------+-------------------------------+---------+
| Active cases         | Real map                      | Case    |
| priority sorted      | last-known pin                | detail  |
|                      | likelihood drift cone         | card    |
| + New Report         | tasked cameras highlighted    | timeline|
|                      | suggested volunteer node      | actions |
+----------------------+-------------------------------+---------+
| Intake modal when needed | Reunification log / event stream     |
+----------------------------------------------------------------+
```

Core states:

- **Active case list.** Priority sorted by vulnerability, elapsed time, and whether the person is near a crush-risk zone.
- **Map.** Last-known pin, shaded drift cone, likelihood-ranked nodes, tasked cameras, and suggested volunteer node.
- **Case detail.** Subject card, wristband status, last scan, ranked zones, current action, and immutable timeline.
- **Intake modal.** Report lost/found case, validate required fields, optionally attach wristband token.
- **Actions.** Start search, mark located, confirm reunited, and gated visual escalation.

The map should render the drift cone as the main visual proof. The case panel should explain the recommendation with reason codes rather than generic confidence theater.

## Case Lifecycle

```text
Report -> Searching -> Located -> Reunited
                 \-> Escalated -> Located -> Reunited
```

Transitions:

- **Report.** Intake creates a lost or found case and writes `report_created`.
- **Searching.** The find engine runs, cameras are tasked, volunteer node is suggested, and `prediction_generated` events are written.
- **Escalated.** Operator authorizes visual matching for a high-priority case; scope and actor are logged.
- **Located.** A wristband re-scan, found-case match, or operator confirmation locates the person.
- **Reunited.** Operator confirms handover and closes the case with reunion notes.

Invalid transitions should be rejected. For example, an `open` case cannot be marked `reunited` without first being `located`, and a `reunited` case cannot be escalated.

## Biometric Escalation Gate

The MVP does not build real face recognition. It demonstrates the governance shape around a sensitive capability.

Default:

- Visual matching is off.
- The button is disabled unless the case is high priority or critical, the search prediction exists, and an operator is present.

On click:

1. Show a confirm step that explains the scope: only cameras covering the current drift cone will be queried.
2. Require an operator authorization action.
3. Log `visual_escalated` with actor, timestamp, case ID, prediction ID, camera scope, and reason.
4. Return deterministic mocked candidates, such as "possible match near Medical Camp B, camera-sangam-ghat, 0.74 confidence."
5. Require wristband re-scan or operator confirmation before `located`.

This keeps the demo AI-native without making a reckless biometric claim. The important product point is scoped, audited escalation, not the facial model itself.

## Demo Story

Seed one deterministic end-to-end scenario:

1. A 74-year-old pilgrim is reported missing at Sangam Ghat 18 minutes ago.
2. Last wristband scan was at Entry Gate.
3. The engine projects the drift cone toward ghat-area rest points.
4. Water ATM and Medical Camp rank highest because they are reachable, aligned with crowd flow, and strong attractors for disoriented elderly pilgrims.
5. The system tasks `camera-sangam-ghat` and `drone-sangam-area`.
6. The console suggests Volunteer Team 3 search Medical Camp B first.
7. Operator escalates visual match; the mocked result flags a candidate near Medical Camp B.
8. A patrol scanner records the wristband at Medical Camp B.
9. Operator marks the case reunited.
10. Timeline shows report, prediction, camera tasking, escalation, re-scan, located, and reunited events.

The demo moment should make the judge think: "This is not a database search. This is command intelligence."

## Testing

Unit tests:

- `findEngine.js`
  - Uses last scan before report location.
  - Computes drift radius from elapsed time and speed.
  - Excludes unreachable nodes outside radius.
  - Favors nodes aligned with dominant flow.
  - Applies attractor bonus for medical, water, rest, toilet, and help nodes.
  - Selects cameras observing top-ranked nodes.
  - Emits stable, deterministic rankings.
- `caseState.js`
  - Allows valid lifecycle transitions.
  - Rejects invalid transitions.
  - Writes immutable events on every transition.
- `registry.js`
  - Exact wristband match outranks fuzzy matches.
  - No-name/no-mobile cases can still rank by spatial-temporal context.
  - `physical_description` is not used as an automatic match signal.
- Intake validation
  - Requires enough location/time context to start a search.
  - Accepts optional wristband ID.
  - Handles found-person reports with unknown identity.

Browser smoke test:

- Load the Lost & Found console.
- Select the seeded high-priority case.
- Confirm the map shows last-known pin, drift cone, tasked cameras, suggested volunteer node, and timeline.
- Run the escalation path and reunite the case without console errors.

Visual QA:

- Capture desktop screenshot showing the cone, highlighted cameras, active case detail, and reunited timeline.

## Success Metrics

Demo metrics:

- Search prediction generated in one click from last-known scan.
- Ranked zones explain why the Medical Camp and Water ATM beat generic nearby nodes.
- Operator can complete Report -> Searching -> Escalated -> Located -> Reunited in the console.
- Every transition is visible in the event timeline.

Product metrics to pitch:

- Reduce time-to-first-search-zone against the 2.7 hour median resolution baseline.
- Increase cross-center duplicate recall through unified registry matching.
- Minimize biometric use by resolving wristband-token cases first.
- Preserve a complete Observation -> Prediction -> Recommendation -> Action -> Outcome record.

## Scope

In scope for the MVP:

- Standalone `lost-and-found` console view.
- Seeded deterministic lost cases, found cases, and wristband scans.
- Pure `findEngine.js` with elderly drift model and attractor scoring.
- Unified registry and simple lost/found matching cascade.
- Shaded drift cone, last-known pin, ranked zones, tasked sensors, and case timeline.
- Mocked but gated biometric escalation.
- Unit tests and browser smoke test.

Out of scope for the MVP:

- Real face recognition.
- Live CCTV feeds.
- Live wristband hardware.
- Telecom or phone location.
- Real dispatch integration.
- Authentication and permissions beyond mocked operator authorization.
- Backend persistence.
- Multi-event scale.

Pitch-only future expansions:

- Consent-gated photo matching with privacy-preserving embeddings.
- Voice/vision intake for non-literate users and multilingual reporters.
- Family group pre-registration with opt-in wristband linking.
- Separation-risk detection before a report is filed.
- Surge-aware lost-and-found staffing and help-desk placement.
- Disaster-camp, airport, railway-station, and pilgrimage-site graph packs.

## Alignment With Astra

Astra Reunite should be presented as the second proof of the platform:

- Crowd Flow predicts risk over people moving through space.
- Reunite predicts likely search zones for a vulnerable person moving through the same space.

Both use the same loop:

```text
Observe -> Understand -> Predict -> Recommend -> Act -> Learn
```

The core platform asset is the SKG: nodes, edges, sensors, observations, predictions, recommendations, actions, outcomes, and events. Reunite adds new entity types and a new reasoner, but it does not fork the product.

## Implementation Notes For The Next Plan

The implementation plan should build in this order:

1. Seed data and graph-compatible entities.
2. Pure find engine with tests.
3. Case state machine and event log with tests.
4. Registry matching support with tests.
5. Lost & Found console UI and map overlays.
6. Mocked biometric escalation gate.
7. Browser smoke test and screenshot verification.

Do not start with the visual escalation. The winning demo rests on the prediction cone and the audited action trail; the escalation is a governed add-on.
