# Kumbh MVP And Data Strategy

## Purpose

This document converts the Kumbh-specific booklet insights into a one-day MVP plan.

The MVP should be ambitious in story but small in implementation. It should prove one core claim:

```text
Astra can turn scattered Kumbh observations into a spatial graph that predicts operational pressure and recommends action before risk escalates.
```

## What The MVP Covers

The one-day MVP should cover five connected operational layers.

### 1. Ritual-Driven Crowd Demand

Kumbh flow is not random. It is driven by bathing dates, ritual windows, Akhara movements, Kalpvas stay patterns, cultural events, and public transport arrivals.

MVP representation:

- A `ritual-calendar.json` file with major event days and expected crowd multipliers.
- Peak windows such as early-morning bathing periods.
- A simple multiplier that increases inflow during high-significance ritual windows.

Why it matters:

- Judges immediately see that the model understands Kumbh, not just generic crowd analytics.
- It explains why congestion appears at specific times and locations.

### 2. Multimodal Pilgrim Inflow

Real pilgrims enter from railway stations, bus stands, parking areas, shuttle routes, and walking corridors before reaching ghats.

MVP representation:

```text
Railway Station
Bus Stand
Parking Zone
      |
Entry Gate
      |
Main Bridge
      |
Sangam Ghat
      |
Exit Route
```

Add one alternate route:

```text
Entry Gate -> Route B -> Sangam Ghat
```

Why it matters:

- It connects crowd risk at the ghat to upstream transport pressure.
- It lets the system recommend action before people reach the bottleneck.

### 3. Ghat And River Safety

The PDFs show river operations are a first-class Kumbh concern: ghats, boat movement, water police, deep-water barricades, river ambulances, floating rescue stations, lifebuoys, divers, and underwater surveillance.

MVP representation:

- `Sangam Ghat` as a high-priority node.
- `River Safety Post` as a rescue node.
- `Boat Route` as an optional non-pedestrian edge.
- `drowningRisk`, `riverCrowdingRisk`, and `rescueAccessMinutes` as fields.

Why it matters:

- Kumbh risk is not only stampede risk.
- A ghat can be crowded but still manageable if rescue access is clear; it becomes dangerous when crowding and rescue delay rise together.

### 4. Basic Civic Load

Sanitation, water, and medical capacity determine whether the temporary city keeps functioning.

MVP representation:

- `Toilet Block`
- `Water ATM`
- `Medical Camp`
- `Cleaning Crew`
- `Ambulance`

Track simple pressure scores:

```text
toilet_pressure = nearby_population / toilet_capacity
water_pressure = nearby_population / water_atm_capacity
medical_pressure = nearby_population * risk_score / medical_capacity
```

Why it matters:

- This makes Astra feel like an operational command platform, not a map with red dots.
- It shows the graph can grow from crowd flow into civic intelligence.

### 5. Recommendation And Communication

A recommendation is only useful if it can be communicated through the correct channel.

MVP representation:

- Alert cards with action, target, expected impact, and confidence.
- A field for communication channel:
  - Public announcement
  - Variable message display
  - Volunteer instruction
  - Police instruction
  - Mobile app notification

Why it matters:

- It closes the loop from prediction to action.
- It demonstrates operational usefulness, not just analytics.

## What The MVP Will Not Cover

Do not build these in the one-day version:

- Real camera integration
- Face recognition
- Person re-identification
- Cross-camera deduplication
- Full GIS ingestion
- Live government APIs
- Production security workflows
- Full lost-and-found search
- Real e-pass issuance
- Real emergency dispatch
- Full sanitation routing

These can be shown as future modules in the pitch.

## One-Day Demo Scenario

### Scenario Name

Amrit Snan Morning Surge

### Story

At 5:30 AM on a major bathing day, railway and bus arrivals rise sharply. The entry gate begins pushing pilgrims toward the main bridge. The bridge is the shortest route to Sangam Ghat, so 75% of flow normally chooses it.

Within 12 minutes, the system predicts the bridge will exceed safe capacity. Route B is slower but underutilized. Astra recommends redirecting 35% of pilgrims to Route B and broadcasting instructions through public announcement systems and volunteer teams.

### Demo Output

```text
Risk: Main Bridge predicted to reach 94% safe capacity in 12 minutes.
Cause: High inflow from Entry Gate during Amrit Snan window.
Recommendation: Redirect 35% of Gate flow to Route B.
Expected impact: Bridge congestion falls from 0.94 to 0.67.
Support action: Deploy 20 volunteers at Entry Gate and activate PA message.
Confidence: 0.82.
```

## Minimal Graph

### Nodes

Use 12 nodes.

- `railway-station`
- `bus-stand`
- `parking-zone`
- `entry-gate`
- `main-bridge`
- `route-b`
- `sangam-ghat`
- `exit-route`
- `medical-camp`
- `river-safety-post`
- `toilet-block`
- `water-atm`

If time is tight, drop `toilet-block` and `water-atm` from the dashboard but keep them in data.

### Edges

- Railway Station -> Entry Gate
- Bus Stand -> Entry Gate
- Parking Zone -> Entry Gate
- Entry Gate -> Main Bridge
- Main Bridge -> Sangam Ghat
- Entry Gate -> Route B
- Route B -> Sangam Ghat
- Sangam Ghat -> Exit Route
- Sangam Ghat -> Medical Camp
- Sangam Ghat -> River Safety Post
- Sangam Ghat -> Toilet Block
- Sangam Ghat -> Water ATM

### Sensors

Use simulated sensors.

- `camera-railway-exit`
- `camera-bus-exit`
- `camera-entry-gate`
- `camera-main-bridge`
- `camera-route-b`
- `camera-sangam-ghat`
- `manual-medical-report`
- `water-atm-status`

## Required Demo Data Files

### `nodes.json`

Contains:

- Node ID
- Name
- Type
- Capacity
- Current population
- Coordinates for dashboard layout
- Risk categories
- Operational priority

### `edges.json`

Contains:

- Edge ID
- Source node
- Target node
- Distance
- Walking time
- Safe flow per minute
- Maximum flow per minute
- Accessibility
- Emergency route flag

### `ritual-calendar.json`

Contains:

- Date label
- Event name
- Ritual importance
- Peak start and end time
- Expected crowd multiplier
- Priority locations

Example:

```json
{
  "id": "amrit-snan-morning",
  "name": "Amrit Snan Morning Window",
  "peakStart": "03:00",
  "peakEnd": "07:00",
  "crowdMultiplier": 2.4,
  "priorityNodes": ["entry-gate", "main-bridge", "sangam-ghat"]
}
```

### `scenario-events.json`

Contains time-stepped observations:

- Timestamp
- Sensor ID
- Node ID
- Estimated population
- Confidence

### `recommendation-rules.json`

Contains explainable rules:

```json
{
  "id": "bridge-diversion",
  "when": {
    "node": "main-bridge",
    "predictedCongestionAbove": 0.9,
    "withinMinutes": 15,
    "alternateNode": "route-b",
    "alternateCongestionBelow": 0.7
  },
  "then": {
    "action": "redirect_crowd",
    "target": "route-b",
    "communicationChannels": ["public_announcement", "volunteer_instruction"]
  }
}
```

## Data Sources

The MVP should combine public data, booklet facts, and synthetic scenario data.

### 1. Booklet Data

Use the two uploaded booklets for domain facts:

- Major rituals and bathing dates
- Temporary city infrastructure
- Police zones and sectors
- Transport preparation
- Medical facilities
- Sanitation and water systems
- River safety assets
- Digital services and communication channels
- Historical incidents

How to use it:

- Convert facts into graph schema fields and scenario assumptions.
- Do not treat the booklet as live operational data.

### 2. OpenStreetMap

Use OpenStreetMap for:

- Roads
- Paths
- Bridges
- Railway stations
- Bus stands
- Ghats
- Hospitals
- Police stations
- Water bodies

How to use it in one day:

- Do not build full OSM ingestion.
- Manually copy a simplified route network into `nodes.json` and `edges.json`.
- Use rough distances from OSM or Google Maps for demo realism.

### 3. Government And Public Websites

Use public government sources for:

- Official event dates
- Official facilities
- Help desks
- Hospitals
- Transport advisories
- Police or traffic advisories
- Mela maps if available

Good target sources:

- Official Maha Kumbh website
- Uttar Pradesh government releases
- PIB releases
- Prayagraj administration pages
- Indian Railways announcements
- Airport and bus transport updates

### 4. Weather Data

Use public weather data for:

- Temperature
- Rain
- Visibility
- Heat index

For MVP:

- Use one static weather condition in `scenario-events.json`.
- Example: cool morning, good visibility, no rain.

### 5. Synthetic Sensor Data

This is the most important data for a reliable one-day demo.

Generate deterministic sensor events that simulate:

- Railway inflow increasing
- Bus inflow increasing
- Entry Gate crowd rising
- Main Bridge approaching capacity
- Route B remaining underused
- Sangam Ghat pressure rising
- Medical and water demand rising

Why synthetic data is acceptable:

- Hackathon judges care about a working proof of concept.
- Real live Kumbh sensor data will not be available.
- Synthetic data lets us demonstrate the architecture without depending on private systems.

### 6. Optional Static Images

If time allows, add 3-5 static crowd images.

Use them as visual evidence only:

- `camera-main-bridge.jpg`
- `camera-entry-gate.jpg`
- `camera-sangam-ghat.jpg`

The one-day version can manually assign counts to each image. If a model is added later, it can replace the manual estimate.

## Why This MVP Is Impactful

### It Solves A Real Operational Problem

Kumbh authorities do not only need to know how many people are present. They need to know where people will be next and what action reduces risk.

### It Uses Existing Infrastructure

The story works with existing CCTV, maps, public announcements, volunteers, police posts, and control rooms. It does not require new hardware to be believable.

### It Is Predictive

The demo shifts from:

```text
The bridge is crowded.
```

to:

```text
The bridge will become unsafe in 12 minutes unless 35% of flow is diverted.
```

That difference is the product.

### It Is Explainable

Every alert can show:

- Supporting observations
- Flow calculation
- Capacity threshold
- Predicted time to risk
- Recommended action
- Expected impact

This matters for government adoption.

### It Expands Naturally

The same graph can later support:

- Lost and found
- Ambulance routing
- Toilet demand
- Water ATM fault response
- Sanitation crew deployment
- River rescue planning
- E-pass vehicle control
- Multilingual announcements

## Buildable In One Day

The MVP is buildable in one day because it avoids the hard parts.

Hard parts skipped:

- Real-time streaming
- Computer vision training
- Identity deduplication
- Full GIS import
- Production deployment

Simple parts built:

- JSON graph
- Scenario playback
- Heuristic prediction
- Rule-based recommendation
- Visual dashboard

## One-Day Build Breakdown

### Hour 1: Data Model

- Create `nodes.json`, `edges.json`, `sensors.json`, `ritual-calendar.json`.
- Hardcode the minimal Kumbh graph.

### Hours 2-3: Scenario Engine

- Load `scenario-events.json`.
- Replay observations every few seconds.
- Update node populations.

### Hours 4-5: Prediction Engine

- Calculate expected inflow and outflow.
- Forecast 10-15 minutes ahead.
- Compute congestion and pressure scores.

### Hours 6-7: Recommendation Rules

- Implement diversion rule.
- Implement volunteer deployment rule.
- Implement medical/river safety alert rule.

### Hours 8-9: Dashboard

- Show schematic map.
- Color nodes and edges by risk.
- Add alert cards and recommendation panel.
- Add simple playback controls.

### Hour 10: Data Story

- Tune scenario data so the risk emerges clearly.
- Add confidence labels and explanation text.

### Hour 11: Pitch Assets

- Prepare before/after screenshots.
- Prepare 3-minute demo script.

### Hour 12: Dry Run

- Run the demo end to end.
- Fix unclear UI text.
- Confirm the story lands in under 3 minutes.

## Demo Script

Opening:

```text
Kumbh is not only a crowd-counting problem. It is a temporary city operations problem.
```

Problem:

```text
During Amrit Snan, inflow from rail, bus, and parking routes converges toward Sangam Ghat. By the time a bridge looks visibly overcrowded, the safest intervention window may already be gone.
```

Solution:

```text
Astra converts observations into a Spatial Knowledge Graph, predicts where pressure will build, and recommends action before the bottleneck becomes unsafe.
```

Demo moment:

```text
The system predicts Main Bridge will cross 90% safe capacity in 12 minutes. It recommends diverting 35% of flow through Route B and deploying volunteers at Entry Gate. The expected congestion score drops from 0.94 to 0.67.
```

Close:

```text
The same graph can later power sanitation, medical routing, river safety, lost and found, and multilingual public communication.
```

## Recommended First Implementation

Start with this exact feature set:

- Static Kumbh graph
- Ritual calendar multiplier
- Scenario playback
- 15-minute prediction
- Congestion heatmap
- Diversion recommendation
- Impact estimate
- Operator-friendly explanation

Do not add more until this works end to end.
