import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { buildAdminGraphView, type AdminGraphRelease } from "@/lib/graph/admin-presentation";
import { createClient } from "@/lib/supabase/server";
import { AdminGraphInspector } from "./admin-graph-inspector";

export default async function AdminGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ release?: string | string[] }>;
}) {
  await requireRole(["platform_admin"]);
  const params = await searchParams;
  const requestedReleaseId = typeof params.release === "string" ? params.release : null;
  const db = await createClient();
  const { data: releaseRows, error: releaseError } = await db.from("taxonomy_releases")
    .select("id,release_key,version,status,manifest_checksum,created_at,published_at")
    .order("created_at", { ascending: false });
  if (releaseError) throw new Error(releaseError.message);

  const releases = (releaseRows ?? []).map((row) => ({
    id: row.id as string,
    key: row.release_key as string,
    version: row.version as string,
    status: row.status as AdminGraphRelease["status"],
    checksum: row.manifest_checksum as string | null,
    createdAt: row.created_at as string,
    publishedAt: row.published_at as string | null,
  }));
  const selectedRelease = releases.find((release) => release.id === requestedReleaseId)
    ?? releases.find((release) => release.status === "published")
    ?? releases[0];

  if (!selectedRelease) {
    return <>
      <PageHeader title="Inspection du graphe" description="Aucune version de taxonomie n'est disponible." />
      <p className="border-y border-border py-8 text-sm text-muted-foreground">Importez une version candidate avant d'utiliser l'inspecteur.</p>
    </>;
  }

  const { data: memberships, error: membershipError } = await db.from("taxonomy_release_memberships")
    .select("record_id,record_type,stable_key,record_version,record_snapshot,record_checksum")
    .eq("release_id", selectedRelease.id);
  if (membershipError) throw new Error(membershipError.message);

  const nodeIds = (memberships ?? []).filter((row) => row.record_type === "competency_node").map((row) => row.record_id as string);
  const edgeIds = (memberships ?? []).filter((row) => row.record_type === "competency_edge").map((row) => row.record_id as string);
  const [nodeResult, edgeResult] = await Promise.all([
    nodeIds.length
      ? db.from("competency_nodes").select("id,review_status,generation_type").in("id", nodeIds)
      : Promise.resolve({ data: [], error: null }),
    edgeIds.length
      ? db.from("competency_edges").select("id,review_status").in("id", edgeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (nodeResult.error || edgeResult.error) throw new Error(nodeResult.error?.message ?? edgeResult.error?.message);

  const graph = buildAdminGraphView({
    release: selectedRelease,
    memberships: (memberships ?? []).map((row) => ({
      record_id: row.record_id as string,
      record_type: row.record_type as string,
      stable_key: row.stable_key as string,
      record_version: Number(row.record_version),
      record_snapshot: row.record_snapshot,
      record_checksum: row.record_checksum as string,
    })),
    currentNodes: (nodeResult.data ?? []).map((row) => ({ id: row.id as string, review_status: row.review_status as string | null, generation_type: row.generation_type as string | null })),
    currentEdges: (edgeResult.data ?? []).map((row) => ({ id: row.id as string, review_status: row.review_status as string | null })),
  });

  return <div className="space-y-7">
    <PageHeader title="Inspection du graphe" description="Contrôlez une version immuable, ses relations et ses alertes structurelles. Cette vue n'écrit aucune donnée." />

    <div className="flex flex-col gap-4 border-y border-border py-4 lg:flex-row lg:items-end lg:justify-between">
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" action="/admin/graph">
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Version inspectée
          <select name="release" defaultValue={selectedRelease.id} className="mt-1.5 block h-10 min-w-72 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal">
            {releases.map((release) => <option key={release.id} value={release.id}>{release.key} · {release.version} · {releaseLabel(release.status)}</option>)}
          </select>
        </label>
        <Button type="submit" variant="outline">Charger</Button>
      </form>
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        <span>{graph.meta.nodeCount} nœuds</span>
        <span>{graph.meta.edgeCount} relations</span>
        <span>{graph.meta.evidenceDefinitionCount} preuves</span>
        <span>{graph.warnings.length} alertes</span>
      </div>
    </div>

    <AdminGraphInspector graph={graph} />
  </div>;
}

function releaseLabel(status: AdminGraphRelease["status"]) {
  return status === "published" ? "publiée" : status === "validating" ? "candidate" : status === "withdrawn" ? "retirée" : "brouillon";
}
