import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analytics/meta/route";

const token = "EAAB-secret-token";

function request() {
  return new NextRequest("https://dailyredsea.com/api/analytics/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "https://dailyredsea.com", "x-forwarded-for": "203.0.113.9", "user-agent": "test-agent" },
    body: JSON.stringify({ event: "tour_view", eventId: "evt-1", data: { item_name: "Orange Bay" } }),
  });
}

function configure() {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
  vi.stubEnv("META_CONVERSIONS_API_ACCESS_TOKEN", token);
  vi.stubEnv("META_GRAPH_API_VERSION", "v21.0");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
  vi.stubEnv("META_CONVERSIONS_API_ACCESS_TOKEN", "");
  vi.stubEnv("META_GRAPH_API_VERSION", "");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Meta Conversions API route", () => {
  it("returns 204 without calling Meta when unconfigured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request());
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 204 when Meta accepts the event", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ events_received: 1 })));
    expect((await POST(request())).status).toBe(204);
  });

  it("returns 502 and logs status and error without PII or the access token when Meta rejects the event", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(
      { error: { message: `Invalid OAuth access token ${token}`, type: "OAuthException", code: 190, fbtrace_id: "trace-1" } },
      { status: 400 },
    )));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(log).toHaveBeenCalledTimes(1);
    const [, details] = log.mock.calls[0] as [string, { status: number; error: Record<string, unknown> }];
    expect(details.status).toBe(400);
    expect(details.error).toMatchObject({ type: "OAuthException", code: 190, fbtraceId: "trace-1" });
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain(token);
    expect(logged).not.toContain("203.0.113.9");
    expect(logged).not.toContain("test-agent");
  });
});
