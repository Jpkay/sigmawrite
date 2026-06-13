import { PageHeader } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const weekly = [
  { label: "Textes complétés", value: "—" },
  { label: "Minutes lues", value: "—" },
  { label: "Réussite moyenne", value: "—" },
  { label: "Mots de vocabulaire", value: "—" },
];

const proof = [
  { title: "Lit avec aisance", note: "Textes que votre enfant lit confortablement", variant: "success" as const },
  { title: "Lit avec soutien", note: "Textes lisibles avec un peu d'aide", variant: "default" as const },
  { title: "Trop difficile pour l'instant", note: "Textes actuellement hors de portée", variant: "secondary" as const },
];

export default function ParentHome() {
  return (
    <>
      <PageHeader
        title="Progrès de votre enfant"
        description="Des preuves concrètes, sans fausse précision."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bande de lecture académique</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <span className="text-3xl font-semibold">—</span>
          <Badge variant="secondary">Confiance : —</Badge>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {weekly.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Preuve de niveau</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {proof.map((p) => (
          <Card key={p.title}>
            <CardContent className="pt-6">
              <Badge variant={p.variant}>{p.title}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
