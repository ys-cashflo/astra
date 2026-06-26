# Astra

Astra is a Spatial Intelligence Platform concept for large public spaces such as Kumbh Mela, pilgrimage sites, stadiums, airports, rail hubs, disaster relief camps, and smart cities.

The core idea is simple:

```text
Observation -> Understanding -> Prediction -> Recommendation -> Action
```

Instead of treating CCTV cameras, drones, maps, weather feeds, river sensors, and operator reports as isolated inputs, Astra converts them into a shared Spatial Knowledge Graph. The graph represents places, paths, zones, sensors, risks, flows, predictions, and recommended operational actions.

The first proof of concept focuses on crowd flow intelligence for Kumbh Mela:

- Estimate crowd population at mapped nodes from static or simulated CCTV images.
- Propagate expected movement through a path network.
- Forecast congestion risk over the next 10-15 minutes.
- Recommend diversions or interventions before bottlenecks become unsafe.

## Documents

- [Product Vision](docs/01-product-vision.md)
- [Spatial Knowledge Graph](docs/02-spatial-knowledge-graph.md)
- [Hackathon MVP](docs/03-hackathon-mvp.md)
- [Technical Architecture](docs/04-technical-architecture.md)
- [Kumbh MVP And Data Strategy](docs/05-kumbh-mvp-and-data-strategy.md)
- [Implementation Design Spec](docs/superpowers/specs/2026-06-27-spatial-intelligence-design.md)

## Current Scope

This repository currently contains the product and architecture foundation. It intentionally avoids implementation until the graph model, MVP boundaries, and demo story are clear.
