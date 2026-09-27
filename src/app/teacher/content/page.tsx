import { ContentCatalog } from "@/components/content-catalog";
import { requireRole } from "@/lib/auth";

export default async function TeacherContentPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["teacher"]);
  return <ContentCatalog audience="teacher" query={await searchParams} />;
}
