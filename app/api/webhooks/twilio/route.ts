import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createRequiredAdminClient } from "@/utils/supabase/admin";

function validSignature(url:string,parameters:URLSearchParams,signature:string|null){const token=process.env.TWILIO_AUTH_TOKEN;if(!token||!signature)return false;const payload=url+[...parameters.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}${value}`).join("");const expected=createHmac("sha1",token).update(payload).digest("base64");const supplied=Buffer.from(signature);const calculated=Buffer.from(expected);return supplied.length===calculated.length&&timingSafeEqual(supplied,calculated);}
export async function POST(request:NextRequest){const raw=await request.text();const parameters=new URLSearchParams(raw);const publicUrl=`${process.env.NEXT_PUBLIC_SITE_URL||request.nextUrl.origin}${request.nextUrl.pathname}`;if(!validSignature(publicUrl,parameters,request.headers.get("x-twilio-signature")))return new NextResponse("Forbidden",{status:403});const from=parameters.get("From")?.replace(/^whatsapp:/,"")||"";const to=parameters.get("To")?.replace(/^whatsapp:/,"")||"";const body=parameters.get("Body")||"";const sid=parameters.get("MessageSid");const supabase=createRequiredAdminClient();
  const { error } = await supabase.from("communication_messages").insert({customer_key:from,channel:"whatsapp",direction:"inbound",recipient:to,sender:from,body,provider_message_id:sid,delivery_status:"received",metadata:Object.fromEntries(parameters.entries())});
  if (error) {
    // Non-2xx makes Twilio retry the webhook, so the inbound message is not silently lost.
    console.error("Twilio inbound message could not be stored", { messageSid: sid, code: error.code, message: error.message });
    return new NextResponse("Storage failed", { status: 500 });
  }
  return new NextResponse("<Response></Response>",{headers:{"Content-Type":"text/xml"}});
}
