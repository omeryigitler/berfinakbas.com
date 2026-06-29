export function GET(): Response {
  return Response.json(
    {
      service: "berfinakbas.com",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
