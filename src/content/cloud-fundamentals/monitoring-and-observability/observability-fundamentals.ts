import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { threeSignalsScene } from './observability-fundamentals.scenes';
import { incidentInvestigationSimulation, STAGES, type IncidentState } from './incident-investigation';
import { renderIncidentState } from './incident-investigation-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const monitoringVsObservability: LessonBody = {
  learningObjectives: [
    'Distinguish monitoring from observability',
    'Describe the three signals — metrics, logs, and traces — and the job each does',
    'Explain known-unknowns versus unknown-unknowns',
  ],
  analogy:
    'Monitoring is the set of warning lights on a car’s dashboard: predefined checks for problems you anticipated. Observability is being able to open the hood and instrument anything to answer a question you had not thought to ask in advance.',
  sections: [
    {
      heading: 'Two related ideas',
      blocks: [
        {
          type: 'paragraph',
          text: 'Monitoring is watching known indicators against expectations — predefined dashboards and alerts for failure modes you anticipated. Observability is a property of the system: how well you can understand its internal state from the outputs it emits, including questions you did not plan for. You monitor the things you already know to watch; you rely on observability when something new and unexpected breaks and you must explore. Good systems have both: monitoring tells you something is wrong, observability lets you find out why.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Monitoring', 'Observability'],
          rows: [
            ['Answers', 'Is a known thing OK?', 'Why is this (possibly novel) thing happening?'],
            ['Shape', 'Predefined dashboards and alerts', 'Rich, high-cardinality telemetry you can slice freely'],
            ['Best at', 'Known-unknowns (failures you expected)', 'Unknown-unknowns (failures you did not)'],
          ],
        },
      ],
    },
    {
      heading: 'The three signals',
      blocks: [
        {
          type: 'paragraph',
          text: 'Observability is usually built from three telemetry signals, each answering a different question. They are complementary, not competing — a real investigation flows between them, which the diagram shows.',
        },
        {
          type: 'comparisonTable',
          headers: ['Signal', 'Job', 'Answers'],
          rows: [
            ['Metrics', 'Detect — cheap aggregates, continuously sampled', 'Is something wrong, and how much?'],
            ['Traces', 'Localise — one request’s path across services', 'Which service / operation is slow or failing?'],
            ['Logs', 'Explain — the detail of individual events', 'What exactly happened in that request?'],
          ],
        },
      ],
    },
    {
      heading: 'Metric → trace → log',
      blocks: [
        {
          type: 'paragraph',
          text: 'The signals have their own detailed treatment in the Metrics & Alerting, Distributed Tracing, and Logging concepts. What ties them together is the investigation flow: a metric alert detects a symptom, a trace localises it to one service and span, and that service’s logs — found by the same trace ID — explain the exact failure. The End-to-End Incident Investigation lab walks this path.',
        },
      ],
    },
  ],
  visualization: threeSignalsScene,
  knowledgeCheck: [
    {
      id: 'of-mvo-1',
      type: 'scenario',
      prompt: 'A failure happens that nobody anticipated, so no dashboard or alert was built for it. Which property most helps you understand it?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish monitoring from observability',
      options: [
        { id: 'a', label: 'Observability — rich telemetry you can explore to answer new questions', correct: true, explanation: 'Correct — observability shines on the unknown-unknowns that predefined monitoring did not cover.' },
        { id: 'b', label: 'More predefined alerts', correct: false, explanation: 'You cannot predefine an alert for a failure you did not anticipate.' },
        { id: 'c', label: 'A higher metric retention', correct: false, explanation: 'Retention alone does not let you ask new questions of the data.' },
      ],
    },
    {
      id: 'of-mvo-2',
      type: 'single-choice',
      prompt: 'Which signal is best for detecting that something is wrong quickly and cheaply?',
      difficulty: 'beginner',
      learningObjective: 'Describe the three signals — metrics, logs, and traces — and the job each does',
      options: [
        { id: 'a', label: 'Metrics', correct: true, explanation: 'Correct — metrics are cheap aggregates sampled continuously, ideal for detection.' },
        { id: 'b', label: 'Logs', correct: false, explanation: 'Logs explain individual events but are not the cheapest way to detect a system-wide symptom.' },
        { id: 'c', label: 'Traces', correct: false, explanation: 'Traces localise a problem to a service; detection usually starts with a metric.' },
      ],
    },
  ],
};

const goldenSignalsAndSlos: LessonBody = {
  learningObjectives: [
    'Define SLI, SLO, and SLA and how they relate',
    'Explain error budgets and what they are used for',
    'Connect the golden signals to the indicators you choose to measure',
  ],
  sections: [
    {
      heading: 'SLI, SLO, SLA',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Term', 'What it is', 'Example'],
          rows: [
            ['SLI (Indicator)', 'A measured number describing service quality', 'The fraction of requests served in under 300 ms'],
            ['SLO (Objective)', 'A target for an SLI over a window — your internal goal', '99.9% of requests under 300 ms over 30 days'],
            ['SLA (Agreement)', 'A contract with consequences if an SLO-like target is missed', 'Credits owed to customers if monthly availability < 99.9%'],
          ],
        },
        {
          type: 'paragraph',
          text: 'An SLI is the measurement, an SLO is the target you hold yourselves to, and an SLA is the external promise with penalties. SLOs are usually set stricter than SLAs so you notice and react before a contractual breach. Good SLIs are user-centric — they measure what users actually experience (success rate, latency), which is exactly what the golden signals capture.',
        },
      ],
    },
    {
      heading: 'Error budgets',
      blocks: [
        {
          type: 'paragraph',
          text: 'An SLO of 99.9% success implies its complement: 0.1% of requests are allowed to fail. That allowance is the error budget. It reframes reliability as a quantity you spend: while budget remains, the team can ship features and take risks; when it is exhausted, the priority shifts to reliability work. It turns an endless "be more reliable" argument into a shared, measurable number.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: '100% is the wrong reliability target. It is effectively impossible, enormously expensive, and users cannot tell the difference between 100% and 99.99% through their own flaky networks and devices. The error budget makes the cost of chasing nines explicit.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'of-slo-1',
      type: 'single-choice',
      prompt: 'What is the difference between an SLO and an SLA?',
      difficulty: 'intermediate',
      learningObjective: 'Define SLI, SLO, and SLA and how they relate',
      options: [
        { id: 'a', label: 'An SLO is an internal target; an SLA is an external contract with consequences for missing it', correct: true, explanation: 'Correct — SLOs are usually stricter so you react before an SLA is breached.' },
        { id: 'b', label: 'They are the same thing', correct: false, explanation: 'An SLA adds a contractual commitment and penalties; an SLO is an internal goal.' },
        { id: 'c', label: 'An SLA is the raw measurement', correct: false, explanation: 'The raw measurement is the SLI.' },
      ],
    },
    {
      id: 'of-slo-2',
      type: 'scenario',
      prompt: 'Your service has a 99.9% success SLO and has used almost none of its error budget this month. What does that permit?',
      difficulty: 'intermediate',
      learningObjective: 'Explain error budgets and what they are used for',
      options: [
        { id: 'a', label: 'Spending budget on feature velocity and riskier changes — reliability is comfortably within target', correct: true, explanation: 'Correct — an unspent budget is headroom the team can deliberately use.' },
        { id: 'b', label: 'Nothing; the budget is irrelevant to delivery decisions', correct: false, explanation: 'The budget is explicitly meant to inform the balance of features vs reliability work.' },
        { id: 'c', label: 'Immediately raising the SLO to 100%', correct: false, explanation: '100% is not a sensible target; the budget exists precisely because some failure is acceptable.' },
      ],
    },
  ],
};

const observabilityDashboards: LessonBody = {
  learningObjectives: [
    'Describe what makes a dashboard useful versus noisy',
    'Lay out a service dashboard around the golden signals',
    'Recognise common dashboard anti-patterns',
  ],
  sections: [
    {
      heading: 'Dashboards that answer a question',
      blocks: [
        {
          type: 'paragraph',
          text: 'A dashboard exists to answer a specific question at a glance — most often "is this service healthy, and if not, where do I look next?" The strongest layout puts user-facing symptoms (the golden signals: latency, traffic, errors, saturation) at the top, so the first screen tells you whether users are affected, with cause-oriented panels (per-dependency, per-resource) below for drilling down. One dashboard, one audience, one question.',
        },
        {
          type: 'list',
          items: [
            'Symptoms on top: the golden signals first, so health is readable in seconds.',
            'Causes below: dependency and resource panels to drill into once a symptom is seen.',
            'Consistent time range and clear units, so panels can be compared at a glance.',
            'Annotations for deploys and incidents, so changes line up with the metrics that moved.',
          ],
        },
      ],
    },
    {
      heading: 'Anti-patterns',
      blocks: [
        {
          type: 'callout',
          tone: 'warning',
          text: 'The "wall of graphs" is the classic failure: dozens of panels with no hierarchy, so nothing stands out and the dashboard is unreadable under pressure. Other traps: mixing unrelated services on one board, charting causes without the symptoms that make them matter, and vanity panels nobody acts on. If a panel never changes a decision, remove it.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'of-dash-1',
      type: 'scenario',
      prompt: 'You are designing the primary dashboard for a user-facing service. What belongs at the very top?',
      difficulty: 'intermediate',
      learningObjective: 'Lay out a service dashboard around the golden signals',
      options: [
        { id: 'a', label: 'User-facing symptoms — the golden signals (latency, traffic, errors, saturation)', correct: true, explanation: 'Correct — symptoms first tell you in seconds whether users are affected.' },
        { id: 'b', label: 'Every available metric, so nothing is missed', correct: false, explanation: 'That produces an unreadable wall of graphs with no hierarchy.' },
        { id: 'c', label: 'Low-level per-host CPU graphs', correct: false, explanation: 'Those are cause panels for drill-down, not the top-line health view.' },
      ],
    },
  ],
};

const incidentInvestigationAndRca: LessonBody = {
  learningObjectives: [
    'Describe the cross-signal investigation workflow from alert to root cause',
    'Explain how correlation (by trace ID) links the three signals',
    'Explain root-cause analysis and the value of a blameless postmortem',
  ],
  sections: [
    {
      heading: 'Working an incident across signals',
      blocks: [
        {
          type: 'paragraph',
          text: 'A disciplined investigation follows the signals in order. An alert on a user-facing symptom starts it. Metrics localise the kind of problem — which golden signals moved and which stayed flat separates a code change from a capacity problem from a failing dependency. Logs, filtered to the incident window and pivoted on a correlation ID, reassemble one failed request and reveal the first service to fail. The trace for that request pinpoints the exact span. Each step narrows "something is wrong" toward one cause.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Correlation is what makes the flow fast: the same trace ID appears on the request’s metrics exemplars, its log lines, and its trace, so you can jump from a symptom straight to the request that caused it rather than searching blind. The End-to-End Incident Investigation lab is this exact workflow, guided.',
        },
      ],
    },
    {
      heading: 'Root-cause analysis and blameless postmortems',
      blocks: [
        {
          type: 'paragraph',
          text: 'Root-cause analysis separates the true cause from its symptoms: a 502 at the frontend, a timeout in the orders service, and a failing payments dependency are not three problems but one, propagating upward. The goal is the earliest link in the chain you can act on. After resolution, a blameless postmortem records the timeline, impact, cause, and — most importantly — the systemic fixes, treating failures as weaknesses in the system rather than faults of individuals.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Blame makes outages worse over time: if people fear punishment they hide information, and the organisation stops learning. A blameless culture gets the honest detail needed to actually prevent recurrence.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'of-rca-1',
      type: 'scenario',
      prompt: 'During an incident you see a 502 at the frontend, a timeout logged in orders, and errors from the payments dependency. How should you treat these?',
      difficulty: 'intermediate',
      learningObjective: 'Explain root-cause analysis and the value of a blameless postmortem',
      options: [
        { id: 'a', label: 'As one failure propagating upward — find the earliest actionable link (the failing dependency), not three separate bugs', correct: true, explanation: 'Correct — RCA follows the chain to its earliest actionable cause.' },
        { id: 'b', label: 'As three unrelated incidents to assign to three teams', correct: false, explanation: 'They are symptoms of one root cause propagating through the call chain.' },
        { id: 'c', label: 'As a reason to page everyone and restart services at random', correct: false, explanation: 'The signals already point to a specific cause; investigate, do not thrash.' },
      ],
    },
  ],
};

const azureObservabilitySuite: LessonBody = {
  learningObjectives: ['Describe how the Azure Monitor suite covers metrics, logs, traces, alerts, and dashboards'],
  sections: [
    {
      heading: 'The Azure Monitor umbrella',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Monitor is the umbrella service for observability on Azure. Metrics are stored in Azure Monitor Metrics; logs and query data live in a Log Analytics workspace queried with KQL; Application Insights provides distributed tracing and application telemetry on the same Log Analytics backend; alerts (metric and log) route through action groups; and visualisation is provided by Azure Monitor dashboards and Workbooks, with Azure Managed Grafana as an option. Because application and infrastructure data share the Log Analytics backend, a single KQL query can join a symptom to the request that caused it.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Each piece is covered in depth in its own concept: Metrics & Alerting (Azure Monitor metrics), Logging (Log Analytics), and Distributed Tracing (Application Insights). This lesson is the map that ties them together.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Monitor suite',
    keyFeatures: [
      'Azure Monitor Metrics for metrics',
      'Log Analytics workspace (KQL) for logs',
      'Application Insights for distributed tracing and app telemetry',
      'Metric and log alerts routed via action groups',
      'Dashboards, Workbooks, and Azure Managed Grafana for visualisation',
    ],
    terminology: {
      'Observability umbrella': 'Azure Monitor',
      'Metrics store': 'Azure Monitor Metrics',
      'Logs store': 'Log Analytics workspace',
      'Tracing / APM': 'Application Insights',
      'Notification/routing target': 'Action group',
    },
    architecturalNotes: [
      'Application Insights shares the Log Analytics backend, so app and infra data query together.',
      'Metric and log alerts both route through action groups.',
    ],
    limitations: ['Component-level specifics are covered in each signal’s concept.', 'Cost is driven by ingestion and retention across the suite.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
  },
  knowledgeCheck: [
    {
      id: 'of-az-1',
      type: 'single-choice',
      prompt: 'In the Azure Monitor suite, which component provides distributed tracing and application telemetry?',
      difficulty: 'beginner',
      learningObjective: 'Describe how the Azure Monitor suite covers metrics, logs, traces, alerts, and dashboards',
      options: [
        { id: 'a', label: 'Application Insights', correct: true, explanation: 'Correct — it provides APM and distributed tracing on the Log Analytics backend.' },
        { id: 'b', label: 'Action groups', correct: false, explanation: 'Action groups are the notification/routing target for alerts.' },
        { id: 'c', label: 'Azure Monitor Metrics', correct: false, explanation: 'That stores metrics, not traces.' },
      ],
    },
  ],
  furtherReading: [{ label: 'Azure Monitor overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview' }],
};

const awsObservabilitySuite: LessonBody = {
  learningObjectives: ['Describe how the Amazon CloudWatch and X-Ray suite covers metrics, logs, traces, alarms, and dashboards'],
  sections: [
    {
      heading: 'CloudWatch and X-Ray',
      blocks: [
        {
          type: 'paragraph',
          text: 'On AWS, Amazon CloudWatch is the central observability service: CloudWatch metrics, CloudWatch Logs (log groups and streams, queried with Logs Insights), CloudWatch alarms, and CloudWatch dashboards. AWS X-Ray provides distributed tracing — segments and subsegments assembled into a service map and trace map. CloudWatch and X-Ray integrate (for example, CloudWatch Application Signals and X-Ray Transaction Search build on this telemetry), and the AWS Distro for OpenTelemetry (ADOT) is the recommended way to collect traces and metrics in an open standard.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'As with Azure, each component is covered in depth in its own concept: Metrics & Alerting (CloudWatch metrics/alarms), Logging (CloudWatch Logs), and Distributed Tracing (X-Ray). This lesson is the map.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon CloudWatch and AWS X-Ray',
    keyFeatures: [
      'CloudWatch metrics for metrics',
      'CloudWatch Logs (log groups/streams, Logs Insights) for logs',
      'AWS X-Ray for distributed tracing (service and trace maps)',
      'CloudWatch alarms (incl. composite) with SNS actions',
      'CloudWatch dashboards for visualisation',
    ],
    terminology: {
      'Observability umbrella': 'Amazon CloudWatch (+ AWS X-Ray)',
      'Metrics store': 'CloudWatch metrics',
      'Logs store': 'CloudWatch Logs (log group)',
      'Tracing / APM': 'AWS X-Ray',
      'Notification/routing target': 'Amazon SNS topic / alarm actions',
    },
    architecturalNotes: [
      'Tracing is a separate service (X-Ray) that integrates with CloudWatch.',
      'AWS Distro for OpenTelemetry (ADOT) is the recommended open-standard collector.',
    ],
    limitations: ['Component-level specifics are covered in each signal’s concept.', 'Cost is driven by ingestion, retention, and trace volume.'],
    documentationUrl: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html',
  },
  knowledgeCheck: [
    {
      id: 'of-aws-1',
      type: 'single-choice',
      prompt: 'On AWS, which service provides distributed tracing (segments, subsegments, and a service map)?',
      difficulty: 'beginner',
      learningObjective: 'Describe how the Amazon CloudWatch and X-Ray suite covers metrics, logs, traces, alarms, and dashboards',
      options: [
        { id: 'a', label: 'AWS X-Ray', correct: true, explanation: 'Correct — X-Ray is the tracing service that integrates with CloudWatch.' },
        { id: 'b', label: 'CloudWatch Logs', correct: false, explanation: 'That stores logs, not traces.' },
        { id: 'c', label: 'Amazon SNS', correct: false, explanation: 'SNS delivers notifications; it is not a tracing service.' },
      ],
    },
  ],
  furtherReading: [{ label: 'What is Amazon CloudWatch?', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html' }],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare the Azure Monitor and AWS CloudWatch/X-Ray observability suites'],
  sections: [
    {
      heading: 'Suites side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Signal / role', 'Azure', 'AWS'],
          rows: [
            ['Umbrella', 'Azure Monitor', 'Amazon CloudWatch (+ X-Ray)'],
            ['Metrics', 'Azure Monitor Metrics', 'CloudWatch metrics'],
            ['Logs', 'Log Analytics workspace (KQL)', 'CloudWatch Logs (Logs Insights)'],
            ['Traces', 'Application Insights', 'AWS X-Ray'],
            ['Alerts', 'Metric/log alerts → action groups', 'Alarms → SNS / actions'],
            ['Dashboards', 'Dashboards / Workbooks / Managed Grafana', 'CloudWatch dashboards'],
            ['Open standard', 'OpenTelemetry into Azure Monitor', 'AWS Distro for OpenTelemetry (ADOT)'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The biggest structural difference: Azure keeps tracing (Application Insights) on the same Log Analytics backend as logs, so app and infra data query together natively; AWS keeps tracing in a separate service (X-Ray) that integrates with CloudWatch. Both now steer toward OpenTelemetry for collection. The architectural idea — detect with metrics, localise with traces, explain with logs — is identical across providers.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'of-cmp-1',
      type: 'single-choice',
      prompt: 'Which pairing of tracing services is correct?',
      difficulty: 'beginner',
      learningObjective: 'Compare the Azure Monitor and AWS CloudWatch/X-Ray observability suites',
      options: [
        { id: 'a', label: 'Azure Application Insights ↔ AWS X-Ray', correct: true, explanation: 'Correct — both provide distributed tracing in their respective suites.' },
        { id: 'b', label: 'Azure Log Analytics ↔ AWS X-Ray', correct: false, explanation: 'Log Analytics is the logs store; it pairs with CloudWatch Logs.' },
        { id: 'c', label: 'Azure action group ↔ AWS X-Ray', correct: false, explanation: 'An action group is the alert notification target, not a tracing service.' },
      ],
    },
  ],
};

const incidentInvestigationLab: LabBody = {
  difficulty: 'advanced',
  estimatedTime: '25 minutes',
  description:
    'Work one incident end to end across all three signals: an alert fires, metrics localise the kind of problem, logs find the failed request, the trace pinpoints the span, and you conclude the root cause. The lab checks your conclusion against the correlated evidence. Deterministic, with fixed illustrative data; it does not reproduce a real monitoring backend.',
  learningObjectives: [
    'Follow the alert → metrics → logs → trace → root-cause workflow',
    'Correlate the three signals to separate cause from symptom',
    'Justify a root-cause conclusion from cross-signal evidence',
  ],
  prerequisites: [
    { type: 'concept', id: 'incident-investigation-and-rca', label: 'Incident Investigation and RCA', description: 'The cross-signal workflow this lab practises.' },
  ],
  content: {
    simulationId: incidentInvestigationSimulation.id,
    instructions: [
      { id: 'alert', label: '1. The alert', description: 'Run the default. An SLO breach on checkout error-rate pages the on-call. You have the symptom, not the cause.' },
      { id: 'metrics', label: '2. Metrics localise', description: 'Step forward. Errors spike while throughput and saturation stay flat — not a traffic or capacity problem.' },
      { id: 'logs', label: '3. Logs find the request', description: 'Step forward. Filtering to errors and pivoting on correlation ID req-7f3a reassembles one failed request: payment timing out on bank-api.' },
      { id: 'trace', label: '4. The trace pinpoints it', description: 'Step forward. The trace shows bank-api as the earliest error span; the other errors are propagation.' },
      { id: 'rca', label: '5. Conclude', description: 'Set your conclusion to "a failing downstream dependency" and step to the root-cause stage to confirm the correlation supports it. Try a wrong conclusion to see it rejected.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'worked-all-signals',
        label: 'Worked the incident through every stage to the root cause',
        check: (state) => (state as IncidentState).step >= STAGES.length - 1,
      },
      {
        id: 'correct-conclusion',
        label: 'Reached the correct root-cause conclusion the evidence supports',
        check: (state) => (state as IncidentState).diagnosisCorrect === true,
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'monitoring-vs-observability': monitoringVsObservability,
    'golden-signals-slis-slos-slas': goldenSignalsAndSlos,
    'observability-dashboards': observabilityDashboards,
    'incident-investigation-and-rca': incidentInvestigationAndRca,
    'azure-observability-suite': azureObservabilitySuite,
    'aws-observability-suite': awsObservabilitySuite,
    'observability-fundamentals-comparison': comparison,
  },
  labs: {
    'end-to-end-incident-investigation-lab': incidentInvestigationLab,
  },
  simulations: {
    'end-to-end-incident-investigation-lab': bindSimulation(incidentInvestigationSimulation, renderIncidentState),
  },
};
