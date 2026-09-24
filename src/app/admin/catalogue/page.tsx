import { ContentCatalog } from "@/components/content-catalog";
import { requireRole } from "@/lib/auth";

export default async function AdminCataloguePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["platform_admin"]);
  return <ContentCatalog audience="admin" query={await searchParams} />;
}
