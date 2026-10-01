import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock("@/utils/supabase/admin", () => ({
  createRequiredAdminClient: () => ({ from: () => ({ insert: mocks.insert }) }),
}));

import { POST } from "@/app/api/webhooks/twilio/route";

const url = "https://dailyredsea.com/api/webhooks/twilio";
const token = "twilio-test-token";
const params = { MessageSid: "SM123", From: "whatsapp:+201000000000", To: "whatsapp:+14155238886", Body: "Hello" };

function sign(values: Record<string, string>) {
  const payload = url + Object.entries(values).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}${value}`).join("");
  return createHmac("sha1", token).update(payload).digest("base64");
}

function request(signature: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (signature) headers["x-twilio-signature"] = signature;
  return new NextRequest(url, { method: "POST", headers, body: new URLSearchParams(params).toString() });
}

beforeEach(() => {
  vi.stubEnv("TWILIO_AUTH_TOKEN", token);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dailyredsea.com");
  mocks.insert.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Twilio inbound webhook", () => {
  it("rejects an invalid signature without touching the database", async () => {
    const response = await POST(request("bad-signature"));
    expect(response.status).toBe(403);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("stores a signed inbound message and returns TwiML", async () => {
    mocks.insert.mockResolvedValue({ error: null });
    const response = await POST(request(sign(params)));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<Response></Response>");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ provider_message_id: "SM123", sender: "+201000000000", direction: "inbound" }));
  });

  it("returns 500 and logs the MessageSid when the insert fails so Twilio retries", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "42501", message: "permission denied" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(request(sign(params)));
    expect(response.status).toBe(500);
    expect(log).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ messageSid: "SM123", code: "42501" }));
  });

  it("acknowledges a retried message that is already stored", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505", message: "duplicate key value" } });
    const response = await POST(request(sign(params)));
    expect(response.status).toBe(200);
  });
});
