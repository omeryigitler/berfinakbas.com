import { POST as createClient } from "@/lib/clients/client-create";
import { GET as listClients } from "@/lib/clients/client-list-read";

export function GET(request: Request) {
  return listClients(request);
}

export function POST(request: Request) {
  return createClient(request);
}
