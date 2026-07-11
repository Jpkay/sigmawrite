import { buildTaxonomyManifest, validateTaxonomy } from "../src/lib/taxonomy/validate";
import {
  CONJUGATION_ASSESSMENT_TEMPLATES,
  CONJUGATION_FOUNDATION_CANDIDATE,
  CONJUGATION_MISCONCEPTIONS,
} from "../src/lib/taxonomy/slices/conjugation-foundation";

const validation = validateTaxonomy(CONJUGATION_FOUNDATION_CANDIDATE);
const manifest = buildTaxonomyManifest(CONJUGATION_FOUNDATION_CANDIDATE);
const nodeByKey = new Map(CONJUGATION_FOUNDATION_CANDIDATE.nodes.map((node) => [node.key, node]));

const lines = [
  "# Dossier de révision pédagogique — conjugaison v1",
  "",
  `**Version :** ${manifest.release.version}  `,
  `**Empreinte du contenu :** \`${manifest.checksums.content}\`  `,
  `**Validation automatique :** ${validation.valid ? "réussie" : "échouée"} (${validation.issues.length} signalement(s))  `,
  `**Périmètre :** ${manifest.counts.nodes} micro-compétences, ${manifest.counts.edges} liens de prérequis, ${manifest.counts.evidence} définitions de preuve`,
  "",
  "## Compétences et preuves",
  "",
  "| Clé | Compétence | Attente / modalité | Repère L1 | Repère FLS/CECR | Preuve observable |",
  "| --- | --- | --- | --- | --- | --- |",
  ...CONJUGATION_FOUNDATION_CANDIDATE.nodes.map((node) => {
    const evidence = node.evidence[0];
    const native = node.mappings.find((mapping) => mapping.framework === "native_grade")?.levelMin ?? "—";
    const fsl = node.mappings.find((mapping) => mapping.framework === "cefr")?.levelMin ?? "—";
    return `| \`${node.key}\` | ${node.labelFr} | ${evidence.expectation} / ${evidence.modality} | ${native} | ${fsl} | ${evidence.actionFr} |`;
  }),
  "",
  "## Prérequis",
  "",
  "| Source → cible | Classe | Justification |",
  "| --- | --- | --- |",
  ...CONJUGATION_FOUNDATION_CANDIDATE.edges.map((edge) => {
    const source = nodeByKey.get(edge.source)?.labelFr ?? edge.source;
    const target = nodeByKey.get(edge.target)?.labelFr ?? edge.target;
    return `| ${source} → ${target} | ${edge.prerequisiteClass ?? "—"} | ${edge.rationale} |`;
  }),
  "",
  "## Erreurs-types",
  "",
  ...CONJUGATION_MISCONCEPTIONS.map((misconception) =>
    `- **${misconception.labelFr}** — ${misconception.nodeKeys.map((key) => `\`${key}\``).join(", ")}`,
  ),
  "",
  "## Modèles d'évaluation",
  "",
  ...CONJUGATION_ASSESSMENT_TEMPLATES.map((template) =>
    `- \`${template.key}\` — ${template.expectation}, réponse ${template.responseType}, contexte nouveau requis : ${template.requiresNovelContext ? "oui" : "non"}.`,
  ),
  "",
  "## Décision du réviseur",
  "",
  "- Nom et qualification :",
  "- Date :",
  `- Empreinte vérifiée : \`${manifest.checksums.content}\``,
  "- Décision : approuver / approuver avec modifications / rejeter",
  "- Commentaires et modifications requises :",
  "",
];

process.stdout.write(`${lines.join("\n")}\n`);
if (!validation.valid) process.exitCode = 1;

