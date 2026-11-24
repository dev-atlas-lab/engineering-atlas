# ADR-002: Concept-First Cloud Content Organization

## Status

Accepted

## Context

The platform covers cloud concepts across multiple providers (initially Azure and AWS). There are two natural ways to organize this content:

**Option A — Provider-first:** Separate learning tracks for each provider. "Azure Compute" and "AWS Compute" are independent sections. Cross-references exist but each track stands alone.

**Option B — Concept-first:** A single "Compute" concept teaches the fundamentals, then branches into provider-specific implementations with explicit comparisons.

## Decision

Use a **concept-first** content organization.

The primary learning unit is the engineering concept (e.g., "Virtual Machines"), not the provider service (e.g., "EC2"). Provider implementations are linked to concepts, not organized as independent hierarchies.

Learning flow for any concept:

1. What is the concept? What problem does it solve?
2. How does it work fundamentally (provider-independent)?
3. How does Azure implement it?
4. How does AWS implement it?
5. How do the implementations compare?
6. Hands-on exploration.

## Consequences

**Benefits:**
- Engineers build transferable mental models. Understanding "how virtual machines work" transfers across providers.
- Adding a third provider (GCP) means adding implementations to existing concepts, not creating a new parallel track.
- Comparisons are structured and contextual, not an afterthought.
- Reduces content duplication — shared fundamentals are written once.

**Trade-offs:**
- Not every concept maps 1:1 across providers. Some provider services don't have a direct counterpart.
- Engineers studying only one provider must still navigate the concept-first structure.
- Content authoring is more complex — each concept requires understanding multiple providers.

**Mitigations:**
- The content model allows a provider implementation to relate to multiple concepts, and a concept to have zero implementations for a given provider.
- Provider-specific "deep dive" lessons exist under each implementation, so single-provider learners can focus there after the concept introduction.
- A `terminology` mapping in each provider implementation makes provider-specific language explicit.

## Examples

**Clean mapping:**
- Concept: Virtual Machines → Azure: Azure VMs, AWS: EC2.

**Asymmetric mapping:**
- Concept: Serverless Functions → Azure: Azure Functions, AWS: Lambda.
- Azure Functions has Durable Functions (stateful orchestration) with no direct AWS equivalent. This is documented as an Azure-specific capability, not forced into a comparison.

**No direct counterpart:**
- AWS has Lightsail (simplified VPS) with no Azure equivalent at the same abstraction level. Lightsail would be referenced in the Compute category with a note about its positioning, not forced into a concept that doesn't fit.
