import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/config/env";

describe("parseEnv", () => {
  it("accepts a well-formed environment", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:pw@127.0.0.1:5432/db",
      REDIS_URL: "redis://127.0.0.1:6379",
    });
    expect(env).toEqual({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:pw@127.0.0.1:5432/db",
      REDIS_URL: "redis://127.0.0.1:6379",
    });
  });

  it("rejects an environment missing DATABASE_URL and names the variable", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "test",
        REDIS_URL: "redis://127.0.0.1:6379",
      }),
    ).toThrowError(/DATABASE_URL/);
  });

  it("rejects an environment missing REDIS_URL and names the variable", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://postgres:pw@127.0.0.1:5432/db",
      }),
    ).toThrowError(/REDIS_URL/);
  });

  it("rejects a malformed NODE_ENV value and names the variable", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "staging",
        DATABASE_URL: "postgresql://postgres:pw@127.0.0.1:5432/db",
        REDIS_URL: "redis://127.0.0.1:6379",
      }),
    ).toThrowError(/NODE_ENV/);
  });

  it("rejects an empty DATABASE_URL as malformed", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "test",
        DATABASE_URL: "",
        REDIS_URL: "redis://127.0.0.1:6379",
      }),
    ).toThrowError(/DATABASE_URL/);
  });
});
