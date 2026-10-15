import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  (await draftMode()).disable();
  (await cookies()).delete("lm-preview");
  redirect("/");
}
