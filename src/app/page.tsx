import Link from "next/link";
import {
  BookOpen,
  Target,
  Brain,
  Wrench,
  LineChart,
  Sparkles,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    icon: Target,
    title: "Le bon niveau",
    body: "Des textes calibrés pour réussir 80–85 % du temps : assez de réussite pour motiver, assez de défi pour progresser.",
  },
  {
    icon: Sparkles,
    title: "Mené par l'intérêt",
    body: "L'élève entre par un sujet qui le passionne, puis le produit l'oriente vers le savoir scolaire.",
  },
  {
    icon: Brain,
    title: "La mémoire",
    body: "Les concepts reviennent par récupération espacée pour transformer la lecture en apprentissage durable.",
  },
  {
    icon: Wrench,
    title: "Réparation des bases",
    body: "Les prérequis manquants sont détectés puis réparés par de courtes micro-leçons, sans infantiliser.",
  },
  {
    icon: LineChart,
    title: "Preuve de progrès",
    body: "Parents et enseignants voient des preuves concrètes : bande de lecture, compétences, vocabulaire.",
  },
  {
    icon: BookOpen,
    title: "Transfert de savoir",
    body: "Football, mode, jeux vidéo… chaque intérêt devient une porte vers la géographie, l'économie, les sciences.",
  },
];

export default function Home() {
  return (
    <>
      <MarketingNav />
      <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium text-primary">
          Lecture académique française · Secondaire
        </p>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Apprendre à aimer lire, tout en lisant pour apprendre.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Une plateforme de lecture personnalisée qui aide les élèves du
          secondaire à améliorer leur compréhension, leur vocabulaire, leur
          mémoire et leurs connaissances scolaires.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Commencer
          </Link>
          <Link
            href="/schools"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Pour les écoles
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Les enseignants enseignent. L&apos;application personnalise la pratique,
          la mémoire et la réparation des bases.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <Icon className="mb-3 size-6 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© Plume</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Conditions
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
