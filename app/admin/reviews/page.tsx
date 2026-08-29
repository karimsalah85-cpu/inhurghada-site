import AdminPageFrame from "@/components/admin/AdminPageFrame";
import ReviewsModeration from "@/components/admin/ReviewsModeration";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminReviewsPage() {
  const { supabase } = await requireAdminPage("content");
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  return <AdminPageFrame eyebrow="Catalog & bookings" title="Trip reviews" description="Approve or reject guest reviews before they appear on a trip's page. Only guests with a completed booking can submit one.">
    {error ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-rose-800">{error.message}</p> : <ReviewsModeration initialReviews={data || []} />}
  </AdminPageFrame>;
}
