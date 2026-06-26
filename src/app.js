import {
  calculateCongestion,
  calculateDiversionImpact,
  cameraFeeds,
  classifyRisk,
  edges,
  getActiveScenarioStep,
  getEventTimeline,
  getInspectorNode,
  getMissionKpis,
  getNodeCapacity,
  getNodePopulation,
  layerCatalog,
  nodes,
  projectBridgeRisk,
  scenarioSteps
} from "./simulation.js";

const graphPositions = {
  "railway-station": { x: 10, y: 24 },
  "bus-stand": { x: 12, y: 52 },
  "parking-zone": { x: 10, y: 76 },
  "entry-gate": { x: 32, y: 52 },
  "main-bridge": { x: 52, y: 41 },
  "route-b": { x: 54, y: 71 },
  "sangam-ghat": { x: 73, y: 51 },
  "temple": { x: 88, y: 31 },
  "medical-camp": { x: 88, y: 60 },
  "toilet-block": { x: 73, y: 82 },
  "river-safety-post": { x: 89, y: 82 },
  "exit-route": { x: 92, y: 47 }
};

const visibleNodeIds = [
  "railway-station",
  "bus-stand",
  "parking-zone",
  "entry-gate",
  "main-bridge",
  "route-b",
  "sangam-ghat",
  "temple",
  "medical-camp",
  "toilet-block"
];

let activeStepIndex = 2;
let sidebarCollapsed = false;

function render() {
  const step = getActiveScenarioStep(activeStepIndex);
  const projection = projectBridgeRisk(step);
  const impact = calculateDiversionImpact(step, 0.35);
  const inspector = getInspectorNode(step, "main-bridge");

  renderHeader(step);
  renderKpis(step);
  renderLayers();
  renderMap(step, projection);
  renderInspector(inspector);
  renderCameras();
  renderEvents(getEventTimeline(step, projection, impact));
  renderTimeline();
  renderCopilot(impact, projection);
}

function renderHeader(step) {
  document.querySelector("#scenario-clock").textContent = step.time;
}

function renderKpis(step) {
  const kpiStrip = document.querySelector("#kpi-strip");
  kpiStrip.innerHTML = getMissionKpis(step).map((kpi) => `
    <article class="kpi-card kpi-${kpi.tone}">
      <span>${kpi.label}</span>
      <strong>${kpi.value}</strong>
      <small>${kpi.trend}</small>
    </article>
  `).join("");
}

function renderLayers() {
  const layerList = document.querySelector("#layer-list");
  layerList.innerHTML = layerCatalog.map((layer) => `
    <label class="layer-row">
      <input type="checkbox" ${layer.active ? "checked" : ""}>
      <span class="layer-dot layer-${layer.id}"></span>
      <span>${layer.label}</span>
    </label>
  `).join("");
}

function renderMap(step, projection) {
  const routeMap = document.querySelector("#route-map");
  const lines = edges.map((edge) => renderEdge(edge, step)).join("");
  const nodesMarkup = visibleNodeIds.map((nodeId) => renderNode(nodeId, step, projection)).join("");

  routeMap.innerHTML = `
    <div class="map-scale">250 m</div>
    <div class="map-coordinate">25.4358 N / 81.8463 E</div>
    <svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="heatCritical" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(239, 68, 68, 0.55)" />
          <stop offset="62%" stop-color="rgba(245, 158, 11, 0.18)" />
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0)" />
        </radialGradient>
        <radialGradient id="heatWatch" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(14, 165, 233, 0.22)" />
          <stop offset="100%" stop-color="rgba(14, 165, 233, 0)" />
        </radialGradient>
      </defs>
      <path class="river-shape" d="M66 0 C60 18 67 30 59 45 C50 62 54 78 46 100 L100 100 L100 0 Z" />
      <ellipse class="heat heat-critical" cx="52" cy="41" rx="19" ry="15" fill="url(#heatCritical)" />
      <ellipse class="heat heat-watch" cx="73" cy="51" rx="22" ry="18" fill="url(#heatWatch)" />
      <path class="risk-zone" d="M43 29 L64 31 L68 47 L53 57 L39 49 Z" />
      ${lines}
      <path class="emergency-route" d="M32 52 C42 61 54 69 73 82 C80 86 86 84 90 82" />
    </svg>
    ${nodesMarkup}
    <div class="map-legend" aria-label="Map legend">
      <span><i class="legend-red"></i> critical</span>
      <span><i class="legend-yellow"></i> watch</span>
      <span><i class="legend-green"></i> stable</span>
      <span><i class="legend-blue"></i> emergency route</span>
    </div>
  `;
}

function renderEdge(edge, step) {
  const from = graphPositions[edge.from];
  const to = graphPositions[edge.to];

  if (!from || !to) return "";

  const isBridge = edge.from === "entry-gate" && edge.to === "main-bridge";
  const isDiversion = edge.to === "route-b";
  const className = [
    "graph-edge",
    isBridge ? "graph-edge-hot" : "",
    isDiversion && activeStepIndex >= 2 ? "graph-edge-diversion" : ""
  ].filter(Boolean).join(" ");
  const width = isBridge ? 1.8 + step.ritualMultiplier * 0.28 : 1.05;

  return `<line class="${className}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke-width="${width}" />`;
}

function renderNode(nodeId, step, projection) {
  const node = nodes.find((item) => item.id === nodeId);
  const position = graphPositions[nodeId];
  const population = getNodePopulation(step, nodeId);
  const score = nodeId === "main-bridge"
    ? projection.projectedScore
    : calculateCongestion(population, getNodeCapacity(nodeId));
  const risk = classifyRisk(score);
  const displayId = nodeId === "main-bridge" ? "Bridge-02" : node.name;

  return `
    <button class="map-node map-node-${risk} ${nodeId === "main-bridge" ? "map-node-selected" : ""}"
      style="--x: ${position.x}; --y: ${position.y};"
      aria-label="${displayId}: ${Math.round(score * 100)} percent capacity, ${risk}">
      <span>${displayId}</span>
      <strong>${Math.round(score * 100)}%</strong>
    </button>
  `;
}

function renderInspector(inspector) {
  const gauge = document.querySelector("#confidence-gauge");
  gauge.style.setProperty("--confidence", `${Math.round(inspector.confidence * 100)}%`);
  gauge.innerHTML = `<span>${Math.round(inspector.confidence * 100)}%</span><small>confidence</small>`;

  document.querySelector("#inspector-list").innerHTML = `
    ${renderInspectorItem("Capacity", inspector.capacity.toLocaleString())}
    ${renderInspectorItem("Current population", inspector.currentPopulation.toLocaleString())}
    ${renderInspectorItem("Predicted population", inspector.predictedPopulation.toLocaleString())}
    ${renderInspectorItem("Risk score", `${Math.round(inspector.riskScore * 100)} / 100`)}
    ${renderInspectorItem("Inflow", `${inspector.inflow} / min`)}
    ${renderInspectorItem("Outflow", `${inspector.outflow} / min`)}
    ${renderInspectorItem("Emergency access", inspector.emergencyAccess)}
    ${renderInspectorItem("Connected cameras", inspector.connectedCameras.join(", "))}
  `;

  document.querySelector("#inspector-recommendation").textContent = inspector.recommendation;
}

function renderInspectorItem(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function renderCameras() {
  document.querySelector("#camera-dock").innerHTML = cameraFeeds.map((camera, index) => `
    <article class="camera-card">
      <div class="camera-view camera-view-${index + 1}">
        <span class="bbox bbox-a"></span>
        <span class="bbox bbox-b"></span>
        <span class="bbox bbox-c"></span>
      </div>
      <div>
        <strong>${camera.id}</strong>
        <span>${camera.label}</span>
        <small>${camera.count} detected / ${Math.round(camera.confidence * 100)}% conf.</small>
      </div>
    </article>
  `).join("");
}

function renderEvents(events) {
  document.querySelector("#timeline-events").innerHTML = events.map((event) => `
    <article class="event-card event-${slugify(event.type)}">
      <span>${event.time}</span>
      <strong>${event.type}</strong>
      <p>${event.summary}</p>
    </article>
  `).join("");
}

function renderTimeline() {
  const controls = document.querySelector("#timeline-controls");
  controls.innerHTML = scenarioSteps.map((step, index) => `
    <button class="timeline-step ${index === activeStepIndex ? "timeline-step-active" : ""}"
      type="button"
      data-step="${index}"
      aria-current="${index === activeStepIndex ? "step" : "false"}">
      <span>${step.time}</span>
      <strong>${step.label}</strong>
    </button>
  `).join("");

  controls.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeStepIndex = Number(button.dataset.step);
      render();
    });
  });
}

function renderCopilot(impact, projection) {
  document.querySelector("#copilot-answer").textContent =
    `Bridge-02 reaches ${Math.round(projection.projectedScore * 100)}% in ${projection.minutesToCritical} minutes. Divert ${impact.divertedPeople} people/min equivalent to Route B and hold the emergency lane open.`;
}

function slugify(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

document.querySelector("#sidebar-toggle").addEventListener("click", () => {
  sidebarCollapsed = !sidebarCollapsed;
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  document.querySelector("#sidebar-toggle").textContent = sidebarCollapsed ? ">>" : "<<";
});

document.querySelector("#sidebar-toggle").textContent = "<<";
render();
