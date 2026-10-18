import { redirect } from "next/navigation";
import { StudentPageHeader as PageHeader } from "@/components/student-page-header";
import { StoryLibraryView } from "@/components/story/story-library";
import { requireRole } from "@/lib/auth";
import { getCurrentStudentId } from "@/lib/db/student";
import { requireStudentAccessAuthorized } from "@/lib/diagnostic/access";
import { journalStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import { STORY_COPY as copy } from "@/lib/story/copy";
import { loadStoryLibrary } from "@/lib/story/server";
import { createClient, createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** startSaga writes the outline and chapter 1 in after(): give server actions time (roadmap H.11). */
export const maxDuration = 300;

/** "Tu es le héros" library: saga in progress, picker with hero setup, shelf of authors (roadmap H.1, H.2, H.6). */
export default async function StoryLibraryPage() {
  if (!isSupabaseConfigured) redirect("/student");
  const session = await requireRole(["student"]);
  const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  await requireStudentAccessAuthorized(supabase, studentId);
  const library = await loadStoryLibrary(createServiceClient(), studentId);
  // Never show a broken feature: no live generation and no fallback chapters → back home.
  if (!library.availability.visible) redirect("/student");
  const suggestedName = session.displayName?.trim().split(/\s+/u)[0] ?? null;
  await journalStudentPayload(studentId, "student:story-library", { proposals: library.proposals, active: library.active, completed: library.completed, shelf: library.shelf, copy });
  return (
    <>
      <PageHeader boundary="student:story-header" eyebrow={copy.eyebrow} title={copy.libraryTitle} description={copy.libraryDescription} />
      <StoryLibraryView key={studentId} library={library} suggestedName={suggestedName} />
    </>
  );
}
