import { createPublicKey } from "node:crypto";
import { calculateJwkThumbprint, exportJWK, type JWK } from "jose";

/**
 * The tool's public signing key, for future LTI services (deep linking, grade
 * passback). The private key lives only in the LTI_PRIVATE_KEY environment
 * variable (PKCS#8 PEM; see .env.example for how to generate it). Only the
 * public half is ever exported.
 */
export async function toolJwks(pem = process.env.LTI_PRIVATE_KEY): Promise<{ keys: JWK[] }> {
  if (!pem) return { keys: [] };
  // Environment variables often carry newlines as "\n".
  const pub = createPublicKey(pem.replace(/\\n/g, "\n"));
  const jwk = await exportJWK(pub);
  for (const k of ["d", "p", "q", "dp", "dq", "qi"]) delete (jwk as Record<string, unknown>)[k];
  const kid = await calculateJwkThumbprint(jwk);
  return { keys: [{ ...jwk, kid, alg: jwk.kty === "EC" ? "ES256" : "RS256", use: "sig" }] };
}
