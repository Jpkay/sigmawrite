import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getPromptVersions } from "@/lib/db/ai";
import { PromptActivationButton } from "./prompt-activation-button";

export default async function PromptsPage() {
  await requireRole(["platform_admin"]);
  const prompts = await getPromptVersions();
  return <>
    <PageHeader title="Prompts" description="Versions utilisées par les tâches IA. Une seule version est active par usage." />
    <div className="space-y-3">
      {prompts.map((prompt) => <Card key={prompt.id}><CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-medium">{prompt.promptKey}</h2><p className="text-xs text-muted-foreground">Version {prompt.versionNumber} · {new Date(prompt.createdAt).toLocaleDateString("fr-FR")}</p></div>
          <div className="flex items-center gap-2">{prompt.active && <Badge variant="success">Active</Badge>}<PromptActivationButton promptId={prompt.id} active={prompt.active} /></div>
        </div>
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 font-sans text-sm leading-relaxed">{prompt.promptText}</pre>
      </CardContent></Card>)}
    </div>
  </>;
}
