// tests/test-mediator.cjs
// Quick smoke test: verify mediator JWT works against /api/cases/:id/participants

const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

(async () => {
  const prefix = "[mediator-smoke]";
  try {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:4000/api";
    const jwt = process.env.MEDIATOR_JWT;
    const caseId = process.env.MEDIATOR_CASE_ID; // set this in .env alongside the JWT

    if (!jwt) throw new Error("Missing MEDIATOR_JWT in .env");
    if (!caseId) throw new Error("Missing MEDIATOR_CASE_ID in .env");

    const url = `${baseUrl}/cases/${caseId}/participants`;
    console.log(`${prefix} GET ${url}`);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} – ${text}`);
    }

    const data = await res.json();
    console.log(`${prefix} ✅ Success, received participants:`, data);
    process.exit(0);
  } catch (err) {
    console.error(`${prefix} ❌ Smoke test failed:`, err.message);
    process.exit(1);
  }
})();
