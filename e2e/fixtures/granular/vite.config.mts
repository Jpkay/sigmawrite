import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";
const here=fileURLToPath(new URL(".",import.meta.url)),root=fileURLToPath(new URL("../../..",import.meta.url));
export default defineConfig({root:here,resolve:{alias:[
 {find:"@/lib/actions/granular-diagnostic",replacement:here+"actions.ts"},
 {find:"next/link",replacement:here+"link.tsx"},
 {find:"@/lib/student-store",replacement:here+"student-store.ts"},
 {find:"@",replacement:root+"/src"},
]},esbuild:{jsx:"automatic"},server:{fs:{allow:[root]}}});
