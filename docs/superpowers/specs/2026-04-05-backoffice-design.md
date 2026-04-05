# BackOffice — Design Spec
**Date:** 2026-04-05
**Status:** Approved

---

## Goal

A mobile-first PWA for a solo Dutch entrepreneur (eenmanszaak) to manage invoices, expenses, VAT, cashflow, and clients. Reduces administrative load by automating calculations and data entry where possible.

---

## Scope (MVP)

- Invoice / facture creation and sending
- Expense tracking with receipt scanning
- VAT (BTW) calculation and quarterly overview
- Cashflow forecasting
- Client database

Out of scope for MVP (future phases): mileage tracking, vehicle reminders, calendar/planning, subscriptions, accountant collaboration portal, multi-currency.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Best ecosystem for PDF, QR, charts; largest community |
| Backend | Firebase (Firestore + Auth + Storage + Hosting) | User already has Firebase; free tier sufficient; offline support built-in |
| PDF generation | @react-pdf/renderer | In-browser PDF, no server needed |
| QR codes | qrcode (npm) | EPC QR for iDEAL payments, generated in-browser |
| OCR | Google Cloud Vision API | Accurate, same Google ecosystem as Firebase, free tier covers low volume |
| Email sending | Firebase Cloud Function | Low volume, free tier sufficient |

---

## Users & Roles

| Role | Access |
|---|---|
| Owner | Full read + write |
| Accountant | Read-only — invoices, expenses, VAT overviews, exports |

Role stored in Firestore under `users/{userId}.role`. Firebase security rules enforce write restrictions for the accountant role server-side.

---

## Data Model (Firestore)

```
users/{userId}
  role: "owner" | "accountant"
  businessName, kvkNumber, btwNumber, iban
  logoUrl (Firebase Storage)
  defaultHourlyRate, defaultVatRate
  taxReservePercent, vacationSavingsPercent

clients/{clientId}
  name, email, phone, address
  language: "nl" | "en" | "pl"
  notes

invoices/{invoiceId}
  invoiceNumber           — auto, sequential, format YYYY-NNN, immutable once issued
  clientId
  clientSnapshot          — name/address copied at time of invoice (client may change)
  language: "nl" | "en" | "pl"
  lines: [{
    description
    type: "hourly" | "fixed"
    qty                   — hours if hourly, 1 if fixed
    rate                  — hourly rate or fixed price
    vatRate               — 0 | 9 | 21
    total                 — computed: qty × rate
  }]
  subtotal                — sum of line totals excl. VAT
  vatAmount               — sum of VAT per line
  totalAmount             — subtotal + vatAmount
  status: "draft" | "sent" | "paid" | "overdue"
  issueDate, dueDate, paidDate
  notes

expenses/{expenseId}
  description
  amount                  — total incl. VAT
  vatAmount               — extracted or calculated
  vatRate: 0 | 9 | 21
  category: "fixed" | "variable"
  tag: "business" | "private"
  date, vendor
  receiptUrl              — Firebase Storage path
  status: "added" | "pending" | "accounted"

```

**VAT and cashflow are computed on the fly** — no separate aggregation collection in MVP.

- **VAT owed (quarter)** = Σ invoice VAT (sent/paid in quarter) − Σ expense VAT (business, in quarter)
- **Cashflow forecast** = current balance + Σ unpaid invoice totals − Σ upcoming fixed expenses

---

## Invoice Requirements (Dutch Law)

Every invoice must include:
- Seller: name, address, KvK number, BTW number
- Buyer: name and address
- Invoice number (sequential, immutable)
- Issue date and due date
- Line descriptions with quantity, rate, VAT rate per line
- Subtotal excl. VAT, VAT amount, total incl. VAT
- IBAN + EPC QR code for iDEAL payment

Invoice languages supported: Dutch (NL), English (EN), Polish (PL) — selected per invoice.

---

## Navigation Structure

Bottom navigation bar (always visible):

| Tab | Content |
|---|---|
| Dashboard | Balance card, cashflow summary, unpaid count, VAT owed, recent activity |
| Invoices | Invoice list (filterable by status), invoice detail, PDF preview, send, mark paid |
| + (center) | Quick action sheet: New Invoice · Add Expense · Add Client |
| Expenses | Expense list, add expense (scan or manual), business/private tag, status |
| Reports | Revenue/expense charts, VAT quarterly summary, cashflow forecast, export |

Clients are accessible from within the Invoices tab (not a separate tab).

---

## Screen Designs

### Dashboard
- Gradient balance card: current balance, incoming (unpaid invoices), outgoing (this month)
- Quick stats: unpaid invoice count + total, this month revenue
- Recent activity list (last 5 invoices/expenses)

### Invoice Creation (2 steps)
1. **Build** — select client, choose language, set due date, add lines (hourly or fixed, mixable), auto-calculated VAT and totals, save draft or proceed
2. **Preview & Send** — mini PDF preview (with QR code), send via email / share link / download PDF

### Expenses
- Scan receipt button (OCR fills amount, VAT, vendor, date automatically)
- Manual fallback fields
- Business / private toggle (manual, required)
- Category toggle: fixed / variable
- Auto-calculated deductible VAT shown before saving

### VAT Overview (in Reports)
- Quarter selector
- BTW collected (from sent/paid invoices)
- BTW deductible (from business expenses)
- BTW owed to Belastingdienst
- Submission deadline shown
- Export to PDF and CSV

### Cashflow
- Current balance (manually entered in settings)
- Incoming: sum of unpaid invoices
- Outgoing: this month's expenses
- Set aside section: BTW reserve (auto), income tax estimate (% of profit), vacation savings (% of revenue)
- End-of-month forecast with progress bar toward optional target
- Upcoming expenses list (from fixed/recurring costs)

---

## Automation vs Manual

### Fully automatic
- Invoice numbering (YYYY-NNN, continuous, no gaps)
- BTW calculation on invoices and expenses
- VAT quarterly totals (collected, deductible, owed)
- Cashflow forecast (unpaid invoices + recurring expenses)
- Income tax reserve estimate (configurable %)
- Vacation savings tracking (configurable %)
- Overdue invoice detection
- Receipt OCR (amount, VAT, vendor, date)

### One tap from user
- Mark invoice as paid
- Business vs private on each expense
- Confirm before sending invoice
- Expense category (fixed / variable)

### Set once in settings, never touch again
- Default BTW rate (21%)
- Income tax reserve % (e.g. 30%)
- Vacation savings % (e.g. 8%)
- Business details (name, KvK, BTW number, IBAN, logo)
- Default hourly rate

All settings are editable at any time. Changes apply going forward; historical data is not affected. Invoice numbers are the only immutable field (legal requirement).

---

## Design Principles

- Dark theme, mobile-first, clean card-based layout
- Minimum taps for common actions (add expense: scan → tag → save = 3 taps)
- All required legal fields always included on invoices automatically
- User logo uploaded once, appears on all invoices
- Offline-capable (Firestore offline cache)

---

## Future Phases (not in MVP)

- Mileage tracking (start/stop trips, automatic distance)
- Vehicle reminders (APK, insurance, maintenance)
- Work calendar and deadline tracking
- Subscription/recurring cost manager
- Accountant collaboration portal
- Multi-currency support with EUR conversion
- Notes per client/invoice
- Global business/private tagging across all transactions
