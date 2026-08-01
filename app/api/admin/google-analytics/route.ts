import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { getGoogleAnalyticsReport, googleAnalyticsConfiguration } from "@/lib/google-analytics";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const date = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request:NextRequest){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
  if(!isAuthorizedAdmin(user))return NextResponse.json({error:"Your admin session was not recognized. Sign out of the admin dashboard, sign in again, and retry."},{status:401});
  const configuration=googleAnalyticsConfiguration();if(!configuration.configured)return NextResponse.json({...configuration},{headers:{"Cache-Control":"private, no-store"}});
  const now=new Date();const defaultTo=now.toISOString().slice(0,10);now.setUTCDate(now.getUTCDate()-29);const defaultFrom=now.toISOString().slice(0,10);
  const from=request.nextUrl.searchParams.get("from")||defaultFrom;const to=request.nextUrl.searchParams.get("to")||defaultTo;
  if(!date.test(from)||!date.test(to)||from>to)return NextResponse.json({error:"Choose a valid date range."},{status:400});
  try{return NextResponse.json(await getGoogleAnalyticsReport(from,to),{headers:{"Cache-Control":"private, no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Google Analytics reporting failed."},{status:502});}
}
