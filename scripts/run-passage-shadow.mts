import{createClient}from'@supabase/supabase-js';
import{processPassageAutomation}from'../src/lib/content/automation/worker';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
console.log(JSON.stringify(await processPassageAutomation(db,3)));
