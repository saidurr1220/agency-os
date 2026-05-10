# agency-os

Multi-tenant agency operating system — Next.js App Router, Prisma, PostgreSQL, Better Auth.

## Email (production)

Transactional mail uses **[Resend](https://resend.com)** (free tier: thousands of emails/month for development and light production).

1. Create a Resend account and an API key.
2. For production, verify your domain in Resend and set `EMAIL_FROM` to an address on that domain (e.g. `AgencyOS <notifications@yourdomain.com>`).
3. For quick local testing you can use Resend’s test sender: `AgencyOS <onboarding@resend.dev>`.

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Verified sender (see above) |
| `NEXT_PUBLIC_APP_URL` | Optional; canonical public URL for links in emails (defaults to `BETTER_AUTH_URL`) |

Without `RESEND_API_KEY` and `EMAIL_FROM`, the app still runs; invitation and notification emails are skipped and a dev warning is logged.

## Commands

```bash
npm install
npx prisma generate
npm run dev
npm run build
npm start
```

## License

Private / all rights reserved unless otherwise stated.
