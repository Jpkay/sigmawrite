import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { JoinCodePanel } from "@/components/join-code-panel";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getActiveJoinCode } from "@/lib/db/lifecycle";
import { createClient } from "@/lib/supabase/server";

const classIdSchema = z.string().uuid();

export default async function AdminClassInvitationsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await requireRole(["platform_admin", "school_admin"]);
  const { classId } = await params;
  if (!classIdSchema.safeParse(classId).success) notFound();

  const db = await createClient();
  const permission = await db.rpc("can_manage_class_invitations", { p_class_id: classId });
  if (permission.error) throw new Error(permission.error.message);
  if (permission.data !== true) notFound();

  const { data: selectedClass, error: classError } = await db
    .from("classes")
    .select("id,name")
    .eq("id", classId)
    .maybeSingle();
  if (classError) throw new Error(classError.message);
  if (!selectedClass) notFound();

  const joinCode = await getActiveJoinCode(classId);

  return (
    <>
      <PageHeader
        eyebrow="Classe"
        title={selectedClass.name as string}
        description="Créez ou remplacez le code permettant aux élèves de rejoindre cette classe."
        action={<Button asChild variant="outline" size="sm"><Link href="/admin/schools"><ArrowLeft /> Retour aux classes</Link></Button>}
      />
      <JoinCodePanel classId={classId} initial={joinCode} />
    </>
  );
}
