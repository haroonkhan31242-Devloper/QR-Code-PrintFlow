# PrintFlow

QR-based file sharing for print shops. A customer scans a shop's QR code, uploads documents from their phone (no account), and the shop owner downloads, prints and tracks the order from their dashboard.

## Roles

| Role | How they get in | What they can do |
| --- | --- | --- |
| **Super Admin** | `/admin/login` | Create, edit, activate/deactivate and delete shops; generate and reset shop-owner credentials; platform stats and activity log |
| **Shop owner** | `/shop/login`, using credentials from the Super Admin | Only their own shop: incoming orders and files, order status, payment, prices, QR code, shop details, own password |
| **Customer** | Scans the shop QR (`/s/<token>`) | Upload files and track an order with a tracking code. No login. |

All permissions are enforced on the server. A shop owner's shop id always comes from their session, never from the URL or request body.

## Run locally

Requires **Node.js 22.13+** (uses the built-in `node:sqlite`).

```bash
npm install
cp .env.example .env     # then set SUPER_ADMIN_USERNAME / SUPER_ADMIN_PASSWORD
npm run dev              # http://localhost:3000
```

On first start the Super Admin account is created from `.env`. The password is temporary: you must choose a new one at first sign-in. If the variables are missing in development, a random password is printed to the console instead.

**Locked out of Super Admin?** Put the password you want in `SUPER_ADMIN_PASSWORD` in `.env`, then run `npm run reset-admin`. Sign in at `/admin/login` (not the shop page).

Data is stored in `./data` (SQLite database + uploaded files). Delete that folder to start fresh.

## Production

```bash
npm run build
npm start                # serves dist/ and the API, with secure cookies and a CSP
```

Run behind HTTPS. Set `TRUST_PROXY=1` when behind a reverse proxy, and back up the `data/` folder.

## Printing

Open an order → select files (all are selected by default) → **Print**. The original uploads are never changed; PDFs and images are merged into one print-ready PDF (images fitted to the order's paper size). Word files can't be printed from the browser: download them and print from Word.

There are two ways to print:

1. **Print dialog** (no setup). Opens the browser's print dialog for the merged PDF, where you choose the printer, copies and duplex.
2. **Direct to printer** (one click, no dialog). Run the print agent on the PC that is connected to the printer:
   - Dashboard → **Settings → Direct printing → Connect a print agent** and copy the command.
   - On that PC, inside this project folder (`npm install` once), run:
     ```bash
     npm run print-agent -- --server http://YOUR-SERVER:3000 --token pfa_...
     ```
   - Keep the window open. The dashboard then shows the PC's printers; pick one, set copies/sides/colour, and press **Print now**. Job status (waiting, printing, printed, failed with reason) shows on the order.
   - Windows prints through the bundled SumatraPDF; macOS/Linux use `lp`. Add `--dry-run` to save PDFs instead of printing.

Only one agent per shop. "Create a new token" disconnects the old agent. A shop's agent can only see that shop's jobs.

## Tests

```bash
npm run build && npm run test:api
```

Starts a throwaway server with its own temp data folder and checks 56 cases: logins per role, forced password change, shop isolation (other shops' orders/files by id), file-type validation, price calculation, QR replacement, deactivation and password reset.

## Project layout

```
server/          Express API: auth, sessions, admin/shop/public routes, uploads, SQLite schema
shared/          Types and price calculation used by both server and client
src/             React app
  components/    UI kit, dashboard layout, toasts
  pages/public   Landing, customer upload, order tracking
  pages/auth     Login, forced password change, account
  pages/admin    Super Admin
  pages/shop     Shop owner
scripts/         API test
_legacy/         Previous localStorage-only prototype, kept for reference (not built)
docs/            Original frontend spec
```

## Security notes

- Passwords hashed with scrypt; sessions are random tokens stored hashed, in an HttpOnly SameSite cookie.
- Each role can only sign in on its own login page. Login is rate-limited.
- Shop deactivation, password reset and password change revoke sessions immediately.
- State-changing requests need a custom header (CSRF protection).
- Uploads: extension allow-list **and** file-signature check, 25 MB per file, 10 files, random stored names outside the web root. Files are only served to the owning shop.
- Shops can delete a finished order's files to protect customer privacy.
