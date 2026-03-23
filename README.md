This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Bootstrap Carbon

**Prairie carbon credit aggregation infrastructure.**
Cooperative-owned. On-chain verified. Built to last.

---

## What it does

Bootstrap Carbon aggregates small SK/AB farmers and landowners into
compliant carbon offset pools, reduces verification costs by 70–80%
through automated MRV, and issues tamper-evident credits on Solana.

It also generates documentation packages for Alberta industrial
facilities exporting to the EU under the Carbon Border Adjustment
Mechanism (CBAM).

---

## Revenue model

| Stream | Model | Unit economics |
|---|---|---|
| Aggregation pools | 10% of credit proceeds | ~$12K per pool / yr |
| Protocol compliance SaaS | $500–2K/mo per org | $360K ARR at 30 orgs |
| CBAM documentation | $15–65K per engagement | $300K+ Y1 |
| Data licensing | Annual license | $800K–2M ARR (Y4+) |

---

## Stack

  Next.js 14 · TypeScript · PostgreSQL + Prisma
  Tailwind + shadcn/ui · Solana Web3.js · Vercel

---

## Quick start

```bash
git clone https://github.com/YOUR_ORG/bootstrap-carbon
cd bootstrap-carbon
cp .env.example .env.local
# fill in .env.local
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

---

## License

Business Source License 1.1 (BSL-1.1).
Commercial use requires a license from Bootstrap IP Ltd.
Contact: legal@bootstrapcarbon.ca

---

*Bootstrap Ltd. is a federal cooperative registered in Canada.*
*Bootstrap IP Ltd. holds all software and data IP.*