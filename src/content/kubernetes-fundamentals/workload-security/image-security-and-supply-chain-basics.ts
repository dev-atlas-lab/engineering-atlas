import type { ConceptContentModule, LessonBody } from '../../types';

const signingAndVerification: LessonBody = {
  learningObjectives: [
    'Describe the sign and verify flow (cosign + policy controller)',
    'Enforce signatures at admission time',
  ],
  sections: [
    {
      heading: 'An image becomes trustable when it is verifiable',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container image is a set of filesystem layers plus a manifest. By default, `docker pull` trusts whatever the registry serves. Supply-chain security adds a signature over the image\'s content digest, published to a transparency log, which an admission controller can verify before allowing a Pod to run that image.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Build: CI builds the image and pushes it to a registry, getting a digest (sha256:abc...).',
            'Sign: CI uses cosign to sign the digest. The signature is published to the registry and (keyless mode) to Sigstore\'s Rekor transparency log.',
            'Attest: CI publishes SBOMs and provenance attestations alongside, signed the same way.',
            'Deploy: an admission controller (sigstore-policy-controller, Kyverno, Connaisseur) checks that any image being admitted has a valid signature from an allowed signer.',
            'Enforce: images without a valid signature are rejected at admission before any Pod starts running them.',
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# A Kyverno policy enforcing signatures.
apiVersion: kyverno.io/v2
kind: ClusterPolicy
metadata: { name: require-signed-images }
spec:
  validationFailureAction: Enforce
  rules:
  - name: verify
    match: { any: [{ resources: { kinds: [Pod] } }] }
    verifyImages:
    - imageReferences: ["registry.example.com/*"]
      attestors:
      - entries:
        - keys: { publicKeys: |-
            -----BEGIN PUBLIC KEY-----
            MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQc...
            -----END PUBLIC KEY----- }`,
        },
      ],
    },
  ],
};

const supplyChainLayers: LessonBody = {
  learningObjectives: ['Describe the layers of a supply-chain security program'],
  sections: [
    {
      heading: 'Four layers that compose',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Layer', 'Question answered', 'Artifact'],
          rows: [
            ['Signing', 'Did the expected pipeline build this?', 'cosign signature'],
            ['SBOM', 'What does this image contain?', 'CycloneDX / SPDX document'],
            ['Provenance', 'How was this image built?', 'SLSA provenance attestation'],
            ['Scanning', 'What known CVEs does this image contain?', 'Trivy / Grype report'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The four are independently useful and generally adopted in that order: signing first (prevents unknown images), then scanning (prevents known-vulnerable), then SBOM (enables searching the fleet when a new CVE lands — "which Pods have log4j 2.14?"), then provenance (enables trust-chain analysis).',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Admission-time enforcement must fail-closed. "Signature check timed out — admit anyway" is a classic bypass. If the policy controller is down, Pods using unverified images should be rejected until the controller recovers, with an explicit break-glass procedure.',
        },
      ],
    },
    {
      heading: 'Where to start',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Require signatures from your own CI on your own images. This alone shuts down "typo in image name picked up from a malicious lookalike."',
            'Add nightly scanning of running images for new CVEs. Alert, don\'t block.',
            'Enforce SBOM presence. Even if nothing is enforced on the contents, having the SBOM lets you answer vulnerability questions fast.',
            'Add provenance (SLSA level 2+) once CI is itself hardened.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'signing-and-verification': signingAndVerification,
    'supply-chain-layers': supplyChainLayers,
  },
  labs: {},
  simulations: {},
};
