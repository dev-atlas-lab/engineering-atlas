import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { contextPropagationScene } from './distributed-tracing.scenes';
import { traceWaterfallSimulation, type TraceState } from './trace-waterfall';
import { renderTraceState } from './trace-waterfall-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const whyTracing: LessonBody = {
  learningObjectives: [
    'Explain the problem distributed tracing solves that metrics and logs cannot',
    'Explain why a slow request is hard to diagnose across many services',
    'Describe what a trace adds over correlated logs',
  ],
  analogy:
    'Metrics tell you a parcel is late. Logs are each depot’s notebook. A trace is the parcel’s end-to-end tracking page — every hop, with the time spent at each — so you can see exactly where it sat waiting.',
  sections: [
    {
      heading: 'The gap metrics and logs leave',
      blocks: [
        {
          type: 'paragraph',
          text: 'When one user request fans out across ten services, metrics tell you overall latency is up but not which service is slow, and logs tell you what each service did but not how the time was divided across them. Distributed tracing fills the gap: it records one request’s whole journey as a tree of timed operations, so you can see exactly where the latency or the failure is.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The three signals are complementary. Metrics detect that something is wrong (a symptom). Traces localise it to a service and operation. Logs explain the detail of what happened there. An investigation usually flows metric → trace → log.',
        },
      ],
    },
    {
      heading: 'Why distribution makes this hard',
      blocks: [
        {
          type: 'paragraph',
          text: 'In a monolith, a slow request is one call stack you can profile. Across services, the work happens on different machines, in parallel, with network hops in between — there is no single stack. Without tracing you are left correlating timestamps across log stores by hand. A trace reconstructs the causal tree automatically, including which calls ran in parallel and which waited on each other.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dt-why-1',
      type: 'scenario',
      prompt: 'Overall p99 latency is up. Metrics confirm the symptom but not the location; logs show each service did its job. What signal localises the slow hop?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the problem distributed tracing solves that metrics and logs cannot',
      options: [
        { id: 'a', label: 'A distributed trace — it shows how the request’s time was divided across services', correct: true, explanation: 'Correct — the trace localises the latency to a service and operation.' },
        { id: 'b', label: 'A bigger metric dashboard', correct: false, explanation: 'More aggregate metrics still will not show per-request, per-service breakdown.' },
        { id: 'c', label: 'Raising the log level to DEBUG everywhere', correct: false, explanation: 'That adds noise without reconstructing the cross-service timing tree.' },
      ],
    },
  ],
};

const tracesSpansContext: LessonBody = {
  learningObjectives: [
    'Define trace, span, and parent-child relationships, and trace IDs and span IDs',
    'Explain context propagation and the W3C traceparent header',
    'Read a trace waterfall: critical path and the earliest error',
  ],
  sections: [
    {
      heading: 'Traces and spans',
      blocks: [
        {
          type: 'list',
          items: [
            'A span is one timed operation — an HTTP handler, a database query, an outbound call — with a name, a start time, a duration, a status, and attributes.',
            'A trace is all the spans for one request, linked into a tree by parent-child relationships.',
            'A trace ID is shared by every span in the trace; a span ID identifies each span; each span records its parent span’s ID. That is what lets the backend reassemble the tree.',
          ],
        },
      ],
    },
    {
      heading: 'Context propagation',
      blocks: [
        {
          type: 'paragraph',
          text: 'For spans created on different machines to join one trace, the trace context must travel with the request. Each service reads the incoming trace context, creates its span as a child, and passes the context on in an outgoing header. The W3C Trace Context standard defines the traceparent header (carrying the trace ID, the parent span ID, and flags) so services and vendors interoperate. Drop the header anywhere and the trace breaks beyond that point. The diagram walks through this.',
        },
      ],
    },
    {
      heading: 'Reading a waterfall',
      blocks: [
        {
          type: 'paragraph',
          text: 'A trace is usually drawn as a waterfall: each span a horizontal bar positioned by its start and length, indented by depth. Two things jump out. The critical path is the chain of spans that determines the total duration — the long pole you must shorten to make the request faster. The earliest error span is the root cause of a failure; spans above it failed only because their downstream call did. The Investigate a Slow Distributed Request lab is built on reading exactly these.',
        },
      ],
    },
  ],
  visualization: contextPropagationScene,
  knowledgeCheck: [
    {
      id: 'dt-ts-1',
      type: 'single-choice',
      prompt: 'What links spans created on different machines into one trace?',
      difficulty: 'beginner',
      learningObjective: 'Define trace, span, and parent-child relationships, and trace IDs and span IDs',
      options: [
        { id: 'a', label: 'A shared trace ID, with each span recording its parent span ID', correct: true, explanation: 'Correct — the backend reassembles the tree from these IDs.' },
        { id: 'b', label: 'They all run on the same server', correct: false, explanation: 'They run on different machines; IDs are what link them.' },
        { id: 'c', label: 'Matching timestamps alone', correct: false, explanation: 'Timestamps are not reliable identifiers for one request.' },
      ],
    },
    {
      id: 'dt-ts-2',
      type: 'scenario',
      prompt: 'In a failing trace, spans in frontend, orders, payment, and bank-api are all marked error. Which is the root cause?',
      difficulty: 'intermediate',
      learningObjective: 'Read a trace waterfall: critical path and the earliest error',
      options: [
        { id: 'a', label: 'The earliest/deepest error span (bank-api) — the others failed because their downstream call failed', correct: true, explanation: 'Correct — errors propagate up the tree; the first one is the cause.' },
        { id: 'b', label: 'The frontend, because it returned the error to the user', correct: false, explanation: 'The frontend only surfaced a downstream failure.' },
        { id: 'c', label: 'Whichever span is longest', correct: false, explanation: 'Duration indicates slowness, not necessarily the failure origin.' },
      ],
    },
  ],
};

const samplingAndOtel: LessonBody = {
  learningObjectives: [
    'Explain head and tail sampling and why tracing is sampled',
    'Describe the OpenTelemetry architecture: SDK, Collector, OTLP, signals',
    'Explain how sampling can hide the trace you need',
  ],
  sections: [
    {
      heading: 'Sampling',
      blocks: [
        {
          type: 'paragraph',
          text: 'Tracing every request at full detail is expensive, so most systems sample — keep a fraction of traces. Where the decision is made matters:',
        },
        {
          type: 'comparisonTable',
          headers: ['Strategy', 'Decides', 'Trade-off'],
          rows: [
            ['Head sampling', 'At the start of the request, before the outcome is known (for example keep 5%)', 'Cheap and simple, but may drop the slow or failed trace you later want'],
            ['Tail sampling', 'After the request finishes, based on the outcome (keep all errors and slow traces)', 'Keeps the interesting traces, but needs a collector to buffer whole traces first'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'With head sampling, the trace for the one incident you are investigating may simply not have been kept. Sampling decisions should be consistent across a trace (all-or-nothing) so you never get half a trace, and many teams bias sampling to keep errors and slow requests.',
        },
      ],
    },
    {
      heading: 'OpenTelemetry',
      blocks: [
        {
          type: 'paragraph',
          text: 'OpenTelemetry (OTel) is the vendor-neutral standard for generating telemetry. It defines three signals — traces, metrics, and logs — an SDK that instruments your code, semantic conventions for naming, the OTLP wire protocol, and a Collector that receives, processes (batching, sampling, redaction), and exports telemetry to one or more backends. Because it is vendor-neutral, you instrument once and can send data to Azure Monitor, AWS, or a third-party backend without re-instrumenting — both Azure and AWS build their modern tracing on OpenTelemetry.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dt-s-1',
      type: 'scenario',
      prompt: 'You go to investigate a specific failed request’s trace and it is not in the tracing backend at all. With head sampling at 5%, why?',
      difficulty: 'advanced',
      learningObjective: 'Explain head and tail sampling and why tracing is sampled',
      options: [
        { id: 'a', label: 'The keep/drop decision was made at the request start, before the failure was known, and this trace was dropped', correct: true, explanation: 'Correct — tail sampling (keep errors) avoids exactly this.' },
        { id: 'b', label: 'Traces are never stored', correct: false, explanation: 'They are stored; this one was sampled out.' },
        { id: 'c', label: 'The trace ID was too long', correct: false, explanation: 'ID length is irrelevant to sampling.' },
      ],
    },
    {
      id: 'dt-s-2',
      type: 'single-choice',
      prompt: 'What is the role of the OpenTelemetry Collector?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the OpenTelemetry architecture: SDK, Collector, OTLP, signals',
      options: [
        { id: 'a', label: 'Receive, process (batch, sample, redact), and export telemetry to one or more backends', correct: true, explanation: 'Correct — it decouples instrumentation from the backend.' },
        { id: 'b', label: 'Generate the application’s spans', correct: false, explanation: 'The SDK in the app generates spans; the Collector handles them downstream.' },
        { id: 'c', label: 'Store traces permanently', correct: false, explanation: 'Storage is the backend’s job; the Collector routes to it.' },
      ],
    },
  ],
};

const azureAppInsights: LessonBody = {
  learningObjectives: ['Describe Azure Monitor Application Insights for distributed tracing'],
  sections: [
    {
      heading: 'Application Insights',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Monitor Application Insights collects application telemetry — requests, dependencies (outbound calls), exceptions, traces, and metrics — and correlates them into end-to-end transactions. Microsoft’s current, recommended approach is OpenTelemetry-based (the Azure Monitor OpenTelemetry Distro). In its data model, operation_Id corresponds to the trace ID and operation_ParentId to the parent span ID, so the backend joins spans into one operation; the Application Map visualises service-to-service calls, and the transaction view shows the per-request waterfall. Because Application Insights stores into Log Analytics, you can query traces and logs together with KQL.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Sampling in Application Insights keeps correlated telemetry together (it samples whole operations in or out), so you do not get half a transaction — but a sampled-out transaction is simply absent, the general sampling caveat.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Monitor Application Insights',
    keyFeatures: [
      'Requests, dependencies, exceptions, traces, and metrics correlated into transactions',
      'OpenTelemetry-based instrumentation (Azure Monitor OpenTelemetry Distro)',
      'operation_Id ↔ trace ID; operation_ParentId ↔ parent span ID',
      'Application Map and end-to-end transaction (waterfall) views',
      'Stored in Log Analytics; queryable with KQL alongside logs',
    ],
    terminology: {
      'Trace': 'Operation (operation_Id = trace ID)',
      'Span': 'Request / dependency telemetry (operation_ParentId = parent span ID)',
      'Service map': 'Application Map',
      'Instrumentation': 'Azure Monitor OpenTelemetry Distro',
    },
    architecturalNotes: [
      'Correlation uses operation_Id (trace) and operation_ParentId (parent span).',
      'Shares the Log Analytics backend, so traces and logs join in KQL.',
      'Sampling keeps whole operations together.',
    ],
    limitations: ['Sampled-out transactions are absent.', 'Exact correlation fields map to OpenTelemetry trace/span IDs.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview',
  },
  knowledgeCheck: [
    {
      id: 'dt-az-1',
      type: 'single-choice',
      prompt: 'In Application Insights, which field corresponds to the OpenTelemetry trace ID?',
      difficulty: 'intermediate',
      learningObjective: 'Describe Azure Monitor Application Insights for distributed tracing',
      options: [
        { id: 'a', label: 'operation_Id', correct: true, explanation: 'Correct — operation_Id is the trace ID; operation_ParentId is the parent span ID.' },
        { id: 'b', label: 'operation_ParentId', correct: false, explanation: 'That corresponds to the parent span ID.' },
        { id: 'c', label: 'customDimensions', correct: false, explanation: 'That holds arbitrary attributes, not the trace ID.' },
      ],
    },
  ],
  furtherReading: [{ label: 'Application Insights overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview' }],
};

const awsXray: LessonBody = {
  learningObjectives: ['Describe AWS X-Ray and its OpenTelemetry (ADOT) path for distributed tracing'],
  sections: [
    {
      heading: 'X-Ray',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS X-Ray records a request as a trace made of segments (the work of one service) and subsegments (finer-grained work, like a downstream call). It builds a service map (trace map) of how services call each other and lets you open individual traces as a timeline. Sampling is controlled by sampling rules — a reservoir (a fixed number of requests per second) plus a rate for the rest — evaluated in priority order. AWS’s vendor-neutral path is ADOT (the AWS Distro for OpenTelemetry): OpenTelemetry spans are converted to X-Ray segments and subsegments, and newer CloudWatch features (Transaction Search) ingest OTel spans through CloudWatch Logs.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS X-Ray',
    keyFeatures: [
      'Traces composed of segments (per service) and subsegments (finer work)',
      'Service/trace map of inter-service calls',
      'Sampling rules: reservoir + rate, evaluated by priority',
      'ADOT (AWS Distro for OpenTelemetry) instrumentation path',
      'Integration with CloudWatch (Transaction Search for OTel spans)',
    ],
    terminology: {
      'Trace': 'Trace',
      'Span (server)': 'Segment',
      'Span (downstream)': 'Subsegment',
      'Service map': 'Trace map',
      'Instrumentation': 'ADOT (AWS Distro for OpenTelemetry)',
    },
    architecturalNotes: [
      'OpenTelemetry server spans map to segments; other spans to subsegments.',
      'Sampling rules use a reservoir plus a percentage rate.',
      'Newer tracing uses OTel via ADOT and CloudWatch.',
    ],
    limitations: ['Head-style sampling can drop the trace you want (bias to keep errors).', 'Some older X-Ray behaviour differs from the OTel path.'],
    documentationUrl: 'https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html',
  },
  knowledgeCheck: [
    {
      id: 'dt-aws-1',
      type: 'single-choice',
      prompt: 'In AWS X-Ray, what is the record of the work done by one service called?',
      difficulty: 'beginner',
      learningObjective: 'Describe AWS X-Ray and its OpenTelemetry (ADOT) path for distributed tracing',
      options: [
        { id: 'a', label: 'A segment (with subsegments for finer work)', correct: true, explanation: 'Correct — segments map to OpenTelemetry server spans.' },
        { id: 'b', label: 'A log group', correct: false, explanation: 'That is a CloudWatch Logs concept.' },
        { id: 'c', label: 'An action group', correct: false, explanation: 'That is an Azure alerting concept.' },
      ],
    },
  ],
  furtherReading: [{ label: 'AWS X-Ray concepts', url: 'https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html' }],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure Application Insights and AWS X-Ray, and their shared OpenTelemetry basis'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Concept', 'Azure Application Insights', 'AWS X-Ray'],
          rows: [
            ['Trace unit', 'Operation (operation_Id)', 'Trace'],
            ['Span', 'Request / dependency telemetry', 'Segment / subsegment'],
            ['Service map', 'Application Map', 'Trace map'],
            ['Instrumentation', 'Azure Monitor OpenTelemetry Distro', 'ADOT (AWS Distro for OpenTelemetry)'],
            ['Store / query', 'Log Analytics + KQL', 'X-Ray (+ CloudWatch Transaction Search)'],
            ['Sampling', 'Operation-consistent sampling', 'Sampling rules (reservoir + rate)'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Both converge on OpenTelemetry: instrument with OTel and each backend ingests it (mapping spans to its own model). Differences remain in terminology (operation/dependency vs segment/subsegment), where traces are stored and queried, and how sampling is configured. Instrumenting with OpenTelemetry keeps you portable across both.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dt-cmp-1',
      type: 'single-choice',
      prompt: 'What do Azure and AWS distributed tracing increasingly have in common?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure Application Insights and AWS X-Ray, and their shared OpenTelemetry basis',
      options: [
        { id: 'a', label: 'OpenTelemetry-based instrumentation (Azure’s distro and AWS ADOT)', correct: true, explanation: 'Correct — OTel is the shared, vendor-neutral instrumentation standard.' },
        { id: 'b', label: 'They use the same storage backend', correct: false, explanation: 'Storage differs (Log Analytics vs X-Ray/CloudWatch).' },
        { id: 'c', label: 'Identical sampling configuration', correct: false, explanation: 'Sampling configuration differs between them.' },
      ],
    },
  ],
};

const investigateTraceLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Reveal a distributed trace span by span and diagnose the problem: a slow dependency on the critical path, a failed downstream span, or a slow branch in a parallel fan-out. Set your diagnosis and the lab checks it against the trace. Deterministic with fixed, illustrative traces; it is not a real tracing backend.',
  learningObjectives: [
    'Read a trace waterfall and identify the critical path',
    'Find the earliest error span as the root cause of a failure',
    'Explain why parallel fan-out makes the slowest branch the bottleneck',
  ],
  prerequisites: [
    { type: 'concept', id: 'traces-spans-and-context', label: 'Traces, Spans, and Context', description: 'Spans, trace IDs, and reading a waterfall.' },
  ],
  content: {
    simulationId: traceWaterfallSimulation.id,
    instructions: [
      { id: 'slow', label: '1. A slow dependency', description: 'Run the default. Reveal the spans and see bank-api’s authorize span consume most of the 920 ms on the critical path. Diagnose bank-api.' },
      { id: 'failed', label: '2. A failed span', description: 'Switch to the failed-span scenario. Several spans are red; the deepest error (bank-api) is the root cause, the rest are propagation. Diagnose bank-api.' },
      { id: 'fanout', label: '3. Parallel fan-out', description: 'Switch to the fan-out scenario. Three branches run in parallel; inventory’s 450 ms sets the critical path. Diagnose inventory.' },
      { id: 'wrong', label: '4. Test a wrong answer', description: 'Blame the frontend on any scenario and read why the trace rejects it.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'correct',
        label: 'Diagnosed the correct service from the trace',
        check: (state) => (state as TraceState).diagnosisCorrect === true,
      },
      {
        id: 'revealed',
        label: 'Revealed the full trace',
        check: (state) => {
          const s = state as TraceState;
          return s.revealed >= s.spans.length && s.revealed >= 5;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'why-distributed-tracing': whyTracing,
    'traces-spans-and-context': tracesSpansContext,
    'sampling-and-opentelemetry': samplingAndOtel,
    'azure-application-insights': azureAppInsights,
    'aws-x-ray': awsXray,
    'distributed-tracing-comparison': comparison,
  },
  labs: {
    'investigate-a-slow-distributed-request-lab': investigateTraceLab,
  },
  simulations: {
    'investigate-a-slow-distributed-request-lab': bindSimulation(traceWaterfallSimulation, renderTraceState),
  },
};
