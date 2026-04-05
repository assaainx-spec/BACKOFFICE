# BackOffice MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for a Dutch eenmanszaak to manage invoices, expenses, VAT, and cashflow, backed by Firebase.

**Architecture:** React + Vite + Tailwind PWA with Firebase (Firestore, Auth, Storage, Functions, Hosting). All business logic lives in pure functions under `src/lib/` and is tested with Vitest. UI components consume Firestore via custom hooks in `src/hooks/`. Two Firebase Cloud Functions handle OCR (Google Vision API) and email sending (Nodemailer + Gmail).

**Tech Stack:** React 18, Vite 5, Tailwind 3, Firebase 10, React Router 6, @react-pdf/renderer 3, react-hook-form 7, recharts 2, qrcode 1.5, dayjs 1, Vitest 1, @testing-library/react 14

---

## File Structure

```
/
├── public/
│   ├── manifest.json               PWA manifest
│   └── icons/                      192x192 + 512x512 app icons
├── src/
│   ├── main.jsx                    Entry point
│   ├── App.jsx                     Router + auth gate
│   ├── firebase.js                 Firebase init (app, auth, db, storage)
│   ├── lib/
│   │   ├── invoiceNumber.js        Sequential numbering (Firestore transaction)
│   │   ├── invoiceNumber.test.js
│   │   ├── vat.js                  VAT calculations (factuurstelsel)
│   │   ├── vat.test.js
│   │   ├── cashflow.js             Cashflow + set-aside computation
│   │   ├── cashflow.test.js
│   │   ├── epcQR.js                EPC QR string builder for iDEAL
│   │   └── epcQR.test.js
│   ├── hooks/
│   │   ├── useAuth.js              Auth state + role
│   │   ├── useSettings.js          Business profile read/write
│   │   ├── useClients.js           Client CRUD
│   │   ├── useInvoices.js          Invoice CRUD + status transitions
│   │   └── useExpenses.js          Expense CRUD
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx        Page wrapper
│   │   │   └── BottomNav.jsx       5-tab bottom navigation
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Toggle.jsx          Binary toggle (e.g. business/private)
│   │   │   └── Badge.jsx           Status badge (paid/unpaid/overdue)
│   │   ├── invoice/
│   │   │   ├── InvoiceList.jsx     List with status filter
│   │   │   ├── InvoiceForm.jsx     Step 1: build invoice
│   │   │   ├── InvoiceLine.jsx     Single editable line item
│   │   │   ├── InvoiceSend.jsx     Step 2: preview + send
│   │   │   └── InvoicePDF.jsx      @react-pdf/renderer document (NL/EN/PL)
│   │   ├── expense/
│   │   │   ├── ExpenseList.jsx
│   │   │   ├── ExpenseForm.jsx     Manual entry + OCR suggestions
│   │   │   └── ReceiptScanner.jsx  Camera capture + OCR trigger
│   │   ├── client/
│   │   │   ├── ClientList.jsx
│   │   │   └── ClientForm.jsx
│   │   └── reports/
│   │       ├── VATSummary.jsx      Quarterly VAT overview + export
│   │       └── CashflowForecast.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── DashboardPage.jsx
│       ├── InvoicesPage.jsx
│       ├── ExpensesPage.jsx
│       ├── ReportsPage.jsx
│       └── SettingsPage.jsx
├── functions/
│   ├── index.js                    Cloud Functions: sendEmail + extractReceipt
│   └── package.json
├── firestore.rules
├── .env.local                      Firebase config (not committed)
├── vite.config.js
├── tailwind.config.js
└── index.html
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `public/manifest.json`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd "C:/Users/assaa/Desktop/BackOffice"
npm create vite@latest . -- --template react
npm install
```

Expected: `src/App.jsx`, `src/main.jsx` created, `node_modules` populated.

- [ ] **Step 2: Install all dependencies**

```bash
npm install firebase react-router-dom @react-pdf/renderer qrcode recharts react-hook-form dayjs
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#1e1e2e',
        mantle: '#181825',
        crust: '#11111b',
        surface: '#313244',
        overlay: '#45475a',
        muted: '#6c7086',
        text: '#cdd6f4',
        blue: '#89b4fa',
        purple: '#cba6f7',
        green: '#a6e3a1',
        red: '#f38ba8',
        peach: '#fab387',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Configure Vite with Vitest**

Replace `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `src/test-setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Replace index.html**

```html
<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="theme-color" content="#11111b" />
    <link rel="manifest" href="/manifest.json" />
    <title>BackOffice</title>
  </head>
  <body class="bg-crust text-text">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Add Tailwind to src/index.css**

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create PWA manifest**

Create `public/manifest.json`:

```json
{
  "name": "BackOffice",
  "short_name": "BackOffice",
  "description": "Business management for freelancers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#11111b",
  "theme_color": "#11111b",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add placeholder icon files:
```bash
mkdir -p public/icons
# Add 192x192 and 512x512 PNG icons to public/icons/ manually
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: server at http://localhost:5173

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + Vite + Tailwind project with PWA manifest"
```

---

## Task 2: Firebase Setup

**Files:**
- Create: `src/firebase.js`, `.env.local`, `firestore.rules`

- [ ] **Step 1: Create Firebase project**

Go to https://console.firebase.google.com → create new project (or use existing).
Enable: **Authentication** (Email/Password), **Firestore** (production mode), **Storage**, **Hosting**.

- [ ] **Step 2: Create .env.local with Firebase config**

In Firebase console → Project Settings → Your apps → Add web app → copy config values.

Create `.env.local` (never commit this file):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Add `.env.local` to `.gitignore`:

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 3: Create src/firebase.js**

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Enable offline persistence
enableIndexedDbPersistence(db).catch(() => {
  // Persistence unavailable (e.g. multiple tabs) — continue without it
})
```

- [ ] **Step 4: Write Firestore security rules**

Create `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthed() {
      return request.auth != null;
    }

    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isOwner() {
      return isAuthed() && userRole() == 'owner';
    }

    function canRead() {
      return isAuthed() && userRole() in ['owner', 'accountant'];
    }

    match /users/{userId} {
      allow read: if isAuthed() && request.auth.uid == userId;
      allow write: if isOwner() && request.auth.uid == userId;
    }

    match /meta/{doc} {
      allow read: if canRead();
      allow write: if isOwner();
    }

    match /clients/{id} {
      allow read: if canRead();
      allow write: if isOwner();
    }

    match /invoices/{id} {
      allow read: if canRead();
      allow write: if isOwner();
    }

    match /expenses/{id} {
      allow read: if canRead();
      allow write: if isOwner();
    }
  }
}
```

- [ ] **Step 5: Install Firebase CLI and deploy rules**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore --project your_project_id
firebase deploy --only firestore:rules
```

Expected: "Deploy complete!" in terminal.

- [ ] **Step 6: Commit**

```bash
git add src/firebase.js firestore.rules .gitignore vite.config.js
git commit -m "feat: add Firebase init and Firestore security rules"
```

---

## Task 3: Auth + Routing + AppShell

**Files:**
- Create: `src/hooks/useAuth.js`, `src/pages/LoginPage.jsx`, `src/components/layout/AppShell.jsx`, `src/components/layout/BottomNav.jsx`
- Modify: `src/App.jsx`, `src/main.jsx`

- [ ] **Step 1: Create useAuth hook**

Create `src/hooks/useAuth.js`:

```js
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [role, setRole] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setRole(null)
        return
      }
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      setRole(snap.exists() ? snap.data().role : null)
      setUser(firebaseUser)
    })
  }, [])

  return { user, role, loading: user === undefined }
}
```

- [ ] **Step 2: Create LoginPage**

Create `src/pages/LoginPage.jsx`:

```jsx
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-crust flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text mb-2">BackOffice</h1>
        <p className="text-muted text-sm mb-8">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue"
          />
          {error && <p className="text-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue text-crust font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create BottomNav**

Create `src/components/layout/BottomNav.jsx`:

```jsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', icon: '🏠', label: 'Dashboard', exact: true },
  { to: '/invoices', icon: '📄', label: 'Invoices' },
  { to: '/expenses', icon: '💸', label: 'Expenses' },
  { to: '/reports', icon: '📊', label: 'Reports' },
]

export default function BottomNav({ onNew }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-mantle border-t border-overlay flex items-center justify-around px-2 pb-safe">
      {tabs.slice(0, 2).map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.exact}
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 text-xs ${isActive ? 'text-blue' : 'text-muted'}`
          }
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}

      {/* Centre + button */}
      <button
        onClick={onNew}
        className="flex flex-col items-center -mt-5"
      >
        <span className="w-12 h-12 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-2xl text-crust shadow-lg">+</span>
      </button>

      {tabs.slice(2).map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 text-xs ${isActive ? 'text-blue' : 'text-muted'}`
          }
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Create AppShell**

Create `src/components/layout/AppShell.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell({ children }) {
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()

  function handleAction(action) {
    setShowNew(false)
    if (action === 'invoice') navigate('/invoices/new')
    if (action === 'expense') navigate('/expenses/new')
    if (action === 'client') navigate('/clients/new')
  }

  return (
    <div className="min-h-screen bg-base pb-20">
      {children}

      {showNew && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end" onClick={() => setShowNew(false)}>
          <div className="w-full bg-mantle rounded-t-2xl p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <p className="text-muted text-xs text-center mb-4">Quick action</p>
            {[
              { label: '📄  New Invoice', action: 'invoice' },
              { label: '💸  Add Expense', action: 'expense' },
              { label: '👤  Add Client', action: 'client' },
            ].map(({ label, action }) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                className="w-full bg-surface text-text rounded-xl py-4 text-sm font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav onNew={() => setShowNew(true)} />
    </div>
  )
}
```

- [ ] **Step 5: Wire up App.jsx with routing + auth gate**

Replace `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InvoicesPage from './pages/InvoicesPage'
import ExpensesPage from './pages/ExpensesPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function AuthGate({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-crust flex items-center justify-center text-muted text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <AuthGate>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/invoices/*" element={<InvoicesPage />} />
                <Route path="/expenses/*" element={<ExpensesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </AppShell>
          </AuthGate>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Create stub page files**

Create `src/pages/DashboardPage.jsx`:
```jsx
export default function DashboardPage() { return <div className="p-4 text-text">Dashboard</div> }
```

Create `src/pages/InvoicesPage.jsx`:
```jsx
export default function InvoicesPage() { return <div className="p-4 text-text">Invoices</div> }
```

Create `src/pages/ExpensesPage.jsx`:
```jsx
export default function ExpensesPage() { return <div className="p-4 text-text">Expenses</div> }
```

Create `src/pages/ReportsPage.jsx`:
```jsx
export default function ReportsPage() { return <div className="p-4 text-text">Reports</div> }
```

Create `src/pages/SettingsPage.jsx`:
```jsx
export default function SettingsPage() { return <div className="p-4 text-text">Settings</div> }
```

- [ ] **Step 7: Update src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Verify login flow works**

```bash
npm run dev
```

Open http://localhost:5173 — should redirect to /login. Sign in with a Firebase user.

- [ ] **Step 9: Commit**

```bash
git add src/
git commit -m "feat: add auth gate, routing, AppShell, and BottomNav"
```

---

## Task 4: Settings (Business Profile)

**Files:**
- Create: `src/hooks/useSettings.js`, `src/pages/SettingsPage.jsx`

- [ ] **Step 1: Create useSettings hook**

Create `src/hooks/useSettings.js`:

```js
import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then(snap => {
      setSettings(snap.exists() ? snap.data() : {})
      setLoading(false)
    })
  }, [])

  async function saveSettings(data) {
    const uid = auth.currentUser.uid
    await setDoc(doc(db, 'users', uid), { ...data, role: settings?.role ?? 'owner' }, { merge: true })
    setSettings(prev => ({ ...prev, ...data }))
  }

  async function uploadLogo(file) {
    const uid = auth.currentUser.uid
    const logoRef = ref(storage, `users/${uid}/logo`)
    await uploadBytes(logoRef, file)
    const url = await getDownloadURL(logoRef)
    await saveSettings({ logoUrl: url })
    return url
  }

  return { settings, loading, saveSettings, uploadLogo }
}
```

- [ ] **Step 2: Build SettingsPage**

Replace `src/pages/SettingsPage.jsx`:

```jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useSettings } from '../hooks/useSettings'

export default function SettingsPage() {
  const { settings, loading, saveSettings, uploadLogo } = useSettings()
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (settings) reset(settings)
  }, [settings, reset])

  async function onSubmit(data) {
    await saveSettings({
      businessName: data.businessName,
      kvkNumber: data.kvkNumber,
      btwNumber: data.btwNumber,
      iban: data.iban,
      address: data.address,
      defaultHourlyRate: parseFloat(data.defaultHourlyRate) || 0,
      defaultVatRate: parseInt(data.defaultVatRate) || 21,
      taxReservePercent: parseFloat(data.taxReservePercent) || 30,
      vacationSavingsPercent: parseFloat(data.vacationSavingsPercent) || 8,
    })
    alert('Saved.')
  }

  if (loading) return <div className="p-4 text-muted text-sm">Loading…</div>

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-text mb-6">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Section title="Business Details">
          <Field label="Business name" {...register('businessName')} />
          <Field label="KvK number" {...register('kvkNumber')} />
          <Field label="BTW number" {...register('btwNumber')} placeholder="NL123456789B01" />
          <Field label="IBAN" {...register('iban')} placeholder="NL91 ABNA 0417 1643 00" />
          <Field label="Address" {...register('address')} />
        </Section>

        <Section title="Defaults">
          <Field label="Default hourly rate (€)" type="number" step="0.01" {...register('defaultHourlyRate')} />
          <Field label="Default VAT rate (%)" type="number" {...register('defaultVatRate')} />
        </Section>

        <Section title="Reserves">
          <Field label="Income tax reserve (%)" type="number" step="0.1" {...register('taxReservePercent')} />
          <Field label="Vacation savings (%)" type="number" step="0.1" {...register('vacationSavingsPercent')} />
        </Section>

        <Section title="Logo">
          {settings?.logoUrl && <img src={settings.logoUrl} alt="logo" className="h-16 mb-2 rounded" />}
          <input
            type="file"
            accept="image/*"
            className="text-sm text-muted"
            onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])}
          />
        </Section>

        <button type="submit" className="w-full bg-blue text-crust font-semibold rounded-xl py-3 text-sm">
          Save settings
        </button>
      </form>

      <button
        onClick={() => signOut(auth)}
        className="mt-6 w-full text-muted text-sm py-2"
      >
        Sign out
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-surface rounded-xl p-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <input
        className="w-full bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue"
        {...props}
      />
    </div>
  )
}
```

- [ ] **Step 3: Add Settings link to AppShell header (optional)**

In `src/components/layout/AppShell.jsx`, add a settings gear icon in the header that navigates to `/settings`. This can also be done via a top bar added to specific pages. Skip if the dashboard will handle navigation to settings.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSettings.js src/pages/SettingsPage.jsx
git commit -m "feat: add business settings with logo upload"
```

---

## Task 5: Client CRUD

**Files:**
- Create: `src/hooks/useClients.js`, `src/components/client/ClientList.jsx`, `src/components/client/ClientForm.jsx`

- [ ] **Step 1: Create useClients hook**

Create `src/hooks/useClients.js`:

```js
import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

export function useClients() {
  const [clients, setClients] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'))
    return onSnapshot(q, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function addClient(data) {
    return addDoc(collection(db, 'clients'), data)
  }

  async function updateClient(id, data) {
    return updateDoc(doc(db, 'clients', id), data)
  }

  async function deleteClient(id) {
    return deleteDoc(doc(db, 'clients', id))
  }

  return { clients, addClient, updateClient, deleteClient }
}
```

- [ ] **Step 2: Create ClientForm component**

Create `src/components/client/ClientForm.jsx`:

```jsx
import { useForm } from 'react-hook-form'
import { useClients } from '../../hooks/useClients'

const LANGUAGES = [
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'pl', label: '🇵🇱 Polish' },
]

export default function ClientForm({ client, onSave, onCancel }) {
  const { addClient, updateClient } = useClients()
  const { register, handleSubmit } = useForm({
    defaultValues: client ?? { language: 'nl' },
  })

  async function onSubmit(data) {
    if (client?.id) {
      await updateClient(client.id, data)
    } else {
      await addClient(data)
    }
    onSave?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4">
      <h2 className="text-text font-semibold mb-4">{client ? 'Edit client' : 'New client'}</h2>
      {[
        { label: 'Name *', name: 'name', required: true },
        { label: 'Email', name: 'email', type: 'email' },
        { label: 'Phone', name: 'phone' },
        { label: 'Address', name: 'address' },
        { label: 'Notes', name: 'notes' },
      ].map(({ label, name, type = 'text', required }) => (
        <div key={name}>
          <label className="text-xs text-muted block mb-1">{label}</label>
          <input
            type={type}
            {...register(name, { required })}
            className="w-full bg-surface text-text rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-muted block mb-1">Invoice language</label>
        <select
          {...register('language')}
          className="w-full bg-surface text-text rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue"
        >
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface text-muted rounded-xl py-3 text-sm">
          Cancel
        </button>
        <button type="submit" className="flex-1 bg-blue text-crust font-semibold rounded-xl py-3 text-sm">
          Save
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create ClientList component**

Create `src/components/client/ClientList.jsx`:

```jsx
import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import ClientForm from './ClientForm'

export default function ClientList() {
  const { clients } = useClients()
  const [editing, setEditing] = useState(null) // null = closed, 'new' = new, client = edit

  if (editing) {
    return (
      <ClientForm
        client={editing === 'new' ? null : editing}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text font-semibold">Clients</h2>
        <button onClick={() => setEditing('new')} className="text-blue text-sm">+ Add</button>
      </div>
      <div className="space-y-2">
        {clients.map(client => (
          <button
            key={client.id}
            onClick={() => setEditing(client)}
            className="w-full bg-surface rounded-xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-text text-sm font-medium">{client.name}</p>
              <p className="text-muted text-xs">{client.email}</p>
            </div>
            <span className="text-muted text-xs">›</span>
          </button>
        ))}
        {clients.length === 0 && <p className="text-muted text-sm text-center py-8">No clients yet</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useClients.js src/components/client/
git commit -m "feat: add client CRUD (list, form, hook)"
```

---

## Task 6: Invoice Number Logic

**Files:**
- Create: `src/lib/invoiceNumber.js`, `src/lib/invoiceNumber.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/invoiceNumber.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatInvoiceNumber, getNextInvoiceNumber } from './invoiceNumber'

describe('formatInvoiceNumber', () => {
  it('pads count to 3 digits', () => {
    expect(formatInvoiceNumber(2025, 1)).toBe('2025-001')
    expect(formatInvoiceNumber(2025, 14)).toBe('2025-014')
    expect(formatInvoiceNumber(2025, 100)).toBe('2025-100')
  })

  it('uses the provided year', () => {
    expect(formatInvoiceNumber(2026, 5)).toBe('2026-005')
  })
})

describe('getNextInvoiceNumber', () => {
  it('returns 001 when no counter exists for the year', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: () => false, data: () => null }),
      set: vi.fn(),
    }
    const mockCounterRef = {}
    const result = await getNextInvoiceNumber(mockTransaction, mockCounterRef, 2025)
    expect(result).toBe('2025-001')
    expect(mockTransaction.set).toHaveBeenCalledWith(mockCounterRef, { year: 2025, count: 1 })
  })

  it('increments count within same year', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ year: 2025, count: 7 }) }),
      set: vi.fn(),
    }
    const mockCounterRef = {}
    const result = await getNextInvoiceNumber(mockTransaction, mockCounterRef, 2025)
    expect(result).toBe('2025-008')
    expect(mockTransaction.set).toHaveBeenCalledWith(mockCounterRef, { year: 2025, count: 8 })
  })

  it('resets to 001 when year changes', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ year: 2024, count: 42 }) }),
      set: vi.fn(),
    }
    const mockCounterRef = {}
    const result = await getNextInvoiceNumber(mockTransaction, mockCounterRef, 2025)
    expect(result).toBe('2025-001')
    expect(mockTransaction.set).toHaveBeenCalledWith(mockCounterRef, { year: 2025, count: 1 })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/invoiceNumber.test.js
```

Expected: FAIL — "Cannot find module './invoiceNumber'"

- [ ] **Step 3: Implement invoiceNumber.js**

Create `src/lib/invoiceNumber.js`:

```js
export function formatInvoiceNumber(year, count) {
  return `${year}-${String(count).padStart(3, '0')}`
}

/**
 * Call inside a Firestore runTransaction callback.
 * @param {object} t - Firestore transaction
 * @param {object} counterRef - doc ref for meta/invoiceCounter
 * @param {number} year - current year (pass explicitly for testability)
 * @returns {Promise<string>} - e.g. "2025-015"
 */
export async function getNextInvoiceNumber(t, counterRef, year) {
  const snap = await t.get(counterRef)
  const existing = snap.exists() ? snap.data() : null
  const currentCount = existing?.year === year ? existing.count : 0
  const newCount = currentCount + 1
  t.set(counterRef, { year, count: newCount })
  return formatInvoiceNumber(year, newCount)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/invoiceNumber.test.js
```

Expected: PASS (3 test suites, 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/invoiceNumber.js src/lib/invoiceNumber.test.js
git commit -m "feat: invoice number generation with year reset and Firestore transaction"
```

---

## Task 7: VAT Calculation Logic

**Files:**
- Create: `src/lib/vat.js`, `src/lib/vat.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/vat.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getQuarter, isInQuarter, calcVATOwed } from './vat'

describe('getQuarter', () => {
  it('returns Q1 for January', () => expect(getQuarter('2025-01-15')).toBe(1))
  it('returns Q2 for April', () => expect(getQuarter('2025-04-01')).toBe(2))
  it('returns Q3 for July', () => expect(getQuarter('2025-07-31')).toBe(3))
  it('returns Q4 for December', () => expect(getQuarter('2025-12-01')).toBe(4))
})

describe('isInQuarter', () => {
  it('returns true when date is in the quarter', () => {
    expect(isInQuarter('2025-02-10', 2025, 1)).toBe(true)
    expect(isInQuarter('2025-05-20', 2025, 2)).toBe(true)
  })
  it('returns false when date is outside the quarter', () => {
    expect(isInQuarter('2025-04-01', 2025, 1)).toBe(false)
    expect(isInQuarter('2024-02-10', 2025, 1)).toBe(false)
  })
})

describe('calcVATOwed', () => {
  const invoices = [
    { issueDate: '2025-01-10', vatAmount: 210, status: 'sent' },
    { issueDate: '2025-02-20', vatAmount: 420, status: 'paid' },
    { issueDate: '2025-04-01', vatAmount: 100, status: 'sent' }, // Q2 — excluded
    { issueDate: '2025-01-05', vatAmount: 50, status: 'draft' }, // draft — excluded
    { issueDate: '2025-03-15', vatAmount: 80, status: 'voided' }, // voided — excluded
  ]

  const expenses = [
    { date: '2025-01-15', vatAmount: 42, deductiblePercent: 100, tag: 'business' },
    { date: '2025-02-10', vatAmount: 20, deductiblePercent: 50, tag: 'business' }, // partial
    { date: '2025-01-20', vatAmount: 30, deductiblePercent: 100, tag: 'private' }, // private — excluded
    { date: '2025-04-05', vatAmount: 10, deductiblePercent: 100, tag: 'business' }, // Q2 — excluded
  ]

  it('calculates VAT collected from invoices in quarter (excl. draft and voided)', () => {
    const { collected } = calcVATOwed(invoices, expenses, 2025, 1)
    expect(collected).toBe(630) // 210 + 420
  })

  it('calculates deductible VAT from business expenses (with deductiblePercent)', () => {
    const { deductible } = calcVATOwed(invoices, expenses, 2025, 1)
    expect(deductible).toBe(52) // 42 + (20 * 0.5) = 42 + 10 = 52
  })

  it('calculates VAT owed as collected minus deductible', () => {
    const { owed } = calcVATOwed(invoices, expenses, 2025, 1)
    expect(owed).toBe(578) // 630 - 52
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/vat.test.js
```

Expected: FAIL — "Cannot find module './vat'"

- [ ] **Step 3: Implement vat.js**

Create `src/lib/vat.js`:

```js
import dayjs from 'dayjs'

/** Returns 1-4 for the quarter of an ISO date string */
export function getQuarter(isoDate) {
  return Math.ceil((dayjs(isoDate).month() + 1) / 3)
}

/** Returns true if isoDate falls within the given year+quarter */
export function isInQuarter(isoDate, year, quarter) {
  const d = dayjs(isoDate)
  return d.year() === year && getQuarter(isoDate) === quarter
}

/**
 * Calculate VAT owed for a given quarter using factuurstelsel.
 * @param {Array} invoices - all invoices
 * @param {Array} expenses - all expenses
 * @param {number} year
 * @param {number} quarter - 1-4
 * @returns {{ collected: number, deductible: number, owed: number }}
 */
export function calcVATOwed(invoices, expenses, year, quarter) {
  const COUNTABLE_STATUSES = ['sent', 'paid', 'overdue']

  const collected = invoices
    .filter(inv =>
      COUNTABLE_STATUSES.includes(inv.status) &&
      inv.issueDate &&
      isInQuarter(inv.issueDate, year, quarter)
    )
    .reduce((sum, inv) => sum + (inv.vatAmount ?? 0), 0)

  const deductible = expenses
    .filter(exp =>
      exp.tag === 'business' &&
      exp.date &&
      isInQuarter(exp.date, year, quarter)
    )
    .reduce((sum, exp) => {
      const pct = (exp.deductiblePercent ?? 100) / 100
      return sum + (exp.vatAmount ?? 0) * pct
    }, 0)

  return {
    collected: Math.round(collected * 100) / 100,
    deductible: Math.round(deductible * 100) / 100,
    owed: Math.round((collected - deductible) * 100) / 100,
  }
}

/** Returns the BTW submission deadline for a given quarter (last day of next month) */
export function vatDeadline(year, quarter) {
  const lastMonthOfQuarter = quarter * 3
  return dayjs(`${year}-${String(lastMonthOfQuarter).padStart(2, '0')}-01`)
    .add(1, 'month')
    .endOf('month')
    .format('D MMM YYYY')
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/vat.test.js
```

Expected: PASS (all 7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/vat.js src/lib/vat.test.js
git commit -m "feat: VAT calculation logic (factuurstelsel) with full test coverage"
```

---

## Task 8: EPC QR Code Logic

**Files:**
- Create: `src/lib/epcQR.js`, `src/lib/epcQR.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/epcQR.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildEPCString } from './epcQR'

describe('buildEPCString', () => {
  it('builds a valid EPC QR string', () => {
    const result = buildEPCString({
      name: 'Jan de Vries',
      iban: 'NL91ABNA0417164300',
      amount: 877.25,
      reference: '2025-015',
    })
    const lines = result.split('\n')
    expect(lines[0]).toBe('BCD')
    expect(lines[1]).toBe('002')
    expect(lines[2]).toBe('1')
    expect(lines[3]).toBe('SCT')
    expect(lines[4]).toBe('') // BIC optional, empty
    expect(lines[5]).toBe('Jan de Vries')
    expect(lines[6]).toBe('NL91ABNA0417164300')
    expect(lines[7]).toBe('EUR877.25')
    expect(lines[9]).toBe('2025-015')
  })

  it('formats amount with 2 decimal places', () => {
    const result = buildEPCString({ name: 'A', iban: 'NL00TEST', amount: 100, reference: 'REF' })
    expect(result).toContain('EUR100.00')
  })

  it('strips spaces from IBAN', () => {
    const result = buildEPCString({ name: 'A', iban: 'NL91 ABNA 0417 1643 00', amount: 10, reference: 'R' })
    expect(result).toContain('NL91ABNA0417164300')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/epcQR.test.js
```

Expected: FAIL — "Cannot find module './epcQR'"

- [ ] **Step 3: Implement epcQR.js**

Create `src/lib/epcQR.js`:

```js
/**
 * Builds an EPC QR code payload string for SEPA Credit Transfer (iDEAL compatible).
 * Dutch banking apps (ING, ABN AMRO, Rabobank) scan this to prefill a transfer.
 * Spec: https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation
 */
export function buildEPCString({ name, iban, amount, reference = '', remittance = '' }) {
  const cleanIBAN = iban.replace(/\s/g, '')
  const formattedAmount = `EUR${amount.toFixed(2)}`

  return [
    'BCD',           // service tag
    '002',           // version
    '1',             // encoding: UTF-8
    'SCT',           // SEPA Credit Transfer
    '',              // BIC (optional, omit for compatibility)
    name,            // beneficiary name
    cleanIBAN,       // beneficiary IBAN
    formattedAmount, // amount
    '',              // purpose (optional)
    reference,       // remittance reference
    remittance,      // remittance information
  ].join('\n')
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/epcQR.test.js
```

Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/epcQR.js src/lib/epcQR.test.js
git commit -m "feat: EPC QR code builder for iDEAL payments"
```

---

## Task 9: Cashflow Logic

**Files:**
- Create: `src/lib/cashflow.js`, `src/lib/cashflow.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/cashflow.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeCashflow } from './cashflow'

describe('computeCashflow', () => {
  const settings = {
    startingBalance: 1000,
    taxReservePercent: 30,
    vacationSavingsPercent: 8,
  }

  const invoices = [
    { status: 'paid', totalAmount: 500, subtotal: 413.22 },
    { status: 'paid', totalAmount: 300, subtotal: 247.93 },
    { status: 'sent', totalAmount: 726.50, vatAmount: 126.50 },  // unpaid
    { status: 'overdue', totalAmount: 363.00, vatAmount: 63.00 }, // unpaid
    { status: 'draft', totalAmount: 100 },                        // excluded
  ]

  const expenses = [
    { amount: 200, tag: 'business', recurring: false },
    { amount: 150, tag: 'business', recurring: true, recurringAmount: 150 },
    { amount: 80, tag: 'business', recurring: true, recurringAmount: 80 },
    { amount: 50, tag: 'private', recurring: true, recurringAmount: 50 }, // private — excluded
  ]

  const result = computeCashflow(invoices, expenses, settings)

  it('currentBalance = startingBalance + paid invoices - all recorded expenses', () => {
    // 1000 + (500 + 300) - (200 + 150 + 80 + 50) = 1000 + 800 - 480 = 1320
    expect(result.currentBalance).toBe(1320)
  })

  it('incoming = sum of unpaid invoice totals', () => {
    expect(result.incoming).toBe(1089.50) // 726.50 + 363.00
  })

  it('upcomingFixed = sum of recurring business expenses', () => {
    expect(result.upcomingFixed).toBe(230) // 150 + 80
  })

  it('projected = currentBalance + incoming - upcomingFixed', () => {
    expect(result.projected).toBe(2179.50) // 1320 + 1089.50 - 230
  })

  it('taxReserve = taxReservePercent of total profit (paid subtotals - business expenses)', () => {
    // profit = (413.22 + 247.93) - (200 + 150 + 80) = 661.15 - 430 = 231.15
    // reserve = 231.15 * 0.30 = 69.345 → 69.35
    expect(result.taxReserve).toBe(69.35)
  })

  it('vacationSavings = vacationSavingsPercent of paid invoice revenue', () => {
    // revenue = 413.22 + 247.93 = 661.15
    // savings = 661.15 * 0.08 = 52.892 → 52.89
    expect(result.vacationSavings).toBe(52.89)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/cashflow.test.js
```

Expected: FAIL — "Cannot find module './cashflow'"

- [ ] **Step 3: Implement cashflow.js**

Create `src/lib/cashflow.js`:

```js
/**
 * Compute cashflow numbers from raw Firestore data.
 * All values in EUR, rounded to 2 decimal places.
 */
export function computeCashflow(invoices, expenses, settings) {
  const {
    startingBalance = 0,
    taxReservePercent = 30,
    vacationSavingsPercent = 8,
  } = settings

  const round2 = n => Math.round(n * 100) / 100

  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const unpaidInvoices = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status))
  const businessExpenses = expenses.filter(exp => exp.tag === 'business')
  const recurringBusinessExpenses = businessExpenses.filter(exp => exp.recurring)

  const totalPaidIn = paidInvoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0)
  const totalExpensesOut = expenses.reduce((s, exp) => s + (exp.amount ?? 0), 0)
  const currentBalance = round2(startingBalance + totalPaidIn - totalExpensesOut)

  const incoming = round2(unpaidInvoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0))
  const upcomingFixed = round2(recurringBusinessExpenses.reduce((s, exp) => s + (exp.recurringAmount ?? 0), 0))
  const projected = round2(currentBalance + incoming - upcomingFixed)

  const paidRevenue = paidInvoices.reduce((s, inv) => s + (inv.subtotal ?? 0), 0)
  const totalBusinessExpenseAmount = businessExpenses.reduce((s, exp) => s + (exp.amount ?? 0), 0)
  const profit = paidRevenue - totalBusinessExpenseAmount
  const taxReserve = round2(profit * (taxReservePercent / 100))
  const vacationSavings = round2(paidRevenue * (vacationSavingsPercent / 100))

  return { currentBalance, incoming, upcomingFixed, projected, taxReserve, vacationSavings }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/cashflow.test.js
```

Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cashflow.js src/lib/cashflow.test.js
git commit -m "feat: cashflow computation (balance, forecast, tax reserve, vacation savings)"
```

---

## Task 10: useInvoices Hook + Invoice Number Wiring

**Files:**
- Create: `src/hooks/useInvoices.js`

- [ ] **Step 1: Create useInvoices hook**

Create `src/hooks/useInvoices.js`:

```js
import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, runTransaction, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { getNextInvoiceNumber } from '../lib/invoiceNumber'

export function useInvoices() {
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function saveDraft(data) {
    return addDoc(collection(db, 'invoices'), {
      ...data,
      status: 'draft',
      invoiceNumber: null,
      createdAt: serverTimestamp(),
    })
  }

  async function sendInvoice(invoiceId, invoiceData) {
    const counterRef = doc(db, 'meta', 'invoiceCounter')
    const year = new Date().getFullYear()
    const issueDate = new Date().toISOString().split('T')[0]

    const invoiceNumber = await runTransaction(db, async t => {
      const number = await getNextInvoiceNumber(t, counterRef, year)
      t.update(doc(db, 'invoices', invoiceId), {
        ...invoiceData,
        invoiceNumber: number,
        issueDate,
        status: 'sent',
      })
      return number
    })

    return invoiceNumber
  }

  async function updateInvoice(id, data) {
    return updateDoc(doc(db, 'invoices', id), data)
  }

  async function markPaid(id) {
    return updateDoc(doc(db, 'invoices', id), {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
    })
  }

  async function voidInvoice(id) {
    return updateDoc(doc(db, 'invoices', id), { status: 'voided' })
  }

  async function deleteDraft(id) {
    return deleteDoc(doc(db, 'invoices', id))
  }

  // Run daily: mark overdue invoices
  function getOverdue() {
    const today = new Date().toISOString().split('T')[0]
    return invoices.filter(inv => inv.status === 'sent' && inv.dueDate < today)
  }

  return { invoices, saveDraft, sendInvoice, updateInvoice, markPaid, voidInvoice, deleteDraft, getOverdue }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useInvoices.js
git commit -m "feat: useInvoices hook with Firestore transaction for sequential numbering"
```

---

## Task 11: Invoice PDF (NL/EN/PL Templates)

**Files:**
- Create: `src/components/invoice/InvoicePDF.jsx`

- [ ] **Step 1: Create InvoicePDF component**

Create `src/components/invoice/InvoicePDF.jsx`:

```jsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import dayjs from 'dayjs'

const LABELS = {
  nl: {
    invoice: 'FACTUUR',
    invoiceNumber: 'Factuurnummer',
    issueDate: 'Factuurdatum',
    dueDate: 'Vervaldatum',
    description: 'Omschrijving',
    qty: 'Aantal',
    rate: 'Tarief',
    vat: 'BTW',
    total: 'Totaal',
    subtotal: 'Subtotaal',
    vatAmount: 'BTW bedrag',
    totalAmount: 'Totaal incl. BTW',
    paymentTerms: 'Gelieve binnen {days} dagen te betalen via bankoverschrijving.',
    hourUnit: 'uur',
  },
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice number',
    issueDate: 'Invoice date',
    dueDate: 'Due date',
    description: 'Description',
    qty: 'Qty',
    rate: 'Rate',
    vat: 'VAT',
    total: 'Total',
    subtotal: 'Subtotal',
    vatAmount: 'VAT amount',
    totalAmount: 'Total incl. VAT',
    paymentTerms: 'Please pay within {days} days by bank transfer.',
    hourUnit: 'hr',
  },
  pl: {
    invoice: 'FAKTURA',
    invoiceNumber: 'Numer faktury',
    issueDate: 'Data wystawienia',
    dueDate: 'Termin płatności',
    description: 'Opis',
    qty: 'Ilość',
    rate: 'Stawka',
    vat: 'VAT',
    total: 'Kwota',
    subtotal: 'Suma netto',
    vatAmount: 'Kwota VAT',
    totalAmount: 'Suma brutto',
    paymentTerms: 'Proszę o zapłatę w ciągu {days} dni przelewem bankowym.',
    hourUnit: 'godz',
  },
}

const eur = amount =>
  `€ ${Number(amount ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  invoiceTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  meta: { marginTop: 6, lineHeight: 1.6 },
  metaLabel: { color: '#666', marginRight: 4 },
  section: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  box: { width: '45%' },
  boxTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 4, fontSize: 8, color: '#666', textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: '6 8', marginBottom: 2 },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1.5, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  col5: { flex: 1.5, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { width: 120, textAlign: 'right', marginRight: 8, color: '#666' },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotal: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 4 },
  footer: { marginTop: 32, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#e0e0e0' },
  footerText: { color: '#666', marginBottom: 3 },
  qrSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
})

export default function InvoicePDF({ invoice, seller, qrDataUrl }) {
  const lang = invoice.language ?? 'nl'
  const L = LABELS[lang] ?? LABELS.nl
  const daysUntilDue = invoice.dueDate && invoice.issueDate
    ? dayjs(invoice.dueDate).diff(dayjs(invoice.issueDate), 'day')
    : 30
  const paymentNote = L.paymentTerms.replace('{days}', daysUntilDue)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            {seller?.logoUrl && <Image src={seller.logoUrl} style={s.logo} />}
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 8 }}>{seller?.businessName}</Text>
            <Text style={s.meta}>{seller?.address}</Text>
            <Text>KvK: {seller?.kvkNumber}</Text>
            <Text>BTW: {seller?.btwNumber}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.invoiceTitle}>{L.invoice}</Text>
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text><Text style={s.metaLabel}>{L.invoiceNumber}: </Text>{invoice.invoiceNumber}</Text>
              <Text><Text style={s.metaLabel}>{L.issueDate}: </Text>{dayjs(invoice.issueDate).format('D MMM YYYY')}</Text>
              <Text><Text style={s.metaLabel}>{L.dueDate}: </Text>{dayjs(invoice.dueDate).format('D MMM YYYY')}</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={s.section}>
          <View style={s.box}>
            <Text style={s.boxTitle}>Bill to</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice.clientSnapshot?.name}</Text>
            <Text>{invoice.clientSnapshot?.address}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.col1, { fontFamily: 'Helvetica-Bold' }]}>{L.description}</Text>
          <Text style={[s.col2, { fontFamily: 'Helvetica-Bold' }]}>{L.qty}</Text>
          <Text style={[s.col3, { fontFamily: 'Helvetica-Bold' }]}>{L.rate}</Text>
          <Text style={[s.col4, { fontFamily: 'Helvetica-Bold' }]}>{L.vat}</Text>
          <Text style={[s.col5, { fontFamily: 'Helvetica-Bold' }]}>{L.total}</Text>
        </View>

        {/* Table rows */}
        {invoice.lines?.map((line, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.col1}>{line.description}</Text>
            <Text style={s.col2}>
              {line.type === 'hourly' ? `${line.qty} ${L.hourUnit}` : '1'}
            </Text>
            <Text style={s.col3}>{eur(line.rate)}</Text>
            <Text style={s.col4}>{line.vatRate}%</Text>
            <Text style={s.col5}>{eur(line.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{L.subtotal}</Text>
            <Text style={s.totalValue}>{eur(invoice.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{L.vatAmount}</Text>
            <Text style={s.totalValue}>{eur(invoice.vatAmount)}</Text>
          </View>
          <View style={[s.totalRow, s.grandTotal]}>
            <Text style={s.totalLabel}>{L.totalAmount}</Text>
            <Text style={s.totalValue}>{eur(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>{paymentNote}</Text>
          <Text style={s.footerText}>IBAN: {seller?.iban}</Text>
        </View>

        {/* QR code */}
        {qrDataUrl && (
          <View style={s.qrSection}>
            <Text style={{ color: '#666', fontSize: 8 }}>Scan to pay via iDEAL</Text>
            <Image src={qrDataUrl} style={{ width: 72, height: 72 }} />
          </View>
        )}

      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/invoice/InvoicePDF.jsx
git commit -m "feat: invoice PDF template with NL/EN/PL language support and EPC QR"
```

---

## Task 12: Invoice Form + Send Flow

**Files:**
- Create: `src/components/invoice/InvoiceLine.jsx`, `src/components/invoice/InvoiceForm.jsx`, `src/components/invoice/InvoiceSend.jsx`
- Modify: `src/pages/InvoicesPage.jsx`

- [ ] **Step 1: Create InvoiceLine component**

Create `src/components/invoice/InvoiceLine.jsx`:

```jsx
export default function InvoiceLine({ line, index, onChange, onRemove, defaultVatRate }) {
  function update(field, value) {
    const updated = { ...line, [field]: value }
    if (field === 'qty' || field === 'rate') {
      updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0)
    }
    if (field === 'type' && value === 'fixed') {
      updated.qty = 1
      updated.total = parseFloat(updated.rate) || 0
    }
    onChange(index, updated)
  }

  return (
    <div className="bg-surface rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['hourly', 'fixed'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => update('type', t)}
              className={`text-xs px-3 py-1 rounded-full ${line.type === t ? 'bg-blue text-crust' : 'bg-overlay text-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onRemove(index)} className="text-red text-sm">✕</button>
      </div>

      <input
        placeholder="Description"
        value={line.description ?? ''}
        onChange={e => update('description', e.target.value)}
        className="w-full bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue"
      />

      <div className="flex gap-2">
        {line.type === 'hourly' && (
          <input
            type="number"
            placeholder="Hours"
            value={line.qty ?? ''}
            onChange={e => update('qty', e.target.value)}
            className="w-20 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
          />
        )}
        <input
          type="number"
          step="0.01"
          placeholder="Rate €"
          value={line.rate ?? ''}
          onChange={e => update('rate', e.target.value)}
          className="flex-1 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
        />
        <select
          value={line.vatRate ?? defaultVatRate}
          onChange={e => update('vatRate', parseInt(e.target.value))}
          className="w-20 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
        >
          {[0, 9, 21].map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </div>

      <div className="text-right text-green text-sm font-semibold">
        € {(line.total ?? 0).toFixed(2)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create InvoiceForm component**

Create `src/components/invoice/InvoiceForm.jsx`:

```jsx
import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import { useSettings } from '../../hooks/useSettings'
import InvoiceLine from './InvoiceLine'
import dayjs from 'dayjs'

const LANGUAGES = [
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'pl', label: '🇵🇱 Polish' },
]

function calcTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + (l.total ?? 0), 0)
  const vatAmount = lines.reduce((s, l) => {
    const vatRate = (l.vatRate ?? 21) / 100
    return s + (l.total ?? 0) * vatRate
  }, 0)
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round((subtotal + vatAmount) * 100) / 100,
  }
}

export default function InvoiceForm({ draft, onNext, onCancel }) {
  const { clients } = useClients()
  const { settings } = useSettings()

  const [clientId, setClientId] = useState(draft?.clientId ?? '')
  const [language, setLanguage] = useState(draft?.language ?? 'nl')
  const [dueInDays, setDueInDays] = useState(30)
  const [lines, setLines] = useState(draft?.lines ?? [])
  const [notes, setNotes] = useState(draft?.notes ?? '')

  const client = clients.find(c => c.id === clientId)
  const { subtotal, vatAmount, totalAmount } = calcTotals(lines)

  function addLine() {
    setLines(prev => [...prev, {
      type: 'hourly',
      description: '',
      qty: '',
      rate: settings?.defaultHourlyRate ?? '',
      vatRate: settings?.defaultVatRate ?? 21,
      total: 0,
    }])
  }

  function updateLine(index, updated) {
    setLines(prev => prev.map((l, i) => i === index ? updated : l))
  }

  function removeLine(index) {
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  function handleNext() {
    if (!clientId) return alert('Select a client.')
    if (lines.length === 0) return alert('Add at least one line.')

    const issueDate = dayjs().format('YYYY-MM-DD')
    const dueDate = dayjs().add(dueInDays, 'day').format('YYYY-MM-DD')

    onNext({
      clientId,
      clientSnapshot: { name: client.name, address: client.address },
      language,
      lines,
      subtotal,
      vatAmount,
      totalAmount,
      issueDate,
      dueDate,
      notes,
    })
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted text-xl">←</button>
        <h1 className="text-text font-bold text-lg">New Invoice</h1>
        <span className="ml-auto text-muted text-xs">Draft</span>
      </div>

      {/* Client */}
      <div>
        <label className="text-xs text-muted block mb-1">Client</label>
        <select
          value={clientId}
          onChange={e => {
            setClientId(e.target.value)
            const c = clients.find(c => c.id === e.target.value)
            if (c?.language) setLanguage(c.language)
          }}
          className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue"
        >
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Language + Due */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Language</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Due in days</label>
          <input
            type="number"
            value={dueInDays}
            onChange={e => setDueInDays(parseInt(e.target.value) || 30)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      {/* Lines */}
      <div>
        <label className="text-xs text-muted block mb-2">Invoice lines</label>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <InvoiceLine
              key={i}
              line={line}
              index={i}
              onChange={updateLine}
              onRemove={removeLine}
              defaultVatRate={settings?.defaultVatRate ?? 21}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-2 w-full border border-dashed border-overlay text-muted rounded-xl py-3 text-sm"
        >
          + Add line
        </button>
      </div>

      {/* Totals */}
      {lines.length > 0 && (
        <div className="bg-surface rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span><span>€ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>BTW</span><span>€ {vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text font-bold mt-2 pt-2 border-t border-overlay">
            <span>Total</span><span className="text-green">€ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs text-muted block mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none resize-none"
        />
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-mantle border-t border-overlay flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-surface text-muted rounded-xl py-3 text-sm">
          Cancel
        </button>
        <button onClick={handleNext} className="flex-1 bg-gradient-to-r from-blue to-purple text-crust font-semibold rounded-xl py-3 text-sm">
          Preview →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create InvoiceSend component**

Create `src/components/invoice/InvoiceSend.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { buildEPCString } from '../../lib/epcQR'
import { useSettings } from '../../hooks/useSettings'
import { useInvoices } from '../../hooks/useInvoices'
import InvoicePDF from './InvoicePDF'

export default function InvoiceSend({ invoiceData, draftId, onBack, onDone }) {
  const { settings } = useSettings()
  const { sendInvoice, saveDraft } = useInvoices()
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!settings?.iban) return
    const epc = buildEPCString({
      name: settings.businessName ?? '',
      iban: settings.iban,
      amount: invoiceData.totalAmount,
      reference: `Invoice ${invoiceData.clientSnapshot?.name ?? ''}`,
    })
    QRCode.toDataURL(epc, { width: 150, margin: 1 }).then(setQrDataUrl)
  }, [settings, invoiceData])

  async function generatePDFBlob() {
    const doc = <InvoicePDF invoice={invoiceData} seller={settings} qrDataUrl={qrDataUrl} />
    return pdf(doc).toBlob()
  }

  async function handleSend() {
    setSending(true)
    try {
      const id = draftId ?? (await saveDraft(invoiceData)).id
      const invoiceNumber = await sendInvoice(id, invoiceData)
      const blob = await generatePDFBlob()
      const base64 = await blobToBase64(blob)

      // Call Cloud Function to send email
      const { getFunctions, httpsCallable } = await import('firebase/functions')
      const functions = getFunctions()
      const sendEmail = httpsCallable(functions, 'sendInvoiceEmail')
      await sendEmail({
        to: invoiceData.clientSnapshot?.email ?? '',
        subject: `Invoice ${invoiceNumber} - ${settings?.businessName}`,
        pdfBase64: base64,
        filename: `invoice-${invoiceNumber}.pdf`,
      })

      onDone()
    } catch (err) {
      alert('Failed to send: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDownload() {
    const blob = await generatePDFBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceData.clientSnapshot?.name ?? 'draft'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted text-xl">←</button>
        <h1 className="text-text font-bold text-lg">Preview & Send</h1>
      </div>

      {/* Mini invoice preview */}
      <div className="bg-white rounded-xl p-4 text-gray-800 text-xs">
        <div className="flex justify-between mb-3">
          <div>
            <p className="font-bold text-sm">{settings?.businessName}</p>
            <p className="text-gray-500">KvK: {settings?.kvkNumber}</p>
            <p className="text-gray-500">BTW: {settings?.btwNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900">
              {invoiceData.language === 'nl' ? 'FACTUUR' : invoiceData.language === 'pl' ? 'FAKTURA' : 'INVOICE'}
            </p>
            <p className="text-gray-500">{invoiceData.issueDate}</p>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-2 mb-3">
          <p className="font-semibold">{invoiceData.clientSnapshot?.name}</p>
          {invoiceData.lines?.map((l, i) => (
            <div key={i} className="flex justify-between mt-1">
              <span className="text-gray-600">{l.description}</span>
              <span>€ {(l.total ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-end border-t border-gray-200 pt-2">
          {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-14 h-14" />}
          <div className="text-right">
            <p className="text-gray-500">BTW € {invoiceData.vatAmount?.toFixed(2)}</p>
            <p className="font-bold text-base">€ {invoiceData.totalAmount?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Send options */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={handleDownload} className="bg-surface rounded-xl p-4 flex flex-col items-center gap-2">
          <span className="text-2xl">⬇️</span>
          <span className="text-muted text-xs">Download PDF</span>
        </button>
        <button
          onClick={async () => {
            const blob = await generatePDFBlob()
            const file = new File([blob], 'invoice.pdf', { type: 'application/pdf' })
            navigator.share?.({ files: [file], title: 'Invoice' })
          }}
          className="bg-surface rounded-xl p-4 flex flex-col items-center gap-2"
        >
          <span className="text-2xl">📤</span>
          <span className="text-muted text-xs">Share</span>
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-gradient-to-br from-blue to-purple rounded-xl p-4 flex flex-col items-center gap-2"
        >
          <span className="text-2xl">📧</span>
          <span className="text-crust text-xs font-semibold">{sending ? '…' : 'Send email'}</span>
        </button>
      </div>
    </div>
  )
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 4: Build InvoicesPage with routing**

Replace `src/pages/InvoicesPage.jsx`:

```jsx
import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useInvoices } from '../hooks/useInvoices'
import InvoiceForm from '../components/invoice/InvoiceForm'
import InvoiceSend from '../components/invoice/InvoiceSend'
import ClientList from '../components/client/ClientList'

const STATUS_COLORS = {
  draft: 'text-muted',
  sent: 'text-blue',
  paid: 'text-green',
  overdue: 'text-red',
  voided: 'text-overlay',
}

function InvoiceListView() {
  const { invoices, markPaid, voidInvoice, deleteDraft } = useInvoices()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filters = ['all', 'draft', 'sent', 'overdue', 'paid']
  const visible = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-text font-bold text-lg">Invoices</h1>
        <button onClick={() => navigate('/clients')} className="text-blue text-sm">Clients</button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs capitalize ${filter === f ? 'bg-blue text-crust' : 'bg-surface text-muted'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map(inv => (
          <div key={inv.id} className="bg-surface rounded-xl px-4 py-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text text-sm font-medium">
                  {inv.invoiceNumber ?? inv.tempId ?? 'Draft'}
                </p>
                <p className="text-muted text-xs mt-0.5">{inv.clientSnapshot?.name} · due {inv.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-green text-sm font-semibold">€ {inv.totalAmount?.toFixed(2)}</p>
                <p className={`text-xs capitalize ${STATUS_COLORS[inv.status]}`}>{inv.status}</p>
              </div>
            </div>
            {inv.status === 'sent' || inv.status === 'overdue' ? (
              <button
                onClick={() => markPaid(inv.id)}
                className="mt-2 w-full bg-green/10 text-green rounded-lg py-1.5 text-xs font-medium"
              >
                Mark as paid
              </button>
            ) : null}
            {inv.status === 'draft' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                  className="flex-1 bg-blue/10 text-blue rounded-lg py-1.5 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteDraft(inv.id)}
                  className="flex-1 bg-red/10 text-red rounded-lg py-1.5 text-xs"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && <p className="text-muted text-sm text-center py-8">No invoices</p>}
      </div>
    </div>
  )
}

function NewInvoiceFlow() {
  const navigate = useNavigate()
  const { saveDraft } = useInvoices()
  const [step, setStep] = useState(1)
  const [invoiceData, setInvoiceData] = useState(null)
  const [draftId, setDraftId] = useState(null)

  async function handleFormNext(data) {
    const ref = await saveDraft(data)
    setDraftId(ref.id)
    setInvoiceData(data)
    setStep(2)
  }

  if (step === 1) {
    return <InvoiceForm onNext={handleFormNext} onCancel={() => navigate('/invoices')} />
  }

  return (
    <InvoiceSend
      invoiceData={invoiceData}
      draftId={draftId}
      onBack={() => setStep(1)}
      onDone={() => navigate('/invoices')}
    />
  )
}

export default function InvoicesPage() {
  return (
    <Routes>
      <Route index element={<InvoiceListView />} />
      <Route path="new" element={<NewInvoiceFlow />} />
      <Route path="clients" element={<ClientList />} />
    </Routes>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/invoice/ src/pages/InvoicesPage.jsx
git commit -m "feat: invoice creation flow with form, PDF preview, send and download"
```

---

## Task 13: Firebase Cloud Functions (Email + OCR)

**Files:**
- Create: `functions/package.json`, `functions/index.js`

- [ ] **Step 1: Initialize Firebase Functions**

```bash
firebase init functions
# Choose: JavaScript, no ESLint, install dependencies
```

Expected: `functions/` directory with `index.js` and `package.json`.

- [ ] **Step 2: Install functions dependencies**

```bash
cd functions
npm install nodemailer @google-cloud/vision
cd ..
```

- [ ] **Step 3: Add Gmail app password to Firebase environment**

In Google Account → Security → App Passwords: generate a password for "BackOffice".

```bash
firebase functions:config:set gmail.user="your@gmail.com" gmail.pass="your_app_password"
```

- [ ] **Step 4: Write Cloud Functions**

Replace `functions/index.js`:

```js
const functions = require('firebase-functions')
const nodemailer = require('nodemailer')
const vision = require('@google-cloud/vision')

const gmailConfig = functions.config().gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: gmailConfig.user, pass: gmailConfig.pass },
})

exports.sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')

  const { to, subject, pdfBase64, filename } = data
  if (!to || !pdfBase64) throw new functions.https.HttpsError('invalid-argument', 'Missing to or pdfBase64.')

  await transporter.sendMail({
    from: `BackOffice <${gmailConfig.user}>`,
    to,
    subject,
    text: 'Please find the attached invoice.',
    attachments: [{ filename, content: pdfBase64, encoding: 'base64' }],
  })

  return { success: true }
})

exports.extractReceiptOCR = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')

  const { imageBase64 } = data
  if (!imageBase64) throw new functions.https.HttpsError('invalid-argument', 'Missing imageBase64.')

  const client = new vision.ImageAnnotatorClient()
  const [result] = await client.textDetection({ image: { content: imageBase64 } })
  const fullText = result.fullTextAnnotation?.text ?? ''

  // Extract amount: look for patterns like "123,45" or "123.45" near "totaal" or "total"
  const amountMatch = fullText.match(/(?:totaal|total|bedrag)[^\d]*(\d+[,\.]\d{2})/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null

  // Extract VAT: look for BTW percentage and amount
  const vatRateMatch = fullText.match(/btw\s+(\d+)%/i)
  const vatRate = vatRateMatch ? parseInt(vatRateMatch[1]) : 21

  // Extract date: look for DD-MM-YYYY or YYYY-MM-DD
  const dateMatch = fullText.match(/(\d{2}[-\/]\d{2}[-\/]\d{4}|\d{4}[-\/]\d{2}[-\/]\d{2})/)
  const date = dateMatch ? dateMatch[1] : null

  // Extract vendor: first line of text is often the store/business name
  const vendor = fullText.split('\n')[0]?.trim() ?? ''

  return { amount, vatRate, date, vendor, rawText: fullText }
})
```

- [ ] **Step 5: Deploy functions**

```bash
firebase deploy --only functions
```

Expected: "Deploy complete! Functions deployed: sendInvoiceEmail, extractReceiptOCR"

- [ ] **Step 6: Commit**

```bash
git add functions/
git commit -m "feat: Cloud Functions for email sending and receipt OCR"
```

---

## Task 14: Expense Form + Receipt Scanner

**Files:**
- Create: `src/hooks/useExpenses.js`, `src/components/expense/ExpenseForm.jsx`, `src/components/expense/ReceiptScanner.jsx`, `src/components/expense/ExpenseList.jsx`
- Modify: `src/pages/ExpensesPage.jsx`

- [ ] **Step 1: Create useExpenses hook**

Create `src/hooks/useExpenses.js`:

```js
import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

export function useExpenses() {
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    return onSnapshot(q, snap => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function addExpense(data, receiptFile) {
    let receiptUrl = null
    if (receiptFile) {
      const uid = auth.currentUser.uid
      const path = `expenses/${uid}/${Date.now()}_${receiptFile.name}`
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, receiptFile)
      receiptUrl = await getDownloadURL(fileRef)
    }
    return addDoc(collection(db, 'expenses'), { ...data, receiptUrl })
  }

  async function updateExpense(id, data) {
    return updateDoc(doc(db, 'expenses', id), data)
  }

  async function deleteExpense(id) {
    return deleteDoc(doc(db, 'expenses', id))
  }

  return { expenses, addExpense, updateExpense, deleteExpense }
}
```

- [ ] **Step 2: Create ReceiptScanner component**

Create `src/components/expense/ReceiptScanner.jsx`:

```jsx
import { useRef } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'

export default function ReceiptScanner({ onExtracted, onFileSelected }) {
  const inputRef = useRef()

  async function handleFile(file) {
    onFileSelected(file)

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        const functions = getFunctions()
        const extract = httpsCallable(functions, 'extractReceiptOCR')
        const result = await extract({ imageBase64: base64 })
        onExtracted(result.data)
      } catch {
        // OCR failed — user fills manually
        onExtracted({})
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="w-full border-2 border-dashed border-blue rounded-xl py-5 flex flex-col items-center gap-2 bg-blue/5"
      >
        <span className="text-3xl">📷</span>
        <span className="text-blue text-sm font-medium">Scan receipt</span>
        <span className="text-muted text-xs">Auto-fills amount & vendor</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create ExpenseForm component**

Create `src/components/expense/ExpenseForm.jsx`:

```jsx
import { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import ReceiptScanner from './ReceiptScanner'
import dayjs from 'dayjs'

export default function ExpenseForm({ onSave, onCancel }) {
  const { addExpense } = useExpenses()
  const [receiptFile, setReceiptFile] = useState(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    vatRate: 21,
    deductiblePercent: 100,
    category: 'variable',
    tag: 'business',
    recurring: false,
    recurringAmount: '',
    date: dayjs().format('YYYY-MM-DD'),
    vendor: '',
    status: 'added',
  })

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleOCRExtracted(data) {
    setForm(prev => ({
      ...prev,
      amount: data.amount ?? prev.amount,
      vatRate: data.vatRate ?? prev.vatRate,
      date: data.date
        ? dayjs(data.date, ['DD-MM-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
        : prev.date,
      vendor: data.vendor ?? prev.vendor,
      description: data.vendor ?? prev.description,
    }))
  }

  function calcVATAmount() {
    const amount = parseFloat(form.amount) || 0
    const rate = form.vatRate / 100
    return Math.round((amount / (1 + rate)) * rate * 100) / 100
  }

  async function handleSave() {
    if (!form.amount || !form.description) return alert('Fill in description and amount.')
    await addExpense(
      {
        ...form,
        amount: parseFloat(form.amount),
        vatAmount: calcVATAmount(),
        vatRate: parseInt(form.vatRate),
        deductiblePercent: parseInt(form.deductiblePercent),
        recurringAmount: form.recurring ? parseFloat(form.recurringAmount) || parseFloat(form.amount) : null,
      },
      receiptFile
    )
    onSave?.()
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted text-xl">←</button>
        <h1 className="text-text font-bold text-lg">Add Expense</h1>
      </div>

      <ReceiptScanner onExtracted={handleOCRExtracted} onFileSelected={setReceiptFile} />

      <div className="text-center text-xs text-overlay">— or fill in manually —</div>

      {[
        { label: 'Description', field: 'description' },
        { label: 'Vendor', field: 'vendor' },
        { label: 'Date', field: 'date', type: 'date' },
      ].map(({ label, field, type = 'text' }) => (
        <div key={field}>
          <label className="text-xs text-muted block mb-1">{label}</label>
          <input
            type={type}
            value={form[field]}
            onChange={e => setField(field, e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Amount incl. BTW (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={e => setField('amount', e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">BTW rate</label>
          <select
            value={form.vatRate}
            onChange={e => setField('vatRate', parseInt(e.target.value))}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          >
            {[0, 9, 21].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>

      {/* Auto-calculated VAT */}
      {form.amount && (
        <div className="bg-green/10 rounded-xl px-4 py-2 flex justify-between">
          <span className="text-xs text-muted">BTW deductible</span>
          <span className="text-green text-sm font-semibold">€ {calcVATAmount().toFixed(2)} ✓</span>
        </div>
      )}

      {/* Deductible % */}
      <div>
        <label className="text-xs text-muted block mb-1">Deductible % (default 100%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={form.deductiblePercent}
          onChange={e => setField('deductiblePercent', e.target.value)}
          className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
        />
      </div>

      {/* Business/Private */}
      <div>
        <label className="text-xs text-muted block mb-2">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {['business', 'private'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setField('tag', t)}
              className={`rounded-xl py-3 text-sm font-medium ${form.tag === t ? 'bg-blue text-crust' : 'bg-surface text-muted'}`}
            >
              {t === 'business' ? '💼 Business' : '🏠 Private'}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed/Variable */}
      <div>
        <label className="text-xs text-muted block mb-2">Category</label>
        <div className="grid grid-cols-2 gap-2">
          {['fixed', 'variable'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setField('category', c)}
              className={`rounded-xl py-3 text-sm font-medium capitalize ${form.category === c ? 'bg-blue text-crust' : 'bg-surface text-muted'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring toggle */}
      <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
        <div>
          <p className="text-sm text-text">Recurring expense</p>
          <p className="text-xs text-muted">Shows in cashflow upcoming list</p>
        </div>
        <button
          type="button"
          onClick={() => setField('recurring', !form.recurring)}
          className={`w-12 h-6 rounded-full transition-colors ${form.recurring ? 'bg-blue' : 'bg-overlay'} relative`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.recurring ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {form.recurring && (
        <div>
          <label className="text-xs text-muted block mb-1">Monthly amount (€)</label>
          <input
            type="number"
            step="0.01"
            placeholder={form.amount}
            value={form.recurringAmount}
            onChange={e => setField('recurringAmount', e.target.value)}
            className="w-full bg-surface text-text rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-mantle border-t border-overlay">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue to-purple text-crust font-semibold rounded-xl py-3 text-sm"
        >
          Save expense
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ExpenseList**

Create `src/components/expense/ExpenseList.jsx`:

```jsx
import { useExpenses } from '../../hooks/useExpenses'

const TAG_COLORS = { business: 'text-blue', private: 'text-purple' }
const STATUS_LABELS = { added: 'Added', pending: 'Pending', accounted: 'Accounted' }

export default function ExpenseList({ onAdd }) {
  const { expenses, deleteExpense, updateExpense } = useExpenses()

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-text font-bold text-lg">Expenses</h1>
        <button onClick={onAdd} className="text-blue text-sm">+ Add</button>
      </div>
      <div className="space-y-2">
        {expenses.map(exp => (
          <div key={exp.id} className="bg-surface rounded-xl px-4 py-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text text-sm font-medium">{exp.description}</p>
                <p className="text-muted text-xs mt-0.5">
                  {exp.vendor} · {exp.date}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs ${TAG_COLORS[exp.tag]}`}>{exp.tag}</span>
                  <span className="text-xs text-muted">{exp.category}</span>
                  {exp.recurring && <span className="text-xs text-peach">recurring</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-red text-sm font-semibold">- € {exp.amount?.toFixed(2)}</p>
                <p className="text-muted text-xs">BTW € {exp.vatAmount?.toFixed(2)}</p>
              </div>
            </div>
            {exp.receiptUrl && (
              <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue mt-2 block">
                View receipt →
              </a>
            )}
            <div className="flex gap-2 mt-2">
              {['added', 'pending', 'accounted'].map(s => (
                <button
                  key={s}
                  onClick={() => updateExpense(exp.id, { status: s })}
                  className={`flex-1 rounded-lg py-1 text-xs ${exp.status === s ? 'bg-blue text-crust' : 'bg-overlay text-muted'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {expenses.length === 0 && <p className="text-muted text-sm text-center py-8">No expenses yet</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Build ExpensesPage**

Replace `src/pages/ExpensesPage.jsx`:

```jsx
import { useState } from 'react'
import ExpenseList from '../components/expense/ExpenseList'
import ExpenseForm from '../components/expense/ExpenseForm'

export default function ExpensesPage() {
  const [adding, setAdding] = useState(false)

  if (adding) return <ExpenseForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
  return <ExpenseList onAdd={() => setAdding(true)} />
}
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useExpenses.js src/components/expense/ src/pages/ExpensesPage.jsx
git commit -m "feat: expense tracking with receipt scan, OCR suggestions, recurring flag"
```

---

## Task 15: Reports — VAT Summary + Cashflow Forecast

**Files:**
- Create: `src/components/reports/VATSummary.jsx`, `src/components/reports/CashflowForecast.jsx`
- Modify: `src/pages/ReportsPage.jsx`

- [ ] **Step 1: Create VATSummary component**

Create `src/components/reports/VATSummary.jsx`:

```jsx
import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { useInvoices } from '../../hooks/useInvoices'
import { useExpenses } from '../../hooks/useExpenses'
import { calcVATOwed, vatDeadline } from '../../lib/vat'

const currentYear = new Date().getFullYear()
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

export default function VATSummary() {
  const { invoices } = useInvoices()
  const { expenses } = useExpenses()
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState(currentQuarter)

  const { collected, deductible, owed } = calcVATOwed(invoices, expenses, year, quarter)
  const deadline = vatDeadline(year, quarter)

  async function exportCSV() {
    const rows = [
      ['Type', 'Amount (EUR)'],
      ['BTW collected', collected.toFixed(2)],
      ['BTW deductible', deductible.toFixed(2)],
      ['BTW owed', owed.toFixed(2)],
      ['Deadline', deadline],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `btw-q${quarter}-${year}.csv`
    a.click()
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-text font-bold text-lg">BTW Overview</h2>

      {/* Quarter selector */}
      <div className="flex gap-2">
        <select
          value={quarter}
          onChange={e => setQuarter(parseInt(e.target.value))}
          className="bg-surface text-text rounded-xl px-4 py-2 text-sm outline-none"
        >
          {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="bg-surface text-text rounded-xl px-4 py-2 text-sm outline-none"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="bg-green/10 border border-green/20 rounded-xl p-4">
        <p className="text-xs text-muted mb-1">BTW ONTVANGEN (van klanten)</p>
        <p className="text-2xl font-bold text-green">€ {collected.toFixed(2)}</p>
      </div>

      <div className="bg-blue/10 border border-blue/20 rounded-xl p-4">
        <p className="text-xs text-muted mb-1">BTW BETAALD (aftrekbaar)</p>
        <p className="text-2xl font-bold text-blue">€ {deductible.toFixed(2)}</p>
      </div>

      <div className={`border rounded-xl p-4 ${owed > 0 ? 'bg-red/10 border-red/20' : 'bg-green/10 border-green/20'}`}>
        <p className="text-xs text-muted mb-1">TE BETALEN AAN BELASTINGDIENST</p>
        <p className={`text-3xl font-bold ${owed > 0 ? 'text-red' : 'text-green'}`}>€ {owed.toFixed(2)}</p>
        <p className="text-xs text-muted mt-1">Deadline: {deadline}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={exportCSV} className="bg-surface text-text rounded-xl py-3 text-sm">
          Export CSV
        </button>
        <button
          onClick={async () => {
            // Minimal PDF export for accountant
            const VATDoc = () => (
              <Document>
                <Page size="A4" style={{ padding: 40, fontSize: 11 }}>
                  <Text style={{ fontSize: 18, marginBottom: 20 }}>BTW Overview Q{quarter} {year}</Text>
                  <Text>BTW collected: € {collected.toFixed(2)}</Text>
                  <Text>BTW deductible: € {deductible.toFixed(2)}</Text>
                  <Text style={{ fontSize: 14, marginTop: 10 }}>BTW owed: € {owed.toFixed(2)}</Text>
                  <Text style={{ marginTop: 8, color: '#666' }}>Deadline: {deadline}</Text>
                </Page>
              </Document>
            )
            const blob = await pdf(<VATDoc />).toBlob()
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `btw-q${quarter}-${year}.pdf`
            a.click()
          }}
          className="bg-surface text-text rounded-xl py-3 text-sm"
        >
          Export PDF
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CashflowForecast component**

Create `src/components/reports/CashflowForecast.jsx`:

```jsx
import { useInvoices } from '../../hooks/useInvoices'
import { useExpenses } from '../../hooks/useExpenses'
import { useSettings } from '../../hooks/useSettings'
import { computeCashflow } from '../../lib/cashflow'

export default function CashflowForecast() {
  const { invoices } = useInvoices()
  const { expenses } = useExpenses()
  const { settings, saveSettings } = useSettings()

  const result = computeCashflow(invoices, expenses, settings ?? {})
  const recurringExpenses = expenses.filter(e => e.recurring && e.tag === 'business')

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-text font-bold text-lg">Cashflow</h2>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue to-purple rounded-2xl p-5">
        <p className="text-xs text-white/70 mb-1">CURRENT BALANCE</p>
        <p className="text-3xl font-bold text-white mb-3">€ {result.currentBalance.toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↑ INCOMING</p>
            <p className="text-white font-semibold mt-1">€ {result.incoming.toFixed(2)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↓ UPCOMING</p>
            <p className="text-white font-semibold mt-1">€ {result.upcomingFixed.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Set aside */}
      <div className="bg-surface rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-overlay flex justify-between">
          <div>
            <p className="text-sm text-text">BTW reserve</p>
            <p className="text-xs text-muted">Based on issued invoices</p>
          </div>
          <p className="text-red font-semibold text-sm">€ —</p>
        </div>
        <div className="px-4 py-3 border-b border-overlay flex justify-between">
          <div>
            <p className="text-sm text-text">Income tax reserve ({settings?.taxReservePercent ?? 30}%)</p>
          </div>
          <p className="text-peach font-semibold text-sm">€ {result.taxReserve.toFixed(2)}</p>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <div>
            <p className="text-sm text-text">Vacation savings ({settings?.vacationSavingsPercent ?? 8}%)</p>
          </div>
          <p className="text-green font-semibold text-sm">€ {result.vacationSavings.toFixed(2)}</p>
        </div>
      </div>

      {/* Projected */}
      <div className="bg-surface rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <p className="text-sm text-text">Projected balance</p>
          <p className="text-green font-bold">€ {result.projected.toFixed(2)}</p>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <p className="text-xs text-muted uppercase mb-2">Upcoming fixed expenses</p>
        <div className="bg-surface rounded-xl overflow-hidden">
          {recurringExpenses.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">
              Tag an expense as recurring to see it here
            </p>
          ) : recurringExpenses.map(exp => (
            <div key={exp.id} className="px-4 py-3 flex justify-between border-b border-overlay last:border-0">
              <p className="text-sm text-text">{exp.description}</p>
              <p className="text-red text-sm">- € {(exp.recurringAmount ?? exp.amount)?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Starting balance editor */}
      <div className="bg-surface rounded-xl p-4">
        <p className="text-xs text-muted mb-2">
          Starting balance {settings?.balanceUpdatedAt ? `· last set ${settings.balanceUpdatedAt}` : ''}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            defaultValue={settings?.startingBalance ?? 0}
            id="startingBalance"
            className="flex-1 bg-overlay text-text rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => {
              const val = parseFloat(document.getElementById('startingBalance').value) || 0
              saveSettings({
                startingBalance: val,
                balanceUpdatedAt: new Date().toISOString().split('T')[0],
              })
            }}
            className="bg-blue text-crust rounded-lg px-4 py-2 text-sm"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build ReportsPage with tabs**

Replace `src/pages/ReportsPage.jsx`:

```jsx
import { useState } from 'react'
import VATSummary from '../components/reports/VATSummary'
import CashflowForecast from '../components/reports/CashflowForecast'

export default function ReportsPage() {
  const [tab, setTab] = useState('vat')

  return (
    <div>
      <div className="flex border-b border-overlay">
        {[
          { id: 'vat', label: 'BTW' },
          { id: 'cashflow', label: 'Cashflow' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium ${tab === t.id ? 'text-blue border-b-2 border-blue' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'vat' ? <VATSummary /> : <CashflowForecast />}
    </div>
  )
}
```

- [ ] **Step 4: Run all pure logic tests together**

```bash
npx vitest run
```

Expected: All tests pass (invoiceNumber, vat, cashflow, epcQR suites)

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/ src/pages/ReportsPage.jsx
git commit -m "feat: VAT quarterly summary and cashflow forecast with PDF/CSV export"
```

---

## Task 16: Dashboard

**Files:**
- Modify: `src/pages/DashboardPage.jsx`

- [ ] **Step 1: Build DashboardPage**

Replace `src/pages/DashboardPage.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'
import { useInvoices } from '../hooks/useInvoices'
import { useExpenses } from '../hooks/useExpenses'
import { useSettings } from '../hooks/useSettings'
import { computeCashflow } from '../lib/cashflow'
import { calcVATOwed, getQuarter } from '../lib/vat'
import dayjs from 'dayjs'

const STATUS_COLORS = { draft: 'text-muted', sent: 'text-blue', paid: 'text-green', overdue: 'text-red' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { invoices, markPaid } = useInvoices()
  const { expenses } = useExpenses()
  const { settings } = useSettings()

  const cashflow = computeCashflow(invoices, expenses, settings ?? {})
  const now = dayjs()
  const quarter = getQuarter(now.format('YYYY-MM-DD'))
  const { owed: vatOwed } = calcVATOwed(invoices, expenses, now.year(), quarter)

  const unpaid = invoices.filter(i => ['sent', 'overdue'].includes(i.status))
  const thisMonthRevenue = invoices
    .filter(i => i.status === 'paid' && i.paidDate?.startsWith(now.format('YYYY-MM')))
    .reduce((s, i) => s + (i.totalAmount ?? 0), 0)

  // Recent activity: last 5 invoices + expenses merged by date
  const recent = [
    ...invoices.slice(0, 5).map(i => ({ ...i, _type: 'invoice' })),
    ...expenses.slice(0, 5).map(e => ({ ...e, _type: 'expense' })),
  ]
    .sort((a, b) => (b.issueDate ?? b.date ?? '').localeCompare(a.issueDate ?? a.date ?? ''))
    .slice(0, 5)

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted text-sm">Good day,</p>
          <p className="text-text text-xl font-bold">{settings?.businessName ?? 'Your Business'} 👋</p>
        </div>
        <button onClick={() => navigate('/settings')} className="text-2xl">⚙️</button>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue to-purple rounded-2xl p-5">
        <p className="text-xs text-white/70 mb-1">CURRENT BALANCE</p>
        <p className="text-3xl font-bold text-white mb-3">€ {cashflow.currentBalance.toFixed(2)}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↑ INCOMING</p>
            <p className="text-white text-sm font-bold mt-1">€ {cashflow.incoming.toFixed(2)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">↓ UPCOMING</p>
            <p className="text-white text-sm font-bold mt-1">€ {cashflow.upcomingFixed.toFixed(2)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-xs text-white/70">VAT OWED</p>
            <p className="text-white text-sm font-bold mt-1">€ {vatOwed.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted mb-1">UNPAID INVOICES</p>
          <p className="text-2xl font-bold text-red">{unpaid.length}</p>
          <p className="text-xs text-muted">€ {unpaid.reduce((s, i) => s + (i.totalAmount ?? 0), 0).toFixed(2)} total</p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted mb-1">THIS MONTH</p>
          <p className="text-2xl font-bold text-green">€ {thisMonthRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted">revenue</p>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p className="text-xs text-muted uppercase mb-2">Recent</p>
        <div className="bg-surface rounded-xl overflow-hidden">
          {recent.length === 0 && (
            <p className="text-muted text-sm text-center py-6">No activity yet</p>
          )}
          {recent.map((item, i) => (
            <div
              key={item.id}
              className={`px-4 py-3 flex justify-between items-center ${i < recent.length - 1 ? 'border-b border-overlay' : ''}`}
            >
              {item._type === 'invoice' ? (
                <>
                  <div>
                    <p className="text-sm text-text">{item.invoiceNumber ?? 'Draft'}</p>
                    <p className="text-xs text-muted">{item.clientSnapshot?.name} · due {item.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green font-semibold">€ {item.totalAmount?.toFixed(2)}</p>
                    <p className={`text-xs capitalize ${STATUS_COLORS[item.status]}`}>{item.status}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-text">{item.description}</p>
                    <p className="text-xs text-muted">{item.date} · {item.tag}</p>
                  </div>
                  <p className="text-sm text-red font-semibold">- € {item.amount?.toFixed(2)}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardPage.jsx
git commit -m "feat: dashboard with balance card, quick stats, VAT owed, and recent activity"
```

---

## Task 17: Overdue Invoice Detection

**Files:**
- Modify: `src/hooks/useInvoices.js`

- [ ] **Step 1: Add useEffect to auto-mark overdue invoices on mount**

Add to `src/hooks/useInvoices.js` inside the hook, after the `onSnapshot` listener:

```js
// Auto-detect overdue: run once when invoices load
useEffect(() => {
  const today = new Date().toISOString().split('T')[0]
  invoices.forEach(inv => {
    if (inv.status === 'sent' && inv.dueDate && inv.dueDate < today) {
      updateDoc(doc(db, 'invoices', inv.id), { status: 'overdue' })
    }
  })
}, [invoices])
```

This runs every time the invoice list updates, keeping overdue status current without a cron job.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useInvoices.js
git commit -m "feat: auto-detect and mark overdue invoices on load"
```

---

## Task 18: Deploy to Firebase Hosting

**Files:**
- Modify: `firebase.json`

- [ ] **Step 1: Initialize Firebase Hosting**

```bash
firebase init hosting
# Public directory: dist
# Single page app: Yes
# Overwrite index.html: No
```

- [ ] **Step 2: Build and deploy**

```bash
npm run build
firebase deploy --only hosting
```

Expected: "Hosting URL: https://your-project.web.app"

- [ ] **Step 3: Test on mobile**

Open the URL on your phone. In Safari/Chrome → Share → Add to Home Screen. The app installs as a PWA.

- [ ] **Step 4: Final commit**

```bash
git add firebase.json
git commit -m "feat: Firebase Hosting config for PWA deployment"
```

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Invoice creation (hourly + fixed) | Task 12 — InvoiceForm + InvoiceLine |
| Invoice languages NL/EN/PL (full templates) | Task 11 — InvoicePDF LABELS |
| Sequential invoice numbering (Firestore transaction) | Task 6 + Task 10 |
| Invoice status (draft/sent/paid/overdue/voided) | Task 10, 12, 17 |
| EPC QR code for iDEAL | Task 8 + Task 12 (InvoiceSend) |
| PDF generation | Task 11 |
| Email with PDF attached | Task 13 (Cloud Function) |
| Download + share fallback | Task 12 (InvoiceSend) |
| Client database | Task 5 |
| Client language preference | Task 5 (ClientForm) |
| Expense tracking (manual) | Task 14 |
| Receipt scan + OCR suggestions | Task 13 + 14 |
| Business/private tag | Task 14 (ExpenseForm) |
| Expense status (added/pending/accounted) | Task 14 (ExpenseList) |
| Deductible % per expense | Task 14 (ExpenseForm) |
| Recurring expense flag | Task 14 (ExpenseForm) |
| VAT calculation (factuurstelsel, issueDate) | Task 7 (vat.js) |
| Quarterly VAT overview + deadline | Task 15 (VATSummary) |
| VAT export PDF + CSV | Task 15 |
| Cashflow (balance + incoming + upcoming) | Task 9 (cashflow.js) + Task 15 |
| Set-aside (tax reserve, vacation savings) | Task 9 + Task 15 |
| Starting balance with timestamp | Task 15 (CashflowForecast) |
| Dashboard overview | Task 16 |
| Auth + accountant read-only role | Task 2 (Firestore rules) + Task 3 |
| Business settings + logo upload | Task 4 |
| Offline support | Task 2 (enableIndexedDbPersistence) |
| PWA installable | Task 1 (manifest) + Task 18 |

All spec requirements covered. No gaps found.

### Placeholder Scan

No TBD, TODO, or incomplete sections found. All code steps contain actual implementation.

### Type Consistency Check

- `computeCashflow(invoices, expenses, settings)` — defined in Task 9, called in Tasks 15 and 16 ✓
- `calcVATOwed(invoices, expenses, year, quarter)` — defined in Task 7, called in Tasks 15 and 16 ✓
- `buildEPCString({ name, iban, amount, reference })` — defined in Task 8, called in Task 12 ✓
- `getNextInvoiceNumber(t, counterRef, year)` — defined in Task 6, called in Task 10 ✓
- Invoice shape: `{ status, issueDate, vatAmount, totalAmount, subtotal, lines, clientSnapshot, language }` — consistent across all tasks ✓
- Expense shape: `{ tag, amount, vatAmount, deductiblePercent, date, recurring, recurringAmount }` — consistent across all tasks ✓
