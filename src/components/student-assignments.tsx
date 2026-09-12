"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {ASSIGNMENT_COPY,assignmentDisplay,type Assignment} from "@/lib/diagnostic/granular/assignment-display";

/** "À faire" — assignments for the student's enrolled classes (PRD §N). */
export function StudentAssignments({assignments}:{assignments:Assignment[]}) {
  if (assignments.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <ClipboardList className="size-5 text-primary" /> {ASSIGNMENT_COPY.title}
      </h2>
      <div className="space-y-2">
        {assignments.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">{assignmentDisplay(a).title}</p>
                <p className="text-sm text-muted-foreground">
                  {assignmentDisplay(a).description}
                </p>
              </div>
              {((a.target_type === "text" && a.text_slug) || (a.target_type === "dictation" && a.target_dictation_id) || (a.target_type !== "text" && a.target_type !== "dictation" && a.target_node_id)) && (
                <Link
                  href={a.target_type === "text" ? `/student/read/${a.text_slug}` : a.target_type === "dictation" ? `/student/dictee/${a.target_dictation_id}` : `/student/practice/${a.target_node_id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  {ASSIGNMENT_COPY.start}
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
