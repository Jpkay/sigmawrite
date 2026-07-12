import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"Reading to Learn",short_name:"Reading",description:"Lecture académique française personnalisée",start_url:"/student",display:"standalone",background_color:"#F7F2E6",theme_color:"#FF3F8E",lang:"fr",icons:[{src:"/app-icon.svg",sizes:"any",type:"image/svg+xml"}]};}
