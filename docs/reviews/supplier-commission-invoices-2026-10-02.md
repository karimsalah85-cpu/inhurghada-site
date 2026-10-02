# Supplier commission invoices — 2 October 2026

The supplier finance detail page now includes a commission invoice editor, saved history, email preview, branded PDF, and recipient confirmation before sending. Finance viewing and management permissions are checked separately. Each saved document is an immutable snapshot; copy it to a new draft to make revisions.

Trip rows contain date, trip name, customer count, ticket price, and commission percentage. Sales and commissions use integer cents, rounding commission per line before summing. All trip dates must fall within the selected month. Currency, city, partner display name, and payment notes are editable.

The email is built from the same lib/email/layout.ts helpers as the booking confirmation: masthead, Manrope typography, intro, detail rows, tinted summary, dark support panel and footer. It uses the booking sender, reply-to and internal BCC. Its PDF attachment shares the booking photo hero, coral logo plate, perforated ticket summary, theme, fonts, continuation header and footer components. Sending uses an atomic database claim to block concurrent or repeated sends. Unconfirmed provider outcomes are marked `delivery_unknown` and must be checked in the sent mailbox; they are not retried automatically. Statements do not create or settle ledger entries.

## Finance-linked monthly statements (follow-up, commit 24961a6)

Statements are no longer typed in by hand. **Load from finance** (`GET …/invoices/monthly?period=YYYY-MM&currency=XXX`) builds rows from the supplier's included, supplier-collected booking lines with trips in that month, using each line's current unpaid balance from `supplier_line_balances` (partial payments reduce it; fully paid lines drop out). It is the balance owed now for that month's trips, not a month-end balance.

- USD statements combine booking currencies at each line's locked trip rate. Other currencies include only bookings in that currency.
- Partner name is the supplier record name. City is the single trip destination, otherwise "All destinations". Only notes are editable.
- Loading is refused, with a message naming the booking, when a line has no supplier split, lacks locked exchange rates, converts to zero, or when the supplier has negative unallocated ledger entries, booking credits, or active extra partner costs on those trips. Those cases need the net supplier statement.
- Each document carries a SHA-256 fingerprint of its supplier, period, currency, city and rows. Saving recomputes from finance and rejects a mismatch. Sending checks the fingerprint, claims the draft, then recomputes again before calling the email provider. If finance has changed, it releases the claim and sends nothing.
- **Refresh from finance** (`PATCH …/invoices/[invoiceId]`) rebuilds an unsent draft in place, guarded against concurrent edits.
- Unlinked drafts created before this change cannot be sent until refreshed. Refreshing clears their old notes.
- Statements still create and settle no ledger entries. Record the commission received when the supplier pays.
- Verified on the branch: 116 test files, 1,013 tests, TypeScript (after `next typegen`) and lint all pass.

### Action needed for the September draft

`DRS-COM-00000001` was entered by hand, so it is unlinked and **Send email** is disabled for it. Before sending it, open it and click **Refresh from finance**. Note that the refresh:

- replaces "El Haddad SCUBA" with the supplier record name "Al- Haddad scuba". Rename the supplier first if the statement should show the other spelling.
- replaces the city "Jeddah" with the trip destination(s).
- replaces the manual amounts with the ledger balances. Only bookings recorded in finance with a supplier split and locked rates will appear.

## September draft (original manual entry)

- Supplier: Al- Haddad scuba; document display name: El Haddad SCUBA.
- Live draft: `DRS-COM-00000001`, ID `b619a50b-e2c3-497f-bebc-ab341a388794`.
- Period/city: September 2026, Jeddah; currency: USD.
- 21 September: Bayada Leisure Boat Trip, 1 × $110.00, 25% = $27.50.
- 21 September: Jeddah Sunset Tour, 5 × $32.00, 25% = $40.00.
- 23 September: Jeddah Sunset Tour, 7 × $32.00, 25% = $56.00.
- Total: 13 customers, $494.00 sales, $123.50 commission.
- Database migration `20261002073043_supplier_commission_invoices` applied; RLS enabled with finance-only reading and server-only writes.
- Verified live draft status with null sent timestamp. No supplier email sent.

## Verification and release boundary

- Full release test suite passed: 114 files, 999 tests.
- All 12 focused statement/API tests pass: exact arithmetic, rounding, invalid input, escaping, PDF pagination, database RLS, permissions, origin checks, confirmation, duplicate sends and ambiguous provider failures.
- TypeScript and lint pass. Production build verified.
- PDF rendered and visually inspected; text totals checked. Email reviewed at desktop and mobile widths.
- Invoice editor verified in an isolated temporary local preview with mocked API requests, including September loading, totals and mobile layout. Temporary preview removed afterward.
- No authenticated live browser send was performed. Email transport acceptance/delivery has not been tested by sending a real message.
- Release prepared in /private/tmp/drs-supplier-invoice-release from main at 88d260a, preserving the newly merged shared email/PDF styling. Database migration and September draft are already live. Open Finance → Suppliers → Al- Haddad scuba after deployment to access the saved draft. Production verification is recorded in the release handoff.
