import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { simulateScaling, autoScalingSimulation, type ScalingConfig } from './scaling-model';

const base: ScalingConfig = { policy: 'target-tracking', scenario: 'spike', min: 2, max: 8, target: 50 };
const run = (o: Partial<ScalingConfig>) => simulateScaling({ ...base, ...o });

describe('auto-scaling model', () => {
  it('respects the minimum and maximum capacity bounds', () => {
    const ticks = run({ min: 2, max: 6 });
    expect(ticks.every((t) => t.serving >= 2 && t.serving <= 6 && t.desired >= 2 && t.desired <= 6)).toBe(true);
  });

  it('scales out in response to a spike with target tracking', () => {
    const ticks = run({ policy: 'target-tracking', scenario: 'spike' });
    expect(ticks.some((t) => t.action === 'scale-out')).toBe(true);
    // Capacity ends higher than it started during the spike.
    expect(Math.max(...ticks.map((t) => t.serving))).toBeGreaterThan(2);
  });

  it('shows reactive scaling lag: the fleet is overloaded for at least one tick on a spike', () => {
    const ticks = run({ policy: 'target-tracking', scenario: 'spike' });
    expect(ticks.some((t) => t.overloaded)).toBe(true);
  });

  it('scheduled scaling handles the spike without overloading', () => {
    const ticks = run({ policy: 'scheduled', scenario: 'spike' });
    expect(ticks.some((t) => t.overloaded)).toBe(false);
    expect(ticks.some((t) => t.action === 'scheduled')).toBe(true);
  });

  it('step scaling holds during its cooldown', () => {
    const ticks = run({ policy: 'step', scenario: 'spike' });
    const actedAt = ticks.findIndex((t) => t.action === 'scale-out');
    expect(actedAt).toBeGreaterThanOrEqual(0);
    // The tick immediately after an action is a cooldown hold.
    expect(ticks[actedAt + 1]!.action).toBe('cooldown');
  });

  it('scales in when load falls below the target', () => {
    const ticks = run({ policy: 'target-tracking', scenario: 'diurnal' });
    expect(ticks.some((t) => t.action === 'scale-in')).toBe(true);
  });

  it('stays pinned at the maximum when the ceiling is too low for the load', () => {
    const ticks = run({ policy: 'target-tracking', scenario: 'spike', max: 3 });
    const spikeTicks = ticks.filter((t) => t.load >= 80);
    expect(spikeTicks.every((t) => t.desired <= 3)).toBe(true);
    expect(spikeTicks.some((t) => t.overloaded)).toBe(true);
  });

  it('is deterministic', () => {
    const params = { policy: 'step', scenario: 'gradual', min: 2, max: 10, target: 60 };
    expect(JSON.stringify(computeHistory(autoScalingSimulation, params))).toBe(JSON.stringify(computeHistory(autoScalingSimulation, params)));
  });

  it('enforces max > min after clamping invalid params', () => {
    const history = computeHistory(autoScalingSimulation, { min: 6, max: 2 });
    const config = history[0]!.state.config;
    expect(config.max).toBeGreaterThan(config.min);
  });
});
