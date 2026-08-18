import { isNodejsRuntime } from "@/lib/config/runtime";

export async function register(): Promise<void> {
  if (isNodejsRuntime()) {
    await import("@/lib/config/env");
  }
}
