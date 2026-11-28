import type { ConceptContentModule, LessonBody } from '../../types';
import { podLifecycleScene } from '../operations-scenes';

const phaseOverview: LessonBody = {
  learningObjectives: [
    'Enumerate the five Pod phases and describe the transitions',
    'Explain why container restarts are invisible at the phase level',
  ],
  analogy:
    'Think of phase as a traffic light and container state as what each car is doing. The light can stay green (Running) while individual cars (containers) stall, restart, or get waved off.',
  sections: [
    {
      heading: 'The five phases',
      blocks: [
        {
          type: 'paragraph',
          text: 'Pod `status.phase` is a single string the API Server records to summarise what the Pod is doing. There are five values, all upper-case: Pending, Running, Succeeded, Failed, Unknown. Phase is deliberately coarse — it tells you where a Pod is in its lifecycle, not whether every container inside it is healthy.',
        },
        {
          type: 'list',
          items: [
            'Pending — the Pod was accepted but at least one container is not yet running. Covers image pull, container creation, scheduling waits.',
            'Running — the Pod is bound to a node and at least one container is running or in the process of starting or restarting.',
            'Succeeded — all containers terminated successfully (exit code 0) and will not be restarted.',
            'Failed — all containers terminated, and at least one exited with a non-zero status or was killed by the system.',
            'Unknown — the state of the Pod cannot be obtained (typically the node hosting it is unreachable).',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Succeeded and Failed are terminal. Kubernetes does not transition them anywhere — the Pod object stays until it is deleted or garbage-collected. A rollout does not "revive" a Succeeded Pod; it creates new ones.',
        },
      ],
    },
    {
      heading: 'Container restarts stay in Running',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container inside a Running Pod can crash, be killed by a failing liveness probe, or be OOMKilled — and the Pod phase will stay Running the entire time. The restart count on the container status climbs, but phase is a Pod-level summary and a restart is container-level activity. This is why "Running" alone is not a health signal; you need to look at `status.containerStatuses[].ready` or the Pod `Ready` condition.',
        },
      ],
    },
  ],
  visualization: podLifecycleScene,
  knowledgeCheck: [
    {
      id: 'phase-kc-1',
      type: 'single-choice',
      prompt: 'A Pod is running three containers. One of them crashes and is restarted by the kubelet. What happens to the Pod phase?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why container restarts are invisible at the phase level',
      options: [
        { id: 'a', label: 'Phase stays Running — restart count on that container\'s status climbs by 1', correct: true, explanation: 'Correct. Phase is Pod-level and does not track individual container churn.' },
        { id: 'b', label: 'Phase transitions to Pending and back to Running', correct: false, explanation: 'Pending is for a newly accepted Pod whose containers have not yet started, not for mid-life restarts.' },
        { id: 'c', label: 'Phase goes to Failed because a container died', correct: false, explanation: 'Failed is terminal and requires that all containers have terminated. One restart of one container does not end the Pod.' },
      ],
    },
  ],
};

const phaseVsConditions: LessonBody = {
  learningObjectives: ['Distinguish phase, conditions, and container state as three different views of a Pod'],
  sections: [
    {
      heading: 'Three overlapping views',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Pod carries three different pieces of lifecycle information, each answering a different operational question.',
        },
        {
          type: 'comparisonTable',
          headers: ['Field', 'Question it answers', 'Granularity', 'Example'],
          rows: [
            ['status.phase', 'Where in the lifecycle is this Pod?', 'Pod', 'Running'],
            ['status.conditions[]', 'Does this Pod meet a specific gate?', 'Pod, multiple gates', 'PodScheduled=True, Ready=False, ContainersReady=False'],
            ['status.containerStatuses[].state', 'What exactly is each container doing?', 'Container, detailed', 'Waiting (reason: CrashLoopBackOff)'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The Ready condition is the one Services actually use. A Pod can be in phase Running but with Ready=False — it is alive but should not receive traffic, usually because its readiness probe is failing. kubectl get pods shows this as READY 0/1.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Alerting on phase alone is a common mistake. A Pod in CrashLoopBackOff still has phase=Running and the containerStatuses[].state.waiting.reason=CrashLoopBackOff. Alert on the Ready condition or on restart counts instead.',
        },
      ],
    },
    {
      heading: 'Where each field comes from',
      blocks: [
        {
          type: 'list',
          items: [
            'Phase is computed by the kubelet from containerStatuses and reported to the API Server.',
            'PodScheduled and Initialized conditions are set by the scheduler and kubelet respectively.',
            'Ready and ContainersReady conditions are derived from probes plus readiness gates.',
            'Container state (Waiting, Running, Terminated) is reported directly by the kubelet based on what the container runtime tells it.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'phase-overview': phaseOverview,
    'phase-vs-conditions': phaseVsConditions,
  },
  labs: {},
  simulations: {},
};
