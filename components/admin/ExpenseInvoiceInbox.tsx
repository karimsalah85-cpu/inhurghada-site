"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { extractInvoice, isSupportedInvoiceFile } from "@/lib/expense-invoice-extract";
import { parseInvoiceText } from "@/lib/expense-invoice-parsing";

const BUCKET = "expense-invoices";

const expenseOptions: [string, string][] = [
  ["google_ads", "Google Ads"],
  ["subscriptions", "Subscriptions"],
  ["supplier_per_trip", "Supplier per trip"],
  ["sales_commission", "Sales person commission"],
  ["fuel", "Fuel"],
  ["guide_fees", "Guide fees"],
  ["boat_costs", "Boat costs"],
  ["other", "Other"],
];

type Supplier = { id: string; name: string };
type SalesPerson = { id: string; name: string };
type BookingRef = { id: string; reference: string; tour_name?: string | null; status?: string };

export type ExpenseInvoice = {
  id: string;
  file_name: string;
  mime_type: string | null;
  status: string;
  extraction_method: string | null;
  ocr_confidence: number | null;
  vendor: string | null;
  suggested_description: string | null;
  suggested_amount: number | string | null;
  suggested_currency: string | null;
  suggested_date: string | null;
  suggested_expense_type: string | null;
  suggested_category: string | null;
  created_at: string;
};

type Draft = {
  expense_type: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  category: string;
  supplier_id: string;
  sales_person_id: string;
  booking_id: string;
};

type Processing = { key: string; name: string; stage: string; error?: string };

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || "The admin request failed.");
  return data as T;
}

const today = () => new Date().toISOString().slice(0, 10);

function draftFrom(invoice: ExpenseInvoice): Draft {
  return {
    expense_type: invoice.suggested_expense_type || "other",
    description: invoice.suggested_description || invoice.vendor || "",
    amount: invoice.suggested_amount != null ? String(invoice.suggested_amount) : "",
    currency: (invoice.suggested_currency || "USD").toUpperCase(),
    date: invoice.suggested_date || today(),
    category: invoice.suggested_category || "",
    supplier_id: "",
    sales_person_id: "",
    booking_id: "",
  };
}

export default function ExpenseInvoiceInbox({
  suppliers,
  salesPeople,
  bookings,
  onPosted,
  onFeedback,
}: {
  suppliers: Supplier[];
  salesPeople: SalesPerson[];
  bookings: BookingRef[];
  onPosted: (expense: { id: string }) => void;
  onFeedback: (message: string) => void;
}) {
  const [invoices, setInvoices] = useState<ExpenseInvoice[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [processing, setProcessing] = useState<Processing[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    api<{ invoices: ExpenseInvoice[] }>("/api/admin/expense-invoices?status=pending")
      .then((data) => {
        if (!active) return;
        setInvoices(data.invoices);
        setDrafts(Object.fromEntries(data.invoices.map((invoice) => [invoice.id, draftFrom(invoice)])));
      })
      .catch(() => active && setError("Could not load the invoice queue."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    setError("");
    for (const file of files) {
      const key = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      if (!isSupportedInvoiceFile(file)) {
        setProcessing((items) => [
          { key, name: file.name, stage: "", error: "Unsupported file type." },
          ...items,
        ]);
        continue;
      }
      setProcessing((items) => [{ key, name: file.name, stage: "uploading" }, ...items]);
      const setStage = (stage: string) =>
        setProcessing((items) => items.map((item) => (item.key === key ? { ...item, stage } : item)));
      try {
        const { path, token } = await api<{ path: string; token: string }>(
          "/api/admin/expense-invoices/upload-url",
          {
            method: "POST",
            body: JSON.stringify({ file_name: file.name, mime_type: file.type, file_size: file.size }),
          },
        );

        const upload = await createClient().storage.from(BUCKET).uploadToSignedUrl(path, token, file, {
          contentType: file.type,
        });
        if (upload.error) throw new Error("The file upload failed.");

        setStage("reading");
        const extraction = await extractInvoice(file, (stageName, fraction) =>
          setStage(`${stageName} ${Math.round(fraction * 100)}%`),
        );
        const parsed = parseInvoiceText(extraction.text);

        const { invoice } = await api<{ invoice: ExpenseInvoice }>("/api/admin/expense-invoices", {
          method: "POST",
          body: JSON.stringify({
            file_path: path,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            extraction_method: extraction.method,
            ocr_confidence: extraction.confidence,
            raw_text: extraction.text.slice(0, 20000),
            vendor: parsed.vendor,
            suggested_description: parsed.vendor || parsed.category,
            suggested_amount: parsed.amount,
            suggested_currency: parsed.currency,
            suggested_date: parsed.date,
            suggested_expense_type: parsed.expenseType,
            suggested_category: parsed.category,
            line_items: parsed.lineItems,
            parsed,
          }),
        });

        setInvoices((items) => [invoice, ...items]);
        setDrafts((items) => ({ ...items, [invoice.id]: draftFrom(invoice) }));
        setProcessing((items) => items.filter((item) => item.key !== key));
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Could not process this file.";
        setProcessing((items) => items.map((item) => (item.key === key ? { ...item, error: message } : item)));
      }
    }
  }, []);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(event.dataTransfer.files));
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts((items) => ({ ...items, [id]: { ...items[id], ...patch } }));
  }

  async function viewFile(id: string) {
    try {
      const { url } = await api<{ url: string }>(`/api/admin/expense-invoices/${id}?file=1`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not open the invoice file.");
    }
  }

  async function post(invoice: ExpenseInvoice) {
    const draft = drafts[invoice.id];
    setBusyId(invoice.id);
    setError("");
    try {
      const result = await api<{ expense: { id: string }; warning?: string }>(
        `/api/admin/expense-invoices/${invoice.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "post",
            description: draft.description,
            amount: Number(draft.amount),
            currency: draft.currency,
            expense_date: draft.date,
            expense_type: draft.expense_type,
            category: draft.category,
            supplier_id: draft.supplier_id || undefined,
            sales_person_id: draft.sales_person_id || undefined,
            booking_id: draft.booking_id || undefined,
          }),
        },
      );
      setInvoices((items) => items.filter((item) => item.id !== invoice.id));
      onPosted(result.expense);
      onFeedback(result.warning || "Expense posted from invoice.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not post this expense.");
    } finally {
      setBusyId(null);
    }
  }

  async function discard(invoice: ExpenseInvoice) {
    if (!window.confirm(`Discard invoice “${invoice.file_name}”? The file stays stored but no expense is created.`)) {
      return;
    }
    setBusyId(invoice.id);
    setError("");
    try {
      await api(`/api/admin/expense-invoices/${invoice.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject" }),
      });
      setInvoices((items) => items.filter((item) => item.id !== invoice.id));
      onFeedback("Invoice discarded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not discard this invoice.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section id="invoice-inbox" className="h-fit scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Invoice inbox</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Drop supplier invoices here. Each file is stored, read on this device, and queued below with pre-filled
        amounts you confirm before it becomes an expense.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragOver ? "border-slate-900 bg-slate-50" : "border-slate-300"
        }`}
      >
        <UploadCloud size={28} className="text-slate-400" />
        <p className="mt-2 text-sm font-semibold">Drag &amp; drop invoices, or click to choose</p>
        <p className="mt-1 text-xs text-slate-400">PDF, PNG, JPEG or WebP · up to 15 MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            handleFiles(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      {processing.length ? (
        <ul className="mt-4 space-y-2">
          {processing.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                {item.error ? (
                  <FileText size={15} className="shrink-0 text-rose-500" />
                ) : (
                  <Loader2 size={15} className="shrink-0 animate-spin text-slate-400" />
                )}
                <span className="truncate">{item.name}</span>
              </span>
              <span className={item.error ? "text-rose-600" : "text-slate-500"}>
                {item.error || item.stage}
                {item.error ? (
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => setProcessing((items) => items.filter((entry) => entry.key !== item.key))}
                  >
                    dismiss
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 border-t pt-5">
        <p className="text-sm font-bold">
          Review queue{invoices.length ? ` · ${invoices.length}` : ""}
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nothing waiting. Uploaded invoices show up here.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {invoices.map((invoice) => {
              const draft = drafts[invoice.id];
              if (!draft) return null;
              const showSupplier = draft.expense_type === "supplier_per_trip";
              const showSalesPerson = draft.expense_type === "sales_commission";
              const showBooking = showSupplier || showSalesPerson;
              return (
                <div key={invoice.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{invoice.file_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {invoice.extraction_method === "pdf_text"
                          ? "Read from PDF text"
                          : invoice.extraction_method === "ocr"
                            ? `OCR${invoice.ocr_confidence != null ? ` · ${invoice.ocr_confidence}% confidence` : ""}`
                            : "Not read"}
                        {invoice.vendor ? ` · ${invoice.vendor}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => viewFile(invoice.id)}
                      className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                    >
                      View file
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold">
                      Expense type
                      <select
                        value={draft.expense_type}
                        onChange={(event) => patchDraft(invoice.id, { expense_type: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 font-normal"
                      >
                        {expenseOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-semibold">
                      Date
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(event) => patchDraft(invoice.id, { date: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold sm:col-span-2">
                      Description
                      <input
                        maxLength={200}
                        value={draft.description}
                        onChange={(event) => patchDraft(invoice.id, { description: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-normal"
                        placeholder="What was paid for?"
                      />
                    </label>
                    <label className="block text-xs font-semibold">
                      Amount
                      <input
                        type="number"
                        min="0.01"
                        max="1000000"
                        step="0.01"
                        value={draft.amount}
                        onChange={(event) => patchDraft(invoice.id, { amount: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-normal"
                        placeholder="0.00"
                      />
                    </label>
                    <label className="block text-xs font-semibold">
                      Currency
                      <input
                        maxLength={3}
                        value={draft.currency}
                        onChange={(event) =>
                          patchDraft(invoice.id, { currency: event.target.value.toUpperCase().slice(0, 3) })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-normal uppercase"
                        placeholder="USD"
                      />
                    </label>
                    {showSupplier ? (
                      <label className="block text-xs font-semibold">
                        Supplier
                        <select
                          value={draft.supplier_id}
                          onChange={(event) => patchDraft(invoice.id, { supplier_id: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 font-normal"
                        >
                          <option value="">Select a supplier</option>
                          {suppliers.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {showSalesPerson ? (
                      <label className="block text-xs font-semibold">
                        Sales person
                        <select
                          value={draft.sales_person_id}
                          onChange={(event) => patchDraft(invoice.id, { sales_person_id: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 font-normal"
                        >
                          <option value="">Select a sales person</option>
                          {salesPeople.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {showBooking ? (
                      <label className="block text-xs font-semibold sm:col-span-2">
                        Booking <span className="font-normal text-slate-400">optional</span>
                        <select
                          value={draft.booking_id}
                          onChange={(event) => patchDraft(invoice.id, { booking_id: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 font-normal"
                        >
                          <option value="">No booking selected</option>
                          {bookings
                            .filter((item) => item.status !== "cancelled")
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.reference} · {item.tour_name || "Transfer"}
                              </option>
                            ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="block text-xs font-semibold sm:col-span-2">
                      Category <span className="font-normal text-slate-400">optional</span>
                      <input
                        maxLength={80}
                        value={draft.category}
                        onChange={(event) => patchDraft(invoice.id, { category: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-normal"
                        placeholder="Internal label"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => post(invoice)}
                      disabled={busyId === invoice.id}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60"
                    >
                      {busyId === invoice.id ? "Posting…" : "Post expense"}
                    </button>
                    <button
                      type="button"
                      onClick={() => discard(invoice)}
                      disabled={busyId === invoice.id}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                    >
                      <Trash2 size={14} /> Discard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
