"use server";
import { headers } from "next/headers";
import type { PayloadRequest } from "payload";
import { cmsClient } from "../client";
import { approvePilotList } from "../pilot-approve";

/** The creator approves the revision list they ticked. Needs a recent passkey confirmation. */
export async function approveRevisionList(_prev: unknown, form: FormData): Promise<{ ok?: string; error?: string }> {
  const payload = await cmsClient();
  const { user } = await payload.auth({ headers: await headers() });
  const req = { payload, user, context: {} } as unknown as PayloadRequest;
  return approvePilotList(payload, req, { from: String(form.get("from") ?? ""), to: String(form.get("to") ?? ""), ids: form.getAll("approve").map(String) });
}
