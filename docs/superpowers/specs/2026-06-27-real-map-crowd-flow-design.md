# Real-Map Crowd Flow Intelligence Design

Date: 2026-06-27
Project: Astra Spatial Intelligence Platform
Scope: One-day MVP UI upgrade for Kumbh Mela command-center demo

## Objective

Rebuild the current stylized digital-twin dashboard into a real geospatial operating view. The dashboard should show a real map, operational nodes, camera locations, movement between nodes, and red/yellow/green node status when risk changes.

The experience should communicate one clear story: command-center operators can see where people are moving, which node is becoming unsafe, which cameras observe it, and what action should be taken next.

## Recommended Approach

Use a browser map library with OpenStreetMap tiles for the central operating view. For the MVP, the node and camera coordinates will be seeded around the Prayagraj/Sangam event area and can later be replaced with real GPS or GIS data.

The UI should keep the visual strength of the original Crowd Flow Intelligence concept while improving the use case:

- Real map instead of a purely decorative map illustration.
- Privacy-safe aggregated crowd flow instead of person-level identity tracking.
- Operational nodes and cameras as first-class objects.
- Movement edges showing inflow, outflow, and diversion paths.
- Risk state visible directly on the map through node color.
- Actionable recommendations linked to the affected node.

## Layout

The dashboard will use a dense command-center layout inspired by the reference designs:

```text
+--------------------------------------------------------------------------------+
| Crowd Flow Intelligence / KPIs / Time / Scenario                               |
+----------------------+--------------------------------------+------------------+
| Operational Pipeline | Real Map: nodes, cameras, flows      | Metrics & Alerts |
| Camera Snapshots     | Selected risk node highlighted red   | Point Summary    |
+----------------------+--------------------------------------+------------------+
| Inflow / Outflow Chart                 | Timeline / AI Recommendation          |
+--------------------------------------------------------------------------------+
```

## Core UI Areas

### Header

The header should show the product identity and high-level mission KPIs:

- Total crowd estimate
- Core capacity usage
- Highest-risk node
- Active alerts
- Incidents
- Weather
- Current simulation time

### Real Map View

The central map should show OpenStreetMap tiles with operational overlays:

- Node markers for transport, entry, bridge, route, ghat, temple, medical, toilet, and exit points.
- Camera markers with camera IDs and coverage labels.
- Movement paths between nodes.
- Animated movement indicators along active paths.
- Emergency route highlighted in blue.
- Red/yellow/green marker states based on calculated risk.
- A selected node state for `Bridge-02`.

The MVP may use Leaflet from a CDN for the map library and OpenStreetMap tile URLs for the base layer. If network access is unavailable during demo, the UI should still degrade gracefully by showing a dark fallback grid/map panel with the same nodes and movement overlays.

### Nodes

Initial seeded nodes:

- Railway Station
- Bus Stand
- Parking Zone
- Entry Gate
- Bridge-02
- Route B
- Sangam Ghat
- River Safety Post
- Temple
- Medical Camp
- Toilet T2
- Water ATM
- Exit Route

Each node should contain:

- `id`
- `name`
- `type`
- `latitude`
- `longitude`
- `capacity`
- `currentPopulation`
- `predictedPopulation`
- `riskScore`
- `riskState`: stable, watch, strain, or critical

### Cameras

Initial seeded cameras:

- `CAM-14`: Bridge east approach
- `CAM-18`: Bridge exit ramp
- `CAM-22`: Entry gate queue
- `DRONE-03`: Sangam aerial

Each camera should contain:

- `id`
- `label`
- `latitude`
- `longitude`
- `observedNodeIds`
- `count`
- `confidence`
- `status`

Camera thumbnails should remain in the left panel so the demo still communicates the original AI/crowd-detection idea.

### Movement

Movement should be represented as graph edges:

- Railway Station -> Entry Gate
- Bus Stand -> Entry Gate
- Parking Zone -> Entry Gate
- Entry Gate -> Bridge-02
- Entry Gate -> Route B
- Bridge-02 -> Sangam Ghat
- Route B -> Sangam Ghat
- Sangam Ghat -> Temple
- Sangam Ghat -> Exit Route
- Sangam Ghat -> River Safety Post
- Sangam Ghat -> Toilet T2
- Sangam Ghat -> Water ATM
- Temple -> Medical Camp

Each edge should show:

- Direction
- Estimated flow per minute
- Distance label when available
- Risk styling when the downstream node is strained or critical
- Animated movement to show crowd direction

### Risk Behavior

Risk should be calculated from `currentPopulation / capacity` and projected crowd pressure.

Recommended states:

- Stable: below 60% capacity, green
- Watch: 60-74%, yellow-green
- Strain: 75-89%, amber
- Critical: 90% or above, red

When something goes wrong:

- The affected node turns red.
- The connected high-pressure edge becomes red or orange.
- The right panel changes to the affected node.
- The alert list explains the issue in operator language.
- The AI recommendation proposes the next operational action.

Example:

`Bridge-02 exceeded safe operating threshold. Divert 35% of Entry Gate flow to Route B for 8 minutes and keep the emergency lane open.`

## Alignment With Original Astra Vision

The map is not only a geographic display. It is the visible operating surface of Astra's Spatial Knowledge Graph.

The original product direction was:

```text
Observe -> Understand -> Predict -> Recommend -> Act -> Learn
```

The real-map MVP must preserve that loop. Every map element should answer at least one of these operational questions:

- Where is the entity?
- What is its current state?
- What observation updated it?
- How does movement flow through it?
- What risk is emerging?
- What action should operators take?

This keeps Astra aligned with its first principle: it is not another CCTV dashboard or crowd-counting screen. Camera analytics are only an input layer. The map should show how observations update the graph, how the graph predicts pressure, and how the system recommends an operational intervention.

## Required Map Intelligence

### 1. Operational Nodes

Operational nodes are the places authorities reason about and act on. They should appear as clickable markers on the map.

Required MVP nodes:

- Railway Station
- Bus Stand
- Parking Zone
- Entry Gate
- Bridge-02
- Route B
- Sangam Ghat
- Exit Route
- Medical Camp
- River Safety Post
- Toilet T2
- Water ATM

Each node should include:

- `id`
- `name`
- `type`
- `latitude`
- `longitude`
- `safeCapacity`
- `currentPopulation`
- `predictedPopulation15m`
- `riskScore`
- `riskState`
- `status`
- `priority`
- `connectedCameraIds`
- `recommendedActionId`

Node risk coloring:

- Stable: green, below 60% safe capacity
- Watch: yellow, 60-74% safe capacity
- Strain: orange, 75-89% safe capacity
- Critical: red, 90% or above safe capacity, blocked, or emergency reported

When anything goes wrong at a node, the node should turn red and become the selected operational focus.

### 2. Movement Paths

Movement paths are graph edges. They explain how crowd pressure travels through the event site.

Required MVP paths:

- Railway Station -> Entry Gate
- Bus Stand -> Entry Gate
- Parking Zone -> Entry Gate
- Entry Gate -> Bridge-02
- Entry Gate -> Route B
- Bridge-02 -> Sangam Ghat
- Route B -> Sangam Ghat
- Sangam Ghat -> Exit Route
- Sangam Ghat -> Medical Camp
- Sangam Ghat -> River Safety Post
- Sangam Ghat -> Toilet T2
- Sangam Ghat -> Water ATM

Each movement path should include:

- `id`
- `fromNodeId`
- `toNodeId`
- `distanceMeters`
- `walkingTimeSeconds`
- `currentFlowPerMinute`
- `safeFlowPerMinute`
- `predictedFlowPerMinute`
- `congestionScore`
- `riskScore`
- `status`
- `isEmergencyRoute`
- `isRecommendedDiversion`

Map behavior:

- Direction should be visible through arrows or animated movement pulses.
- High-pressure edges should become orange or red.
- Recommended diversion edges should be highlighted in blue.
- Blocked or restricted paths should show a clear warning state.

### 3. Camera And Sensor Locations

Cameras and sensors are observation sources. They should be shown separately from operational nodes so the viewer understands what is observed and where the observation came from.

Required MVP sensors:

- `camera-railway-exit`
- `camera-bus-exit`
- `camera-entry-gate`
- `camera-main-bridge`
- `camera-route-b`
- `camera-sangam-ghat`
- `drone-sangam-area`
- `manual-medical-report`
- `water-atm-status`

Each sensor should include:

- `id`
- `name`
- `type`: camera, drone, manual report, IoT, or service status
- `latitude`
- `longitude`
- `observedNodeIds`
- `latestObservationType`
- `latestObservedValue`
- `confidence`
- `status`: online, delayed, offline, or manual

Map behavior:

- Camera markers should use a different icon from node markers.
- Clicking a camera should show the node or nodes it observes.
- If a camera is delayed or offline, the marker should show degraded status.
- Camera thumbnails should remain in the side panel to connect the map to the original crowd-intelligence concept.

### 4. Risk And Alert Layer

The risk layer is what turns the map from a locator into an operations tool.

Risk should be derived from:

- Current crowd load
- Predicted 10-15 minute load
- Safe capacity
- Flow pressure on incoming edges
- Manual incidents or blocked route reports
- Facility pressure for medical, water, toilet, and river safety nodes

Required red-state behavior:

- The affected node marker turns red.
- The incoming or outgoing risky path becomes red/orange.
- The right-side inspector switches to the affected node.
- An alert card explains the cause in plain operator language.
- A recommendation appears with expected impact and confidence.

Example red-state copy:

```text
Bridge-02 is predicted to cross 94% safe capacity in 12 minutes.
Cause: high Entry Gate inflow during Amrit Snan window.
Action: divert 35% of crowd through Route B and deploy volunteers at Entry Gate.
Expected impact: reduce bridge congestion from 0.94 to 0.67.
```

### 5. Resource And Response Layer

The map should show enough operational resources to make recommendations believable.

Required MVP resources:

- Medical Camp
- River Safety Post
- Volunteer / police deployment point at Entry Gate
- Emergency access route
- Toilet T2
- Water ATM

Each resource should include:

- `id`
- `type`
- `location`
- `serviceStatus`
- `capacity`
- `currentPressure`
- `responseTimeMinutes`

Map behavior:

- Emergency access should be shown as a blue route.
- Resource pressure should affect the right panel and alerts when relevant.
- The MVP should not attempt full dispatch workflows; it only needs to show why a recommendation is operationally possible.

### 6. Recommendation And Action Layer

The map should close the loop from prediction to action.

Required MVP recommendations:

- Redirect crowd to Route B
- Temporarily meter Entry Gate inflow
- Deploy volunteers at Entry Gate
- Keep emergency lane open
- Notify medical or river safety team
- Activate public announcement

Each recommendation should include:

- `id`
- `type`
- `targetNodeId`
- `supportingPredictionId`
- `priority`
- `actionText`
- `communicationChannels`
- `expectedImpact`
- `confidence`
- `status`

The recommendation should be visible on the map through highlighted target nodes, highlighted diversion routes, and a right-side explanation panel.

## MVP Map Data Model

For the one-day MVP, the data can remain in local JavaScript modules or JSON-like objects. The important thing is that the fields match the future Spatial Knowledge Graph shape.

Minimum local data collections:

- `nodes`
- `edges`
- `sensors`
- `observations`
- `scenarioSteps`
- `predictions`
- `recommendations`
- `events`

The map should not depend on real-time feeds. Seeded deterministic data is the right choice for the demo because it keeps the story reliable and avoids fragile external integrations.

## MVP Map Story

The first map scenario should remain focused on one strong operational moment:

```text
Amrit Snan Morning Surge
```

Story sequence:

1. Railway, bus, and parking inflow rises during the ritual window.
2. Entry Gate pressure increases.
3. Most people choose the shortest route through Bridge-02.
4. The system predicts Bridge-02 will cross safe capacity within 12 minutes.
5. Bridge-02 turns red on the real map.
6. The incoming Entry Gate -> Bridge-02 path becomes risky.
7. Route B remains underused and is highlighted as the recommended diversion.
8. The system recommends diverting 35% of flow, deploying volunteers, and activating public announcements.
9. The expected impact shows congestion dropping from 0.94 to 0.67.

This is the strongest demo because it shows the complete Astra loop: observation, graph state, prediction, risk, recommendation, action, and expected impact.

## Out Of Scope For The Map MVP

Do not add these to the map in the first build:

- Full OpenStreetMap route ingestion
- Live CCTV streams
- Face recognition or person re-identification
- Cross-camera identity deduplication
- Real dispatch workflows
- Authentication and agency permissions
- Citizen navigation app flows
- Full sanitation route optimization
- Full ambulance routing engine

These can appear in the pitch as future expansions, but the MVP map should stay focused on crowd-flow prediction and intervention.

## Data Strategy For MVP

The MVP should use seeded local data so it can be built and demonstrated in one day.

Data sources by maturity:

- Day-one demo: local JSON/JavaScript seed data for nodes, cameras, paths, risk, and simulated time steps.
- Real deployment: GIS survey data, CCTV/camera registry, police/administration route plans, public OpenStreetMap basemap, weather feeds, transport arrivals, and manual incident reports.
- Later AI integration: aggregated crowd counts from camera images, mobile tower density feeds where legally available, drone observations, and operator-confirmed event logs.

The MVP must not depend on live personal tracking or person re-identification.

## Interaction Model

Operators should be able to:

- Click a node on the map to inspect capacity, crowd, prediction, connected cameras, and recommendation.
- Click a camera marker to see which node it observes.
- Switch scenario time steps to watch risk evolve.
- See the affected node turn red automatically when risk crosses the threshold.
- Read the recommended action without leaving the map.

## Visual Direction

The visual language should be enterprise GIS command-center, not sci-fi:

- Dark charcoal base
- Satellite/map texture from real tiles
- Blue for emergency/access route
- Green/yellow/orange/red for operational risk
- Dense panels and data tables inspired by the original designs
- Clear typography and restrained motion
- One memorable signature: animated movement pulses traveling along real map routes

## Implementation Boundaries

In scope for this MVP:

- Add real map view with seeded node and camera coordinates.
- Add node/camera markers and movement edges.
- Add red/yellow/green risk states.
- Add selected-node inspector and alerts tied to map state.
- Preserve camera snapshot cards and operational pipeline.
- Preserve tests for risk, scenarios, and dashboard data helpers.

Out of scope for the one-day MVP:

- Real CCTV integration.
- Real computer vision inference.
- Live GIS backend.
- User authentication.
- Incident write-back workflows.
- Person-level deduplication or identity tracking.

## Testing And Verification

Minimum verification before delivery:

- Unit tests pass for risk classification, scenario clamping, KPI generation, and selected-node inspector data.
- JavaScript syntax checks pass.
- Browser smoke test confirms the dashboard loads without console errors.
- Desktop screenshot confirms real map panel, nodes, camera markers, red-risk node, and movement routes are visible.
- Mobile smoke test confirms no horizontal layout overflow.

## Success Criteria

The redesign is successful if a viewer can understand within 10 seconds:

- This is a real-map command-center product.
- The platform knows where operational nodes and cameras are located.
- Crowd movement is directional and visible.
- Bridge-02 is currently the risky node because it turns red.
- The system recommends an operational action, not just a visualization.
