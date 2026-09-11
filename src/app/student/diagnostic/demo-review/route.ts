import { createClient } from "@/lib/supabase/server";
import reviewHtml from "./review.json";

export const dynamic = "force-dynamic";

/** Saved synthetic session, restricted to its demonstration account. */
export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) {
    return Response.redirect(new URL("/login", request.url));
  }
  if (user.id !== "c0a033fc-2b2a-480e-b3d1-28d562901fd7") {
    return new Response("Cette démonstration est accessible avec le compte doves.demo.", {
      status: 403, headers: { "Cache-Control": "private, no-store" },
    });
  }
  return new Response(reviewHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
