# Korbly

Korbly is a [Next.js](https://nextjs.org/) app that turns a short grocery brief into a dinner plan and a real Gurkerl cart.

The current flow is:

1. Tell Korbly what you need, how many people you are feeding, cuisines, and diet limits.
2. Korbly fetches candidate dinners, lets you pick three, and consolidates overlapping groceries into one basket.
3. The app suggests smart top-ups to help reach the Gurkerl minimum order and can hand the cart off to Gurkerl or save regular order details.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Zod
- Vercel KV for persistent plan storage when configured
- Gurkerl MCP access via `mcp-remote`
- Optional AI filtering via Vercel AI Gateway

## Local Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Create your environment file

```sh
cp .env.example .env
```

`.env.example` currently includes:

```env
RHL_EMAIL=you@example.com
RHL_PASS=your-gurkerl-password
KV_REST_API_URL=
KV_REST_API_TOKEN=
AI_GATEWAY_API_KEY=
RESEND_API_KEY=
RESEND_FROM=Korbly <plans@korbly.at>
```

### 3. Start the app

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Notes

- `RHL_EMAIL` / `RHL_PASS` are required for host-side Gurkerl browsing.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` are optional. Without them, plans use an in-memory store.
- `AI_GATEWAY_API_KEY` is optional. Without it, diet filtering falls back to deterministic keyword rules.
- `RESEND_API_KEY` and `RESEND_FROM` are optional and only used for sending plan emails.

## Scripts

- `npm run dev` starts the local dev server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint with warnings treated as failures.
- `npm test` runs the unit test suite.
- `npm run smoke:mcp` exercises the Gurkerl MCP connection.
- `npm run test:creds` runs the per-request credentials smoke test.
- `npm run list-tools` lists tools exposed by the Gurkerl MCP.
- `npm run inspect` opens the MCP inspector against the Gurkerl endpoint.

## Project Flow

- `/` is the landing page.
- `/plan/new` collects the intake brief.
- `/plan/new/pick` lets the user choose three dinners.
- `/api/candidates` fetches and filters recipe candidates.
- `/api/plan` builds a saved plan and consolidated basket.
- `/api/plan/[id]/order` either adds the basket to Gurkerl or stores regular order details.

## Storage and Ordering

- Plans are stored in Vercel KV when KV is configured.
- In local development without KV, plans are stored in memory.
- Gurkerl user credentials are supplied per request for cart handoff and are not persisted by the app.

## Testing

```sh
npm run lint
npm test
npm run build
```

For MCP credential isolation details, see [MCP_CREDENTIAL_SMOKE.md](./MCP_CREDENTIAL_SMOKE.md).
