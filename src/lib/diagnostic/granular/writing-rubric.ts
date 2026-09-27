import {z} from "zod";
/** Source-owned task scope. Structural validation does not confer content approval. */
export const writingRubricSchema=z.object({
 version:z.literal(1),nodeKey:z.string().min(1),
 criteria:z.array(z.object({id:z.string().min(1).max(100),descriptionFr:z.string().trim().min(10).max(1000)}).strict()).min(1).max(100),
 exclusionsFr:z.array(z.string().trim().min(1).max(1000)).max(30).default([]),
}).strict().refine(value=>new Set(value.criteria.map(c=>c.id)).size===value.criteria.length,"Duplicate writing criterion");
export type WritingRubric=z.infer<typeof writingRubricSchema>;
export function readWritingRubric(nodeKey:string,raw:unknown):WritingRubric|undefined{
 const requiresScope=["maintenir_orthographe_lexicale_phrase","maintenir_orthographe_grammaticale_phrase"].includes(nodeKey);
 if(raw===undefined){if(requiresScope)throw Error("Explicit spelling scope required");return undefined;}
 const rubric=writingRubricSchema.parse(raw);
 if(rubric.nodeKey!==nodeKey)throw Error("Writing rubric target mismatch");
 return rubric;
}
