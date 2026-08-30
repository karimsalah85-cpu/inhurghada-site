import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { getGoogleAnalyticsReport, googleAnalyticsConfiguration } from "@/lib/google-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const date = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request:NextRequest){
  const{allowed}=await getAdminAuthorization("view_analytics");
  if(!allowed)return NextResponse.json({error:"Analytics permission required."},{status:403});
  const configuration=googleAnalyticsConfiguration();if(!configuration.configured)return NextResponse.json({...configuration},{headers:{"Cache-Control":"private, no-store"}});
  // Default the range from "today in Africa/Cairo" (the business + GA4 property timezone), not UTC.
  const cairo=(d:Date)=>d.toLocaleDateString("en-CA",{timeZone:"Africa/Cairo"});const now=new Date();const defaultTo=cairo(now);now.setDate(now.getDate()-29);const defaultFrom=cairo(now);
  const from=request.nextUrl.searchParams.get("from")||defaultFrom;const to=request.nextUrl.searchParams.get("to")||defaultTo;
  if(!date.test(from)||!date.test(to)||from>to)return NextResponse.json({error:"Choose a valid date range."},{status:400});
  try{return NextResponse.json(await getGoogleAnalyticsReport(from,to),{headers:{"Cache-Control":"private, no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Google Analytics reporting failed."},{status:502});}
}
