# PrintFlow

QR-based file sharing for print shops. A customer scans a shop's QR code, uploads documents from their phone (no account), and the shop owner downloads, prints and tracks the order from their dashboard.

**This build is frontend only.** There is no backend and no API. All data is kept in the browser as a mock database, so the app can be tested end to end and later connected to Supabase.

## Run locally

Requires **Node.js 20.19+**.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build` (typecheck + production build into `dist/`), `npm run preview` (serve the build), `npm run lint` (typecheck).

## Demo accounts

Created automatically the first time the app opens in a browser (see `src/services/seed.ts`). They are test values for this local demo only.

| Role | Sign in at | Username | Password |
| --- | --- | --- | --- |
| Super Admin | `/admin/login` | `superadmin` | `Admin1234` |
| Shop owner (Demo Print Shop) | `/shop/login` | `demoshop` | `Shop1234` |

Customer upload page for the demo shop: `/s/demoprint1`. Shops created by the Super Admin get a temporary password that must be changed at first sign-in.

To start again from scratch: sign in as Super Admin → **Account → Reset demo data**.

## Roles

| Role | What they can do |
| --- | --- |
| **Super Admin** | Create, edit, activate/deactivate and delete shops; generate and reset shop-owner credentials; platform stats and activity log |
| **Shop owner** | Only their own shop: orders and files, order status, payment, prices, QR code, shop details, own password |
| **Customer** | Scan the shop QR (`/s/<token>`), upload files and track an order with its tracking code. No login. |

## How data is stored

| What | Where |
| --- | --- |
| Shops, users, sessions, prices, orders, order history, activity log | `localStorage` key `printflow:db` (one JSON document with a table per entity) |
| Uploaded file contents (PDF, Word, images) | IndexedDB database `printflow-files` (Blobs, keyed by file id) |
| Who is signed in on this browser | `localStorage` key `printflow:session` |

Data survives a page refresh and is shared between tabs of the same browser (changes in one tab show up in the others).

**Limits of a browser-only demo**

- Data exists only in the browser where it was created. A phone scanning the QR code opens the shop's link in *its own* browser, which does not have the shop's data. To test the customer flow, open the upload link (or use **Scan a shop QR code** on the home page) in the same browser as the shop dashboard.
- Passwords are hashed (PBKDF2), and every service checks the signed-in role, but anyone with access to the browser can read or change its storage. Real security needs a backend (e.g. Supabase Auth + Row Level Security).
- Printing uses the browser's print dialog (selected files are merged into one PDF in the browser). One-click "direct to printer" printing needs a program on the shop PC and is not part of this build.

## QR codes

- **Generate:** Shop owner → **QR code** creates the QR image in the browser (`qrcode`), with print and PNG download.
- **Scan:** Home page → **Scan a shop QR code** decodes with the camera or from a photo/screenshot of the code (`jsqr`), then opens the shop's upload page.

## Project structure

```
src/
  services/            Data layer — the only code that touches storage
    index.ts           Public entry: authService, adminService, shopService, publicService
    authService.ts     Sign in/out, current user, change password
    adminService.ts    Super Admin: shops, owner accounts, stats, activity
    shopService.ts     Shop owner: profile, orders, files, prices, QR, print bundle
    publicService.ts   Customer: shop page, create order (with files), tracking
    session.ts         Sessions and role checks
    seed.ts            Demo data and reset
    validate.ts        Input validation
    crypto.ts          Ids, codes, password hashing (Web Crypto)
    fileInspect.ts     File type checks and page counting
    mappers.ts         Row → UI type conversion
    storage/
      localDb.ts       localStorage mock database
      fileStore.ts     IndexedDB file storage
  shared/              Types and the price calculator
  lib/                 Router, auth context, useQuery hook, formatting
  components/          UI kit, layout, toasts, QR scanner
  pages/               public/, auth/, admin/, shop/
docs/                  Original product spec
```

## Moving to Supabase later

Pages and components never touch storage directly; they call the functions exported from `src/services`. To switch:

1. Create tables matching the row types in `src/services/storage/localDb.ts` and a Storage bucket for files.
2. Re-implement each service module with the Supabase client, keeping the same function names and return types (throw `ServiceError` for errors).
3. Replace `session.ts` with Supabase Auth and enforce shop ownership with Row Level Security.

No page or component should need to change.
