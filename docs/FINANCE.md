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

**Margin** = revenue (excl. VAT) − all partner costs (main + extra partners) −
agent commission − payment fees.

**Profit after linked expenses** = margin − the expenses linked to the trip:
- An expense can be linked to **one booking**. It is shared across that booking's
  trips by revenue.
- Or it can be linked to **one tour**, such as snorkel gear for Giftun trips. It
  counts against that tour and its destination.
- It is never linked to both, so it is never counted twice.
- The Margins page and the dashboard show both figures, and flag on profit.
- The P&L still subtracts every expense once, by expense date.

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

## VAT (set up for Egypt; everything stays configurable)

Set up on 30 Sep 2026 following Egyptian VAT Law 67/2016 and Saudi (ZATCA)
rules. Change any of it on *Finance → VAT*.

- **Rates:** Egypt 14% (`EG-VAT-14`), the default for Egyptian trips (Hurghada,
  Marsa Alam, El Gouna), partners and expenses **from 1 October 2026**.
  September and earlier stay as reported (no VAT). Saudi 15% (`SA-VAT-15`) is
  set up for Jeddah but not applied until Daily Red Sea registers with ZATCA:
  then make it the sales default.
- **Countries:** which destinations belong to which country, and how often each
  files, are settings (Egypt: monthly, due by the end of the next month; Saudi:
  quarterly, due by the end of the month after the quarter).
- **Tours in Egypt are local services,** not zero-rated exports: the guest is
  physically here, so foreign guests pay VAT too.
- **Guest prices include VAT.** VAT = amount × r / (100 + r).
- **Revenue excludes VAT.** The P&L shows *Net sales (incl. VAT) → Output VAT →
  Revenue excl. VAT*; margins, tours, destinations and the dashboard use revenue
  excluding VAT.
- **Partners** each have a VAT status on their partner page:
  - *Not registered* (the default): no VAT, nothing to deduct. This fits most
    small boats, guides and drivers.
  - *Registered, VAT included:* the VAT inside their price is deductible, so their
    cost excludes it.
  - *Registered, VAT on top:* the usual quote from registered Egyptian companies
    ("+14%"). What Daily Red Sea owes them includes the VAT; the cost in the
    margin does not.
  - Only VAT on a registered partner's tax (e-)invoice can be deducted.
- **Expenses** get 14% by default from October. Choose "No VAT" when the receipt
  is not a tax invoice or e-receipt.
- **When VAT is due (tax point):** money a guest pays before the trip carries its
  share of the VAT in the month it was received. The rest falls in the trip
  month. Partner VAT counts by trip date, expense VAT by expense date.
- **The VAT page** shows VAT per country and month in the currency the return
  is filed in (EGP; SAR for Saudi Arabia), with USD underneath and each return's
  due date.
  - Amounts already in that currency are used as they are.
  - Others are converted at the rate on their tax date.

**For the accountant to confirm:**
- Daily Red Sea is VAT-registered in Egypt (it must be above EGP 250,000 a year
  in sales).
- Which partners are registered.
- Whether an earlier start date is needed.

## Recording guest payments (from now on)

Record every deposit, balance and refund on the day it happens (amount, method,
date) from the booking's details. *Finance → Payments to record* lists the
bookings Daily Red Sea collects that are marked paid or refunded, or whose trip
has happened, but have no payment recorded. Marking a booking paid by hand opens
it so the payment can be recorded. Trips a partner collects are not listed: the
guest pays the partner, and Daily Red Sea's share is settled on the partner's
page.

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
