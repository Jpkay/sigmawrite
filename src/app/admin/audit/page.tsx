import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuditLogs } from "@/lib/db/admin";

const ACTION_LABEL: Record<string, string> = {
  consent_given: "Consentement donné",
  data_export: "Export de données",
  data_deletion_requested: "Demande de suppression",
};

export default async function AdminAuditPage() {
  const entries = await getAuditLogs();

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        description="Actions sensibles enregistrées (PRD §10). Lecture réservée aux administrateurs."
      />
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune entrée pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <Badge>{ACTION_LABEL[e.action] ?? e.action}</Badge>
                  {e.target_type && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {e.target_type}
                      {e.target_id ? ` · ${e.target_id.slice(0, 8)}…` : ""}
                    </span>
                  )}
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("fr-FR")}
                </time>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
