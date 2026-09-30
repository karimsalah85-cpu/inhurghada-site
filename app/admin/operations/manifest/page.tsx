import AdminPageFrame from "@/components/admin/AdminPageFrame";
import PickupManifest from "@/components/admin/PickupManifest";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { buildManifest, type ManifestAssignment, type ManifestBooking, type ManifestPerson } from "@/lib/pickup-manifest";
import { loadPickupZoneData } from "@/lib/pickup-zones";

const cairoToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export default async function ManifestPage({ searchParams }: { searchParams: Promise<{ date?: string | string[] }> }) {
  const { supabase } = await requireAdminPage("operations");
  const requested = (await searchParams).date;
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(`${raw}T00:00:00Z`)) ? raw : addDays(cairoToday(), 1);

  const baseColumns = "id,reference,type,customer_name,phone,tour_name,tour_slug,date,start_time,hotel,notes,guests,adults,youth,infants,status,payment_status,amount,currency";
  const loadBookings = (columns: string) => supabase
    .from("bookings")
    .select(columns)
    .eq("date", date)
    .is("archived_at", null)
    .neq("status", "cancelled")
    .order("start_time", { nullsFirst: false });
  let { data: bookings, error } = await loadBookings(`${baseColumns},guest_requirements`);
  // guest_requirements arrives with the 20261001110000 migration; the code may deploy first.
  if (error && ["42703", "PGRST204"].includes(error.code || "")) ({ data: bookings, error } = await loadBookings(baseColumns));
  const rows = (bookings || []) as unknown as ManifestBooking[];
  const ids = rows.map((booking) => booking.id);
  const { data: assignments } = ids.length
    ? await supabase.from("booking_assignments").select("booking_id,supplier_id,staff_member_id,assignment_type,pickup_time,status,notes").in("booking_id", ids)
    : { data: [] as ManifestAssignment[] };
  const supplierIds = [...new Set((assignments || []).map((row) => row.supplier_id).filter(Boolean))] as string[];
  const staffIds = [...new Set((assignments || []).map((row) => row.staff_member_id).filter(Boolean))] as string[];
  const [{ data: suppliers }, { data: staff }] = await Promise.all([
    supplierIds.length ? supabase.from("suppliers").select("id,name,phone,whatsapp").in("id", supplierIds) : Promise.resolve({ data: [] }),
    staffIds.length ? supabase.from("staff_members").select("id,name,phone,staff_type").in("id", staffIds) : Promise.resolve({ data: [] }),
  ]);
  const people: ManifestPerson[] = [
    ...((suppliers || []) as Array<{ id: string; name: string; phone: string | null; whatsapp: string | null }>).map((row) => ({ ...row, kind: "supplier" as const })),
    ...((staff || []) as Array<{ id: string; name: string; phone: string | null; staff_type: string | null }>).map((row) => ({ id: row.id, name: row.name, phone: row.phone, role: row.staff_type, kind: "staff" as const })),
  ];
  // Zone pickup times fill in stops with no assigned time; null (tables not migrated yet) keeps the old behaviour.
  const tourSlugs = [...new Set(rows.map((row) => row.tour_slug).filter(Boolean))] as string[];
  const zoneData = await loadPickupZoneData(supabase, tourSlugs);
  const groups = buildManifest(rows, (assignments || []) as ManifestAssignment[], people, zoneData);

  return <AdminPageFrame eyebrow="Dispatch & calendar" title="Pickup manifest" description="Every pickup for the day, grouped by boat, vehicle or guide, in pickup-time order. Print it or send each list on WhatsApp.">
    {error ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-rose-800">{error.message}</p> : <PickupManifest date={date} groups={groups} />}
  </AdminPageFrame>;
}
