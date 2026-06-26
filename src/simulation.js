export const nodes = [
  { id: "railway-station", name: "Railway Station", capacity: 2600, type: "inflow" },
  { id: "bus-stand", name: "Bus Stand", capacity: 1800, type: "inflow" },
  { id: "parking-zone", name: "Parking Zone", capacity: 1400, type: "inflow" },
  { id: "entry-gate", name: "Entry Gate", capacity: 1700, type: "control" },
  { id: "main-bridge", name: "Main Bridge", capacity: 1200, type: "bottleneck" },
  { id: "route-b", name: "Route B", capacity: 950, type: "alternate" },
  { id: "sangam-ghat", name: "Sangam Ghat", capacity: 2200, type: "ritual" },
  { id: "temple", name: "Temple", capacity: 1600, type: "ritual" },
  { id: "exit-route", name: "Exit Route", capacity: 1500, type: "exit" },
  { id: "medical-camp", name: "Medical Camp", capacity: 260, type: "medical" },
  { id: "river-safety-post", name: "River Safety Post", capacity: 120, type: "rescue" },
  { id: "toilet-block", name: "Toilet T2", capacity: 900, type: "civic" },
  { id: "water-atm", name: "Water ATM", capacity: 750, type: "civic" }
];

export const edges = [
  { from: "railway-station", to: "entry-gate", label: "rail inflow" },
  { from: "bus-stand", to: "entry-gate", label: "bus inflow" },
  { from: "parking-zone", to: "entry-gate", label: "parking inflow" },
  { from: "entry-gate", to: "main-bridge", label: "75% default" },
  { from: "entry-gate", to: "route-b", label: "25% default" },
  { from: "main-bridge", to: "sangam-ghat", label: "primary path" },
  { from: "route-b", to: "sangam-ghat", label: "alternate path" },
  { from: "sangam-ghat", to: "temple", label: "ritual corridor" },
  { from: "temple", to: "medical-camp", label: "service lane" },
  { from: "sangam-ghat", to: "toilet-block", label: "amenity path" },
  { from: "sangam-ghat", to: "exit-route", label: "exit" }
];

export const scenarioSteps = [
  {
    time: "05:00",
    label: "Pre-surge",
    ritualMultiplier: 1.4,
    populations: {
      "railway-station": 820,
      "bus-stand": 520,
      "parking-zone": 360,
      "entry-gate": 640,
      "main-bridge": 690,
      "route-b": 220,
      "sangam-ghat": 980,
      "temple": 420,
      "exit-route": 280,
      "medical-camp": 34,
      "river-safety-post": 18,
      "toilet-block": 390,
      "water-atm": 310
    },
    bridgeIncoming: 190,
    projectedBridgePopulation: 820,
    minutesToCritical: 24,
    confidence: 0.74
  },
  {
    time: "05:15",
    label: "Inflow rising",
    ritualMultiplier: 1.8,
    populations: {
      "railway-station": 1180,
      "bus-stand": 760,
      "parking-zone": 520,
      "entry-gate": 910,
      "main-bridge": 820,
      "route-b": 300,
      "sangam-ghat": 1240,
      "temple": 560,
      "exit-route": 340,
      "medical-camp": 48,
      "river-safety-post": 24,
      "toilet-block": 520,
      "water-atm": 430
    },
    bridgeIncoming: 280,
    projectedBridgePopulation: 1010,
    minutesToCritical: 18,
    confidence: 0.79
  },
  {
    time: "05:30",
    label: "Amrit Snan surge",
    ritualMultiplier: 2.4,
    populations: {
      "railway-station": 1640,
      "bus-stand": 1080,
      "parking-zone": 720,
      "entry-gate": 1320,
      "main-bridge": 960,
      "route-b": 360,
      "sangam-ghat": 1620,
      "temple": 880,
      "exit-route": 410,
      "medical-camp": 72,
      "river-safety-post": 36,
      "toilet-block": 690,
      "water-atm": 590
    },
    bridgeIncoming: 410,
    projectedBridgePopulation: 1128,
    minutesToCritical: 12,
    confidence: 0.82
  },
  {
    time: "05:45",
    label: "Intervention active",
    ritualMultiplier: 2.1,
    populations: {
      "railway-station": 1390,
      "bus-stand": 920,
      "parking-zone": 620,
      "entry-gate": 980,
      "main-bridge": 805,
      "route-b": 610,
      "sangam-ghat": 1780,
      "temple": 920,
      "exit-route": 570,
      "medical-camp": 86,
      "river-safety-post": 42,
      "toilet-block": 760,
      "water-atm": 650
    },
    bridgeIncoming: 260,
    projectedBridgePopulation: 890,
    minutesToCritical: 26,
    confidence: 0.78
  }
];

export const layerCatalog = [
  { id: "crowd", label: "Crowd", active: true },
  { id: "cameras", label: "Cameras", active: true },
  { id: "nodes", label: "Nodes", active: true },
  { id: "paths", label: "Paths", active: true },
  { id: "heatmap", label: "Heatmap", active: true },
  { id: "risk-zones", label: "Risk zones", active: true },
  { id: "toilets", label: "Toilets", active: false },
  { id: "medical", label: "Medical", active: true },
  { id: "police", label: "Police", active: true },
  { id: "river", label: "River", active: true },
  { id: "weather", label: "Weather", active: false },
  { id: "infrastructure", label: "Infrastructure", active: true }
];

export const cameraFeeds = [
  { id: "CAM-14", label: "Bridge east approach", count: 384, confidence: 0.88 },
  { id: "CAM-18", label: "Bridge exit ramp", count: 292, confidence: 0.84 },
  { id: "DRONE-03", label: "Sangam aerial", count: 742, confidence: 0.81 }
];

export function calculateCongestion(population, capacity) {
  if (capacity <= 0) return 0;
  return round2(population / capacity);
}

export function classifyRisk(score) {
  if (score >= 0.9) return "critical";
  if (score >= 0.75) return "strain";
  if (score >= 0.6) return "watch";
  return "stable";
}

export function getActiveScenarioStep(index) {
  const clampedIndex = Math.min(Math.max(index, 0), scenarioSteps.length - 1);
  return scenarioSteps[clampedIndex];
}

export function projectBridgeRisk(step) {
  const projectedScore = calculateCongestion(step.projectedBridgePopulation, getNodeCapacity("main-bridge"));

  return {
    nodeId: "main-bridge",
    minutesToCritical: step.minutesToCritical,
    projectedPopulation: step.projectedBridgePopulation,
    projectedScore,
    riskLabel: classifyRisk(projectedScore),
    confidence: step.confidence
  };
}

export function calculateDiversionImpact(step, diversionShare) {
  const bridgeCapacity = getNodeCapacity("main-bridge");
  const divertedPeople = Math.round(step.bridgeIncoming * diversionShare);
  const gateMeteringRelief = Math.round(bridgeCapacity * 0.15);
  const totalRelief = divertedPeople + gateMeteringRelief;
  const afterPopulation = Math.max(step.projectedBridgePopulation - totalRelief, 0);
  const beforeScore = calculateCongestion(step.projectedBridgePopulation, bridgeCapacity);
  const afterScore = calculateCongestion(afterPopulation, bridgeCapacity);

  return {
    divertedPeople,
    gateMeteringRelief,
    totalRelief,
    beforeScore,
    afterScore,
    reduction: round2(beforeScore - afterScore)
  };
}

export function getNodeCapacity(nodeId) {
  return nodes.find((node) => node.id === nodeId)?.capacity ?? 0;
}

export function getNodePopulation(step, nodeId) {
  return step.populations[nodeId] ?? 0;
}

export function getMissionKpis(step) {
  const totalCrowd = Object.values(step.populations).reduce((total, value) => total + value, 0);
  const managedCoreNodeIds = ["entry-gate", "main-bridge", "route-b", "sangam-ghat", "toilet-block", "water-atm"];
  const managedCorePopulation = managedCoreNodeIds.reduce((total, nodeId) => total + getNodePopulation(step, nodeId), 0);
  const managedCoreCapacity = managedCoreNodeIds.reduce((total, nodeId) => total + getNodeCapacity(nodeId), 0);
  const bridgeProjection = projectBridgeRisk(step);
  const activeAlerts = countActiveAlerts(step, bridgeProjection);

  return [
    { label: "Crowd", value: totalCrowd.toLocaleString(), trend: "+18% / 15m", tone: "neutral" },
    { label: "Capacity", value: `${Math.round((managedCorePopulation / managedCoreCapacity) * 100)}%`, trend: "core area", tone: "watch" },
    { label: "Risk", value: titleCase(bridgeProjection.riskLabel), trend: "Bridge-02", tone: bridgeProjection.riskLabel },
    { label: "Incidents", value: "2", trend: "1 medical, 1 access", tone: "neutral" },
    { label: "Active alerts", value: String(activeAlerts), trend: "3 priority", tone: "critical" },
    { label: "Weather", value: "18°C", trend: "clear / 3 km vis", tone: "stable" }
  ];
}

export function getInspectorNode(step, nodeId) {
  const projection = projectBridgeRisk(step);
  const impact = calculateDiversionImpact(step, 0.35);
  const currentPopulation = getNodePopulation(step, nodeId);

  return {
    id: "Bridge-02",
    name: "Main Bridge",
    capacity: getNodeCapacity(nodeId),
    currentPopulation,
    predictedPopulation: projection.projectedPopulation,
    riskScore: projection.projectedScore,
    inflow: step.bridgeIncoming,
    outflow: Math.max(projection.projectedPopulation - currentPopulation, 0) + impact.gateMeteringRelief - 106,
    emergencyAccess: "Restricted east lane / blue route open",
    connectedCameras: ["CAM-14", "CAM-18", "DRONE-03"],
    recommendation: "Redirect 35% of Entry Gate flow to Route B and meter bridge approach for 8 minutes.",
    confidence: projection.confidence
  };
}

export function getEventTimeline(step, projection, impact) {
  return [
    {
      time: step.time,
      type: "Observation",
      summary: `CAM-14 detects ${getNodePopulation(step, "main-bridge").toLocaleString()} people at Bridge-02`
    },
    {
      time: "+03m",
      type: "Prediction",
      summary: `Bridge-02 reaches ${Math.round(projection.projectedScore * 100)}% projected capacity in ${projection.minutesToCritical} min`
    },
    {
      time: "+04m",
      type: "Recommendation",
      summary: `Divert 35% flow to Route B; expected capacity drops to ${Math.round(impact.afterScore * 100)}%`
    },
    {
      time: "+05m",
      type: "Operator action",
      summary: "PA message queued; volunteer team V-12 assigned to Entry Gate"
    }
  ];
}

function countActiveAlerts(step, bridgeProjection) {
  const pressureNodes = ["entry-gate", "main-bridge", "sangam-ghat", "toilet-block", "water-atm"];
  const pressureAlerts = pressureNodes.filter((nodeId) => {
    const score = nodeId === "main-bridge"
      ? bridgeProjection.projectedScore
      : calculateCongestion(getNodePopulation(step, nodeId), getNodeCapacity(nodeId));
    return score >= 0.74;
  }).length;

  return pressureAlerts + 1;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
