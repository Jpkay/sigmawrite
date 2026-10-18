import { notFound } from "next/navigation";
import { StoryReader } from "@/components/story/story-reader";
import { loadStoryChapter } from "@/lib/actions/story-ui";

/** Chapter generation and branch prefetch run in after(): server actions on this page need time (roadmap H.10/H.11). */
export const maxDuration = 300;

/** The reader (roadmap H.1, H.3–H.6): chapter, micro-task, two paths, daily unlock, finale. */
export default async function StoryReaderPage({ params }: { params: Promise<{ sagaId: string }> }) {
  const { sagaId } = await params;
  if (!/^[0-9a-f-]{36}$/iu.test(sagaId)) notFound();
  const initial = await loadStoryChapter({ sagaId }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "Histoire introuvable.") return null;
    throw error;
  });
  if (!initial) notFound();
  return <StoryReader key={sagaId} initial={initial} />;
}
