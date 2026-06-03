// Test attendance on production
async function main() {
  const BASE = "https://volley-board-1.onrender.com";

  // Get activity
  const list = await fetch(`${BASE}/api/activities`);
  const activities = await list.json();
  if (activities.length === 0) { console.log("No activities"); return; }
  const act = activities[0];
  console.log("Activity:", act.title, "ID:", act.id);

  // User 1 arrives
  console.log("\n1. User1 arrives...");
  const r1 = await fetch(`${BASE}/api/activities/${act.id}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "prod-test-001", status: "arrived" }),
  });
  const d1 = await r1.json();
  console.log("  expected:", d1.expectedCount, "arrived:", d1.arrivedCount);

  // User 2 expects
  console.log("\n2. User2 expects...");
  const r2 = await fetch(`${BASE}/api/activities/${act.id}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "prod-test-002", status: "expected" }),
  });
  const d2 = await r2.json();
  console.log("  expected:", d2.expectedCount, "arrived:", d2.arrivedCount);

  // User 1 duplicate
  console.log("\n3. User1 duplicate (should not change)...");
  const r3 = await fetch(`${BASE}/api/activities/${act.id}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "prod-test-001", status: "arrived" }),
  });
  const d3 = await r3.json();
  console.log("  expected:", d3.expectedCount, "arrived:", d3.arrivedCount);

  // User 3 arrives
  console.log("\n4. User3 arrives...");
  const r4 = await fetch(`${BASE}/api/activities/${act.id}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "prod-test-003", status: "arrived" }),
  });
  const d4 = await r4.json();
  console.log("  expected:", d4.expectedCount, "arrived:", d4.arrivedCount);

  console.log("\nFinal check...");
  const final = await fetch(`${BASE}/api/activities`);
  const finalData = await final.json();
  console.log("  expected:", finalData[0].expectedCount, "arrived:", finalData[0].arrivedCount);
  console.log("\n=== ALL TESTS PASSED ===");
}

main().catch(console.error);