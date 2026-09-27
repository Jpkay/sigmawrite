/** A taught target is releasable only when its full prerequisite chain is taught.
 * This does not erase graph edges or treat missing instruction as mastery. */
export function resolveTeachingScope(
 skills: readonly {id:string;prerequisites:readonly string[]}[],
 ready:ReadonlySet<string>,
):{included:string[];blocked:{skillId:string;missingPrerequisiteIds:string[]}[]}{
 const byId=new Map(skills.map(skill=>[skill.id,skill]));
 const included=new Set<string>();
 const blocked:{skillId:string;missingPrerequisiteIds:string[]}[]=[];
 for(const id of [...ready].sort()){
  const visited=new Set<string>();
  const visit=(current:string)=>{
   if(visited.has(current))return;
   const skill=byId.get(current);if(!skill)throw Error(`Unknown scope target: ${current}`);
   visited.add(current);skill.prerequisites.forEach(visit);
  };
  visit(id);
  const missingPrerequisiteIds=[...visited].filter(key=>!ready.has(key)).sort();
  if(missingPrerequisiteIds.length)blocked.push({skillId:id,missingPrerequisiteIds});
  else visited.forEach(key=>included.add(key));
 }
 return {included:[...included].sort(),blocked};
}
