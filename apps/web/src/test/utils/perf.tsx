import React, { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";

/**
 * CI environments have variable performance. Apply a multiplier to duration
 * budgets to avoid flaky tests while still catching real regressions.
 */
const CI_DURATION_MULTIPLIER = process.env.CI ? 2 : 1;

export interface RenderInfo {
  phase: "mount" | "update" | "nested-update";
  duration: number;
  commitTime: number;
}

export interface RenderMetrics {
  renderCount: number;
  totalDuration: number;
  renders: RenderInfo[];
  reset: () => void;
}

interface TrackerResult {
  Tracker: React.FC<{ children: ReactNode }>;
  metrics: RenderMetrics;
}

/**
 * Creates a render tracker that wraps components with React's Profiler
 * to measure render counts and durations.
 */
export function createRenderTracker(): TrackerResult {
  const metrics: RenderMetrics = {
    renderCount: 0,
    totalDuration: 0,
    renders: [],
    reset() {
      this.renderCount = 0;
      this.totalDuration = 0;
      this.renders = [];
    },
  };

  const onRender: ProfilerOnRenderCallback = (
    _id,
    phase,
    actualDuration,
    _baseDuration,
    _startTime,
    commitTime
  ) => {
    metrics.renderCount++;
    metrics.totalDuration += actualDuration;
    metrics.renders.push({
      phase: phase as RenderInfo["phase"],
      duration: Math.round(actualDuration * 100) / 100,
      commitTime,
    });
  };

  function Tracker({ children }: { children: ReactNode }) {
    return (
      <Profiler id="render-tracker" onRender={onRender}>
        {children}
      </Profiler>
    );
  }

  return { Tracker, metrics };
}

/**
 * Asserts that render count is within budget.
 * Throws a descriptive error if exceeded for agent-friendly debugging.
 */
export function expectRenderCount(metrics: RenderMetrics, max: number): void {
  if (metrics.renderCount > max) {
    const rendersJson = JSON.stringify(
      metrics.renders.map((r) => ({ phase: r.phase, duration: r.duration })),
      null,
      2
    );
    throw new Error(
      `Render budget exceeded: ${metrics.renderCount} renders (max: ${max})\n` +
        `Total duration: ${Math.round(metrics.totalDuration * 100) / 100}ms\n` +
        `Renders: ${rendersJson}`
    );
  }
}

/**
 * Asserts that total render duration is within budget.
 * Throws a descriptive error if exceeded for agent-friendly debugging.
 * In CI, the budget is multiplied by CI_DURATION_MULTIPLIER to account for slower runners.
 */
export function expectRenderDuration(metrics: RenderMetrics, maxMs: number): void {
  const adjustedMax = maxMs * CI_DURATION_MULTIPLIER;
  if (metrics.totalDuration > adjustedMax) {
    const rendersJson = JSON.stringify(
      metrics.renders.map((r) => ({ phase: r.phase, duration: r.duration })),
      null,
      2
    );
    throw new Error(
      `Duration budget exceeded: ${Math.round(metrics.totalDuration * 100) / 100}ms (max: ${adjustedMax}ms)\n` +
        `Render count: ${metrics.renderCount}\n` +
        `Renders: ${rendersJson}`
    );
  }
}

/**
 * Combined assertion for both render count and duration.
 * Useful for concise budget checks.
 */
export function expectWithinBudget(
  metrics: RenderMetrics,
  budget: { renders: number; duration: number }
): void {
  expectRenderCount(metrics, budget.renders);
  expectRenderDuration(metrics, budget.duration);
}
