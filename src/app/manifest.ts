import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"Reading to Learn",short_name:"Reading",description:"Lecture académique française personnalisée",start_url:"/student",display:"standalone",background_color:"#09090b",theme_color:"#6366f1",lang:"fr",icons:[{src:"/app-icon.svg",sizes:"any",type:"image/svg+xml"}]};}
