import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
let db: PGlite;
const root = new URL("../supabase/migrations/",import.meta.url);
const read = (name: string) => readFileSync(new URL(name,root),"utf8");
const table=(sql:string,name:string)=>{const start=sql.search(new RegExp('create table (?:if not exists )?public\\.'+name+' \\('));if(start<0)throw new Error(name);return sql.slice(start,sql.indexOf(';',start)+1)};
beforeAll(async()=>{
db=new PGlite();
const baseline=read('202607210000_baseline_schema.sql');
const control=read('202608010001_admin_control_center.sql');
const operations=read('202608010002_complete_admin_operations.sql');

await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);`);
await db.exec(baseline.match(/create type[^;]+;/g)!.join('\n'));
await db.exec(table(baseline,'bookings'));
await db.exec(table(control,'content_items'));
await db.exec(`alter table content_items add column listing_status text default 'active';`);
await db.exec(table(control,'tour_availability'));
await db.exec(operations.slice(operations.indexOf('alter table public.bookings'),operations.indexOf('alter table public.suppliers')));
await db.exec(table(operations,'customer_profiles'));
await db.exec(table(operations,'booking_capacity_reservations'));
await db.exec(operations.slice(operations.indexOf('create or replace function public.reserve_booking('),operations.indexOf('create or replace function public.release_booking_capacity()')));
await db.exec(read('202608120002_booking_idempotency.sql'));
await db.exec(read('20260907123500_transfer_booking_details.sql'));
await db.exec(read('20260913123742_trip_identifiers.sql'));
await db.exec(read('20260913123918_booking_promo_codes.sql'));
await db.exec(read('20260914114918_booking_pricing_snapshot.sql'));
await db.exec(read('20260920100000_referral_program.sql'));
await db.exec(read('20260921070742_referral_acquisition_hardening.sql'));
await db.exec(read('20260921205256_referral_operational_analytics.sql'));
await db.exec(`grant all on all tables in schema public to service_role;grant usage on schema public to service_role;`);

await db.exec(`insert into content_items(content_type,slug,locale,status,title,trip_id) values('tour','reef','en','published','Reef','DRS-001');insert into tour_availability(tour_slug,service_date,capacity) values('reef','2099-01-01',10000);`);
},30000);
afterAll(async()=>{await db?.close();});
type Saved={booking:{id:string;amount:number;referral_discount_percent:number;referral_reward_units_redeemed:number;referrer_customer_key:string|null};replayed:boolean};
let serial=0;
function person(){serial++;return {email:`person${serial}@example.com`,phone:`+2010000${String(serial).padStart(5,"0")}`};}
async function reserve(options:Partial<{email:string;phone:string;referralCode:string|null;redeemUnits:number;promo:string|null;hotel:string;key:string;amount:number}>= {}):Promise<Saved>{
 const p={...person(),referralCode:null,redeemUnits:0,promo:null,hotel:"Different hotel",key:randomUUID(),amount:100,...options};
 const snapshot={version:1,currency:"USD",subtotal:p.amount,trips:[{lines:[{total:p.amount}]}]};
 const params=[JSON.stringify(snapshot),p.key,"a".repeat(64),"TEST-"+randomUUID(),"tour","Guest",p.email,p.phone,"Reef","reef","2099-01-01",null,1,1,0,0,p.hotel,null,p.amount,"USD","en",null,p.promo,p.referralCode,p.redeemUnits];
 const result=await db.query<{result:Saved}>(`select public.reserve_booking_with_referral(${params.map((_,i)=>"$"+(i+1)).join(",")}) result`,params);
 return result.rows[0].result;
}
async function account(email:string){return (await db.query<{a:{qualified:boolean;referral_code:string|null;balance_units:number}}>("select referral_account($1) a",[email])).rows[0].a;}
async function qualify(p=person()){
 const result=await db.query<{id:string}>(`insert into bookings(reference,type,customer_name,customer_email,phone,tour_name,tour_slug,date,hotel,amount,status,payment_status) values($1,'tour','Guest',$2,$3,'Reef','reef','2025-01-01','Old Hotel',100,'completed','paid') returning id`,[randomUUID(),p.email,p.phone]);
 return {...p,id:result.rows[0].id,code:(await account(p.email)).referral_code!};
}
async function complete(id:string){await db.query("update bookings set status='completed',payment_status='paid' where id=$1",[id]);}
async function balance(email:string){return (await account(email)).balance_units;}
async function reason(id:string){return (await db.query<{reasons:string[]}>("select reasons from referral_attempts where booking_id=$1",[id])).rows[0]?.reasons;}
async function credit(email:string,units:number){await db.query("insert into referral_reward_transactions(customer_key,type,reward_units,note) values($1,'ADMIN_ADJUSTMENT',$2,'Fixture earned units')",[email,units]);}

describe("referral acquisition database invariants",()=>{
 it("does not activate a new unpaid referrer",async()=>{
  const p=person();await reserve(p); const a=await account(p.email);expect(a.qualified).toBe(false);expect(a.referral_code).toBeNull();
  const row=await db.query<{referral_code:string}>("select referral_code from referral_identities where customer_key=$1",[p.email]);
  const b=await reserve({referralCode:row.rows[0].referral_code});expect(Number(b.booking.amount)).toBe(100);expect(await reason(b.booking.id)).toContain("unqualified_referrer");
 });
 it("gives exactly 5% only after completed and paid qualification",async()=>{
  const p=person(),first=await reserve(p);await db.query("update bookings set status='completed' where id=$1",[first.booking.id]);expect((await account(p.email)).qualified).toBe(false);
  await db.query("update bookings set payment_status='paid' where id=$1",[first.booking.id]);const a=await account(p.email);expect(a.qualified).toBe(true);expect(a.referral_code).toMatch(/^DRS-[A-F0-9]{32}$/);
  const b=await reserve({referralCode:a.referral_code});expect(Number(b.booking.amount)).toBe(95);expect(Number(b.booking.referral_discount_percent)).toBe(5);
 });
 it("rejects self with same normalized email OR international phone",async()=>{
  const p=await qualify();for(const v of [{email:p.email.toUpperCase(),phone:person().phone},{email:person().email,phone:p.phone.replace("+","00")}]){
   const b=await reserve({...v,referralCode:p.code});expect(Number(b.booking.amount)).toBe(100);expect(await reason(b.booking.id)).toContain("self_referral");
  }
 });
 it("rejects returning customers changing either contact",async()=>{
  const ref=await qualify(),existing=await qualify();for(const v of [{email:person().email,phone:existing.phone},{email:existing.email,phone:person().phone}]){
   const b=await reserve({...v,referralCode:ref.code});expect(Number(b.booking.amount)).toBe(100);expect(await reason(b.booking.id)).toContain("existing_customer");
  }
 });
 it("rejects historical reciprocal referrals",async()=>{
  const a=await qualify(),bp=person(),b=await reserve({...bp,referralCode:a.code});await complete(b.booking.id);
  const ba=await account(bp.email);const reverse=await reserve({...a,referralCode:ba.referral_code});expect(await reason(reverse.booking.id)).toContain("circular_referral");
 });
 it("rejects known participants of the same booking",async()=>{
  const a=await qualify(),b=person();await db.query("insert into referral_booking_participants(booking_id,email,phone,created_by) values($1,$2,$3,'staff')",[a.id,b.email,b.phone]);
  const booking=await reserve({...b,referralCode:a.code});expect(await reason(booking.booking.id)).toContain("same_booking_participants");expect(Number(booking.booking.amount)).toBe(100);
 });
 it("rejects two known contacts-only passengers on another customer's booking",async()=>{
  const owner=await qualify(),a=await qualify(),b=person();
  await db.query("insert into referral_booking_participants(booking_id,email,phone,created_by) values($1,$2,$3,'staff'),($1,$4,$5,'staff')",[owner.id,a.email,a.phone,b.email,b.phone]);
  const booking=await reserve({...b,referralCode:a.code});expect(await reason(booking.booking.id)).toContain("same_booking_participants");
 });
 it("newly discovered participant links reverse an earned referral once",async()=>{
  const a=await qualify(),p=person(),b=await reserve({...p,referralCode:a.code});await complete(b.booking.id);expect(await balance(a.email)).toBe(1);
  await db.query("insert into referral_booking_participants(booking_id,email,created_by) values($1,$2,'staff')",[a.id,p.email]);
  expect(await balance(a.email)).toBe(0);expect((await db.query<{status:string}>("select status from referrals where referred_booking_id=$1",[b.booking.id])).rows[0].status).toBe("rejected");
 });
 it("only flags strong uncertain same-party signals and requires approval",async()=>{
  const a=await qualify();await reserve({...a,hotel:"Shared Resort"});const b=await reserve({referralCode:a.code,hotel:"Shared Resort"});
  await complete(b.booking.id);expect(await balance(a.email)).toBe(0);
  const r=(await db.query<{id:string;status:string}>("select id,status from referrals where referred_booking_id=$1",[b.booking.id])).rows[0];expect(r.status).toBe("pending_review");
  await db.query("select review_referral($1,'approve','Confirmed separate party','staff')",[r.id]);expect(await balance(a.email)).toBe(1);
 });
 it("does not flag unrelated same-tour same-date customers",async()=>{
  const a=await qualify();await reserve({...a,hotel:"Resort A"});const b=await reserve({referralCode:a.code,hotel:"Resort B"});await complete(b.booking.id);expect(await balance(a.email)).toBe(1);
 });
 it("never earns for cancelled, no-show, test, fraudulent or duplicate trips",async()=>{
  const a=await qualify();for(const exclusion of ["no_show","test","fraud","duplicate"]){const b=await reserve({referralCode:a.code});await db.query("update bookings set status='completed',payment_status='paid',referral_exclusion_reason=$2 where id=$1",[b.booking.id,exclusion]);}
  const b=await reserve({referralCode:a.code});await db.query("update bookings set status='cancelled',payment_status='paid' where id=$1",[b.booking.id]);expect(await balance(a.email)).toBe(0);
 });
 it("earns once and reverses once from authoritative payment lifecycle",async()=>{
  const a=await qualify(),b=await reserve({referralCode:a.code});await complete(b.booking.id);await complete(b.booking.id);expect(await balance(a.email)).toBe(1);
  await db.query("update bookings set payment_status='refunded' where id=$1",[b.booking.id]);expect(await balance(a.email)).toBe(0);await complete(b.booking.id);expect(await balance(a.email)).toBe(0);
 });
 it.each([4,6])("spends 3 of %i units and preserves every remaining unit",async(units)=>{
  const a=await qualify();await credit(a.email,units);const b=await reserve({...a,redeemUnits:99});expect(Number(b.booking.referral_discount_percent)).toBe(15);expect(await balance(a.email)).toBe(units-3);
 });
 it("serializes competing spends and restores cancelled redemption exactly once",async()=>{
  const a=await qualify();await credit(a.email,3);const results=await Promise.all([reserve({...a,redeemUnits:3}),reserve({...a,redeemUnits:3})]);expect(results.map(r=>Number(r.booking.referral_reward_units_redeemed)).sort()).toEqual([0,3]);expect(await balance(a.email)).toBe(0);
  const redeemed=results.find(r=>Number(r.booking.referral_reward_units_redeemed)===3)!;await db.query("update bookings set status='cancelled' where id=$1",[redeemed.booking.id]);await db.query("update bookings set status='cancelled' where id=$1",[redeemed.booking.id]);expect(await balance(a.email)).toBe(3);
  await expect(complete(redeemed.booking.id)).rejects.toThrow(/rebooked/);
 });
 it("applies only better promo and does not consume own rewards",async()=>{
  const a=await qualify();await credit(a.email,3);await db.exec("insert into promo_codes(code,discount_type,discount_value) values('REFTEST20','percent',20)");
  const b=await reserve({...a,redeemUnits:3,promo:"REFTEST20"});expect(Number(b.booking.amount)).toBe(80);expect(Number(b.booking.referral_reward_units_redeemed)).toBe(0);expect(await balance(a.email)).toBe(3);
 });
 it("does not let unverified booking contact change immutable identity contacts",async()=>{
  const a=await qualify();await reserve({...a,phone:person().phone});const row=await db.query<{phone:string}>("select phone from referral_identities where customer_key=$1",[a.email]);expect(row.rows[0].phone).toBe(a.phone);
 });
 it("rejects public sync and private account/OTP access for ordinary users",async()=>{
  await db.exec("set role authenticated");try{await expect(db.query("select referral_account('any@example.com')")).rejects.toThrow(/permission denied/);await expect(db.query("select sync_referral_reward_for_booking($1,'completed')",[randomUUID()])).rejects.toThrow(/permission denied/);}finally{await db.exec("reset role");}
 });
 it("consumes OTP once and serializes the five-attempt limit",async()=>{
  const a=await qualify();await db.query("insert into referral_verification_codes(customer_key,code_hash,expires_at) values($1,'correct',now()+interval '10 minutes')",[a.email]);
  for(let i=0;i<5;i++)expect((await db.query<{ok:boolean}>("select consume_referral_otp($1,'wrong') ok",[a.email])).rows[0].ok).toBe(false);
  expect((await db.query<{ok:boolean}>("select consume_referral_otp($1,'correct') ok",[a.email])).rows[0].ok).toBe(false);
  const b=await qualify();await db.query("insert into referral_verification_codes(customer_key,code_hash,expires_at) values($1,'correct',now()+interval '10 minutes')",[b.email]);
  expect((await db.query<{ok:boolean}>("select consume_referral_otp($1,'correct') ok",[b.email])).rows[0].ok).toBe(true);expect((await db.query<{ok:boolean}>("select consume_referral_otp($1,'correct') ok",[b.email])).rows[0].ok).toBe(false);
 });
 it("never retries discarded notifications or retries exhausted events",async()=>{
  await db.exec("update referral_notification_events set sent_at=now()");const a=await qualify();
  await db.query("update referral_notification_events set discarded_at=now() where customer_key=$1 and event_type='activated'",[a.email]);
  await db.query("update referral_notification_events set attempts=5 where customer_key=$1 and event_type='trip_completed'",[a.email]);
  expect((await db.query("select * from claim_referral_notifications(50)")).rows).toHaveLength(0);
 });
 it("does not forget an existing customer after a once-qualified trip is cancelled",async()=>{
  const a=await qualify(),b=await qualify();await db.query("update bookings set status='cancelled' where id=$1",[b.id]);
  const booking=await reserve({...b,referralCode:a.code});expect(await reason(booking.booking.id)).toContain("existing_customer");
 });
 it("queues completion/activation/earned events once without sending or amounts",async()=>{
  const a=await qualify(),b=await reserve({referralCode:a.code});await complete(b.booking.id);await complete(b.booking.id);
  const events=await db.query<{event_type:string;payload:object}>("select event_type,payload from referral_notification_events where booking_id=$1",[b.booking.id]);expect(events.rows.map(r=>r.event_type).sort()).toEqual(["activated","reward_earned","trip_completed"]);expect(JSON.stringify(events.rows)).not.toContain('amount');
 });
 it("keeps creation analytics after qualification and denies public analytics access",async()=>{
  const a=await qualify(),b=await reserve({referralCode:a.code});await complete(b.booking.id);
  const events=await db.query<{event_name:string}>("select event_name from referral_analytics_events where booking_id=$1",[b.booking.id]);
  expect(events.rows.filter(e=>e.event_name==='referred_booking_created')).toHaveLength(1);
  expect(events.rows.filter(e=>e.event_name==='referral_reward_earned')).toHaveLength(1);
  await db.exec("set role authenticated");try{await expect(db.query("select * from referral_analytics_events")).rejects.toThrow(/permission denied/);}finally{await db.exec("reset role");}
 });

});
