// All process.env access lives under lib/config so the ESLint isolation rule can
// ban it everywhere else without exceptions. NEXT_RUNTIME is a Next-injected
// runtime marker, not an application env var, so it is not part of the validated
// env schema — this helper only decides which runtime the boot hook is running in.
export function isNodejsRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "nodejs";
}
