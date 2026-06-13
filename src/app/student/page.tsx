import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const stats = [
  { label: "Bande de lecture", value: "—" },
  { label: "Textes cette semaine", value: "0" },
  { label: "Minutes de lecture", value: "0" },
  { label: "Zone de réussite", value: "—" },
];

export default function StudentHome() {
  return (
    <>
      <PageHeader
        title="Bonjour 👋"
        description="Voici ta lecture du jour, choisie selon tes intérêts et ton niveau."
      />

      <Card className="mb-6 border-primary/40 bg-accent/40">
        <CardHeader>
          <CardTitle>Lecture du jour</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-medium">
              « Pourquoi de jeunes footballeurs quittent leur pays »
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Géographie : migration</Badge>
              <Badge>Économie : opportunité</Badge>
              <Badge variant="secondary">Connecteurs de cause</Badge>
            </div>
          </div>
          <Link href="/student/diagnostic" className={buttonVariants()}>
            Commencer <ArrowRight />
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Commence par le diagnostic pour établir ton profil de lecture. Tu
        recevras ensuite des textes au bon niveau.
      </p>
    </>
  );
}
