import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 3123;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

let server: ChildProcess | undefined;
let logs = "";

beforeAll(async () => {
  // next dev sets NODE_ENV itself; carrying a parent NODE_ENV through would
  // make the CLI run the wrong mode, so it is explicitly unset. The two
  // validated variables are test values only — the smoke test must not
  // depend on a real .env file.
  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT), "-H", "127.0.0.1"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: undefined,
      DATABASE_URL: "postgresql://postgres:test-password@127.0.0.1:5432/coa_test",
      REDIS_URL: "redis://127.0.0.1:6379",
    } as unknown as NodeJS.ProcessEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server = child;

  child.stdout?.on("data", (chunk: Buffer) => {
    logs += String(chunk);
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    logs += String(chunk);
  });

  // The first request compiles the route, which is slow on cold caches, so
  // poll until the server answers or the deadline passes.
  const deadline = Date.now() + 150_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next dev exited early with code ${child.exitCode}\n${logs}`);
    }
    try {
      const res = await fetch(BASE_URL);
      if (res.status === 200) {
        return;
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`next dev did not become ready within 150s\n${logs}`);
});

afterAll(() => {
  if (!server || server.exitCode !== null) {
    return;
  }
  if (process.platform === "win32") {
    // Kill the whole process tree: next dev keeps children alive on Windows.
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill("SIGKILL");
  }
});

describe("placeholder route", () => {
  it("returns 200 with the placeholder content", async () => {
    const res = await fetch(BASE_URL);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Computer Operator AI");
  });
});
