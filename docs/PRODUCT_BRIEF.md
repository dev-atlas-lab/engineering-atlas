# Product Brief — Engineering Atlas

## What It Is

Engineering Atlas is a frontend-only interactive learning platform that helps software engineers understand how technologies, infrastructure, and complex systems work internally.

## Problem

Engineers learning cloud infrastructure, distributed systems, and complex technologies face:

- **Fragmented resources.** Vendor docs explain their own services but rarely teach underlying concepts or compare approaches.
- **Passive learning.** Most resources are static text. Engineers can't explore, experiment, or observe system behavior.
- **Missing mental models.** Without interactive exploration, engineers memorize APIs without understanding the systems behind them.
- **Provider lock-in of knowledge.** Engineers learn one cloud provider and struggle to transfer concepts to another.

## Solution

A concept-first learning platform that combines:

- Interactive architecture visualizations adapted to each concept.
- Step-by-step technical walkthroughs with timeline controls.
- Browser-based simulations with deterministic behavior.
- Local hands-on labs with clear instructions and expected results.
- Multi-provider comparisons rooted in shared engineering principles.
- Knowledge checks and architecture challenges.

## Initial Scope — Phase 1: Cloud Fundamentals

Common cloud concepts across Azure and AWS:

| Concept Area | Examples |
|---|---|
| Cloud Computing Models | IaaS, PaaS, SaaS, serverless |
| Global Infrastructure | Regions, availability zones, edge locations |
| Compute | Virtual machines, containers, serverless functions |
| Storage | Block, object, file storage |
| Networking | VNets/VPCs, subnets, DNS, CDN |
| Identity & Access | IAM, RBAC, policies |
| Security | Encryption, key management, firewalls |
| Load Balancing | Application and network load balancers |
| Scalability & Reliability | Auto-scaling, high availability, fault tolerance |
| Monitoring & Observability | Metrics, logs, traces, alerting |

Providers: **Microsoft Azure** and **Amazon Web Services (AWS)**.

## What It Is Not

- Not a certification prep tool (though it may help).
- Not a replacement for official provider documentation.
- Not a managed cloud environment or sandbox.
- Not a backend application or SaaS service.

## Constraints

- Frontend-only. No backend, authentication, or cloud integration.
- Local persistence only.
- Simulations are browser-based and deterministic.
- Labs provide instructions — they do not execute commands on behalf of the user.
- All results from simulations are clearly labeled as simulated.

## Target Users

- Software engineers learning cloud infrastructure.
- Engineers expanding from one cloud provider to another.
- Engineers who want to understand systems, not just memorize APIs.
- Self-directed learners who prefer interactive exploration over passive reading.

## Success Criteria

- Engineers can explain a concept's fundamentals independent of any provider.
- Engineers can compare how Azure and AWS implement the same concept.
- Interactive visualizations make system behavior observable.
- Labs have clear validation criteria so engineers know when they've succeeded.
- The platform feels like exploring a system, not reading a textbook.
