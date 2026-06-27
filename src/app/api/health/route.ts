export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "volley-board",
    timestamp: new Date().toISOString(),
  });
}
