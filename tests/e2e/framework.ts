/**
 * Memorandom E2E Test Framework Harness
 * Lightweight, zero-external-dependency test runner supporting
 * 4-Tier requirement-driven verification with structured reporting.
 */

export type Tier = "Tier 1: Feature Coverage" | "Tier 2: Boundary & Corner Cases" | "Tier 3: Cross-Feature Combinations" | "Tier 4: Real-World Scenarios";
export type Feature = "R1: Story Catalog" | "R2: Biography Document" | "R3: Historical Prompts" | "R4: Deployment & Offline" | "R5: Visual Stage" | "Cross-Feature" | "Real-World";

export interface TestResult {
  id: string;
  name: string;
  suite: string;
  tier: Tier;
  feature: Feature;
  status: "pass" | "fail" | "skip";
  durationMs: number;
  error?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: TestResult[];
  tierBreakdown: Record<string, { total: number; passed: number; failed: number }>;
  featureBreakdown: Record<string, { total: number; passed: number; failed: number }>;
}

class TestContext {
  private currentSuite = "Global";
  private currentTier: Tier = "Tier 1: Feature Coverage";
  private currentFeature: Feature = "R1: Story Catalog";
  public results: TestResult[] = [];
  private beforeHooks: (() => void | Promise<void>)[] = [];
  private afterHooks: (() => void | Promise<void>)[] = [];

  setSuite(name: string, tier: Tier, feature: Feature) {
    this.currentSuite = name;
    this.currentTier = tier;
    this.currentFeature = feature;
  }

  addBeforeEach(fn: () => void | Promise<void>) {
    this.beforeHooks.push(fn);
  }

  addAfterEach(fn: () => void | Promise<void>) {
    this.afterHooks.push(fn);
  }

  async runTest(
    id: string,
    name: string,
    fn: () => void | Promise<void>,
    tier?: Tier,
    feature?: Feature
  ): Promise<TestResult> {
    const activeTier = tier || this.currentTier;
    const activeFeature = feature || this.currentFeature;
    const startTime = Date.now();

    try {
      for (const hook of this.beforeHooks) {
        await hook();
      }

      await fn();

      for (const hook of this.afterHooks) {
        await hook();
      }

      const durationMs = Date.now() - startTime;
      const res: TestResult = {
        id,
        name,
        suite: this.currentSuite,
        tier: activeTier,
        feature: activeFeature,
        status: "pass",
        durationMs,
      };
      this.results.push(res);
      return res;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.stack || err.message : String(err);
      const res: TestResult = {
        id,
        name,
        suite: this.currentSuite,
        tier: activeTier,
        feature: activeFeature,
        status: "fail",
        durationMs,
        error: errorMessage,
      };
      this.results.push(res);
      return res;
    }
  }

  getSummary(): TestSuiteSummary {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const skipped = this.results.filter((r) => r.status === "skip").length;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    const tierBreakdown: Record<string, { total: number; passed: number; failed: number }> = {};
    const featureBreakdown: Record<string, { total: number; passed: number; failed: number }> = {};

    for (const r of this.results) {
      if (!tierBreakdown[r.tier]) {
        tierBreakdown[r.tier] = { total: 0, passed: 0, failed: 0 };
      }
      tierBreakdown[r.tier].total++;
      if (r.status === "pass") tierBreakdown[r.tier].passed++;
      if (r.status === "fail") tierBreakdown[r.tier].failed++;

      if (!featureBreakdown[r.feature]) {
        featureBreakdown[r.feature] = { total: 0, passed: 0, failed: 0 };
      }
      featureBreakdown[r.feature].total++;
      if (r.status === "pass") featureBreakdown[r.feature].passed++;
      if (r.status === "fail") featureBreakdown[r.feature].failed++;
    }

    return {
      total,
      passed,
      failed,
      skipped,
      durationMs,
      results: this.results,
      tierBreakdown,
      featureBreakdown,
    };
  }

  clear() {
    this.results = [];
    this.beforeHooks = [];
    this.afterHooks = [];
  }
}

export const globalTestContext = new TestContext();

export function suite(name: string, tier: Tier, feature: Feature, fn: () => void | Promise<void>) {
  globalTestContext.setSuite(name, tier, feature);
  return fn();
}

export function test(
  id: string,
  name: string,
  fn: () => void | Promise<void>,
  options?: { tier?: Tier; feature?: Feature }
) {
  return globalTestContext.runTest(id, name, fn, options?.tier, options?.feature);
}

export function it(
  id: string,
  name: string,
  fn: () => void | Promise<void>,
  options?: { tier?: Tier; feature?: Feature }
) {
  return test(id, name, fn, options);
}

export function beforeEach(fn: () => void | Promise<void>) {
  globalTestContext.addBeforeEach(fn);
}

export function afterEach(fn: () => void | Promise<void>) {
  globalTestContext.addAfterEach(fn);
}

/**
 * Deep equality helper
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Assertion interface
 */
export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      if (!deepEqual(actual, expected)) {
        throw new Error(
          `Expected deep equality:\nExpected: ${JSON.stringify(expected, null, 2)}\nReceived: ${JSON.stringify(actual, null, 2)}`
        );
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but received undefined`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy, but received ${JSON.stringify(actual)}`);
      }
    },
    toContain(item: any) {
      if (typeof actual === "string") {
        if (!actual.includes(item)) {
          throw new Error(`Expected string "${actual}" to contain substring "${item}"`);
        }
      } else if (Array.isArray(actual)) {
        const found = actual.some((x) => deepEqual(x, item) || x === item);
        if (!found) {
          throw new Error(`Expected array to contain item ${JSON.stringify(item)}`);
        }
      } else {
        throw new Error(`toContain called on non-string, non-array target`);
      }
    },
    toBeGreaterThan(num: number) {
      if (typeof actual !== "number" || actual <= num) {
        throw new Error(`Expected ${actual} to be greater than ${num}`);
      }
    },
    toBeGreaterThanOrEqual(num: number) {
      if (typeof actual !== "number" || actual < num) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${num}`);
      }
    },
    toBeLessThan(num: number) {
      if (typeof actual !== "number" || actual >= num) {
        throw new Error(`Expected ${actual} to be less than ${num}`);
      }
    },
    toBeLessThanOrEqual(num: number) {
      if (typeof actual !== "number" || actual > num) {
        throw new Error(`Expected ${actual} to be less than or equal to ${num}`);
      }
    },
    toMatch(pattern: RegExp | string) {
      const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
      if (typeof actual !== "string" || !regex.test(actual)) {
        throw new Error(`Expected string "${actual}" to match pattern ${pattern}`);
      }
    },
    toThrow(expectedMessage?: string | RegExp) {
      if (typeof actual !== "function") {
        throw new Error(`toThrow called on non-function`);
      }
      let threw = false;
      let thrownError: any;
      try {
        actual();
      } catch (e) {
        threw = true;
        thrownError = e;
      }
      if (!threw) {
        throw new Error(`Expected function to throw, but it did not throw`);
      }
      if (expectedMessage) {
        const msg = thrownError instanceof Error ? thrownError.message : String(thrownError);
        if (expectedMessage instanceof RegExp) {
          if (!expectedMessage.test(msg)) {
            throw new Error(`Expected thrown message "${msg}" to match pattern ${expectedMessage}`);
          }
        } else if (!msg.includes(expectedMessage)) {
          throw new Error(`Expected thrown message "${msg}" to contain "${expectedMessage}"`);
        }
      }
    },
    not: {
      toBe(expected: any) {
        if (actual === expected) {
          throw new Error(`Expected NOT ${JSON.stringify(expected)}, but received it`);
        }
      },
      toEqual(expected: any) {
        if (deepEqual(actual, expected)) {
          throw new Error(`Expected values to NOT be deeply equal`);
        }
      },
      toBeNull() {
        if (actual === null) {
          throw new Error(`Expected NOT null, but received null`);
        }
      },
      toBeUndefined() {
        if (actual === undefined) {
          throw new Error(`Expected NOT undefined, but received undefined`);
        }
      },
      toContain(item: any) {
        if (typeof actual === "string") {
          if (actual.includes(item)) {
            throw new Error(`Expected string "${actual}" to NOT contain substring "${item}"`);
          }
        } else if (Array.isArray(actual)) {
          const found = actual.some((x) => deepEqual(x, item) || x === item);
          if (found) {
            throw new Error(`Expected array to NOT contain item ${JSON.stringify(item)}`);
          }
        }
      },
    },
  };
}

/**
 * Mock Request builder for Next.js App Router route testing
 */
export function createMockRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
}

/**
 * In-memory Mock LocalStorage for testing isolated fallback states
 */
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

/**
 * Formats results into ANSI terminal summary and returns exit code
 */
export function formatTerminalSummary(summary: TestSuiteSummary): { text: string; success: boolean } {
  const lines: string[] = [];
  lines.push("\n=======================================================");
  lines.push("  MEMORANDUM E2E TEST SUITE REPORT (TIERS 1 - 4)");
  lines.push("=======================================================\n");

  lines.push(`Total Tests:    ${summary.total}`);
  lines.push(`Passed:         ${summary.passed} (✓)`);
  lines.push(`Failed:         ${summary.failed} (✗)`);
  lines.push(`Skipped:        ${summary.skipped}`);
  lines.push(`Total Duration: ${summary.durationMs}ms\n`);

  lines.push("--- TIER BREAKDOWN ---");
  for (const [tier, stats] of Object.entries(summary.tierBreakdown)) {
    const statusMark = stats.failed === 0 ? "✓" : "✗";
    lines.push(`  [${statusMark}] ${tier.padEnd(36)}: ${stats.passed}/${stats.total} passed`);
  }

  lines.push("\n--- FEATURE BREAKDOWN ---");
  for (const [feat, stats] of Object.entries(summary.featureBreakdown)) {
    const statusMark = stats.failed === 0 ? "✓" : "✗";
    lines.push(`  [${statusMark}] ${feat.padEnd(28)}: ${stats.passed}/${stats.total} passed`);
  }

  if (summary.failed > 0) {
    lines.push("\n--- FAILED TESTS DETAIL ---");
    for (const r of summary.results.filter((res) => res.status === "fail")) {
      lines.push(`\n[FAIL] [${r.id}] ${r.tier} > ${r.feature} > ${r.name}`);
      lines.push(`  Error: ${r.error?.split("\n")[0]}`);
      if (r.error) {
        const stackLines = r.error.split("\n").slice(1, 4).join("\n");
        lines.push(`  Stack: ${stackLines}`);
      }
    }
  }

  lines.push("\n=======================================================\n");
  return {
    text: lines.join("\n"),
    success: summary.failed === 0,
  };
}
