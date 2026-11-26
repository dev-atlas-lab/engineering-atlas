import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { scaleUpVsOutScene } from './auto-scaling.scenes';
import { autoScalingSimulation, type ScalingState } from './scaling-model';
import { renderScalingState } from './auto-scaling-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const verticalVsHorizontal: LessonBody = {
  learningObjectives: [
    'Distinguish vertical from horizontal scaling and scalability from elasticity',
    'Explain why stateless design is a prerequisite for horizontal scaling',
    'Identify shared bottlenecks that cap throughput no matter how many instances you add',
  ],
  analogy:
    'Scaling up is trading your car for a bigger truck; scaling out is buying more cars and hiring a dispatcher. More cars only help if any driver can take any job — a stateful app is a truck that only one driver knows how to operate.',
  sections: [
    {
      heading: 'Up and out',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Scale up (vertical)', 'Scale out (horizontal)'],
          rows: [
            ['Means', 'A bigger instance (more CPU/RAM)', 'More instances behind a load balancer'],
            ['Ceiling', 'The largest instance size available', 'Much higher — add more instances'],
            ['Failure impact', 'The whole service (single point of failure)', 'One instance’s share; the rest carry on'],
            ['Change', 'Often a resize and restart', 'Add or remove instances live'],
            ['Cost granularity', 'Coarse — jump to the next size', 'Fine — pay for roughly what you use'],
            ['Needs', 'Nothing special', 'A stateless application'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Scalability is whether a system can handle more load given more resources. Elasticity is doing that automatically and in both directions — adding capacity for a spike and removing it afterwards. Horizontal scaling is what makes elasticity practical, because you can add and remove whole instances; vertical scaling is coarse and usually disruptive.',
        },
      ],
    },
    {
      heading: 'Why statelessness is the gate',
      blocks: [
        {
          type: 'paragraph',
          text: 'Horizontal scaling only works if any instance can serve any request. If an instance keeps per-user state in memory — a session, a cart, an upload in progress — then requests must return to that instance (session affinity), load spreads unevenly, and losing the instance loses the state. The fix is to externalise state: put sessions in a shared cache or database, uploads in object storage, and keep the instances themselves disposable.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A stateful application often cannot scale out until it is re-architected, no matter how good the auto-scaler is. Recognising this early is the difference between “add instances” and a migration project.',
        },
      ],
    },
    {
      heading: 'Adding instances does not always add throughput',
      blocks: [
        {
          type: 'paragraph',
          text: 'More instances help only if the balanced tier was the bottleneck. If every instance contends for one shared resource, throughput plateaus or even drops as you scale:',
        },
        {
          type: 'list',
          items: [
            'A single database that all instances read and write — the classic ceiling. Scale it with read replicas, caching, sharding, or partitioning.',
            'A shared cache, queue, or lock that serialises work.',
            'A downstream third-party API with its own rate limit.',
            'Connection limits: more app instances can exhaust a database’s connection pool, making things worse. A connection pooler helps.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Caches and queues are scaling tools in their own right: a cache removes load from the database, and a queue absorbs spikes so the backend can process at a steady rate instead of being overwhelmed.',
        },
      ],
    },
  ],
  visualization: scaleUpVsOutScene,
  knowledgeCheck: [
    {
      id: 'as-vh-1',
      type: 'scenario',
      prompt: 'An app stores each user’s session in the instance’s memory. The team turns on auto-scaling to handle growth. What problem appears first?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why stateless design is a prerequisite for horizontal scaling',
      options: [
        { id: 'a', label: 'Users get logged out or see inconsistent state when routed to a different instance, and affinity is needed as a stopgap', correct: true, explanation: 'Correct — in-memory session state breaks horizontal scaling until it is externalised.' },
        { id: 'b', label: 'Nothing — auto-scaling handles state automatically', correct: false, explanation: 'Auto-scaling adds instances; it does not move in-memory state between them.' },
        { id: 'c', label: 'The load balancer refuses to start', correct: false, explanation: 'The balancer works; the application behaviour is the problem.' },
      ],
    },
    {
      id: 'as-vh-2',
      type: 'single-choice',
      prompt: 'A stateless web tier is scaled from 3 to 12 instances, but throughput barely improves. What is the most likely cause?',
      difficulty: 'intermediate',
      learningObjective: 'Identify shared bottlenecks that cap throughput no matter how many instances you add',
      options: [
        { id: 'a', label: 'A shared downstream resource — most often the database — is the real bottleneck', correct: true, explanation: 'Correct — scaling the web tier does not relieve a shared dependency.' },
        { id: 'b', label: 'The load balancer can only handle 3 instances', correct: false, explanation: 'Load balancers handle far more than 3 backends.' },
        { id: 'c', label: 'Horizontal scaling never increases throughput', correct: false, explanation: 'It does, when the balanced tier is the bottleneck.' },
      ],
    },
  ],
};

const howAutoScalingWorks: LessonBody = {
  learningObjectives: [
    'Describe the auto-scaling feedback loop and the role of min/max/desired capacity',
    'Compare target tracking, step, scheduled, and (where supported) predictive scaling',
    'Explain why scaling lags a spike, and the role of cooldown, warm-up, and scale-in protection',
  ],
  sections: [
    {
      heading: 'The feedback loop',
      blocks: [
        {
          type: 'paragraph',
          text: 'Auto-scaling is a control loop: observe a metric, evaluate a policy, decide a desired capacity, provision or terminate instances, wait for things to stabilise, and observe again. It is bounded by three numbers — minimum, maximum, and desired capacity — so it can never scale to zero below the floor or run away above the ceiling.',
        },
        {
          type: 'code',
          code: 'observe metric → evaluate policy → decide desired capacity\n      ↑                                      │\n      └──────── stabilise ← provision/terminate┘\n\nbounded by: minimum ≤ desired ≤ maximum',
        },
      ],
    },
    {
      heading: 'Policy types',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Policy', 'How it decides', 'Good for'],
          rows: [
            ['Target tracking', 'Adjusts capacity to hold a metric near a target (like a thermostat)', 'Most workloads — the default recommendation'],
            ['Step scaling', 'Adds/removes a set amount per threshold band; bigger breaches, bigger steps', 'When you want explicit control over the response size'],
            ['Scheduled', 'Changes capacity at set times, ignoring the live metric', 'Known patterns (business hours, a batch window, a sale)'],
            ['Predictive (where supported)', 'Forecasts load from history and scales out ahead of it', 'Cyclical, predictable demand; usually paired with a reactive policy'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Metrics are not only CPU. Request count per instance, queue depth, latency, and memory are often better signals — a queue-depth target scales a worker fleet to the backlog, which CPU would miss.',
        },
      ],
    },
    {
      heading: 'Why scaling lags, and how it is damped',
      blocks: [
        {
          type: 'paragraph',
          text: 'Scaling is never instant. When a spike arrives, the metric rises, the policy reacts, new instances launch and then warm up (start, load config, fill caches) before they take traffic. For that window the existing instances are overloaded. Scheduled or predictive scaling closes the gap by acting before the load arrives — at the cost of needing to know the pattern.',
        },
        {
          type: 'list',
          items: [
            'Warm-up / initialization delay: a new instance does not count toward the metric until it is ready, so the policy does not over-provision while it waits.',
            'Cooldown / stabilization: after a scaling action, wait before acting again, so the loop does not thrash on one spike. Step and simple policies use cooldowns; target tracking relies on warm-up instead.',
            'Scale-in protection and gentle scale-in: remove instances conservatively (and never ones doing critical work), because scaling in too eagerly re-triggers a scale-out moments later.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The Design an Auto Scaling Policy lab runs this loop over a spike, a gradual ramp, and a daily curve so you can watch the lag and the damping directly.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'as-how-1',
      type: 'scenario',
      prompt: 'Traffic quadruples in seconds. CPU-based target tracking is configured. Why do users still see errors for a short while?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why scaling lags a spike, and the role of cooldown, warm-up, and scale-in protection',
      options: [
        { id: 'a', label: 'The policy must observe the high metric, launch instances, and wait for them to warm up before they relieve load — a reactive loop cannot pre-empt a sudden spike', correct: true, explanation: 'Correct — scheduled or predictive scaling, or more headroom, addresses this.' },
        { id: 'b', label: 'Target tracking is broken', correct: false, explanation: 'It is working; the lag is inherent to reacting after the spike.' },
        { id: 'c', label: 'The maximum capacity is too low by definition', correct: false, explanation: 'Even with ample maximum, there is a reaction and warm-up delay.' },
      ],
    },
    {
      id: 'as-how-2',
      type: 'single-choice',
      prompt: 'A worker fleet processes jobs from a queue. Which scaling metric best matches capacity to the backlog?',
      difficulty: 'intermediate',
      learningObjective: 'Compare target tracking, step, scheduled, and (where supported) predictive scaling',
      options: [
        { id: 'a', label: 'Queue depth (or messages per instance) — it directly reflects work waiting to be done', correct: true, explanation: 'Correct — CPU can look low while a backlog grows.' },
        { id: 'b', label: 'CPU utilisation only', correct: false, explanation: 'Idle-waiting workers can have low CPU while the backlog grows.' },
        { id: 'c', label: 'The number of load balancer rules', correct: false, explanation: 'That is unrelated to the backlog.' },
      ],
    },
    {
      id: 'as-how-3',
      type: 'single-choice',
      prompt: 'What problem does a cooldown (stabilization) period prevent?',
      difficulty: 'beginner',
      learningObjective: 'Describe the auto-scaling feedback loop and the role of min/max/desired capacity',
      options: [
        { id: 'a', label: 'Thrashing — scaling repeatedly in reaction to one event before the last change has taken effect', correct: true, explanation: 'Correct — it lets a change stabilise before the next decision.' },
        { id: 'b', label: 'Instances starting too slowly', correct: false, explanation: 'That is warm-up, a different mechanism.' },
        { id: 'c', label: 'The metric being too low', correct: false, explanation: 'Cooldown governs decision frequency, not metric values.' },
      ],
    },
  ],
};

const azureAutoscale: LessonBody = {
  learningObjectives: ['Describe Virtual Machine Scale Sets and Azure Monitor autoscale'],
  sections: [
    {
      heading: 'Scale sets and autoscale rules',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Virtual Machine Scale Sets manage a group of identical VMs as one resource, with health monitoring and rolling upgrades. Azure Monitor autoscale drives the instance count using autoscale settings: profiles contain rules that scale out and scale in based on metrics (for example Percentage CPU over a look-back time window), and schedule-based profiles change capacity at set times. Each rule has its own cooldown, and when several scale-in rules could fire, autoscale scales in conservatively.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Predictive autoscale (in preview, scale-out only, and currently limited to the Percentage CPU metric) forecasts cyclical CPU load and scales out ahead of it. Microsoft’s guidance is to start it in forecast-only mode and keep reactive rules for unexpected load and for scale-in.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Virtual Machine Scale Sets and Azure Monitor autoscale',
    keyFeatures: [
      'Virtual Machine Scale Sets manage identical VMs as one group',
      'Azure Monitor autoscale: metric-based rules in profiles, with scale-out and scale-in pairs',
      'Schedule-based profiles (recurring or fixed-date)',
      'Per-rule cooldown; conservative scale-in',
      'Predictive autoscale (preview, scale-out, Percentage CPU)',
    ],
    terminology: {
      'Instance group': 'Virtual Machine Scale Set',
      'Auto-scaling engine': 'Azure Monitor autoscale',
      'Scaling rule': 'Autoscale rule (in a profile)',
      'Scheduled scaling': 'Schedule-based profile',
      'Min/max/desired': 'Minimum / maximum / default instance count',
    },
    architecturalNotes: [
      'Autoscale rules come in scale-out/scale-in pairs within a profile.',
      'A metric look-back window normalises transient spikes.',
      'Scale-in is conservative when multiple rules match.',
    ],
    limitations: ['Predictive autoscale is preview, scale-out only, and limited to Percentage CPU.', 'Metric and cooldown choices are configuration, not guarantees.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-overview',
  },
  knowledgeCheck: [
    {
      id: 'as-az-1',
      type: 'single-choice',
      prompt: 'In Azure Monitor autoscale, what pairs with a scale-out rule inside a profile?',
      difficulty: 'beginner',
      learningObjective: 'Describe Virtual Machine Scale Sets and Azure Monitor autoscale',
      options: [
        { id: 'a', label: 'A scale-in rule', correct: true, explanation: 'Correct — rules are typically defined in scale-out/scale-in pairs.' },
        { id: 'b', label: 'A load balancer listener', correct: false, explanation: 'Listeners are a load balancing concept, not an autoscale rule.' },
        { id: 'c', label: 'A DNS record', correct: false, explanation: 'Autoscale rules are metric/schedule based, not DNS.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Monitor autoscale overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-overview' },
    { label: 'Virtual Machine Scale Sets overview', url: 'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview' },
  ],
};

const awsAutoScaling: LessonBody = {
  learningObjectives: ['Describe EC2 Auto Scaling groups and their scaling policy types'],
  sections: [
    {
      heading: 'Auto Scaling groups and policies',
      blocks: [
        {
          type: 'paragraph',
          text: 'An Amazon EC2 Auto Scaling group manages a fleet of instances between a minimum, maximum, and desired capacity, launching and terminating to match. Dynamic scaling policies come in three types: target tracking (hold a metric near a value — the recommended default), step scaling (adjust by step amounts sized to the breach), and simple scaling (one adjustment, then a cooldown). You can add scheduled actions for known patterns and predictive scaling to scale out ahead of forecasted load.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Target tracking and step scaling do not wait on a cooldown between actions; instead each new instance has a warm-up period before it counts toward the metric. AWS recommends target tracking for most cases and advises against simple scaling with cooldowns.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon EC2 Auto Scaling',
    keyFeatures: [
      'Auto Scaling groups with minimum, maximum, and desired capacity',
      'Target tracking (recommended), step, and simple dynamic policies',
      'Scheduled actions and predictive scaling',
      'Instance warm-up; health checks and instance refresh',
    ],
    terminology: {
      'Instance group': 'Auto Scaling group (ASG)',
      'Auto-scaling engine': 'EC2 Auto Scaling',
      'Scaling rule': 'Scaling policy (target tracking / step / simple)',
      'Scheduled scaling': 'Scheduled action',
      'Min/max/desired': 'Minimum / maximum / desired capacity',
    },
    architecturalNotes: [
      'Target tracking is the recommended default; step scaling reacts in sized steps.',
      'Target and step policies use instance warm-up rather than a cooldown between actions.',
      'Predictive scaling forecasts load and scales out ahead of it.',
    ],
    limitations: ['AWS advises against simple scaling with cooldowns for most workloads.', 'Policy behaviour depends on the chosen metric and warm-up/cooldown settings.'],
    documentationUrl: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html',
  },
  knowledgeCheck: [
    {
      id: 'as-aws-1',
      type: 'single-choice',
      prompt: 'Which EC2 Auto Scaling policy type does AWS recommend as the default for most workloads?',
      difficulty: 'beginner',
      learningObjective: 'Describe EC2 Auto Scaling groups and their scaling policy types',
      options: [
        { id: 'a', label: 'Target tracking', correct: true, explanation: 'Correct — it holds a metric near a target and is the recommended default.' },
        { id: 'b', label: 'Simple scaling', correct: false, explanation: 'AWS advises against simple scaling with cooldowns for most workloads.' },
        { id: 'c', label: 'Manual scaling', correct: false, explanation: 'Manual scaling is not automatic.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'What is Amazon EC2 Auto Scaling?', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html' },
    { label: 'Dynamic scaling for EC2 Auto Scaling', url: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html' },
  ],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure and AWS auto-scaling building blocks'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Concept', 'Azure', 'AWS'],
          rows: [
            ['Instance group', 'Virtual Machine Scale Set', 'EC2 Auto Scaling group'],
            ['Scaling engine', 'Azure Monitor autoscale', 'EC2 Auto Scaling'],
            ['Hold a metric at a target', 'Metric rule toward a threshold', 'Target tracking policy'],
            ['Sized steps', 'Rules per threshold', 'Step scaling policy'],
            ['Scheduled', 'Schedule-based profile', 'Scheduled action'],
            ['Predictive', 'Predictive autoscale (preview)', 'Predictive scaling'],
            ['Damping', 'Per-rule cooldown; conservative scale-in', 'Instance warm-up; gentle scale-in'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The building blocks line up closely. The clearest difference is damping: Azure leans on per-rule cooldowns, while AWS target/step policies use instance warm-up instead of a cooldown between actions. Both reach the same goal — react without thrashing.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'as-cmp-1',
      type: 'single-choice',
      prompt: 'Which pairing is correct?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure and AWS auto-scaling building blocks',
      options: [
        { id: 'a', label: 'Virtual Machine Scale Set ↔ EC2 Auto Scaling group', correct: true, explanation: 'Correct — both manage a group of identical instances.' },
        { id: 'b', label: 'Virtual Machine Scale Set ↔ Application Load Balancer', correct: false, explanation: 'An ALB is a load balancer, not an instance group.' },
        { id: 'c', label: 'Azure Monitor autoscale ↔ Amazon Route 53', correct: false, explanation: 'Route 53 is DNS, not an autoscaler.' },
      ],
    },
  ],
};

const scalingLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '25 minutes',
  description:
    'Run an auto-scaling loop over a spike, a gradual ramp, and a daily curve. Choose target tracking, step, or scheduled scaling, set min/max capacity and a target, and watch capacity, the metric, warm-up, and cooldown — including why scaling lags a sudden spike. Deterministic and simulated; timings are illustrative.',
  learningObjectives: [
    'Explain how each policy decides capacity from the metric',
    'Observe scaling lag during a spike and how scheduled scaling avoids it',
    'Explain the effect of min/max bounds, warm-up, and cooldown',
  ],
  prerequisites: [
    { type: 'concept', id: 'how-auto-scaling-works', label: 'How Auto-Scaling Works', description: 'The feedback loop and policy types.' },
  ],
  content: {
    simulationId: autoScalingSimulation.id,
    instructions: [
      { id: 'spike', label: '1. The lag', description: 'Run the default (target tracking, spike). Watch the instances overload for a tick while the new ones warm up, then recover.' },
      { id: 'scheduled', label: '2. Anticipate it', description: 'Switch to scheduled scaling on the same spike. Capacity is raised before the load arrives, so there is no overload — but it only works because the pattern is known.' },
      { id: 'step', label: '3. Step and cooldown', description: 'Switch to step scaling. Note it adds instances in steps and then holds during its cooldown even if the metric is still high.' },
      { id: 'bounds', label: '4. Bounds', description: 'Lower the maximum capacity and replay the spike. Capacity hits the ceiling and stays overloaded — the maximum is a hard cap.' },
      { id: 'diurnal', label: '5. A daily curve', description: 'Choose the diurnal pattern and compare scale-out on the way up with gentle scale-in on the way down.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'scaled-out',
        label: 'A policy scaled out in response to rising load',
        check: (state) => (state as ScalingState).ticks.some((t) => t.action === 'scale-out' || (t.action === 'scheduled' && t.desired > t.serving)),
      },
      {
        id: 'saw-lag',
        label: 'Observed the fleet overloaded while new instances warmed up (reactive scaling lag)',
        check: (state) => {
          const s = state as ScalingState;
          return s.config.policy !== 'scheduled' && s.ticks.some((t) => t.overloaded);
        },
      },
      {
        id: 'scheduled-no-overload',
        label: 'Scheduled scaling handled the spike without overloading',
        check: (state) => {
          const s = state as ScalingState;
          return s.config.policy === 'scheduled' && s.config.scenario === 'spike' && s.ticks.length > 0 && !s.ticks.some((t) => t.overloaded);
        },
      },
      {
        id: 'hit-cap',
        label: 'Saw capacity held at the maximum bound',
        check: (state) => {
          const s = state as ScalingState;
          return s.ticks.some((t) => t.serving === s.config.max || t.desired === s.config.max);
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'vertical-vs-horizontal-scaling': verticalVsHorizontal,
    'how-auto-scaling-works': howAutoScalingWorks,
    'azure-autoscale': azureAutoscale,
    'aws-auto-scaling': awsAutoScaling,
    'auto-scaling-comparison': comparison,
  },
  labs: {
    'design-an-auto-scaling-policy-lab': scalingLab,
  },
  simulations: {
    'design-an-auto-scaling-policy-lab': bindSimulation(autoScalingSimulation, renderScalingState),
  },
};
