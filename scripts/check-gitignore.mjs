// Merge gate: makes it impossible to repeat the 2026-08-18 gap where
// .gitignore covered only current-issues.md and .env could have landed in
// history on the first `git add .`. Exits non-zero when:
//   1. ".env" is not ignored, or
//   2. any tracked file whose basename is ".env" or starts with ".env."
//      exists, other than the one allowed exception ".env.example".
import { execFileSync } from "node:child_process";
import process from "node:process";

const SECRET_BASENAME = ".env";
const ALLOWED_EXAMPLE = ".env.example";

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

try {
  runGit(["check-ignore", "-q", SECRET_BASENAME]);
} catch {
  console.error(
    `FAIL: "${SECRET_BASENAME}" is not gitignored. Add ".env" to .gitignore — committing it would leak credentials.`,
  );
  process.exit(1);
}

const tracked = runGit(["ls-files"]).split("\n").filter(Boolean);
const offenders = tracked.filter((file) => {
  const base = file.split("/").at(-1);
  return base === SECRET_BASENAME || (base !== ALLOWED_EXAMPLE && base.startsWith(`${SECRET_BASENAME}.`));
});

if (offenders.length > 0) {
  console.error(
    `FAIL: tracked env file(s) other than "${ALLOWED_EXAMPLE}": ${offenders.join(", ")}. Remove them from git.`,
  );
  process.exit(1);
}

console.log(`OK: ${SECRET_BASENAME} is gitignored; no tracked .env* files other than ${ALLOWED_EXAMPLE}`);
