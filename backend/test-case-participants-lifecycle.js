let okCount = 0;
let errCount = 0;

/* End-to-end participant flow tests:
   - List -> Invite -> Accept -> Update -> Delete (incl. guard: last mediator)
   - Negative cases: unauthorized, unknown user, last-mediator delete/demote
*/

const BASE = "http://localhost:4000/api/cases";
const CASE_ID = 4;

// Seeded users from earlier steps:
const ALICE = "11111111-1111-1111-1111-111111111111"; // mediator (active)
const BOB   = "22222222-2222-2222-2222-222222222222"; // divorcee (invited/active in flow)

const TOKEN = "testtoken"; // placeholder auth middleware accepts any non-empty token
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function req(method, path, body = null, headers = H) {
  const res = await fetch(`${BASE}/${CASE_ID}/participants${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
    const raw = await res.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }
    return { ok: res.ok, status: res.status, data };
}

function logStep(title) {
  console.log("\n" + "—".repeat(70));
  console.log(title);
  console.log("—".repeat(70));
}

function expectOk(cond, msg) {
  if (!cond) {
    console.error("❌ " + msg);
    throw new Error(msg);
  }
  okCount++;
  console.log("✅ " + msg);
}

function expectError(r, status, msg) {
  if (r.status === status) {
    errCount++;
    console.log(`✅ ${msg} (got ${status} as expected)`);
  } else {
    console.error(`❌ ${msg} (got ${r.status}, expected ${status})`);
    throw new Error(msg);
  }
}

(async () => {
  console.log("🧪 Case Participants Lifecycle — Case ID:", CASE_ID);

  // 0) Unauthorized guard
  logStep("0) Unauthorized GET should 401");
  {
    const r = await req("GET", "", null, {}); // no headers
    expectError(r, 401, "Unauthorized GET blocked");
  }

  // 1) Initial list
  logStep("1) Initial list");
  {
    const r = await req("GET", "");
    expectOk(r.ok, "GET participants returned 200");
    console.table(r.data);
  }

  // 2) Re-invite BOB
  logStep("2) Invite Bob (divorcee) — idempotent");
  {
    const r = await req("POST", "/invite", { userId: BOB, role: "divorcee" });
    expectOk(r.ok, "Invite Bob returned 200");
    expectOk(r.data.status === "invited", "Bob status set to 'invited'");
  }

  // 3) Accept BOB
  logStep("3) Accept Bob");
  {
    const r = await req("POST", "/accept", { userId: BOB });
    expectOk(r.ok, "Accept Bob returned 200");
    expectOk(r.data.status === "active", "Bob now 'active'");
  }

  // 4) Promote BOB
  logStep("4) Promote Bob to mediator");
  {
    const r = await req("PATCH", `/${BOB}`, { role: "mediator", status: "active" });
    expectOk(r.ok, "PATCH Bob -> mediator returned 200");
    expectOk(r.data.role === "mediator" && r.data.status === "active", "Bob is active mediator");
  }

  // 5) Remove ALICE
  logStep("5) Delete Alice (should succeed: Bob remains mediator)");
  {
    const r = await req("DELETE", `/${ALICE}`);
    expectOk(r.ok, `DELETE Alice returned ${r.status}`);
  }

  // 6) Try to remove last mediator (BOB) — should 400
  logStep("6) Delete Bob as last mediator (should 400)");
  {
    const r = await req("DELETE", `/${BOB}`);
    expectError(r, 400, "DELETE Bob blocked as last mediator");
  }

  // 7) Restore ALICE
  logStep("7) Restore Alice (invite as mediator -> accept)");
  {
    const inv = await req("POST", "/invite", { userId: ALICE, role: "mediator" });
    expectOk(inv.ok, "Invite Alice returned 200");
    const acc = await req("POST", "/accept", { userId: ALICE });
    expectOk(acc.ok, "Accept Alice returned 200");
    expectOk(acc.data.role === "mediator" && acc.data.status === "active", "Alice active mediator restored");
  }

  // 8) Demote ALICE then try to demote BOB
  logStep("8) Demote Alice to divorcee (should succeed), then demote Bob (should fail)");
  {
    const a1 = await req("PATCH", `/${ALICE}`, { role: "divorcee", status: "active" });
    expectOk(a1.ok, "Demote Alice returned 200");
    expectOk(a1.data.role === "divorcee", "Alice is now divorcee");

    const b1 = await req("PATCH", `/${BOB}`, { role: "divorcee" });
    expectError(b1, 400, "Demote Bob blocked as last mediator");
  }

  // 9) Cleanup
  logStep("9) Cleanup — set Alice back to mediator");
  {
    const r = await req("PATCH", `/${ALICE}`, { role: "mediator", status: "active" });
    expectOk(r.ok, "Restore Alice mediator returned 200");
  }

  // 10) Unknown user accept
  logStep("10) Accept unknown user (should 404)");
  {
    const UNKNOWN = "33333333-3333-3333-3333-333333333333";
    const r = await req("POST", "/accept", { userId: UNKNOWN });
    expectError(r, 404, "Unknown accept blocked");
  }

  // 11) Final list
  logStep("11) Final list");
  {
    const r = await req("GET", "");
    expectOk(r.ok, "GET participants returned 200");
    console.table(r.data);
  }

  console.log("\n🎉 All tests completed.");
  console.log(`Summary: ${okCount} OK checks, ${errCount} expected-error checks passed.`);
})().catch(err => {
  console.error("\n💥 Test run failed:", err.message);
  console.log(`Summary so far: ${okCount} OK, ${errCount} expected-error`);
  process.exit(1);
});
