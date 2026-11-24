import type { ContentBlock, LessonSection, ProviderImplementationDetails } from '../content/types';

const calloutToneClass: Record<'info' | 'warning' | 'success', string> = {
  info: 'border-info/40 bg-info/5',
  warning: 'border-warning/40 bg-warning/5',
  success: 'border-success/40 bg-success/5',
};

function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="text-[14px] leading-relaxed text-text-secondary">{block.text}</p>;

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-text-secondary">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-text-secondary">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );

    case 'code':
      return (
        <figure>
          <pre className="overflow-x-auto rounded-md bg-bg-subtle p-3 font-mono text-[12.5px] text-text">
            <code>{block.code}</code>
          </pre>
          {block.caption && <figcaption className="mt-1 text-[12px] text-text-muted">{block.caption}</figcaption>}
        </figure>
      );

    case 'callout':
      return (
        <div className={`rounded-md border px-3 py-2 text-[13px] text-text-secondary ${calloutToneClass[block.tone]}`}>
          {block.text}
        </div>
      );

    case 'comparisonTable':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} className="border-b border-border px-3 py-2 text-left font-medium text-text">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 align-top text-text-secondary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LessonSectionView({ section }: { section: LessonSection }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[15px] font-semibold text-text">{section.heading}</h3>
      {section.blocks.map((block, i) => (
        <ContentBlockView key={i} block={block} />
      ))}
    </section>
  );
}

export function ProviderDetailsView({ details }: { details: ProviderImplementationDetails }) {
  const terminologyEntries = Object.entries(details.terminology);

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h3 className="text-[14px] font-medium text-text">{details.serviceName}</h3>
        <a
          href={details.documentationUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-accent hover:text-accent-hover"
        >
          Official documentation
        </a>
      </div>

      <div>
        <h4 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Key features</h4>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
          {details.keyFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      {terminologyEntries.length > 0 && (
        <div>
          <h4 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Terminology</h4>
          <dl className="mt-1.5 space-y-1">
            {terminologyEntries.map(([common, providerTerm]) => (
              <div key={common} className="flex gap-2 text-[13px]">
                <dt className="text-text-muted">{common}</dt>
                <dd className="font-medium text-text">→ {providerTerm}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <h4 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Architectural notes</h4>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
          {details.architecturalNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      {details.limitations.length > 0 && (
        <div>
          <h4 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Limitations</h4>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
            {details.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
