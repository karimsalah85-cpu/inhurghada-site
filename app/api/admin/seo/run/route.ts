import { NextResponse } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { runSeoChecks } from "@/lib/seo-monitor";
import { createClient } from "@/utils/supabase/server";

export async function POST(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!(await hasLivePermission(supabase,user,"settings")))return NextResponse.json({error:"Unauthorized"},{status:401});try{return NextResponse.json({ok:true,...await runSeoChecks()});}catch(error){console.error("SEO checks failed",error);return NextResponse.json({error:"SEO checks failed."},{status:500});}}
