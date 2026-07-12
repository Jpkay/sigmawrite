import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getViewableStudents } from "@/lib/db/dashboard";
import { weeklyReport } from "@/lib/reports";
import { nowMs } from "@/lib/clock";
import { ChildAccountForm } from "@/components/child-account-form";
import { getAdultLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function ParentHome() {
  const children = await getViewableStudents();
  const now = nowMs();
  const language=await getAdultLanguage();
  const supabase = await createClient();
  const childIds = children.map((child) => child.id);
  const { data: reports } = childIds.length
    ? await supabase.from("parent_reports").select("id,student_id,report_period_start,report_period_end,created_at").in("student_id", childIds).order("created_at", { ascending: false }).limit(8)
    : { data: [] };

  return (
    <>
      <PageHeader
        eyebrow={language === "en" ? "Family view" : "Espace famille"}
        title={language==="en"?"Your child’s progress":"Progrès de votre enfant"}
        description={language==="en"?"Concrete evidence without false precision.":"Des preuves concrètes, sans fausse précision."}
      />

      <ChildAccountForm language={language} />

      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {language==="en"?"No child is linked to your account yet.":"Aucun enfant lié à votre compte pour l’instant."}
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {children.map((child) => {
            const r = weeklyReport(child.snap, now);
            return (
              <Link key={child.id} href={`/parent/students/${child.id}`}>
                <div className="group flex flex-wrap items-center justify-between gap-3 px-2 py-5 transition-colors hover:bg-muted/30 sm:px-4">
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge>{r.band}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {r.textsCompleted} {language==="en"?"text(s) this week":"texte(s) cette semaine"} ·{" "}
                          {r.avgSuccess !== null
                            ? `${Math.round(r.avgSuccess * 100)}% ${language === "en" ? "success" : "de réussite"}`
                            : language==="en"?"no reading yet":"pas encore de lecture"}
                        </span>
                      </div>
                    </div>
                    <span className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight className="size-4" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {(reports ?? []).length > 0 && <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">{language === "en" ? "Weekly reports" : "Rapports hebdomadaires"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(reports ?? []).map((report) => {
            const child = children.find((item) => item.id === report.student_id);
            return <Link key={report.id} href={`/parent/reports/${report.id}`}><Card className="h-full transition-colors hover:border-primary/50"><CardContent className="flex items-center justify-between gap-3 pt-6"><div><p className="font-medium">{child?.name ?? (language === "en" ? "Child" : "Élève")}</p><p className="text-sm text-muted-foreground">{report.report_period_start} → {report.report_period_end}</p></div><ArrowRight className="size-4 text-muted-foreground" /></CardContent></Card></Link>;
          })}
        </div>
      </section>}
    </>
  );
}
