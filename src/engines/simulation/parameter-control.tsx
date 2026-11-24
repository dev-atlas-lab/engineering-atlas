import type { SimulationParamValue, SimulationParameter } from './types';

interface ParameterControlProps {
  param: SimulationParameter;
  value: SimulationParamValue;
  onChange: (value: SimulationParamValue) => void;
}

export function ParameterControl({ param, value, onChange }: ParameterControlProps) {
  return (
    <div>
      <label htmlFor={param.key} className="block text-[12px] font-medium text-text">
        {param.label}
      </label>

      {param.type === 'number' && (
        <input
          id={param.key}
          type="number"
          value={Number(value)}
          min={param.min}
          max={param.max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-text"
        />
      )}

      {param.type === 'boolean' && (
        <input
          id={param.key}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1"
        />
      )}

      {param.type === 'select' && (
        <select
          id={param.key}
          value={String(value)}
          onChange={(e) => {
            const option = param.options?.find((o) => String(o.value) === e.target.value);
            onChange(option ? option.value : e.target.value);
          }}
          className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-text"
        >
          {param.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      <p className="mt-0.5 text-[11px] text-text-muted">{param.description}</p>
    </div>
  );
}
