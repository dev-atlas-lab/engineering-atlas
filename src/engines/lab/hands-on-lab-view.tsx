import { useProgressStore } from '../../stores/progress-store';
import type { HandsOnLab, LabDefinition } from '../../content/types';

interface HandsOnLabViewProps {
  lab: LabDefinition;
  content: HandsOnLab;
}

/** Per docs/LAB_ENGINE.md: the platform never claims to have verified a
 *  local lab result — every completion checkbox here is self-reported. */
export function HandsOnLabView({ lab, content }: HandsOnLabViewProps) {
  const labProgress = useProgressStore((s) => s.labs[lab.id]);
  const setChecklistItem = useProgressStore((s) => s.setLabChecklistItem);
  const setTaskCompleted = useProgressStore((s) => s.setLabTaskCompleted);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-[13px] font-medium text-text">Environment</h3>
        <ul className="mt-2 space-y-1.5">
          {content.environment.map((env) => (
            <li key={env.tool} className="text-[13px] text-text-secondary">
              <span className="font-medium text-text">{env.tool}</span>
              {env.version ? ` (${env.version})` : ''} —{' '}
              <a
                href={env.installUrl}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:text-accent-hover"
              >
                install
              </a>
              {' · '}
              <code className="rounded bg-bg-subtle px-1 py-0.5 font-mono text-[12px]">
                {env.verifyCommand}
              </code>
            </li>
          ))}
        </ul>
      </div>

      {content.starterFiles && content.starterFiles.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-[13px] font-medium text-text">Starter files</h3>
          <ul className="mt-2 space-y-3">
            {content.starterFiles.map((file) => (
              <li key={file.filename} className="text-[13px] text-text-secondary">
                <span className="font-mono font-medium text-text">{file.filename}</span> — {file.description}
                <pre className="mt-1.5 whitespace-pre-wrap rounded-md bg-bg-subtle p-3 font-mono text-[12px] text-text [overflow-wrap:anywhere]">
                  {file.content}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.tasks.map((task) => {
        const taskProgress = labProgress?.taskProgress[task.id];
        return (
          <div key={task.id} className="rounded-lg border border-border p-4">
            <h3 className="text-[14px] font-medium text-text">{task.title}</h3>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">
              {task.instructions}
            </p>

            {task.commands?.map((cmd) => (
              <div key={cmd.command} className="mt-2 rounded-md bg-bg-subtle p-3 font-mono text-[12px] text-text [overflow-wrap:anywhere]">
                <div>$ {cmd.command}</div>
                {cmd.expectedOutput && <div className="mt-1 text-text-muted">{cmd.expectedOutput}</div>}
              </div>
            ))}

            <ul className="mt-3 space-y-1.5">
              {task.validationChecklist.map((item) => {
                const checked = taskProgress?.checklist[item] ?? false;
                return (
                  <li key={item} className="flex items-start gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setChecklistItem(lab.id, task.id, item, e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className={checked ? 'text-text' : 'text-text-secondary'}>{item}</span>
                  </li>
                );
              })}
            </ul>

            {task.hints.length > 0 && (
              <details className="mt-3 text-[13px] text-text-secondary">
                <summary className="cursor-pointer font-medium text-text">Hints</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {task.hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </details>
            )}

            <label className="mt-3 flex items-center gap-2 text-[13px] font-medium text-text">
              <input
                type="checkbox"
                checked={taskProgress?.completed ?? false}
                onChange={(e) => setTaskCompleted(lab.id, task.id, e.target.checked)}
              />
              Mark task complete (self-reported)
            </label>
          </div>
        );
      })}

      <p className="rounded-md bg-bg-subtle px-3 py-2 text-[12px] text-text-muted">
        Self-reported — not automatically verified. Confirm your own output matches what&apos;s described above.
      </p>

      {content.cleanupInstructions && (
        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-4">
          <h3 className="text-[13px] font-medium text-text">Cleanup</h3>
          <p className="mt-1 text-[13px] text-text-secondary">{content.cleanupInstructions}</p>
        </div>
      )}
    </div>
  );
}
