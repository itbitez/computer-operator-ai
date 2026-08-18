import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Invariant 3: every vendor is reached only through its own src/lib/<module>
// directory. The isolation modules' stubs stay empty until their unit lands, so
// these are the only files that may import the vendor SDK. Each message names
// the module to import instead.
const vendorSdkPatterns = [
  {
    regex: "^groq-sdk($|/)",
    message:
      "Groq is reachable only through lib/ai. Import `@/lib/ai/client` instead.",
  },
  {
    regex: "^@aws-sdk/",
    message:
      "Object storage is reachable only through lib/storage. Import `@/lib/storage/client` instead.",
  },
  {
    // bKash ships no official npm SDK (Unit 12 integrates over raw HTTPS), but
    // any package that names itself bKash is caught so a community SDK cannot
    // leak in later.
    regex: "bkash",
    message:
      "bKash is reachable only through lib/payments. Import `@/lib/payments/client` instead.",
  },
  {
    regex: "^bullmq$",
    message:
      "BullMQ is reachable only through lib/queue. Import `@/lib/queue/client` instead.",
  },
  {
    regex: "^nodemailer$",
    message:
      "Email is reachable only through lib/notifications. Import `@/lib/notifications/client` instead.",
  },
  {
    regex: "^next-auth($|/)",
    message:
      "The auth SDK is reachable only through lib/auth. Import `@/lib/auth/client` instead.",
  },
];

const isolationModuleDirs = [
  "src/lib/ai/**",
  "src/lib/storage/**",
  "src/lib/payments/**",
  "src/lib/notifications/**",
  "src/lib/queue/**",
  "src/lib/auth/**",
];

// Local rule rather than a new plugin dependency: core ESLint has no rule that
// bans `process.env`, and the architecture does not name an ESLint plugin. All
// environment access goes through src/lib/config/.
const noProcessEnvRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Ban direct process.env access outside src/lib/config",
    },
    messages: {
      banned:
        "Do not read process.env here. Import the validated config instead: `import { env } from \"@/lib/config/env\"`.",
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "process" &&
          node.property.type === "Identifier" &&
          node.property.name === "env"
        ) {
          context.report({ node, messageId: "banned" });
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    name: "isolation/vendor-sdk-imports",
    files: ["src/**/*.{ts,tsx}"],
    ignores: isolationModuleDirs,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: vendorSdkPatterns,
        },
      ],
    },
  },
  {
    name: "isolation/process-env",
    files: ["src/**/*.{ts,tsx}", "next.config.ts"],
    ignores: ["src/lib/config/**"],
    plugins: {
      isolation: {
        rules: {
          "no-process-env": noProcessEnvRule,
        },
      },
    },
    rules: {
      "isolation/no-process-env": "error",
    },
  },
]);

export default eslintConfig;
