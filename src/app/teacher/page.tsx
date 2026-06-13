import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const overview = [
  { label: "Élèves actifs", value: "—" },
  { label: "Textes assignés", value: "—" },
  { label: "Réussite moyenne", value: "—" },
  { label: "Faible engagement", value: "—" },
];

const groups = [
  { name: "Groupe A — Inférence faible", count: "—", activity: "Preuves + sens implicite" },
  { name: "Groupe B — Vocabulaire académique", count: "—", activity: "Connecteurs de cause/conséquence" },
  { name: "Groupe C — Endurance de lecture", count: "—", activity: "Textes courts à fort intérêt" },
];

export default function TeacherHome() {
  return (
    <>
      <PageHeader
        title="Vue de classe"
        description="Intervenez avec précision : lacunes de compétences et groupes recommandés."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overview.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Groupes recommandés</h2>
      <div className="space-y-3">
        {groups.map((g) => (
          <Card key={g.name}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-medium">{g.name}</p>
                <p className="text-sm text-muted-foreground">{g.activity}</p>
              </div>
              <Badge variant="secondary">{g.count} élèves</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
