import { getDatabase } from "@/lib/db";

export async function GET(): Promise<Response> {
  try {
    await getDatabase().$queryRaw`SELECT 1`;

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
  } catch {
    return Response.json(
      {
        service: "berfinakbas.com",
        status: "unavailable",
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 503,
      },
    );
  }
}
