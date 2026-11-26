import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';
import { metricsTimelineSimulation, buildSeries, type MetricsState } from './metrics-timeline';
import { alertEvaluationSimulation, evaluateAlerts, everFired, type AlertRuntimeState } from './alert-evaluation';
import { logInvestigationSimulation, LOGS, ROOT_SERVICE, type LogState } from './log-investigation';
import { traceWaterfallSimulation, criticalPath, depthOf, TRACES, type Span, type TraceState } from './trace-waterfall';
import { incidentInvestigationSimulation, STAGES, TRUE_CAUSE, type IncidentState } from './incident-investigation';

/** The final state after stepping a simulation to the end with given params. */
function finalState<T>(def: SimulationDefinition<T>, params: SimulationParams): T {
  const history = computeHistory(def, params);
  return history[history.length - 1]!.state;
}

function isDeterministic<T>(def: SimulationDefinition<T>, params: SimulationParams): boolean {
  return JSON.stringify(computeHistory(def, params)) === JSON.stringify(computeHistory(def, params));
}

describe('metrics timeline', () => {
  it('builds four golden-signal series of 12 ticks each', () => {
    const series = buildSeries('deploy-regression');
    expect(series.map((s) => s.key)).toEqual(['throughput', 'latency', 'errors', 'saturation']);
    for (const s of series) expect(s.values).toHaveLength(12);
  });

  it('reveals the true cause for each scenario at the end', () => {
    expect(finalState(metricsTimelineSimulation, { scenario: 'deploy-regression', diagnosis: 'bad-deploy' }).revealedCause).toBe('bad-deploy');
    expect(finalState(metricsTimelineSimulation, { scenario: 'traffic-saturation', diagnosis: 'bad-deploy' }).revealedCause).toBe('under-provisioned');
    expect(finalState(metricsTimelineSimulation, { scenario: 'dependency-failure', diagnosis: 'bad-deploy' }).revealedCause).toBe('dependency-failing');
  });

  it('marks a matching diagnosis correct and a mismatching one incorrect', () => {
    const right = finalState(metricsTimelineSimulation, { scenario: 'deploy-regression', diagnosis: 'bad-deploy' });
    const wrong = finalState(metricsTimelineSimulation, { scenario: 'deploy-regression', diagnosis: 'under-provisioned' });
    expect(right.diagnosisCorrect).toBe(true);
    expect(wrong.diagnosisCorrect).toBe(false);
  });

  it('only reveals the cause on the final tick', () => {
    const history = computeHistory(metricsTimelineSimulation, { scenario: 'deploy-regression', diagnosis: 'bad-deploy' });
    const states = history.map((h) => h.state as MetricsState);
    // Every state except the last has no revealed cause.
    expect(states.slice(0, -1).every((s) => s.revealedCause === null)).toBe(true);
    expect(states[states.length - 1]!.tick).toBe(11);
  });

  it('is deterministic', () => {
    expect(isDeterministic(metricsTimelineSimulation, { scenario: 'traffic-saturation', diagnosis: 'under-provisioned' })).toBe(true);
  });
});

describe('alert evaluation', () => {
  it('starts in insufficient-data and fires on a sustained real incident', () => {
    const evals = evaluateAlerts({ scenario: 'real-incident', thresholdType: 'static', threshold: 300, evaluationPeriods: 3 });
    expect(evals[0]!.state).toBe('insufficient-data');
    expect(everFired(evals)).toBe(true);
    // It auto-resolves once latency recovers.
    expect(evals.some((e) => e.transition === 'resolved')).toBe(true);
  });

  it('ignores a transient blip when the evaluation window needs several periods', () => {
    const evals = evaluateAlerts({ scenario: 'transient-blip', thresholdType: 'static', threshold: 300, evaluationPeriods: 3 });
    expect(everFired(evals)).toBe(false);
  });

  it('fires on the same blip when a single breaching period is enough', () => {
    const evals = evaluateAlerts({ scenario: 'transient-blip', thresholdType: 'static', threshold: 300, evaluationPeriods: 1 });
    expect(everFired(evals)).toBe(true);
  });

  it('misses gradual drift with a high static threshold but catches it with a dynamic band', () => {
    const staticHigh = evaluateAlerts({ scenario: 'gradual-drift', thresholdType: 'static', threshold: 500, evaluationPeriods: 3 });
    const dynamic = evaluateAlerts({ scenario: 'gradual-drift', thresholdType: 'dynamic', threshold: 500, evaluationPeriods: 3 });
    expect(everFired(staticHigh)).toBe(false);
    expect(everFired(dynamic)).toBe(true);
  });

  it('final runtime state records whether the alert ever fired', () => {
    const fired = finalState(alertEvaluationSimulation, { scenario: 'real-incident', thresholdType: 'static', threshold: 300, evaluationPeriods: 3 }) as AlertRuntimeState;
    expect(fired.fired).toBe(true);
  });

  it('is deterministic', () => {
    expect(isDeterministic(alertEvaluationSimulation, { scenario: 'gradual-drift', thresholdType: 'dynamic', threshold: 300, evaluationPeriods: 3 })).toBe(true);
  });
});

describe('log investigation', () => {
  it('filtering to errors shows exactly the three error lines', () => {
    const errors = LOGS.filter((l) => l.level === 'ERROR');
    expect(errors).toHaveLength(3);
  });

  it('reaches the root filter with the correct root service', () => {
    const state = finalState(logInvestigationSimulation, { diagnosis: ROOT_SERVICE });
    expect(state.filter).toBe('root');
    expect(state.resolved).toBe(true);
    expect(state.diagnosisCorrect).toBe(true);
  });

  it('rejects a wrong root-cause service', () => {
    const state = finalState(logInvestigationSimulation, { diagnosis: 'frontend' }) as LogState;
    expect(state.diagnosisCorrect).toBe(false);
  });

  it('only resolves on the final (root) step', () => {
    const history = computeHistory(logInvestigationSimulation, { diagnosis: ROOT_SERVICE });
    const states = history.map((h) => h.state as LogState);
    expect(states.slice(0, -1).every((s) => !s.resolved)).toBe(true);
  });

  it('is deterministic', () => {
    expect(isDeterministic(logInvestigationSimulation, { diagnosis: 'payment' })).toBe(true);
  });
});

describe('trace waterfall', () => {
  it('computes span depth from the parent chain', () => {
    const spans = TRACES['slow-dependency'].spans;
    const byId = new Map(spans.map((s) => [s.id, s] as const));
    const bankApi = spans.find((s) => s.service === 'bank-api')!;
    expect(depthOf(bankApi, byId)).toBe(3); // frontend -> orders -> payment -> bank-api
  });

  it('puts the slow dependency on the critical path', () => {
    const path = criticalPath(TRACES['slow-dependency'].spans);
    const bankApi = TRACES['slow-dependency'].spans.find((s) => s.service === 'bank-api')!;
    expect(path.has(bankApi.id)).toBe(true);
  });

  it('puts the slow parallel branch, not a fast one, on the critical path', () => {
    const spans = TRACES['fan-out'].spans;
    const path = criticalPath(spans);
    const inventory = spans.find((s) => s.service === 'inventory')!;
    const catalog = spans.find((s) => s.service === 'catalog')!;
    expect(path.has(inventory.id)).toBe(true);
    expect(path.has(catalog.id)).toBe(false);
  });

  it('reveals the at-fault service and checks the diagnosis at the end', () => {
    expect(finalState(traceWaterfallSimulation, { scenario: 'slow-dependency', diagnosis: 'bank-api' }).revealedCause).toBe('bank-api');
    expect(finalState(traceWaterfallSimulation, { scenario: 'fan-out', diagnosis: 'inventory' }).diagnosisCorrect).toBe(true);
    expect(finalState(traceWaterfallSimulation, { scenario: 'fan-out', diagnosis: 'payment' }).diagnosisCorrect).toBe(false);
  });

  it('reveals spans parent-before-child', () => {
    const state = finalState(traceWaterfallSimulation, { scenario: 'slow-dependency', diagnosis: 'bank-api' }) as TraceState;
    const seen = new Set<string>();
    for (const span of state.spans as Span[]) {
      if (span.parentId) expect(seen.has(span.parentId)).toBe(true);
      seen.add(span.id);
    }
  });

  it('is deterministic', () => {
    expect(isDeterministic(traceWaterfallSimulation, { scenario: 'failed-span', diagnosis: 'bank-api' })).toBe(true);
  });
});

describe('incident investigation', () => {
  it('walks every stage and reveals the true cause at the end', () => {
    const state = finalState(incidentInvestigationSimulation, { diagnosis: TRUE_CAUSE });
    expect(state.step).toBe(STAGES.length - 1);
    expect(state.seen).toHaveLength(STAGES.length);
    expect(state.revealedCause).toBe(TRUE_CAUSE);
    expect(state.diagnosisCorrect).toBe(true);
  });

  it('rejects a conclusion the evidence does not support', () => {
    const state = finalState(incidentInvestigationSimulation, { diagnosis: 'bad-deploy' }) as IncidentState;
    expect(state.diagnosisCorrect).toBe(false);
  });

  it('only reveals the cause on the final stage', () => {
    const history = computeHistory(incidentInvestigationSimulation, { diagnosis: TRUE_CAUSE });
    const states = history.map((h) => h.state as IncidentState);
    expect(states.slice(0, -1).every((s) => s.revealedCause === null)).toBe(true);
  });

  it('is deterministic', () => {
    expect(isDeterministic(incidentInvestigationSimulation, { diagnosis: 'dependency-failing' })).toBe(true);
  });
});
