import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCongestion,
  calculateDiversionImpact,
  classifyRisk,
  getEventTimeline,
  getActiveScenarioStep,
  getInspectorNode,
  getMissionKpis,
  projectBridgeRisk,
  scenarioSteps
} from "../src/simulation.js";

test("calculateCongestion returns a rounded capacity ratio", () => {
  assert.equal(calculateCongestion(940, 1000), 0.94);
  assert.equal(calculateCongestion(333, 1000), 0.33);
});

test("calculateCongestion returns zero for invalid capacity", () => {
  assert.equal(calculateCongestion(500, 0), 0);
  assert.equal(calculateCongestion(500, -20), 0);
});

test("classifyRisk maps scores to stable, watch, strain, and critical", () => {
  assert.equal(classifyRisk(0.42), "stable");
  assert.equal(classifyRisk(0.68), "watch");
  assert.equal(classifyRisk(0.82), "strain");
  assert.equal(classifyRisk(0.94), "critical");
});

test("getActiveScenarioStep clamps indexes to the available range", () => {
  assert.equal(getActiveScenarioStep(-10), scenarioSteps[0]);
  assert.equal(getActiveScenarioStep(999), scenarioSteps[scenarioSteps.length - 1]);
});

test("projectBridgeRisk calculates time, score, and risk label for a step", () => {
  const step = getActiveScenarioStep(2);
  const projection = projectBridgeRisk(step);

  assert.equal(projection.nodeId, "main-bridge");
  assert.equal(projection.minutesToCritical, 12);
  assert.equal(projection.projectedScore, 0.94);
  assert.equal(projection.riskLabel, "critical");
});

test("calculateDiversionImpact estimates lower bridge pressure after diversion", () => {
  const step = getActiveScenarioStep(2);
  const impact = calculateDiversionImpact(step, 0.35);

  assert.equal(impact.divertedPeople, 144);
  assert.equal(impact.beforeScore, 0.94);
  assert.equal(impact.afterScore, 0.67);
  assert.equal(impact.reduction, 0.27);
});

test("getMissionKpis summarizes command center state for the active step", () => {
  const step = getActiveScenarioStep(2);
  const kpis = getMissionKpis(step);

  assert.deepEqual(kpis.map((kpi) => kpi.label), [
    "Crowd",
    "Capacity",
    "Risk",
    "Incidents",
    "Active alerts",
    "Weather"
  ]);
  assert.equal(kpis[0].value, "10,378");
  assert.equal(kpis[1].value, "72%");
  assert.equal(kpis[2].value, "Critical");
  assert.equal(kpis[4].value, "6");
});

test("getInspectorNode returns Bridge-02 operational details", () => {
  const step = getActiveScenarioStep(2);
  const inspector = getInspectorNode(step, "main-bridge");

  assert.equal(inspector.id, "Bridge-02");
  assert.equal(inspector.currentPopulation, 960);
  assert.equal(inspector.predictedPopulation, 1128);
  assert.equal(inspector.riskScore, 0.94);
  assert.equal(inspector.inflow, 410);
  assert.equal(inspector.outflow, 242);
  assert.equal(inspector.confidence, 0.82);
  assert.deepEqual(inspector.connectedCameras, ["CAM-14", "CAM-18", "DRONE-03"]);
});

test("getEventTimeline returns ordered observation to action events", () => {
  const step = getActiveScenarioStep(2);
  const projection = projectBridgeRisk(step);
  const impact = calculateDiversionImpact(step, 0.35);
  const events = getEventTimeline(step, projection, impact);

  assert.deepEqual(events.map((event) => event.type), [
    "Observation",
    "Prediction",
    "Recommendation",
    "Operator action"
  ]);
  assert.equal(events[1].summary, "Bridge-02 reaches 94% projected capacity in 12 min");
  assert.equal(events[2].summary, "Divert 35% flow to Route B; expected capacity drops to 67%");
});
