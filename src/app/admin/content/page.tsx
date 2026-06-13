"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_VARIANT,
} from "@/lib/content/review-status";
import { isApproved, setReviewStatus, useCandidates } from "@/lib/content-store";

export default function ContentLibraryPage() {
  const candidates = useCandidates();
  const approved = candidates.filter((c) => isApproved(c.reviewStatus));

  return (
    <>
      <PageHeader
        title="Bibliothèque de contenu"
        description="Textes approuvés, assignables aux élèves."
      />

      {approved.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Aucun texte approuvé pour l&apos;instant.
            </p>
            <Link href="/admin/content/review" className={buttonVariants()}>
              Aller à la révision
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {approved.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{c.generated.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.input.textType} · {c.difficulty.band} · difficulté{" "}
                    {c.difficulty.overall} · {c.generated.questions.length} questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={REVIEW_STATUS_VARIANT[c.reviewStatus]}>
                    {REVIEW_STATUS_LABEL[c.reviewStatus]}
                  </Badge>
                  {c.reviewStatus !== "benchmark_locked" && (
                    <button
                      onClick={() => setReviewStatus(c.id, "benchmark_locked")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Verrouiller comme référence
                    </button>
                  )}
                  <button
                    onClick={() => setReviewStatus(c.id, "retired")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Retirer
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
