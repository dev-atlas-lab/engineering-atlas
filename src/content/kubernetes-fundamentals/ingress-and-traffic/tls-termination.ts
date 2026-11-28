import type { ConceptContentModule, LessonBody } from '../../types';

const howTlsTerminates: LessonBody = {
  learningObjectives: [
    'Describe TLS termination at the controller',
    'Explain how the controller picks a certificate from SNI',
  ],
  sections: [
    {
      heading: 'Secrets hold the certificate',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Ingress resource references a Secret of type `kubernetes.io/tls` which holds a PEM certificate chain and a private key. The controller reads that Secret at startup and on every change, and configures its proxy to present that certificate on the TLS listener.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: Secret
metadata: { name: shop-tls }
type: kubernetes.io/tls
data:
  tls.crt: <base64 cert chain>
  tls.key: <base64 private key>
---
spec:
  tls:
  - hosts: [shop.example.com, www.shop.example.com]
    secretName: shop-tls`,
        },
      ],
    },
    {
      heading: 'SNI picks the certificate',
      blocks: [
        {
          type: 'paragraph',
          text: 'The controller can host many hostnames behind a single IP. When a client opens a TLS connection it sends the hostname it wants in the Server Name Indication (SNI) field of the ClientHello. The controller looks up the matching Secret and presents that cert. Without SNI (very rare in modern clients), the controller falls back to a default certificate.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'cert-manager is the canonical automated issuer for Kubernetes. It watches Ingress and Certificate CRDs, requests certs from Let\'s Encrypt (or an internal CA), and writes the resulting Secret in the right namespace. Combined with HTTP01 challenges served by the Ingress controller itself, this makes TLS maintenance fully automatic.',
        },
      ],
    },
  ],
};

const passthroughReencrypt: LessonBody = {
  learningObjectives: ['Compare termination, passthrough, and re-encryption'],
  sections: [
    {
      heading: 'Three patterns',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Pattern', 'Who terminates TLS', 'Backend sees'],
          rows: [
            ['Termination (default)', 'Ingress controller', 'HTTP'],
            ['Re-encrypt', 'Ingress controller then re-encrypt to backend', 'HTTPS, but with a different cert'],
            ['Passthrough', 'Backend Pod directly (controller just forwards TCP + SNI)', 'HTTPS, original cert'],
          ],
        },
        {
          type: 'list',
          items: [
            'Termination — the simplest and fastest. Adopts Secret-based cert lifecycle; works with HTTP/2 push, HSTS, inspection.',
            'Re-encrypt — used when mTLS must terminate at the pod (compliance, service mesh). Often used with a mesh sidecar as the TLS endpoint inside the Pod.',
            'Passthrough — rare; required when the backend owns the cert (e.g. a Kubernetes API Server behind an Ingress). The controller cannot inspect the request, so L7 routing beyond SNI is impossible.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Passthrough on ingress-nginx requires the `--enable-ssl-passthrough` flag and dedicates a TCP port (not the HTTP one). Not every controller supports it; some use HAProxy or Envoy routes to achieve similar.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-tls-terminates': howTlsTerminates,
    'passthrough-and-reencrypt': passthroughReencrypt,
  },
  labs: {},
  simulations: {},
};
