/**
 * Conservative request-body ceiling for the interim BFF upload route.
 *
 * Matches the ~4.5 MB serverless-function request cap documented in
 * `docs/integration/Training.md` (§11). The backend's `record-config.maxBytes`
 * may be lower; this is the deployment floor the browser must stay under until
 * a pre-signed upload flow replaces the proxy.
 */
export const MEMBER_UPLOAD_MAX_BYTES = 4_500_000;
