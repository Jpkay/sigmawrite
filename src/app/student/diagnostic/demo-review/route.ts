import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import {
  DEMO_REVIEW_COPY,
  demoReviewDocumentDisplay,
  demoReviewForbiddenDisplay,
} from "@/lib/diagnostic/granular/demo-review-display";
import { journalStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import reviewHtml from "./review.json";

export const dynamic = "force-dynamic";

/** Saved synthetic session, restricted to its demonstration account. */
export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) {
    return Response.redirect(new URL("/login", request.url));
  }
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  const studentId = profile?.role === "student" ? await getCurrentStudentId(db) : null;
  if (user.id !== "921b350e-61dc-4f0d-a8b7-a2717e94f902") {
    if (studentId) {
      await journalStudentPayload(studentId, "legacy:diagnostic-demo-review-forbidden", demoReviewForbiddenDisplay());
    }
    return new Response(DEMO_REVIEW_COPY.forbidden, {
      status: 403, headers: { "Cache-Control": "private, no-store" },
    });
  }
  if (!studentId) throw new Error("Profil élève introuvable.");
  await journalStudentPayload(studentId, "legacy:diagnostic-demo-review", demoReviewDocumentDisplay(reviewHtml));
  return new Response(reviewHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
