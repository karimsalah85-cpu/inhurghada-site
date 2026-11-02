import { describe, expect, it } from "vitest";
import { transferCancellationDeadline } from "@/lib/transfer-cancellation";

const now = new Date("2026-11-02T10:00:00Z"); // 12:00 in Cairo

describe("transferCancellationDeadline", () => {
  it("is 48 hours before pickup, across a month boundary", () => {
    expect(transferCancellationDeadline("2026-12-01", "09:30", now)).toEqual({ eligible: true, date: "2026-11-29", time: "09:30" });
  });
  it("stays eligible at exactly 48 hours in Cairo time", () => {
    expect(transferCancellationDeadline("2026-11-04", "12:00", now).eligible).toBe(true);
  });
  it("is not eligible one minute inside 48 hours", () => {
    expect(transferCancellationDeadline("2026-11-04", "11:59", now).eligible).toBe(false);
  });
  it("is not eligible before a date is chosen", () => {
    expect(transferCancellationDeadline("", "", now).eligible).toBe(false);
  });
});
