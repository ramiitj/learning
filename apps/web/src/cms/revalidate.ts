import { revalidatePath, revalidateTag } from "next/cache";

/** Publishing goes live within seconds: drop the cached pages for this lesson in every locale. */
export function revalidateLesson(lessonId: string) {
  try {
    revalidateTag("content", { expire: 0 });
    revalidatePath(`/[locale]/lessons/${lessonId}`, "page");
    revalidatePath(`/[locale]/lessons/${lessonId}/classroom`, "page");
    revalidatePath("/[locale]", "page");
  } catch {
    // Outside a Next.js request (seed scripts, tests) there is no cache to revalidate.
  }
}

export function revalidateContent() {
  try {
    revalidateTag("content", { expire: 0 });
    revalidatePath("/", "layout");
  } catch {
    /* outside Next.js */
  }
}
