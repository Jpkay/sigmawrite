import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getViewableStudents } from "@/lib/db/dashboard";
import { weeklyReport } from "@/lib/reports";
import { nowMs } from "@/lib/clock";

export default async function ParentHome() {
  const children = await getViewableStudents();
  const now = nowMs();

  return (
    <>
      <PageHeader
        title="Progrès de votre enfant"
        description="Des preuves concrètes, sans fausse précision."
      />

      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aucun enfant lié à votre compte pour l&apos;instant.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {children.map((child) => {
            const r = weeklyReport(child.snap, now);
            return (
              <Link key={child.id} href={`/parent/students/${child.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge>{r.band}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {r.textsCompleted} texte(s) cette semaine ·{" "}
                          {r.avgSuccess !== null
                            ? `${Math.round(r.avgSuccess * 100)}% de réussite`
                            : "pas encore de lecture"}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
