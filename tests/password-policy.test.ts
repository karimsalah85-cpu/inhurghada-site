import {describe,expect,it} from "vitest";import {passwordPolicyError} from "@/lib/password-policy";
describe("admin password policy",()=>{it("rejects weak passwords",()=>expect(passwordPolicyError("short")).toBeTruthy());it("accepts a strong password",()=>expect(passwordPolicyError("DailyRedSea!2026")).toBeNull());});
