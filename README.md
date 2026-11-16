# usetenth web

The web app for **usetenth**, built for the Rust API in `~/Rust-workspace/usetenth-rust`. It is the same app in two places: inside Telegram as a Mini App (signed in automatically), and in a browser for people who prefer email and a password. Both reach the same account, and Telegram can be connected later.

Next.js (App Router), React 19, Tailwind 4, TypeScript. Money is never a float: `lib/money.ts` works in integer cents.

## Screens

| Route | What it does |
| --- | --- |
| `/` | Landing for visitors, with an Install the app button; routes everyone else to their next setup step |
| `/register`, `/login` | Email and password, or a one-time code from the bot's `/login` |
| `/onboarding` | Pick 5, 10 or 20 percent and a mix, then the wallet is created |
| `/verify` | Name and NIN check (about a minute); waits for the answer by itself |
| `/portfolio` | Worth today, invested vs ready to withdraw, holdings with Sell |
| `/tenth`, `/tenth/mix` | Change the percentage, pick a preset mix or your own stocks |
| `/payment` | An example payment split across your mix |
| `/add-funds` | Your wallet: a QR code and the address per network, with Copy and a Share sheet (copy, Telegram, other apps) |
| `/buy`, `/sell` | Live quote, confirm, then the order is followed until it settles |
| `/withdraw`, `/withdraw/addresses` | Saved addresses (24-hour wait), then a withdrawal confirmed by password or a Telegram code |
| `/activity` | Payments invested, your buys and sales, withdrawals |
| `/account` | Connect Telegram, add an email and password, sign out |

## Install and launch screen

- **Installable.** `app/manifest.ts` and `public/sw.js` make the site an installable web app. The landing page's Install the app button opens the browser's install prompt. On an iPhone, where there is no prompt, it shows the Share > Add to Home Screen steps instead. The installed app never shows the landing page: after the launch screen it opens sign-in, or the user's home screen if they are signed in.
- **Launch screen.** `components/LaunchSplash.tsx` covers the app once per launch, signed in or not, until the sign-in check has finished (at least 1.5 seconds). In an installed app every launch is a new session, so it shows each time. In a browser it shows once per tab.
- **One session.** The landing page leads with Open in Telegram, then Install the app. Sign-in and sign-up only open in the installed app or inside Telegram (`components/AppOnly.tsx`), so an account never has one session in a browser tab and another in the app. A plain browser tab is asked to install first. In development this is switched off so you can use the browser; in production set `NEXT_PUBLIC_ALLOW_BROWSER_AUTH=true` to switch it off.
- **Hand-off.** The launch screen stays until the first real screen has painted, so there is no second loading state. Pinch and double-tap zoom are switched off.
- **Errors.** If the API cannot be reached (no connection, or the proxy has nothing to forward to), `lib/http.ts` turns it into one friendly message and screens show an offline card with Try again, or a full-screen version where the whole page depends on it. Real errors from the API keep their own message. `app/not-found.tsx` is the 404 page; `app/error.tsx` and `app/global-error.tsx` catch crashes.
- **Deploying.** On Vercel, set `API_INTERNAL_URL` in the project settings to the public address of the Rust server (no trailing slash) and redeploy, because it is read at build time. Without it `/api` points at localhost and nothing can sign in. Inside Telegram a failed sign-in shows an error screen with Try again, not the sign-in form.
- **Headers.** On screens with a back button, the title and description sit under the nav bar, never beside the back button.

## How it talks to the API

The browser only ever calls its own origin. `next.config.ts` forwards `/api/*` to the Rust API with the prefix removed, so `/api/v1/kyc` reaches `/v1/kyc` and no CORS setup is needed. **`API_INTERNAL_URL` is read when the app is built**, so rebuild after changing it.

- **Sessions:** a short-lived access token plus a rotating refresh token, kept in `localStorage` (`lib/session.ts`). `lib/http.ts` refreshes once on a 401, however many requests are waiting, and signs the user out if the refresh fails.
- **Inside Telegram:** `lib/auth.tsx` signs in with Telegram's signed launch data (`POST /auth/telegram/webapp`) on every open, so the Telegram identity always wins there.
- **Irreversible actions:** adding a withdrawal address and withdrawing call `POST /v1/confirm` first. Users with a password enter it; Telegram-only users get a one-time code in the bot that works only for that exact action (`components/Proof.tsx`).

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `/api` | API base the browser calls |
| `API_INTERNAL_URL` | `http://localhost:3000` | Where `/api` is forwarded. Build-time. |
| `NEXT_PUBLIC_BOT_URL` | `https://t.me/usetenth_bot` | The landing page's Open in Telegram button |
| `NEXT_PUBLIC_ALLOW_BROWSER_AUTH` | off in production | Lets plain browser tabs sign in and sign up |
| `NEXT_PUBLIC_SAMPLE_PAYMENT` | `800.00` | The example payment used on `/payment` and in nudges |

`NEXT_PUBLIC_*` values are inlined at build time. Regenerate the QR with `bun run qr <url>`.

## Running

```bash
bun install
API_INTERNAL_URL=http://localhost:3000 bun run build && bun run start -p 3100
bun run dev -p 3100   # while developing
bun run typecheck
bun run test          # Vitest
```

Telegram only opens HTTPS pages, so to try the Mini App serve this behind a public HTTPS URL and set that as the bot's web app URL and the API's `WEB_APP_URL`.

## What changed from the first web app

Dropped because the new API has no equivalent: the invite-only demo and its access checks, "hold weekend deposits", "ask before each buy", custom percentages from 1 to 50 (the API offers 5, 10 and 20), creating addresses on extra networks, and bank-wire deposits. Added: email accounts and sign-in, connecting Telegram, the identity check, saved withdrawal addresses with confirmation, and the activity feed.
