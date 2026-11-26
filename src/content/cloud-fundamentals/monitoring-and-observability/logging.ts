import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { loggingPipelineScene } from './logging.scenes';
import { logInvestigationSimulation, type LogState } from './log-investigation';
import { renderLogState } from './log-investigation-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const loggingFundamentals: LessonBody = {
  learningObjectives: [
    'Distinguish structured from unstructured logs and explain why structure matters',
    'Use log levels appropriately and design a consistent event schema',
    'Explain what belongs in a log that does not belong in a metric',
  ],
  analogy:
    'If metrics are the dashboard gauges, logs are the flight recorder: a detailed, timestamped account of discrete events. You do not watch them continuously; you read them when something went wrong.',
  sections: [
    {
      heading: 'Structured versus unstructured',
      blocks: [
        {
          type: 'paragraph',
          text: 'An unstructured log is a line of free text: "2026-01-02 12:00:03 user 4123 checkout failed timeout". A structured log is the same event as named fields — JSON with timestamp, level, service, correlation ID, user ID, and message. The difference is everything at query time: you can filter structured logs by service and level, group by status code, and pivot on a correlation ID. Free text you can only grep.',
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "timestamp": "2026-01-02T12:00:03Z",\n  "level": "ERROR",\n  "service": "payment",\n  "correlationId": "req-7f3a",\n  "message": "timeout calling bank-api after 5000ms",\n  "durationMs": 5000\n}',
          caption: 'A structured log event. Named fields are what make it searchable and correlatable.',
        },
      ],
    },
    {
      heading: 'Levels and schemas',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Level', 'Use for'],
          rows: [
            ['ERROR', 'A failure that needs attention — a request failed, a dependency is down'],
            ['WARN', 'Something unexpected but handled — a retry, a fallback, approaching a limit'],
            ['INFO', 'Normal, significant events — a request served, a job completed'],
            ['DEBUG', 'Detailed internals for development; usually off or sampled in production'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Agree a schema: the same field names and types across every service (service, level, correlationId, traceId, timestamp). Consistency is what makes a single query span all services — without it, each team’s logs are an island.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Never log secrets or sensitive personal data — passwords, tokens, full card numbers. Logs are widely readable and long-lived; redact or omit at the source.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'log-fund-1',
      type: 'scenario',
      prompt: 'During an incident you need all failed payment requests for one user across five services. Which log format lets you do this with a single query?',
      difficulty: 'beginner',
      learningObjective: 'Distinguish structured from unstructured logs and explain why structure matters',
      options: [
        { id: 'a', label: 'Structured logs with consistent fields (service, level, userId, correlationId)', correct: true, explanation: 'Correct — named fields let you filter and correlate precisely.' },
        { id: 'b', label: 'Free-text logs grepped line by line', correct: false, explanation: 'Grep cannot reliably join one user’s events across services.' },
        { id: 'c', label: 'Metrics', correct: false, explanation: 'Metrics are aggregated numbers; they cannot show individual failed requests.' },
      ],
    },
  ],
};

const correlationAndTraceIds: LessonBody = {
  learningObjectives: [
    'Explain correlation IDs and trace IDs and how they link logs across services',
    'Explain context propagation and why IDs must be passed between services',
    'Explain how a correlation ID reassembles one request from interleaved logs',
  ],
  sections: [
    {
      heading: 'One request, many log lines',
      blocks: [
        {
          type: 'paragraph',
          text: 'In a distributed system, one user request produces log lines in several services, interleaved with lines from thousands of other concurrent requests. A correlation ID (often the same value as the trace ID) is a unique identifier attached to every log line for that request. Filtering by it reassembles the request’s whole journey in order, across every service — which is exactly what the Find a Failed Request lab does.',
        },
      ],
    },
    {
      heading: 'Context propagation',
      blocks: [
        {
          type: 'paragraph',
          text: 'For this to work, the ID must travel with the request from service to service — context propagation. The first service generates the ID (or reads it from an incoming header), includes it in its logs, and passes it downstream in a header. The W3C Trace Context standard (the traceparent header) defines a common format so that different services and vendors interoperate. If any service drops the header, the chain breaks there and you lose correlation beyond it.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Trace IDs link logs and traces together: the same trace ID appears on a request’s log lines and on its distributed trace, so you can jump from an error log straight to the trace that shows where the time went. Distributed Tracing covers the trace side in depth.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'log-cid-1',
      type: 'scenario',
      prompt: 'Logs for a request appear in the frontend and orders services but stop there, even though payment was involved. What most likely happened?',
      difficulty: 'intermediate',
      learningObjective: 'Explain context propagation and why IDs must be passed between services',
      options: [
        { id: 'a', label: 'The correlation/trace ID was not propagated to the payment service, so its logs carry a different (or no) ID', correct: true, explanation: 'Correct — context propagation broke, so payment’s logs are not linked to the request.' },
        { id: 'b', label: 'Payment did no work', correct: false, explanation: 'It was involved; its logs just are not correlated.' },
        { id: 'c', label: 'The log store lost the data', correct: false, explanation: 'More likely the ID was not passed downstream.' },
      ],
    },
  ],
};

const centralizedLogging: LessonBody = {
  learningObjectives: [
    'Describe the centralized logging pipeline: collect, process, store, query',
    'Explain ingestion, retention, and querying, and what drives cost',
    'Explain why local logs are insufficient in the cloud',
  ],
  sections: [
    {
      heading: 'The pipeline',
      blocks: [
        {
          type: 'paragraph',
          text: 'Centralized logging moves every service’s logs into one searchable system. An agent or collector gathers logs from each instance and ships them; a processing stage parses, enriches (adds service, environment, region), and redacts; the logs land in an indexed store with a retention policy; and engineers query that store during investigations. The diagram walks through each stage.',
        },
        {
          type: 'list',
          items: [
            'Ingestion: logs are collected and shipped continuously; volume here drives much of the cost.',
            'Retention: how long logs are kept — longer retention costs more, so teams keep high-value logs longer and drop or sample noisy ones.',
            'Querying: an indexed store makes search fast; without indexing, a cross-service search would be impractical.',
          ],
        },
      ],
    },
    {
      heading: 'Why not just local files?',
      blocks: [
        {
          type: 'callout',
          tone: 'warning',
          text: 'In the cloud, instances are disposable: they are replaced on deploys, scale-in, and failures, taking their local log files with them. And you cannot search one request across ten instances by logging into each. Centralized logging solves both — durability and a single searchable view.',
        },
      ],
    },
  ],
  visualization: loggingPipelineScene,
  knowledgeCheck: [
    {
      id: 'log-cl-1',
      type: 'single-choice',
      prompt: 'What most directly drives the cost of a centralized logging system?',
      difficulty: 'beginner',
      learningObjective: 'Explain ingestion, retention, and querying, and what drives cost',
      options: [
        { id: 'a', label: 'Ingestion volume and retention period', correct: true, explanation: 'Correct — how much you send and how long you keep it.' },
        { id: 'b', label: 'The number of dashboards', correct: false, explanation: 'Dashboards query; they are not the main cost driver.' },
        { id: 'c', label: 'The log level names', correct: false, explanation: 'Level names have no cost impact.' },
      ],
    },
  ],
};

const azureLogAnalytics: LessonBody = {
  learningObjectives: ['Describe Azure Monitor Logs / Log Analytics and KQL'],
  sections: [
    {
      heading: 'Log Analytics and KQL',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Monitor Logs stores log and other data in a Log Analytics workspace, queried with the Kusto Query Language (KQL). Data is organised into tables; KQL filters, aggregates, joins, and renders results, and the same queries power workbooks, dashboards, and log search alerts. Diagnostic settings route platform and resource logs into the workspace, and a retention policy governs how long data is kept. Application Insights (covered under tracing) is built on the same Log Analytics backend, so application telemetry and infrastructure logs can be queried together.',
        },
        {
          type: 'code',
          language: 'text',
          code: 'AppRequests\n| where TimeGenerated > ago(1h) and Success == false\n| summarize failures = count() by OperationName\n| order by failures desc',
          caption: 'An illustrative KQL query: failed requests in the last hour, grouped by operation.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Monitor Logs (Log Analytics)',
    keyFeatures: [
      'Log Analytics workspace as the central store',
      'Kusto Query Language (KQL) for filtering, aggregation, and joins',
      'Diagnostic settings route platform/resource logs in',
      'Configurable retention; workbooks and log search alerts',
      'Shared backend with Application Insights',
    ],
    terminology: {
      'Central log store': 'Log Analytics workspace',
      'Query language': 'Kusto Query Language (KQL)',
      'Log ingestion config': 'Diagnostic settings',
      'Log-based alert': 'Log search alert rule',
    },
    architecturalNotes: [
      'KQL queries power search, dashboards, workbooks, and log alerts.',
      'Application Insights shares the Log Analytics backend.',
    ],
    limitations: ['Retention and ingestion drive cost.', 'Query and alert specifics depend on workspace configuration.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-overview',
  },
  knowledgeCheck: [
    {
      id: 'log-az-1',
      type: 'single-choice',
      prompt: 'Which language queries data in an Azure Log Analytics workspace?',
      difficulty: 'beginner',
      learningObjective: 'Describe Azure Monitor Logs / Log Analytics and KQL',
      options: [
        { id: 'a', label: 'Kusto Query Language (KQL)', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'CloudWatch Logs Insights', correct: false, explanation: 'That is the AWS query tool.' },
        { id: 'c', label: 'SQL only', correct: false, explanation: 'Log Analytics uses KQL.' },
      ],
    },
  ],
  furtherReading: [{ label: 'Log Analytics overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-overview' }],
};

const awsCloudWatchLogs: LessonBody = {
  learningObjectives: ['Describe CloudWatch Logs, log groups/streams, Logs Insights, and metric filters'],
  sections: [
    {
      heading: 'CloudWatch Logs',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon CloudWatch Logs organises logs into log groups (one per application or service), each containing log streams (one per source). Retention is set per log group. CloudWatch Logs Insights queries logs with its own purpose-built query language; metric filters turn matching log patterns into CloudWatch metrics (so you can alarm on a log pattern); and subscription filters stream logs to other destinations (for example OpenSearch or Lambda) in real time.',
        },
        {
          type: 'code',
          language: 'text',
          code: 'fields @timestamp, @message\n| filter level = "ERROR"\n| stats count() by service\n| sort count() desc',
          caption: 'An illustrative CloudWatch Logs Insights query: error counts by service.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon CloudWatch Logs',
    keyFeatures: [
      'Log groups (per service) and log streams (per source)',
      'Per-log-group retention',
      'CloudWatch Logs Insights query language',
      'Metric filters to alarm on log patterns',
      'Subscription filters to stream logs to other destinations',
    ],
    terminology: {
      'Central log store': 'Log group',
      'Query language': 'CloudWatch Logs Insights',
      'Log-to-metric': 'Metric filter',
      'Log routing': 'Subscription filter',
    },
    architecturalNotes: [
      'Retention is configured per log group.',
      'Metric filters let a log pattern drive a CloudWatch alarm.',
      'Subscription filters fan logs out in real time.',
    ],
    limitations: ['Ingestion and retention drive cost.', 'Insights query features differ from KQL.'],
    documentationUrl: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html',
  },
  knowledgeCheck: [
    {
      id: 'log-aws-1',
      type: 'single-choice',
      prompt: 'In CloudWatch Logs, what turns a matching log pattern into a metric you can alarm on?',
      difficulty: 'intermediate',
      learningObjective: 'Describe CloudWatch Logs, log groups/streams, Logs Insights, and metric filters',
      options: [
        { id: 'a', label: 'A metric filter', correct: true, explanation: 'Correct — it converts log matches into a CloudWatch metric.' },
        { id: 'b', label: 'A log stream', correct: false, explanation: 'A log stream is a source of log events, not a metric generator.' },
        { id: 'c', label: 'A subscription filter', correct: false, explanation: 'That streams logs elsewhere; it does not create a metric to alarm on.' },
      ],
    },
  ],
  furtherReading: [{ label: 'What is CloudWatch Logs?', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html' }],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure Log Analytics and AWS CloudWatch Logs'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Concept', 'Azure', 'AWS'],
          rows: [
            ['Central store', 'Log Analytics workspace', 'Log group (+ streams)'],
            ['Query language', 'Kusto Query Language (KQL)', 'CloudWatch Logs Insights'],
            ['Ingestion config', 'Diagnostic settings', 'Agent / SDK / service integration'],
            ['Log → metric/alarm', 'Log search alert (KQL)', 'Metric filter → alarm'],
            ['Route logs out', 'Export / data collection rules', 'Subscription filter'],
            ['App + infra together', 'App Insights shares the workspace', 'CloudWatch unifies logs and metrics'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Both centralize logs, set retention, and offer a query language and a way to alert on log content. The clearest difference is the query language (KQL vs Logs Insights) and how each turns logs into alerts — Azure runs a KQL log search alert; AWS extracts a metric with a metric filter and alarms on it.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'log-cmp-1',
      type: 'single-choice',
      prompt: 'Which pairing of central log stores is correct?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure Log Analytics and AWS CloudWatch Logs',
      options: [
        { id: 'a', label: 'Azure Log Analytics workspace ↔ AWS CloudWatch Logs log group', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'Azure Log Analytics ↔ AWS X-Ray', correct: false, explanation: 'X-Ray is tracing.' },
        { id: 'c', label: 'KQL ↔ SNS', correct: false, explanation: 'KQL is a query language; SNS is notifications.' },
      ],
    },
  ],
};

const findFailedRequestLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Investigate a failed checkout through structured logs: start from the noisy incident window, filter to errors, pivot on the correlation ID to reassemble one request across services, and identify the first failure. Deterministic with fixed, illustrative log data; it is not a real log store.',
  learningObjectives: [
    'Use filtering and correlation-ID pivoting to find a failed request',
    'Reassemble one request’s journey across services from interleaved logs',
    'Distinguish the root failure from its downstream symptoms',
  ],
  prerequisites: [
    { type: 'concept', id: 'correlation-and-trace-ids', label: 'Correlation IDs and Trace IDs', description: 'How IDs link logs across services.' },
  ],
  content: {
    simulationId: logInvestigationSimulation.id,
    instructions: [
      { id: 'all', label: '1. The noisy window', description: 'Run the default. The full window interleaves several requests — too noisy to read directly.' },
      { id: 'errors', label: '2. Filter to errors', description: 'Step forward to level = ERROR. Three error lines share one correlation ID.' },
      { id: 'pivot', label: '3. Pivot on the correlation ID', description: 'Step forward to see that one request’s whole journey across services, in order.' },
      { id: 'root', label: '4. Find the first failure', description: 'Step to the root: payment timing out on bank-api, with the order failure and 502 as symptoms. Set your diagnosis to payment and confirm.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'reached-root',
        label: 'Pivoted to the correlation ID and reached the first failure',
        check: (state) => (state as LogState).filter === 'root',
      },
      {
        id: 'correct-root',
        label: 'Identified the correct root-cause service',
        check: (state) => (state as LogState).diagnosisCorrect === true,
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'logging-fundamentals': loggingFundamentals,
    'correlation-and-trace-ids': correlationAndTraceIds,
    'centralized-logging-architecture': centralizedLogging,
    'azure-log-analytics': azureLogAnalytics,
    'aws-cloudwatch-logs': awsCloudWatchLogs,
    'logging-comparison': comparison,
  },
  labs: {
    'find-a-failed-request-using-structured-logs-lab': findFailedRequestLab,
  },
  simulations: {
    'find-a-failed-request-using-structured-logs-lab': bindSimulation(logInvestigationSimulation, renderLogState),
  },
};
