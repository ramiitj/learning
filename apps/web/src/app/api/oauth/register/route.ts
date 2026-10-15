import { registerClient } from "@/auth/oauth";

/** RFC 7591 dynamic client registration. Registering grants nothing: the creator still has to approve the client. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { client_name?: string; redirect_uris?: string[] };
  try {
    const client_id = await registerClient(body);
    return Response.json({ client_id, client_name: body.client_name, redirect_uris: body.redirect_uris, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none" }, { status: 201 });
  } catch (e) {
    return Response.json({ error: "invalid_redirect_uri", error_description: (e as Error).message }, { status: 400 });
  }
}
