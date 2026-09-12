"use client";
import {VERB_REFERENCE_COPY as copy} from "@/lib/diagnostic/granular/verb-reference-copy";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccentInput } from "@/components/accent-input";

export function VerbSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [verb, setVerb] = useState(initial);
  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); const value = verb.trim().toLocaleLowerCase("fr"); if (value) router.push(`/student/reference/verbe/${encodeURIComponent(value)}`); }}>
      <label className="min-w-64 flex-1 text-sm">{copy.infinitive}
        <AccentInput value={verb} onChange={setVerb} autoComplete="off" spellCheck={false} placeholder={copy.placeholder} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-lg" />
      </label>
      <Button type="submit" className="mb-11"><Search className="size-4" />{copy.conjugate}</Button>
    </form>
  );
}
