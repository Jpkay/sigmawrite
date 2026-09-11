// Called only by the disposable database harness. Never imports dotenv or
// connects to a database; SQL output is confined to its private temporary folder.
import {readFileSync,writeFileSync,realpathSync} from "node:fs";
import {basename,dirname} from "node:path";
import {buildSyntheticIntegrationBundle} from "../../src/lib/diagnostic/granular/testing/synthetic-bundle";
import {buildSyntheticPersistenceJourney} from "../../src/lib/diagnostic/granular/testing/synthetic-journey";
import {checksum} from "../../src/lib/taxonomy/validate";
import {join} from "node:path";
const output=process.argv[2];
if(!output||!basename(realpathSync(dirname(output))).startsWith("plume-full-schema-pg."))throw Error("Output must be inside the disposable database harness directory");
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
const bundle=buildSyntheticIntegrationBundle(artifact,{taxonomyId:"00000000-0000-4000-8000-000000005001",bankId:"00000000-0000-4000-8000-000000005002"});
const journey=buildSyntheticPersistenceJourney(bundle);
// Explicitly test data, not a publishable bank or content approval artifact.
const payload=JSON.stringify(journey).replaceAll("'","''");
writeFileSync(output,`select set_config('test.journey','${payload}',false);\n`,{mode:0o600});
const fullGraph=JSON.stringify({taxonomy:artifact.taxonomy,taxonomyChecksum:artifact.manifest.contentChecksum,bundle,bundleChecksum:checksum(bundle),journey}).replaceAll("'","''");
writeFileSync(join(dirname(output),"full-graph.sql"),`create temporary table full_graph_fixture(payload jsonb);\ninsert into full_graph_fixture values ('${fullGraph}');\n`,{mode:0o600});
console.log(`Prepared ${journey.states.length} real session states over ${bundle.assessment.skills.length} approved evidence targets.`);
