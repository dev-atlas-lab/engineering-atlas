import type { ConceptMeta, Lesson } from '../../types';
import { serverlessRequestFlowScene } from './scenes';

const introductionToServerless: Lesson = {
  id: 'introduction-to-serverless',
  title: 'Introduction to Serverless Computing',
  kind: 'concept',
  learningObjectives: [
    'Explain what "serverless" means architecturally, and what it does not mean',
    'Identify workloads well-suited to a serverless execution model',
  ],
  sections: [
    {
      heading: '"Serverless" does not mean no servers',
      blocks: [
        {
          type: 'paragraph',
          text: 'Serverless computing still runs on servers — the term describes who manages them and how they are billed, not their absence. In a serverless function platform, the provider provisions, patches, and scales the underlying compute entirely; the only unit a developer deploys is a function’s code, triggered by an event, and billing is based on actual execution time and invocation count rather than reserved capacity.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'This is the sharpest contrast with the two concepts covered earlier: a VM is billed whether it is busy or idle; a container still runs inside compute capacity someone provisions (even if that someone is a serverless container platform managing it for you); a serverless function has literally nothing running, and therefore costs nothing, between invocations.',
        },
      ],
    },
    {
      heading: 'When serverless functions fit',
      blocks: [
        {
          type: 'list',
          items: [
            'Event-driven, short-lived work: processing a file upload, responding to a queue message, handling an API request',
            'Highly variable or unpredictable traffic, where paying for idle reserved capacity would be wasteful',
            'Glue logic between other managed services, where a small amount of code reacts to one service’s event and calls another',
          ],
        },
        {
          type: 'paragraph',
          text: 'Serverless functions fit less well for long-running processes (most platforms cap execution duration per invocation), workloads needing persistent in-memory state between requests, or workloads where predictable, sustained throughput makes reserved VM or container capacity more cost-effective than per-invocation billing.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'intro-serverless-kc-1',
      type: 'single-choice',
      prompt: 'What does "serverless" actually describe?',
      difficulty: 'beginner',
      learningObjective: 'Explain what "serverless" means architecturally, and what it does not mean',
      options: [
        {
          id: 'a',
          label: 'A model where the provider fully manages the underlying compute and billing is based on actual execution, not reserved capacity',
          correct: true,
          explanation: 'Correct — servers still exist underneath; "serverless" describes the operating and billing model, not a literal absence of servers.',
        },
        {
          id: 'b',
          label: 'A model where no physical hardware is involved at all',
          correct: false,
          explanation: 'Code still executes on physical servers — they are just entirely managed by the provider and invisible to the developer.',
        },
        {
          id: 'c',
          label: 'A synonym for containers',
          correct: false,
          explanation: 'Containers and serverless functions are distinct execution models — see the Container Architecture lesson for how they differ.',
        },
      ],
    },
  ],
};

const eventDrivenCompute: Lesson = {
  id: 'event-driven-compute',
  title: 'Event-Driven Compute and Cold Starts',
  kind: 'concept',
  learningObjectives: ['Trace the lifecycle of a request through a serverless platform, including the cold start penalty'],
  sections: [
    {
      heading: 'Triggers and execution environments',
      blocks: [
        {
          type: 'paragraph',
          text: 'A serverless function is invoked by a trigger — an HTTP request, a message arriving on a queue, a file landing in storage, a scheduled timer. The platform does not keep a server running waiting for that trigger; instead, it provisions an execution environment (a lightweight, isolated runtime context) on demand when an invocation arrives.',
        },
      ],
    },
    {
      heading: 'Cold starts vs. warm starts',
      blocks: [
        {
          type: 'paragraph',
          text: 'If no execution environment is currently available for a function, the platform must provision one before running the code — allocating resources, loading the runtime, and initializing the function — and that provisioning latency is the cold start. If a recently-used execution environment is still around, the platform reuses it and skips straight to running the code: a warm start. Step through the diagram below; it models exactly this distinction for a single incoming request.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Cold start duration depends heavily on runtime and package size — it is a real latency cost, not a theoretical one, and is the main reason serverless functions are a poor fit for strict low-latency request paths unless the platform’s pre-warming features (covered in the provider lessons) are used.',
        },
      ],
    },
  ],
  visualization: serverlessRequestFlowScene,
  knowledgeCheck: [
    {
      id: 'event-driven-kc-1',
      type: 'single-choice',
      prompt: 'A function was invoked 30 seconds ago and the platform has not reclaimed its execution environment yet. What happens on the next invocation?',
      difficulty: 'intermediate',
      learningObjective: 'Trace the lifecycle of a request through a serverless platform, including the cold start penalty',
      options: [
        {
          id: 'a',
          label: 'A warm start — the existing execution environment is reused, skipping provisioning',
          correct: true,
          explanation: 'Correct. Reusing a still-available execution environment is exactly what a warm start means.',
        },
        {
          id: 'b',
          label: 'A cold start — every invocation always provisions a fresh environment',
          correct: false,
          explanation: 'Platforms reuse recently-used environments specifically to avoid paying the cold start cost on every single invocation.',
        },
        {
          id: 'c',
          label: 'The invocation fails, because only one invocation can use an execution environment ever',
          correct: false,
          explanation: 'Execution environments are explicitly designed to be reused across multiple sequential invocations.',
        },
      ],
    },
  ],
};

const azureFunctions: Lesson = {
  id: 'azure-functions',
  title: 'Azure Functions',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Describe Azure Functions’ trigger model and hosting plan trade-offs'],
  sections: [
    {
      heading: 'Triggers and bindings',
      blocks: [
        {
          type: 'paragraph',
          text: 'An Azure Function is invoked by a trigger — HTTP, Timer, Queue Storage, Blob Storage, Event Grid, and others — and can declare input/output bindings that connect it to other services (for example, reading a document from Cosmos DB) without hand-written SDK calls.',
        },
      ],
    },
    {
      heading: 'Hosting plans change the cold-start trade-off',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Plan', 'Billing', 'Cold starts'],
          rows: [
            ['Consumption', 'Per execution and per GB-second consumed', 'Possible — instances scale from zero'],
            ['Premium', 'Pre-warmed instances kept ready, plus consumption-based scale-out', 'Minimized — at least one instance is always warm'],
            ['Dedicated (App Service plan)', 'Fixed cost for an always-on App Service plan', 'None — the plan is never scaled to zero'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Durable Functions is an extension that adds stateful orchestration directly inside the Functions runtime — letting a workflow with multiple steps, waits, and fan-out/fan-in patterns be written as ordinary-looking function code. This is architecturally distinct from how AWS handles the same problem, covered in the comparison lesson.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Functions',
    keyFeatures: ['Trigger and binding model for common event sources', 'Multiple hosting plans trading cost against cold-start behavior', 'Durable Functions extension for stateful orchestration'],
    terminology: { 'Event source': 'Trigger', 'Workflow orchestration': 'Durable Functions orchestrator function' },
    architecturalNotes: ['Durable Functions state is persisted by the runtime itself, not by a separate standalone orchestration service'],
    limitations: ['Consumption plan cold starts can be noticeable for workloads with large dependencies'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview',
  },
};

const awsLambda: Lesson = {
  id: 'aws-lambda',
  title: 'AWS Lambda',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Describe AWS Lambda’s event source model and how provisioned concurrency addresses cold starts'],
  sections: [
    {
      heading: 'Event sources and execution environments',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Lambda function is invoked by an event source — API Gateway, S3, DynamoDB Streams, SQS, EventBridge, and many others. Lambda manages a pool of execution environments per function and reuses a warm one for sequential invocations when possible, exactly matching the warm/cold start model from the earlier lesson.',
        },
      ],
    },
    {
      heading: 'Provisioned concurrency',
      blocks: [
        {
          type: 'paragraph',
          text: 'Provisioned concurrency keeps a specified number of execution environments initialized and warm ahead of demand, at an additional cost, specifically to eliminate cold starts for latency-sensitive invocations — the Lambda-specific answer to the same trade-off Azure addresses with its Premium plan.',
        },
      ],
    },
    {
      heading: 'Orchestration lives in a separate service',
      blocks: [
        {
          type: 'callout',
          tone: 'info',
          text: 'AWS Step Functions, not Lambda itself, is the service responsible for multi-step, stateful workflow orchestration. A Step Functions state machine calls out to Lambda functions (and other AWS services) as steps, but the orchestration state lives in Step Functions — an architecturally different approach from Azure bundling orchestration directly into the Functions runtime via Durable Functions. Neither approach is a direct substitute for the other; they solve the same problem with a different service boundary.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Lambda',
    keyFeatures: ['Broad event source integration across AWS services', 'Provisioned concurrency for eliminating cold starts on demand', 'Pay-per-invocation and per-millisecond execution billing'],
    terminology: { 'Event source': 'Event source mapping / trigger', 'Workflow orchestration': 'AWS Step Functions (a separate service)' },
    architecturalNotes: ['Multi-step workflow state is held by Step Functions, not inside the Lambda function itself — see the comparison lesson for why this matters architecturally'],
    limitations: ['Provisioned concurrency is billed for the time it is configured, whether or not it is actually invoked'],
    documentationUrl: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html',
  },
};

const serverlessComparison: Lesson = {
  id: 'serverless-architecture-comparison',
  title: 'Architecture Comparison: Azure Functions vs. AWS Lambda',
  kind: 'comparison',
  learningObjectives: ['Compare Azure Functions and AWS Lambda, including the asymmetric approach each takes to workflow orchestration'],
  sections: [
    {
      heading: 'Where they are genuinely equivalent',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both are trigger-invoked, pay-per-execution function platforms with a warm/cold execution environment model, and both offer a mechanism to keep instances pre-warmed for latency-sensitive workloads (Premium plan vs. provisioned concurrency).',
        },
      ],
    },
    {
      heading: 'Where the architecture genuinely differs',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure Functions', 'AWS Lambda'],
          rows: [
            ['Stateful workflow orchestration', 'Built into the runtime via the Durable Functions extension', 'Delegated to a separate service, Step Functions, which calls Lambda as steps'],
            ['Pre-warming mechanism', 'Premium hosting plan', 'Provisioned concurrency, configured per function'],
            ['Always-on option', 'Dedicated (App Service) plan', 'Provisioned concurrency approximates this, but Lambda has no literal "always-on" plan type the way Azure does'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Durable Functions and Step Functions are not interchangeable despite solving the same underlying problem (multi-step, stateful workflows). Durable Functions keeps orchestration state and code together in one deployable unit; Step Functions externalizes orchestration into its own state machine definition, calling out to Lambda. Migrating a Durable Functions orchestration to AWS means restructuring it as a Step Functions state machine, not a line-for-line port.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'serverless-compare-kc-1',
      type: 'single-choice',
      prompt: 'Why can’t a Durable Functions orchestration be ported to AWS as a line-for-line equivalent?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure Functions and AWS Lambda, including the asymmetric approach each takes to workflow orchestration',
      options: [
        {
          id: 'a',
          label: 'AWS handles orchestration in a separate service (Step Functions) with its own state machine model, rather than inside the function runtime itself',
          correct: true,
          explanation: 'Correct — the orchestration logic has to move from in-code (Durable Functions) to a Step Functions state machine definition, a genuine architectural restructuring.',
        },
        {
          id: 'b',
          label: 'AWS Lambda does not support multi-step workflows at all',
          correct: false,
          explanation: 'AWS does support multi-step workflows — through Step Functions, just not inside Lambda’s own runtime.',
        },
        {
          id: 'c',
          label: 'Azure Functions and AWS Lambda use incompatible programming languages',
          correct: false,
          explanation: 'Both platforms support multiple common languages — language choice is not the source of the architectural asymmetry here.',
        },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Durable Functions overview', url: 'https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview' },
    { label: 'AWS Step Functions', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html' },
  ],
};

export const serverlessFunctions: ConceptMeta = {
  id: 'serverless-functions',
  title: 'Serverless Functions',
  description: 'Event-driven compute that runs code without managing servers, scaling automatically per invocation.',
  status: 'available',
  learningObjectives: [
    'Explain what "serverless" means architecturally and when it fits a workload',
    'Trace a request through a serverless platform, including cold starts',
    'Compare Azure Functions and AWS Lambda, including their differing approaches to workflow orchestration',
  ],
  prerequisites: ['virtual-machines'],
  relatedConcepts: ['containers', 'virtual-machines'],
  estimatedMinutes: 50,
  lessons: [introductionToServerless, eventDrivenCompute, azureFunctions, awsLambda, serverlessComparison],
  // No lab in this slice — deferred and documented, not silently dropped
  // (docs/M1B_DESIGN_DECISIONS.md pattern: deferral is explicit, not an
  // empty placeholder pretending to be complete).
};
