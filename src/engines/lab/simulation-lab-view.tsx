import type { ReactNode } from 'react';
import { useSimulation } from '../simulation/use-simulation';
import { ParameterControl } from '../simulation/parameter-control';
import { TimelineController } from '../visualization/timeline-controller';
import type { SimulationDefinition } from '../simulation/types';
import type { SimulationLab } from '../../content/types';

interface SimulationLabViewProps<TState> {
  content: SimulationLab;
  simulation: SimulationDefinition<TState>;
  renderState: (state: TState) => ReactNode;
}

/** Per docs/LAB_ENGINE.md: simulation labs validate automatically against
 *  the deterministic simulation state — this is the one lab type the
 *  platform can honestly claim to have verified. */
export function SimulationLabView<TState>({ content, simulation, renderState }: SimulationLabViewProps<TState>) {
  const sim = useSimulation(simulation);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-bg-subtle p-4">{renderState(sim.current.state)}</div>

      <TimelineController
        stepIndex={sim.stepIndex}
        totalSteps={sim.totalSteps}
        stepLabel={sim.current.stepLabel}
        onStepTo={sim.stepTo}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-[13px] font-medium text-text">Parameters</h3>
          {simulation.parameters.map((param) => (
            <ParameterControl
              key={param.key}
              param={param}
              value={sim.params[param.key] ?? param.default}
              onChange={(value) => sim.setParameter(param.key, value)}
            />
          ))}
          <button onClick={sim.reset} className="text-[12px] font-medium text-accent hover:text-accent-hover">
            Reset simulation
          </button>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-4">
          <h3 className="text-[13px] font-medium text-text">Current step</h3>
          <p className="text-[13px] text-text-secondary">{sim.current.stepDescription}</p>
        </div>
      </div>

      <ol className="space-y-2 rounded-lg border border-border p-4">
        {content.instructions.map((step) => (
          <li key={step.id} className="text-[13px] text-text-secondary">
            <span className="font-medium text-text">{step.label}:</span> {step.description}
          </li>
        ))}
      </ol>

      {content.validationRules.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-[13px] font-medium text-text">Validation</h3>
          <ul className="mt-2 space-y-1.5">
            {content.validationRules.map((rule) => {
              const passed = rule.check(sim.current.state);
              return (
                <li key={rule.id} className="flex items-center gap-2 text-[13px]">
                  <span className={passed ? 'text-success' : 'text-text-muted'}>{passed ? '✓' : '○'}</span>
                  <span className={passed ? 'text-text' : 'text-text-secondary'}>{rule.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
