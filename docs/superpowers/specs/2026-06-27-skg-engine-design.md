# Spatial Knowledge Graph Engine Design

Date: 2026-06-27
Project: Astra Spatial Intelligence Platform
Scope: Replace the mocked dashboard data layer with a real, deterministic Spatial Knowledge Graph (SKG) engine for the Kumbh Mela crowd-flow MVP.

## Status

Approved for implementation planning. This spec is the design contract for the engine. The next step after user review is the writing-plans skill.

## Context

The repository currently contains five product/architecture docs and a polished command-center UI ([index.html](../../../index.html), [src/app.js](../../../src/app.js), [src/simulation.js](../../../src/simulation.js)). The UI is faithful to the vision but runs on **hardcoded mock data**:

- `simulation.js` stores nodes/edges inline and pre-bakes every prediction (`projectedBridgePopulation`, `minutesToCritical`, `confidence` are hand-typed per scenario step).
- `projectBridgeRisk` / `getInspectorNode` only work for `main-bridge`; clicking any other node does nothing.
- The recommendation text and its `0.94 → 0.67` impact are string/number literals, not computed.
- No data files exist despite every doc calling for them.

The docs are explicit ([spatial-intelligence-design.md](2026-06-27-spatial-intelligence-design.md) line 260): *"start with the MVP data model and deterministic simulation engine before frontend polish."* The work so far did the opposite. This spec corrects that by building the engine the docs describe.

## Goal

Build the deterministic SKG engine so that **every** value on the dashboard is computed from data + graph + rules, traceable back to its source observations, and would change correctly if the data were edited. The crowd-flow logic becomes the first *reasoner* over a shared Spatial Knowledge Graph, proving the platform's "one engine, many applications" thesis rather than asserting it.

This phase is **engine first**. The real geospatial map ([real-map-crowd-flow-design.md](2026-06-27-real-map-crowd-flow-design.md)) is a later phase; the engine must emit map-compatible data shapes (lat/long, `riskState`, camera `observedNodeIds`) so that phase is a drop-in.

## Decisions (from brainstorming)

These were settled interactively and are the binding choices for this design:

1. **Snapshot-driven engine**, not a live tick simulator. Each scenario step is a snapshot of *observed* populations (the input); everything downstream is computed. Deterministic and demo-reliable, but the math is real and works for every node and every step with no ordering dependency.
2. **Real JSON data files** + a loader that works in the browser (`fetch`) and Node tests (`fs`).
3. **Graph-based flow propagation** for prediction inflow: `inflow(node) = Σ upstream(pop × outflowRate × routeShare)`. Pure function of the current snapshot + topology. Powers explainable recommendations and honest what-if impact.
4. **Generic rule evaluator + 3 seed rules + what-if recompute** for recommendations. Impact is a genuine recompute of the prediction with modified routing/metering, not a hand-typed number.
5. **Full SKG backbone.** A typed entity store + append-only event log + a thin reasoner interface is the architecture. Crowd-flow and all variable groups are reasoners over one shared graph.
6. **Deep variable coverage** — all four groups are computed, not stubbed: crowd-density physics, human physiology load, finite resources & honest recommendations, sensor trust.
7. **Research-gap closures folded in:** Zones as first-class entities (A), an image→count vision stub (B), queue formation (C), static infrastructure/historical node layers (D). "Digital Twin" vocabulary is aligned in pitch/docs (E).

## Alignment With Source Vision

The design was tested against [02-spatial-knowledge-graph.md](../../02-spatial-knowledge-graph.md) and the user's original research ("AI-Powered Digital Twin for Large Public Spaces"). Key alignments:

- **Core principle** Observation → Understanding → Prediction → Recommendation → Action maps directly: "Understanding" is the derived **State** layer between observation and prediction.
- **MVP entity subset** is exactly the doc's prescribed subset (doc line 495): Node, FlowEdge, Sensor, Observation, State, Prediction, Recommendation, Event — extended with **Zone** and **Resource**.
- **Density is in the doc's own schema** (`flow_edge.density_people_per_square_meter`, `width_meters`), so the density-first risk model implements the schema as written rather than inventing it.
- **Multi-risk layer** (stampede, drowning, heat, structural, medical) is the home for each reasoner's output — every reasoner produces a *risk facet*, not a bolted-on feature.
- **Platform Applications** (one engine, many apps) is demonstrated by the reasoners-over-graph structure: adding a concern is "new data + new reasoner," not a rewrite.

## Architecture

```text
src/
  data/                    typed entities + relationships as JSON
    nodes.json  edges.json  sensors.json  zones.json  resources.json
    ritual-calendar.json  scenario-events.json  recommendation-rules.json
    images/                static crowd images for the vision stub
  skg/
    entities.js   Node / FlowEdge / Sensor / Zone / Resource factories (base + spatial + operational fields)
    graph.js      the SKG: entity store + typed relationships; query API
    events.js     append-only event log; state is DERIVED, never mutated directly
    load.js       load + validate data into the graph (fetch in browser / fs in Node)
  reasoners/      each: (graph, context) -> events[]
    sensorTrust.js  physiology.js  flow.js  density.js  predict.js  river.js  resources.js
    recommend.js  rule evaluator + what-if recompute + provenance
  pipeline.js     orchestrator: scenarioStep -> apply observations as events -> run reasoners -> derive state -> world snapshot
  app.js          UI; consumes the world snapshot (current SVG dashboard unchanged this phase)
  simulation.js   thin compatibility shim during transition, then retired
```

### The decision loop is literal

A scenario step executes the documented operational loop (doc line 484):

```text
replay scenario-events as ObservationReceived events
  -> sensorTrust (mark stale / uncovered nodes -> status:'unknown')
  -> physiology (heat + vulnerability -> flow-speed modifier, medical demand)
  -> flow (outflow, edge flows, merge + counterflow penalty, queue at gates)
  -> density (density p/m2 -> stampede facet)
  -> predict (15-min future_pop, congestion, egress time, queue)
  -> river (drowning facet)
  -> resources (availability + dispatch latency)
  -> recommend (eval rules, what-if recompute, rank) -> RecommendationCreated
  -> derive State for each entity from the event log
  -> world snapshot -> UI
```

Every red node on screen is therefore traceable: Recommendation → `supporting_prediction_ids` → Prediction → `supporting_observation_ids` → Observation → Sensor. That provenance chain is the platform's differentiator and is built in, not narrated.

## Data Model

Entities carry the doc's base, spatial, and operational fields. Illustrative shapes (the implementation plan will enumerate full field lists):

### Node (`nodes.json`)

```jsonc
{
  "id": "main-bridge", "type": "infrastructure", "subtype": "bridge", "name": "Bridge-02",
  "geometry": { "latitude": 25.4290, "longitude": 81.8840, "area_m2": 900 },
  "operations": { "capacity_safe": 1200, "capacity_max": 1800, "service_status": "open", "priority": "critical" },
  "semantic": { "attracts_crowd": true, "expected_stay_minutes": 6 },
  "zone_id": "bathing-sector",
  "infrastructure": { "power": "backup", "lighting": "good", "cctvCoverage": "full" },
  "historical": { "previousPeak": 1340, "incidentHistory": 3 },
  "vulnerabilityIndex": 0.18
}
```

`area_m2` enables density. `infrastructure` and `historical` are carried as static descriptive fields (displayed, not computed in MVP; seed future reasoners). `vulnerabilityIndex` feeds physiology.

### FlowEdge (`edges.json`)

Fields: `from_node_id`, `to_node_id`, `distance_meters`, `width_meters`, `safe_flow_per_minute`, `max_flow_per_minute`, `outflowRatePerMinute`, `routeShare`, `is_emergency_route`, `accessibility { pedestrian, ambulance, boat }`, plus computed `current_flow_per_minute`, `predicted_flow_per_minute`, `density_people_per_square_meter`, `congestion_score`, `risk_score`.

### Zone (`zones.json`) — research gap A

```jsonc
{ "id": "bathing-sector", "type": "bathing", "priority": "critical", "memberNodeIds": ["sangam-ghat", "main-bridge", "temple"] }
```

Zones aggregate member nodes (via `LOCATED_IN`) and roll up occupancy, entry/exit rate, zone risk, and priority. Recommendations may target a zone, not just a node.

### Sensor (`sensors.json`) + vision stub — research gap B

Sensors link to nodes via `OBSERVED_BY`. Cameras carry `count`, `confidence`, `status`, and an optional `imageRef` into `data/images/`. The MVP sources `count` from a manual per-image estimate; the UI shows the thumbnail + bounding-box overlay + "detected N @ conf". No real CV model; swappable later. Synthetic `scenario-events` remain the source of truth.

### Resource (`resources.json`)

A finite ledger: ambulances (e.g. 2 of 5 available), volunteer teams (8 of 10), medical beds. Recommendations that consume resources must check availability; concurrent incidents contend for the same pool.

### Supporting data files

- `ritual-calendar.json` — windows with `crowdMultiplier` and `priorityNodes`; the multiplier scales inflow during high-significance ritual windows.
- `scenario-events.json` — time-stepped Observations: timestamp, sensorId, nodeId, estimatedPopulation, confidence.
- `recommendation-rules.json` — `when`/`then` rule definitions (see Recommendation Engine).

### Relationships

`CONNECTED_TO` (flow), `OBSERVED_BY` (camera→node), `ALTERNATE_ROUTE` (diversion), `CAN_EVACUATE_TO` (egress), `LOCATED_IN` (node→zone).

## Reasoners

Each reasoner is a pure function `(graph, context) -> events[]`. The pipeline runs them in order; state is derived from the resulting event log.

- **sensorTrust** — flags nodes with no recent observation (stale) or no observing camera (coverage gap); sets `status: 'unknown'` and lowers confidence. Missing data never reads as `stable`.
- **physiology** — combines `weather.heatIndex` / cold-wet exposure and node `vulnerabilityIndex` into a flow-speed modifier (slower crowd → higher density) and a medical-demand term. Produces the **heat / medical** risk facet.
- **flow** — `outflow = population × outflowRatePerMinute × routeShare`; computes edge `current_flow_per_minute`; applies a **counterflow** penalty on bidirectional edges and a **merge** density multiplier where multiple edges converge; derives **queue** length and average wait at control nodes (gap C).
- **density** — `density = population / area_m2`; classifies on the crowd-safety scale (3/4/5/6 p/m²). Produces the **stampede** risk facet.
- **predict** — `future_population_15m = current + expected_inflow − expected_outflow`; `congestion = future / capacity_safe`; egress time = `population / Σ(exit edge safe flow)`; projects queue. Emits Prediction objects with `supporting_observation_ids`.
- **river** — combines depth/current/`rescueAccessMinutes` into the **drowning** risk facet for ghat/river nodes.
- **resources** — computes availability and dispatch latency per resource type; exposes feasibility to the recommender.
- **recommend** — see below.

A node's `riskState` is the **worst of** all facets (stampede / heat / drowning / medical), classified as `stable` (<60%), `watch` (60–74%), `strain` (75–89%), `critical` (≥90%) — matching the existing `classifyRisk` thresholds and the real-map spec. The inspector can report *which* facet drove the state.

## Recommendation Engine

A generic evaluator loads `recommendation-rules.json` and evaluates each `when` block against computed state, firing all matches and ranking by urgency × impact × confidence. Three seed rules prove generality:

1. **Bridge diversion** — bridge predicted congestion > 0.90 within 15 min AND Route B < 0.70 → redirect flow to Route B; channels: public_announcement, volunteer_instruction.
2. **Gate metering** — Sangam Ghat predicted over capacity → slow inflow at Entry Gate.
3. **Medical / river dispatch** — a high-risk node within reach of Medical Camp / River Safety Post → dispatch the appropriate team.

**Expected impact is a genuine what-if recompute.** For diversion, change Entry Gate's `routeShare` (e.g. 75/25 → 40/60), re-run `predict` across the whole graph, and report the real before/after congestion. The recompute also:

- **Discounts by compliance** — a PA announcement does not divert 100% instantly; impact is scaled by a compliance rate (~50%) with lag, so the reported drop is honest rather than optimistic.
- **Runs a cascade check** — because the recompute covers every node, it verifies the diversion did not create a *new* red node downstream; the diversion is capped at the alternate route's headroom.
- **Gates on resources** — a recommendation requiring teams/ambulances is suppressed (or downgraded to "insufficient resources") when the ledger lacks availability.
- **Escalates when boxed in** — if all routes from a node are saturated, the recommendation becomes "reduce inflow at source; no safe diversion available."

Each Recommendation carries `confidence`, `expected_impact_score`, `time_to_act_minutes`, and `supporting_prediction_ids` (the provenance chain).

## Demo Fidelity

The Amrit Snan Morning Surge story is preserved but **earned**. Seed data (`nodes.json`, `scenario-events.json`, outflow rates) is tuned so the *computed* bridge risk lands near the documented beat (~90%+ at the surge step, with a meaningful diversion drop). The narrative is identical; the numbers now fall out of the model and would change correctly if the data changed.

## Coordinates

`nodes.json` carries real `latitude`/`longitude` for the future real map. The current SVG dashboard keeps its `x/y` display positions as a pure presentation concern in `app.js`. Both coexist; no rework when the map phase lands.

## Error Handling

- Missing/zero `area_m2` or `capacity_safe` → validation error at load; no divide-by-zero downstream.
- Edge referencing an unknown node → load fails with a clear message.
- Observation for an unknown node → rejected and logged, not applied.
- Missing upstream data for prediction → drop confidence, never silently treat as zero.
- Negative population after heavy outflow → clamped at 0.
- Stale / uncovered node → `status: 'unknown'`, surfaced as such.

## Testing Strategy

Tests assert **behavior**, not baked constants. The existing tests (which assert magic numbers like `0.94`, `1128`, `0.67`) are rewritten accordingly.

- **Load/validate:** good data loads; bad ref / missing area → throws; observation for unknown node → rejected + logged.
- **Flow:** propagation math; counterflow and merge penalties applied; queue derived at gates.
- **Density:** classification at boundary values (3/4/5/6 p/m²).
- **Predict:** bridge crosses **critical at the surge step** with tuned seed data.
- **Recommend:** diversion fires and **reduces** bridge risk; **cascade check rejects** a diversion that would overload Route B; rule **blocked** when required resources are unavailable; compliance discount applied.
- **Sensor trust:** stale node → `unknown`, never `stable`.
- **Event log:** each step produces an ordered, replayable Observation → … → Recommendation trace with intact provenance ids.
- **Syntax/smoke:** `node --check` passes; dashboard loads without console errors.

## Build Phasing

1. **SKG core** — entities, graph, event log, loader + validation, all JSON data files (incl. zones/resources/images). Tests for load + validation.
2. **Reasoners** — sensorTrust → physiology → flow → density → predict → river → resources, each test-first.
3. **Recommendation** — rule evaluator + what-if recompute (compliance, cascade, headroom, resource gate) + provenance.
4. **Wire-up** — `pipeline.js` → world snapshot; point `app.js` at it (SVG dashboard unchanged); retire baked constants; rewrite tests; tune seed data to land the demo beat.

## Out Of Scope (this phase)

- The real geospatial map (Leaflet/OSM) — separate later phase; engine emits compatible shapes.
- Real computer vision inference, live camera streaming, person re-identification.
- Live GIS backend, authentication, multi-agency workflows, incident write-back.
- A continuous live-tick simulator (snapshot-driven by decision).
- Citizen-facing apps, lost-and-found, full sanitation routing (future reasoners over the same graph).

## Implementation Readiness

After user review of this spec, proceed to the writing-plans skill to produce a phased implementation plan that follows the Build Phasing above, starting with the SKG core and deterministic reasoners before any UI rewiring.
