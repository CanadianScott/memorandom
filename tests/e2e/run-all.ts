/**
 * Memorandom E2E Test Suite Master Runner
 * Executes all test suites across Tiers 1-4:
 * - R1: Story Catalog (Tier 1 & 2)
 * - R2: Biography Document (Tier 1 & 2)
 * - R3: Historical Prompts (Tier 1 & 2)
 * - R4: Deployment & Offline (Tier 1 & 2)
 * - R5: Visual Stage (Tier 1 & 2)
 * - Tier 3: Cross-Feature Combinations
 * - Tier 4: Real-World Scenarios
 *
 * Usage:
 *   npx tsx tests/e2e/run-all.ts
 */

import { globalTestContext, formatTerminalSummary } from "./framework";
import { runCatalogTests } from "./catalog.test";
import { runBiographyTests } from "./biography.test";
import { runHistoricalTests } from "./historical.test";
import { runDeploymentTests } from "./deployment.test";
import { runVisualStageTests } from "./visual-stage.test";
import { runCrossFeatureTests } from "./cross-feature.test";
import { runRealWorldTests } from "./real-world.test";
import { runBiographicalNarrativeTests } from "./biographical-narrative.test";

export async function runAllE2ETests() {
  const startTime = Date.now();
  console.log("\n🚀 Starting Memorandom Comprehensive E2E Test Suite (Tiers 1-4)...");

  // Clear any existing runs
  globalTestContext.clear();

  try {
    console.log("  → Running Biographical Narrative Synthesis tests...");
    await runBiographicalNarrativeTests();

    console.log("  → Running R1 Story Catalog tests...");
    await runCatalogTests();

    console.log("  → Running R2 Biography Document tests...");
    await runBiographyTests();

    console.log("  → Running R3 Historical Prompts tests...");
    await runHistoricalTests();

    console.log("  → Running R4 Deployment & Offline tests...");
    await runDeploymentTests();

    console.log("  → Running R5 Visual Stage tests...");
    await runVisualStageTests();

    console.log("  → Running Tier 3 Cross-Feature Combination tests...");
    await runCrossFeatureTests();

    console.log("  → Running Tier 4 Real-World Scenario tests...");
    await runRealWorldTests();
  } catch (fatalErr) {
    console.error("FATAL RUNNER ERROR:", fatalErr);
  }

  const summary = globalTestContext.getSummary();
  const { text, success } = formatTerminalSummary(summary);
  console.log(text);

  return { summary, success };
}

// Direct execution entrypoint
runAllE2ETests()
  .then(({ success }) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Runner execution failed:", err);
    process.exit(1);
  });
