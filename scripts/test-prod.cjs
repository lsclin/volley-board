// Test script - creates activity on production
async function main() {
  const BASE = "https://volley-board-1.onrender.com";
  let cookies = "";

  console.log("1. Login...");
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "volley2024" }),
  });
  const setCookie = login.headers.get("set-cookie") || "";
  cookies = setCookie.split(";")[0];
  console.log("  Status:", login.status, "Cookies:", cookies ? "OK" : "NONE");

  if (!cookies) {
    console.log("ERROR: No cookie received from login");
    return;
  }

  console.log("2. Create team A...");
  const teamA = await fetch(`${BASE}/api/admin/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ name: "A" }),
  });
  console.log("  Status:", teamA.status);

  console.log("3. Create team B...");
  const teamB = await fetch(`${BASE}/api/admin/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ name: "B" }),
  });
  console.log("  Status:", teamB.status);

  console.log("4. Create activity...");
  const activity = await fetch(`${BASE}/api/admin/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({
      title: "今晚野球",
      type: "pickup",
      startAt: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
      endAt: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
      location: "...",
      note: "...",
    }),
  });
  const act = await activity.json();
  console.log("  ID:", act.id, "Title:", act.title, "Location:", act.location);

  console.log("5. Public activities...");
  const pub = await fetch(`${BASE}/api/activities`);
  const pubData = await pub.json();
  console.log("  Count:", pubData.length);
  for (const a of pubData) {
    console.log("  -", a.title, "|", a.location, "|", a.status);
  }
}

main().catch(console.error);