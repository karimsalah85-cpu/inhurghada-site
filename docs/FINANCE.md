# Finance module: how the numbers work

Reference for the owner and the accountant. Everything below is enforced in
the database (`supabase/migrations/2026092*`) and covered by the tests in
`tests/finance-*.test.ts`.

## Who can see and change finance

Only the **owner** and the **accountant** (the `finance` role) can see or change
finance. The owner can widen or narrow this in *Users & roles → Role
permissions*. Every change to money is written to the audit log (who, when,
before, after); the audit log itself cannot be edited or deleted.

## Nothing financial is deleted

Bookings are archived or cancelled, expenses are voided with a reason, partners
and sales people are deactivated, assignments are cancelled, receipts are
rejected, ledger and guest-payment entries are corrected by **reversal**
entries. The database refuses deletes on all of these.

## Currencies and exchange rates

- Guests pay in EUR, USD, GBP, EGP or SAR; partners are usually paid in EGP.
- Every amount keeps its **original currency and amount** plus the **rate used**.
- Reports are in **USD** (the base currency). The reports page can *show* them
  in another currency at the latest stored rate or at a rate you type in.
- Rates come daily from free public sources; a rate entered in
  *Currency settings* always wins. A record's USD value is provisional until
  the exact rate for its date exists, then it is locked and never moves.
- Money is exact decimal (never floating point); rounding is half away from
  zero to the cent.

## Bookings, trips and revenue (accrual, by trip date)

Each booking is split into one **trip line** per trip. A trip counts in the
P&L on its **trip date**:

| Booking status | Revenue | Partner costs |
|---|---|---|
| New (not confirmed) | none | none |
| Confirmed / completed / no-show | net price − refunds | full cost |
| Cancelled, nothing paid | none | only agreed cancellation fees |
| Cancelled, guest paid | what the guest paid and did not get back | only agreed cancellation fees |

**Margin** = revenue − all partner costs (main + extra partners) − agent
commission − payment fees. Business expenses are subtracted in the P&L, not
per trip.

## Guest payments, refunds and credit notes

- Record deposits, balance payments and refunds per booking (cash, card,
  Stripe, bank transfer, PayPal, InstaPay, Vodafone Cash, other). A payment in
  another currency stores the rate used at the desk (or the day's rate).
- Refunds and credit notes can never exceed what the guest has paid.
- Once a booking has any recorded payment, its payment status (unpaid / paid /
  refunded) follows the recorded money.
- A **credit note** is a refund given as credit: it removes the revenue from the
  original booking and is money owed to the guest until used. Using it on a
  later booking counts as a (non-cash) payment there.
- Cancellation reasons: weather, guest, partner, other. The *Cancellations*
  page shows what they cost each month.

## Partners and payouts

Each trip has a **main partner** (the one who may collect the guest's money)
and any number of **extra partners** (guide, driver, hotel, company…), each with
their own cost, currency and cancellation fee.

The partner ledger is automatic and append-only. **Sign convention: a
positive balance means the partner owes Daily Red Sea; negative means Daily Red
Sea owes the partner.**

- Guest paid Daily Red Sea → we owe the main partner their cost.
- Guest paid the partner → the partner owes us the difference.
- Extra partners are always paid by Daily Red Sea.
- Cancelling a trip reverses what partners were owed, leaving only agreed
  cancellation fees. Payments, commission received, settlements and adjustments
  are recorded on the partner's page and corrected only by reversal.

## VAT (configurable, nothing hard-coded)

- Rates are set up on *Finance → VAT* (percent, sales/purchases/both, valid
  dates, optional default for new sales / new purchases). A rate's percent
  never changes; end it and add a new one. Each transaction keeps the percent
  it was given.
- Amounts are treated as **VAT-inclusive**: VAT = amount × r / (100 + r).
- VAT is recorded on trip sales, main-partner costs, extra-partner costs and
  expenses, and reported per month (sales, purchases, net).
- VAT does **not** yet reduce revenue, margins or what partners are owed.

**To confirm with the accountant:** the rates; whether some partners charge
VAT on top of their price; whether revenue should be shown excluding VAT; and
whether VAT is filed by trip date (as reported now), invoice date or payment
date.

## Cash in vs cash out

Counts only money that actually moved, on the date it moved: guest payments
and refunds (not credit notes), payments to and receipts from partners,
settlements, and expenses that are not voided. Reversals net out. Profit is by
trip date, cash is by payment date, so the two can differ within a month.

## Export for the accountant

*Finance reports → Export all transactions (CSV)* lists, for a date range,
every trip sale, guest payment/refund/credit note, partner ledger entry and
expense with: date, type, booking, guest/partner/vendor, description, original
currency and amount, rate, USD, VAT, method, whether it moved cash and its cash
effect, reversal/void flags, who recorded it and when. The dashboard's cash
figures are computed from the same list, so they always agree.
