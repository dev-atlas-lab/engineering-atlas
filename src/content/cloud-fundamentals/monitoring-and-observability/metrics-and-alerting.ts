import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { metricsTimelineSimulation, type MetricsState } from './metrics-timeline';
import { renderMetricsState } from './metrics-timeline-view';
import { alertEvaluationSimulation, everFired, evaluateAlerts, type AlertRuntimeState } from './alert-evaluation';
import { renderAlertState } from './alert-evaluation-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const metricsFundamentals: LessonBody = {
  learningObjectives: [
    'Define a metric and distinguish counters, gauges, and histograms',
    'Explain dimensions/labels and the cost of high cardinality',
    'Explain why metrics are cheap to store but lossy compared with logs and traces',
  ],
  analogy:
    'Metrics are the dashboard gauges of a car: compact numbers sampled continuously — speed, fuel, temperature. They tell you something is wrong fast and cheaply, but not why; for that you open the hood (logs) or trace the fault (traces).',
  sections: [
    {
      heading: 'What a metric is',
      blocks: [
        {
          type: 'paragraph',
          text: 'A metric is a numeric measurement captured over time: a name, a value, a timestamp, and a set of labels. Because each point is just a number, metrics are extremely cheap to store and fast to aggregate and chart across long windows — which is exactly what makes them the first signal you reach for. The trade-off is that they are pre-aggregated and lossy: a metric tells you the error rate rose, not which request failed.',
        },
        {
          type: 'comparisonTable',
          headers: ['Type', 'Represents', 'Example'],
          rows: [
            ['Counter', 'A value that only increases (you read its rate)', 'Total requests served; you chart requests per second'],
            ['Gauge', 'A value that goes up and down; the current level', 'CPU utilisation, queue depth, memory in use'],
            ['Histogram', 'The distribution of many observations into buckets', 'Request latency, from which p50/p95/p99 are computed'],
          ],
        },
      ],
    },
    {
      heading: 'Dimensions and cardinality',
      blocks: [
        {
          type: 'paragraph',
          text: 'Labels (dimensions) let one metric be sliced many ways: http_requests_total by service, status code, and region. Each unique combination of label values is a separate time series. The number of combinations is the cardinality, and it is the main cost driver of a metrics system.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Never put unbounded values — user IDs, request IDs, full URLs — in metric labels. Each unique value creates a new time series; a high-cardinality label can explode storage and cost and slow queries. Those identifiers belong in logs and traces, not metric dimensions.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ma-mf-1',
      type: 'single-choice',
      prompt: 'Which metric type would you use to measure the distribution of request latency so you can compute p99?',
      difficulty: 'beginner',
      learningObjective: 'Define a metric and distinguish counters, gauges, and histograms',
      options: [
        { id: 'a', label: 'A histogram', correct: true, explanation: 'Correct — histograms bucket observations so percentiles can be computed.' },
        { id: 'b', label: 'A counter', correct: false, explanation: 'A counter only increases; it measures totals/rates, not distributions.' },
        { id: 'c', label: 'A gauge', correct: false, explanation: 'A gauge is a single current value, not a distribution.' },
      ],
    },
    {
      id: 'ma-mf-2',
      type: 'scenario',
      prompt: 'A team adds the full request URL (including query strings) as a label on a request-count metric. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Explain dimensions/labels and the cost of high cardinality',
      options: [
        { id: 'a', label: 'Cardinality explodes — every distinct URL becomes a new time series, driving up cost and slowing queries', correct: true, explanation: 'Correct — unbounded label values are a classic metrics anti-pattern; use logs/traces for that detail.' },
        { id: 'b', label: 'Nothing — labels are free', correct: false, explanation: 'Each label-value combination is a separate series with real cost.' },
        { id: 'c', label: 'The metric becomes a histogram', correct: false, explanation: 'Labels do not change the metric type.' },
      ],
    },
  ],
};

const goldenSignals: LessonBody = {
  learningObjectives: [
    'Explain the four golden signals: latency, traffic, errors, saturation',
    'Compare the RED and USE methods and when each applies',
    'Distinguish alerting on symptoms from alerting on causes',
  ],
  sections: [
    {
      heading: 'The four golden signals',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Signal', 'Question', 'Watch for'],
          rows: [
            ['Latency', 'How long do requests take?', 'The tail (p95/p99), and latency of errors separately from success'],
            ['Traffic', 'How much demand is there?', 'Requests per second, so you can tell load-driven problems apart from code ones'],
            ['Errors', 'What fraction of requests fail?', 'Explicit failures and wrong-but-200 responses'],
            ['Saturation', 'How full is the system?', 'The most constrained resource (CPU, memory, connections, queue depth)'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The four golden signals (from Google’s SRE practice) are the minimum you need to understand a user-facing service. Together they let you separate causes: latency and errors rising while traffic and saturation are flat points at the code; latency rising as saturation follows traffic points at capacity. The Diagnose a Latency Spike lab is built on exactly this reasoning.',
        },
      ],
    },
    {
      heading: 'RED and USE',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Method', 'For', 'Measures'],
          rows: [
            ['RED', 'Request-driven services', 'Rate (requests/s), Errors (failed/s), Duration (latency distribution)'],
            ['USE', 'Resources (hosts, disks, queues)', 'Utilisation, Saturation, Errors'],
          ],
        },
        {
          type: 'paragraph',
          text: 'RED (Rate, Errors, Duration) describes a service from the request’s point of view; USE (Utilisation, Saturation, Errors) describes a resource from the machine’s point of view. They are complementary: RED tells you users are suffering, USE tells you which resource is the bottleneck. Both are subsets and reframings of the golden signals.',
        },
      ],
    },
    {
      heading: 'Symptoms versus causes',
      blocks: [
        {
          type: 'callout',
          tone: 'info',
          text: 'Alert on symptoms, diagnose with causes. “p99 latency is above 500 ms for users” is a symptom worth paging on; “CPU is at 85%” is a cause that may or may not hurt users. Paging on every cause produces noise; paging on user-facing symptoms and then using cause metrics to investigate keeps alerts meaningful.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ma-gs-1',
      type: 'scenario',
      prompt: 'Latency and error rate rise sharply; traffic and saturation are unchanged. What does this pattern most strongly suggest?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the four golden signals: latency, traffic, errors, saturation',
      options: [
        { id: 'a', label: 'A code/configuration change (for example a bad deploy) — load did not change and nothing is saturated', correct: true, explanation: 'Correct — the golden signals let you rule out capacity and load.' },
        { id: 'b', label: 'The servers are out of capacity', correct: false, explanation: 'Saturation is flat, so capacity is not the cause.' },
        { id: 'c', label: 'A traffic surge', correct: false, explanation: 'Traffic is unchanged.' },
      ],
    },
    {
      id: 'ma-gs-2',
      type: 'single-choice',
      prompt: 'Which signal should you most prefer to page a human on?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish alerting on symptoms from alerting on causes',
      options: [
        { id: 'a', label: 'A user-facing symptom, such as elevated p99 latency or error rate', correct: true, explanation: 'Correct — symptom-based alerts fire when users are actually affected.' },
        { id: 'b', label: 'CPU utilisation crossing 80%', correct: false, explanation: 'A cause metric; high CPU may not hurt users and often produces noise.' },
        { id: 'c', label: 'Any metric changing at all', correct: false, explanation: 'That guarantees alert fatigue.' },
      ],
    },
  ],
};

const aggregationAndWindows: LessonBody = {
  learningObjectives: [
    'Explain aggregation functions and why percentiles beat averages for latency',
    'Explain time resolution, aggregation windows, and the rate of a counter',
    'Explain how aggregation can hide problems',
  ],
  sections: [
    {
      heading: 'Aggregating points into a chart',
      blocks: [
        {
          type: 'paragraph',
          text: 'Raw metrics are sampled frequently, then aggregated for storage and display: summed, averaged, maxed, or reduced to percentiles over a window (say one minute). The aggregation you choose changes what you see. A counter is turned into a rate by taking the difference over time — requests/second from a monotonically increasing total.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Averages hide the tail. If 99 requests take 50 ms and one takes 5 s, the average is ~100 ms and looks fine, while the p99 is 5 s and some users are furious. For latency, watch p95/p99, not the mean.',
        },
      ],
    },
    {
      heading: 'Resolution and windows',
      blocks: [
        {
          type: 'list',
          items: [
            'Resolution: how often points are recorded. Finer resolution catches short spikes but costs more and is often kept for a shorter retention.',
            'Aggregation window: the period a chart or alert reduces over. A one-minute window smooths a metric; a short spike inside it may be averaged away.',
            'Alignment: a one-minute average can hide a 10-second outage entirely — the window and the incident must be comparable for the signal to be visible.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'This is why an alert window is a trade-off: longer windows reduce noise but slow detection and can mask brief incidents; shorter windows detect faster but react to blips. The Configure an Alerting Policy lab lets you feel this directly.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ma-ag-1',
      type: 'scenario',
      prompt: 'Average latency looks healthy at 90 ms, but users complain about slowness. What should you check?',
      difficulty: 'intermediate',
      learningObjective: 'Explain aggregation functions and why percentiles beat averages for latency',
      options: [
        { id: 'a', label: 'High percentiles (p95/p99) — the average can hide a slow tail affecting a minority of requests', correct: true, explanation: 'Correct — tail latency is where real user pain often lives.' },
        { id: 'b', label: 'Nothing — a good average means everyone is fine', correct: false, explanation: 'Averages mask the tail.' },
        { id: 'c', label: 'The total request counter', correct: false, explanation: 'That measures volume, not per-request latency.' },
      ],
    },
  ],
};

const alertingFundamentals: LessonBody = {
  learningObjectives: [
    'Describe an alert rule: metric, threshold, evaluation window, and action',
    'Compare static and dynamic thresholds, and consecutive/M-of-N evaluation',
    'Explain severity, routing, escalation, and alert fatigue',
  ],
  sections: [
    {
      heading: 'What an alert rule is',
      blocks: [
        {
          type: 'paragraph',
          text: 'An alert rule watches a metric, compares it to a threshold over an evaluation window, and takes an action when the condition holds. The window matters as much as the threshold: firing on a single breaching sample pages people for noise, so rules require the condition to hold for several periods — consecutively, or M breaching periods out of the last N.',
        },
        {
          type: 'comparisonTable',
          headers: ['Threshold', 'How it is set', 'Good for'],
          rows: [
            ['Static', 'A fixed value and operator (latency > 500 ms)', 'Clear, stable limits you can state in advance'],
            ['Dynamic', 'A band learned from the metric’s own history (anomaly detection)', 'Metrics with daily/weekly patterns, or where a good fixed value is unknown — catches drift a high static threshold misses'],
          ],
        },
      ],
    },
    {
      heading: 'Severity, routing, and escalation',
      blocks: [
        {
          type: 'list',
          items: [
            'Severity tags the alert’s urgency (a critical page vs an informational ticket), which drives how and whether it interrupts someone.',
            'Routing sends the alert to the right destination — an on-call rota, a chat channel, a ticket — based on the service and severity.',
            'Escalation re-routes an unacknowledged alert to the next person or team after a timeout, so a missed page is not a silent outage.',
            'Auto-resolution clears the alert when the metric recovers, so dashboards reflect reality without manual clean-up.',
          ],
        },
      ],
    },
    {
      heading: 'Alert fatigue',
      blocks: [
        {
          type: 'callout',
          tone: 'warning',
          text: 'The biggest failure mode of alerting is too many alerts, not too few. Noisy, non-actionable, or flapping alerts train people to ignore them — so the one real page is missed. Good alerting is ruthless: page on user-facing symptoms, require sustained breaches, set sensible thresholds, and delete alerts nobody acts on. The Configure an Alerting Policy lab shows a twitchy rule firing on a harmless blip.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ma-al-1',
      type: 'scenario',
      prompt: 'An alert pages on-call every time latency exceeds 300 ms for a single one-minute sample. It fires several times a night on brief, self-correcting blips. What is the best fix?',
      difficulty: 'intermediate',
      learningObjective: 'Compare static and dynamic thresholds, and consecutive/M-of-N evaluation',
      options: [
        { id: 'a', label: 'Require the breach to persist for several evaluation periods before firing (and reconsider the threshold)', correct: true, explanation: 'Correct — an evaluation window turns a transient blip into a non-event while still catching sustained incidents.' },
        { id: 'b', label: 'Lower the threshold to 200 ms', correct: false, explanation: 'That makes it fire more, worsening fatigue.' },
        { id: 'c', label: 'Delete all alerts', correct: false, explanation: 'The goal is meaningful alerts, not none.' },
      ],
    },
    {
      id: 'ma-al-2',
      type: 'scenario',
      prompt: 'A metric drifts slowly upward every day and a fixed high threshold never catches it until it is a crisis. What alerting approach helps?',
      difficulty: 'advanced',
      learningObjective: 'Compare static and dynamic thresholds, and consecutive/M-of-N evaluation',
      options: [
        { id: 'a', label: 'A dynamic (anomaly-detection) threshold learned from the metric’s baseline', correct: true, explanation: 'Correct — it flags deviation from normal even when no single fixed value is obviously wrong.' },
        { id: 'b', label: 'A much higher static threshold', correct: false, explanation: 'A higher fixed value detects the drift even later.' },
        { id: 'c', label: 'Remove the evaluation window', correct: false, explanation: 'That increases noise and does not address slow drift.' },
      ],
    },
  ],
};

const azureMetricsAlerts: LessonBody = {
  learningObjectives: ['Describe Azure Monitor metrics and metric alerts, including dynamic thresholds and action groups'],
  sections: [
    {
      heading: 'Azure Monitor metrics and alerts',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Monitor collects platform metrics automatically and accepts custom metrics. Metric alert rules evaluate a metric on a schedule (evaluation frequency) over an aggregation window, using either a static threshold (value and operator) or a dynamic threshold driven by machine learning, with a sensitivity setting (high/medium/low) and a failing-periods rule (fire only after a minimum number of unhealthy periods — an M-of-N window). Severity runs from 0 (critical) to 4 (verbose). When a rule fires, it triggers an action group, which fans out to notifications (email, SMS, push) and actions (webhooks, functions, ITSM), and can be combined with alert processing rules for suppression and routing.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Log-based (log search) alerts run a Kusto query on Log Analytics instead of a single metric — covered under Logging. Both metric and log alerts route through the same action groups.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Monitor metrics and alerts',
    keyFeatures: [
      'Platform and custom metrics with multi-dimensional support',
      'Metric alerts with static or dynamic (ML) thresholds',
      'Sensitivity and failing-periods (M-of-N) configuration',
      'Severity 0 (critical) to 4 (verbose)',
      'Action groups for notification and automated actions',
    ],
    terminology: {
      'Alert rule': 'Metric alert rule',
      'Dynamic threshold': 'Dynamic thresholds (ML-based)',
      'Evaluation window': 'Aggregation granularity + failing periods',
      'Notification/routing target': 'Action group',
      'Alert severity': 'Severity 0–4',
    },
    architecturalNotes: [
      'Evaluation frequency and aggregation window are configured separately.',
      'Dynamic thresholds use a sensitivity setting and a failing-periods rule.',
      'Action groups are shared by metric and log alerts.',
    ],
    limitations: ['Dynamic thresholds need enough history to learn a baseline.', 'Exact evaluation defaults depend on the interface and are configuration, not guarantees.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-types',
  },
  knowledgeCheck: [
    {
      id: 'ma-az-1',
      type: 'single-choice',
      prompt: 'In Azure Monitor, what receives the notification when a metric alert fires?',
      difficulty: 'beginner',
      learningObjective: 'Describe Azure Monitor metrics and metric alerts, including dynamic thresholds and action groups',
      options: [
        { id: 'a', label: 'An action group', correct: true, explanation: 'Correct — action groups fan out to notifications and automated actions.' },
        { id: 'b', label: 'A CloudWatch alarm', correct: false, explanation: 'That is the AWS service.' },
        { id: 'c', label: 'A Log Analytics workspace', correct: false, explanation: 'That stores logs; it is not the alert notification target.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Types of Azure Monitor alerts', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-types' },
  ],
};

const cloudwatchMetricsAlarms: LessonBody = {
  learningObjectives: ['Describe CloudWatch metrics and alarms, including states, M-of-N, and anomaly detection'],
  sections: [
    {
      heading: 'CloudWatch metrics and alarms',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon CloudWatch stores metrics in namespaces with dimensions, aggregated over a period using a statistic (Average, Sum, p99, and so on). A metric alarm has three states: OK (within threshold), ALARM (outside), and INSUFFICIENT_DATA (just started or not enough data). Evaluation uses Evaluation Periods (N) and Datapoints to Alarm (M): with M of N, M breaching datapoints within the last N periods trigger the alarm; set them equal for consecutive breaches. Alarms can use a static threshold or an anomaly-detection band (ANOMALY_DETECTION_BAND), and missing data is handled explicitly (breaching, notBreaching, ignore, missing). Composite alarms combine child alarm states with AND/OR/NOT to cut noise, and alarms notify through Amazon SNS (and other actions).',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon CloudWatch metrics and alarms',
    keyFeatures: [
      'Metrics in namespaces with dimensions, periods, and statistics (incl. percentiles)',
      'Alarm states: OK, ALARM, INSUFFICIENT_DATA',
      'M-of-N evaluation (Datapoints to Alarm / Evaluation Periods)',
      'Static thresholds or anomaly-detection bands',
      'Composite alarms and SNS notification/actions',
    ],
    terminology: {
      'Alert rule': 'Metric alarm',
      'Dynamic threshold': 'Anomaly detection band',
      'Evaluation window': 'Evaluation Periods + Datapoints to Alarm (M-of-N)',
      'Notification/routing target': 'Amazon SNS topic / alarm actions',
      'No-data state': 'INSUFFICIENT_DATA',
    },
    architecturalNotes: [
      'M-of-N breaching datapoints need not be consecutive (within the last N periods).',
      'Anomaly detection uses a band rather than a fixed value.',
      'Composite alarms reduce noise by combining child alarms.',
    ],
    limitations: ['Missing-data handling must be chosen explicitly and changes behaviour.', 'Anomaly bands require history to train.'],
    documentationUrl: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarm-evaluation.html',
  },
  knowledgeCheck: [
    {
      id: 'ma-aws-1',
      type: 'single-choice',
      prompt: 'A new CloudWatch alarm is created. What state does it start in?',
      difficulty: 'beginner',
      learningObjective: 'Describe CloudWatch metrics and alarms, including states, M-of-N, and anomaly detection',
      options: [
        { id: 'a', label: 'INSUFFICIENT_DATA', correct: true, explanation: 'Correct — it has not yet evaluated enough data to decide OK or ALARM.' },
        { id: 'b', label: 'ALARM', correct: false, explanation: 'It only enters ALARM after evaluating breaching data.' },
        { id: 'c', label: 'FIRING', correct: false, explanation: 'CloudWatch alarm states are OK, ALARM, and INSUFFICIENT_DATA.' },
      ],
    },
    {
      id: 'ma-aws-2',
      type: 'single-choice',
      prompt: 'An alarm has Evaluation Periods = 5 and Datapoints to Alarm = 3. When does it enter ALARM?',
      difficulty: 'advanced',
      learningObjective: 'Describe CloudWatch metrics and alarms, including states, M-of-N, and anomaly detection',
      options: [
        { id: 'a', label: 'When 3 of the last 5 periods are breaching (not necessarily consecutive)', correct: true, explanation: 'Correct — that is the M-of-N evaluation.' },
        { id: 'b', label: 'Only when 5 consecutive periods breach', correct: false, explanation: 'That would be M = N = 5.' },
        { id: 'c', label: 'On the first breaching datapoint', correct: false, explanation: 'M = 3 requires three breaching datapoints in the window.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'CloudWatch alarm evaluation', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarm-evaluation.html' },
  ],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure Monitor and CloudWatch metrics and alerting'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Concept', 'Azure Monitor', 'Amazon CloudWatch'],
          rows: [
            ['Metric store', 'Azure Monitor Metrics', 'CloudWatch metrics (namespaces/dimensions)'],
            ['Alert object', 'Metric alert rule', 'Metric alarm'],
            ['Dynamic threshold', 'Dynamic thresholds (sensitivity)', 'Anomaly detection band'],
            ['Window', 'Aggregation + failing periods', 'Evaluation Periods + Datapoints to Alarm (M-of-N)'],
            ['No-data state', 'Not-enough-data handling', 'INSUFFICIENT_DATA'],
            ['Notify/route', 'Action group', 'SNS topic / alarm actions'],
            ['Combine alerts', 'Alert processing rules', 'Composite alarms'],
            ['Severity', '0–4', 'No built-in severity (set via tags/routing)'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The models are close: both evaluate a metric over a window against a static or dynamic threshold and route to a notification target. Differences to respect: Azure has first-class alert severity; AWS expresses the evaluation window as explicit M-of-N datapoints and has a distinct INSUFFICIENT_DATA state.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ma-cmp-1',
      type: 'single-choice',
      prompt: 'Which pairing is correct?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure Monitor and CloudWatch metrics and alerting',
      options: [
        { id: 'a', label: 'Azure action group ↔ AWS SNS topic / alarm actions (the notification target)', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'Azure dynamic thresholds ↔ AWS INSUFFICIENT_DATA', correct: false, explanation: 'Dynamic thresholds pair with the anomaly-detection band; INSUFFICIENT_DATA is a state.' },
        { id: 'c', label: 'Azure metric alert ↔ AWS X-Ray', correct: false, explanation: 'X-Ray is tracing, not metric alerting.' },
      ],
    },
  ],
};

const diagnoseLatencyLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Read four correlated golden-signal metrics over time and diagnose the cause of an incident. Switch between a bad-deploy, a saturation, and a dependency scenario, and set your diagnosis — the lab checks whether the correlation supports it. Deterministic, with illustrative values; it does not reproduce a real monitoring backend.',
  learningObjectives: [
    'Use the golden signals to separate code, capacity, and dependency problems',
    'Read which signals move together and which stay flat',
    'Justify a diagnosis from metric correlation',
  ],
  prerequisites: [
    { type: 'concept', id: 'the-golden-signals', label: 'The Golden Signals, RED, and USE', description: 'The four signals this lab reads.' },
  ],
  content: {
    simulationId: metricsTimelineSimulation.id,
    instructions: [
      { id: 'deploy', label: '1. The deploy scenario', description: 'Run the default. Step through and watch latency and errors jump at the deploy marker while traffic and saturation stay flat. Set your diagnosis to "a bad deploy" and confirm.' },
      { id: 'saturation', label: '2. Saturation', description: 'Switch to the traffic scenario. Note the order: throughput rises, saturation follows to ~100%, then latency and errors. Diagnose "under-provisioned capacity".' },
      { id: 'dependency', label: '3. Dependency', description: 'Switch to the dependency scenario. Errors spike hard while saturation stays low. Diagnose "a failing downstream dependency".' },
      { id: 'wrong', label: '4. Test a wrong answer', description: 'On any scenario, pick a diagnosis the signals do not support and read why it is rejected.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'correct-diagnosis',
        label: 'Reached a correct diagnosis that the signal correlation supports',
        check: (state) => (state as MetricsState).diagnosisCorrect === true,
      },
      {
        id: 'revealed',
        label: 'Revealed the full timeline through the incident',
        check: (state) => (state as MetricsState).tick >= 11,
      },
    ],
  },
};

const configureAlertLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Tune an alert rule — static or dynamic threshold, and how many consecutive breaching periods it takes to fire — against a real incident, a transient blip, and a slow drift. The goal is a policy that fires on the real incident but not the blip. Deterministic, with illustrative values; not a real alerting backend.',
  learningObjectives: [
    'Explain how the evaluation window prevents firing on transient blips',
    'Explain when a dynamic threshold beats a static one',
    'Design an alert that catches real incidents without causing fatigue',
  ],
  prerequisites: [
    { type: 'concept', id: 'alerting-fundamentals', label: 'Alerting Fundamentals', description: 'Thresholds, windows, severity, and alert fatigue.' },
  ],
  content: {
    simulationId: alertEvaluationSimulation.id,
    instructions: [
      { id: 'fire', label: '1. Fire on the real incident', description: 'Run the default (real incident, static 300 ms, 3 periods). It fires once the breach is sustained, then auto-resolves when latency recovers.' },
      { id: 'fatigue', label: '2. Cause alert fatigue', description: 'Switch to the transient blip and set the periods to 1. The rule fires on a single harmless sample — a false page.' },
      { id: 'fix-fatigue', label: '3. Fix it', description: 'Keep the blip scenario and raise the periods back to 3. Now the blip no longer fires, while the real incident still would.' },
      { id: 'dynamic', label: '4. Catch the drift', description: 'Switch to the gradual-drift scenario. A high static threshold never fires; switch the threshold type to dynamic and watch the learned band catch the drift.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'fires-real',
        label: 'The policy fired on the real sustained incident',
        check: (state) => {
          const s = state as AlertRuntimeState;
          return s.config.scenario === 'real-incident' && everFired(s.evaluations);
        },
      },
      {
        id: 'ignores-blip',
        label: 'A multi-period window ignored a transient blip',
        check: (state) => {
          const s = state as AlertRuntimeState;
          return s.config.scenario === 'transient-blip' && s.config.evaluationPeriods >= 3 && !everFired(s.evaluations) && s.evaluations.length > 0;
        },
      },
      {
        id: 'dynamic-catches-drift',
        label: 'A dynamic threshold caught the gradual drift',
        check: (state) => {
          const s = state as AlertRuntimeState;
          // A high static threshold would miss this drift; the dynamic band catches it.
          return s.config.scenario === 'gradual-drift' && s.config.thresholdType === 'dynamic' && everFired(s.evaluations) && !everFired(evaluateAlerts({ ...s.config, thresholdType: 'static', threshold: 500 }));
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'metrics-fundamentals': metricsFundamentals,
    'the-golden-signals': goldenSignals,
    'aggregation-and-time-windows': aggregationAndWindows,
    'alerting-fundamentals': alertingFundamentals,
    'azure-monitor-metrics-and-alerts': azureMetricsAlerts,
    'cloudwatch-metrics-and-alarms': cloudwatchMetricsAlarms,
    'metrics-and-alerting-comparison': comparison,
  },
  labs: {
    'diagnose-a-latency-spike-lab': diagnoseLatencyLab,
    'configure-an-alerting-policy-lab': configureAlertLab,
  },
  simulations: {
    'diagnose-a-latency-spike-lab': bindSimulation(metricsTimelineSimulation, renderMetricsState),
    'configure-an-alerting-policy-lab': bindSimulation(alertEvaluationSimulation, renderAlertState),
  },
};
