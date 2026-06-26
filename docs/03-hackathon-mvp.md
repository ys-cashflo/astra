# Hackathon MVP

## Goal

Build a working proof of concept that demonstrates crowd flow intelligence for a Kumbh Mela-style site.

The demo should show that disconnected visual observations can update a spatial graph, forecast movement, identify congestion risk, and recommend operational actions.

The MVP should feel specific to Kumbh, not like a generic crowd dashboard. It should include ritual-driven demand, transport inflow, a ghat bottleneck, one alternate route, one medical/rescue node, and one communication action.

## Non-Goal

The MVP must not attempt to build the full platform.

Avoid:

- Person re-identification
- Cross-camera identity deduplication
- Real-time production video streaming
- Production-grade computer vision
- Full GIS ingestion
- Multi-agency workflow management
- Citizen mobile apps
- Authentication and permissions

These are valid future features, but they are distractions for a 1-day demo.

## Demo Story

The command center sees a small Kumbh route network:

```text
Railway Station ----\
Bus Stand -----------> Entry Gate -> Main Bridge -> Sangam Ghat -> Exit Route
Parking Zone -------/       \------> Route B ------/
                                      |
Sangam Ghat -> Medical Camp
Sangam Ghat -> River Safety Post
```

Every 30 seconds, the system receives simulated observations:

- Railway station exit population
- Bus stand exit population
- Parking population
- Entry Gate population
- Main Bridge population
- Route B population
- Sangam Ghat population
- Medical or river safety status

The graph updates current state, predicts the next 10-15 minutes, flags congestion risk, and recommends intervention.

Example output:

```text
Main Bridge will reach 94% safe capacity in 12 minutes.
Expected inflow from Entry Gate: 410 people.
Recommended action: redirect 35% of crowd through Route B.
Expected impact: reduce Main Bridge congestion score from 0.94 to 0.67.
Communication: public announcement + volunteer instruction at Entry Gate.
Confidence: 0.82.
```

## MVP Capabilities

### 1. Static Spatial Graph

Represent a small event area as nodes and edges.

Minimum nodes:

- Railway Station
- Bus Stand
- Parking Zone
- Entry Gate
- Main Bridge
- Route B
- Sangam Ghat
- Medical Camp
- River Safety Post
- Toilet Block
- Water ATM

Minimum edges:

- Railway Station to Entry Gate
- Bus Stand to Entry Gate
- Parking Zone to Entry Gate
- Entry Gate to Main Bridge
- Main Bridge to Sangam Ghat
- Entry Gate to Route B
- Route B to Sangam Ghat
- Sangam Ghat to Medical Camp
- Sangam Ghat to River Safety Post
- Sangam Ghat to Toilet Block
- Sangam Ghat to Water ATM

If the build is running behind, keep Toilet Block and Water ATM in JSON but hide them from the first dashboard.

### 2. Observation Ingestion

Use simulated observations or static image-derived counts.

Observation fields:

- Timestamp
- Sensor ID
- Node ID
- Estimated population
- Confidence

For demo speed, crowd counts may be generated from a scripted scenario rather than a trained model.

### 3. Flow Estimation

Estimate movement across edges using:

- Current population at source node
- Current population at target node
- Edge distance
- Walking time
- Directional route assumptions
- Recent population delta

The MVP can use heuristics rather than machine learning.

### 4. Prediction

Forecast node population and edge congestion for the next 10-15 minutes.

Simple formula:

```text
future_population = current_population + expected_inflow - expected_outflow
```

Congestion score:

```text
congestion_score = future_population / safe_capacity
```

### 5. Risk Heatmap

Display risk by color:

- Green: below 60% safe capacity
- Yellow: 60-75%
- Orange: 75-90%
- Red: above 90%

### 6. Recommendation Engine

Generate simple operational recommendations:

- Redirect crowd to alternate route
- Temporarily slow entry at Entry Gate
- Deploy volunteers
- Notify medical team
- Notify river safety team
- Close or restrict a path
- Trigger public announcement or message display

Recommendation priority is based on predicted congestion score and time to threshold.

### 7. Dashboard

The dashboard should show:

- Map or schematic graph
- Current node populations
- Predicted populations
- Edge congestion
- Risk heatmap
- Alert cards
- Recommended actions

## Suggested Tech Stack

Keep the stack simple.

Frontend:

- React or Next.js
- SVG or canvas graph visualization
- Lightweight charts for trends

Backend:

- Node.js API or Python FastAPI
- In-memory graph state for hackathon speed
- JSON files for demo scenarios

Algorithms:

- Heuristic flow propagation
- Capacity-based risk scoring
- Rule-based recommendations

Optional AI:

- Use an LLM only to summarize alerts and recommendations in operator-friendly language.
- Do not make the LLM the source of truth for calculations.

## Data Strategy

Use deterministic synthetic data so the demo is reliable.

Required sample files:

- `nodes.json`
- `edges.json`
- `sensors.json`
- `ritual-calendar.json`
- `scenario-events.json`
- `recommendation-rules.json`

Optional sample inputs:

- Static crowd images
- Mock camera thumbnails
- Weather conditions
- Manual incident report

Use public and synthetic data together:

- Booklet facts for domain assumptions.
- OpenStreetMap for route and facility references.
- Official government/public pages for event dates and facility claims.
- Synthetic sensor data for the repeatable demo scenario.

See [Kumbh MVP And Data Strategy](05-kumbh-mvp-and-data-strategy.md) for the full data plan.

## Judging Narrative

The pitch should say:

```text
We are not building another CCTV dashboard.
We convert disconnected camera observations into a spatial graph that predicts crowd movement and recommends interventions before dangerous congestion forms.
```

## Success Criteria

The MVP succeeds if it can:

- Load a small mapped network.
- Ingest changing crowd observations.
- Update current state at nodes.
- Predict at least one future congestion event.
- Highlight the risky route.
- Recommend a concrete intervention.
- Show the expected benefit of that intervention.

## 8-12 Hour Build Plan

Hour 1:

- Create graph JSON for nodes, edges, sensors, capacities, and coordinates.

Hours 2-3:

- Build in-memory graph state and scenario event playback.

Hours 4-5:

- Implement flow estimation, prediction, and congestion scoring.

Hours 6-7:

- Build dashboard map, heatmap, and alert cards.

Hours 8-9:

- Add recommendation rules and expected impact simulation.

Hours 10-11:

- Polish demo story, sample data, and presentation screenshots.

Hour 12:

- Dry run, fix edge cases, and prepare final pitch.
