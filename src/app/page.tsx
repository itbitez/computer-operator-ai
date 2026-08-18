import { connection } from "next/server";

export default async function Home() {
  // Nonce-based CSP requires per-request rendering: a statically built page has
  // no request headers, so Next.js could not stamp its inline scripts with the
  // nonce and the browser would block them.
  await connection();

  return (
    <main>
      <h1>Computer Operator AI</h1>
    </main>
  );
}
