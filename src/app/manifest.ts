import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{id:"/",name:"Plume",short_name:"Plume",description:"Lecture académique française personnalisée",start_url:"/student",display:"standalone",background_color:"#F7F2E6",theme_color:"#A80049",lang:"fr",icons:[{src:"/app-icon.svg",sizes:"any",type:"image/svg+xml"}]};}
