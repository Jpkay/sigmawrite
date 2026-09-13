import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { SchoolManagementConsole } from "@/components/school-management-console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSchoolInquiries } from "@/lib/db/admin";
import { getSchoolManagementData } from "@/lib/db/schools";

const statusLabels = {
  new: "Nouvelle",
  contacted: "Contactée",
  qualified: "Qualifiée",
  proposal_sent: "Proposition envoyée",
  won: "Cliente",
  closed: "Clôturée",
} as const;

const needLabels: Record<string, string> = {
  grammar_writing: "Grammaire et expression écrite",
  french_second_language: "Français langue seconde",
  literacy: "Lecture et compréhension",
  exam_prep: "Préparation aux examens",
  other: "Autre besoin",
};

export default async function AdminSchoolsPage() {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const [data, inquiries] = await Promise.all([
    getSchoolManagementData(),
    session.role === "platform_admin" ? getSchoolInquiries() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title={session.role === "school_admin" ? "Mon établissement" : "Écoles"}
        description={session.role === "school_admin"
          ? "Gérez les classes et les comptes de votre établissement."
          : "Créez les structures scolaires, leurs classes et leurs accès administrateur."}
        action={<Button asChild variant="outline" size="sm"><Link href="/admin/users">Comptes et accès <ArrowRight /></Link></Button>}
      />

      {session.role === "platform_admin" && (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><h2 className="text-lg font-semibold">Demandes d’établissement</h2><p className="mt-1 text-sm text-muted-foreground">Formulaires reçus depuis le site Plume.</p></div>
            <Badge variant="secondary">{inquiries.length}</Badge>
          </div>
          {inquiries.length === 0 ? (
            <p className="border-y border-border py-5 text-sm text-muted-foreground">Aucune demande reçue.</p>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(14rem,.8fr)_minmax(18rem,1.2fr)_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{inquiry.organization_name}</h3><Badge variant={inquiry.status === "new" ? "default" : "outline"}>{statusLabels[inquiry.status]}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">{inquiry.country} · {inquiry.student_count} élèves{inquiry.teacher_count ? ` · ${inquiry.teacher_count} enseignants` : ""}</p>
                  </div>
                  <div className="text-sm">
                    <p><a className="font-medium text-primary hover:underline" href={`mailto:${inquiry.contact_email}`}>{inquiry.contact_name}</a> · {inquiry.contact_role}</p>
                    <p className="mt-1 text-muted-foreground">{needLabels[inquiry.primary_need] ?? inquiry.primary_need}</p>
                    {inquiry.message ? <p className="mt-2 max-w-2xl text-muted-foreground">{inquiry.message}</p> : null}
                  </div>
                  <time className="text-xs text-muted-foreground" dateTime={inquiry.created_at}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(inquiry.created_at))}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <SchoolManagementConsole data={data} />
    </>
  );
}
