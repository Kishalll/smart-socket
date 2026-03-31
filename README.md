# S.A.F.E System

**Selective Appliance Filtering & Enforcement** System. Web dashboard for managing hostel blocks, rooms, students, electrical sockets, power events, load rules, wardens, violation cases, and fines.

Course: BCSE302L — Database Systems

---

## Tech Stack

| Layer        | Tech                                      |
|--------------|-------------------------------------------|
| Framework    | Next.js 16 (App Router, Turbopack)        |
| Language     | TypeScript 5                              |
| Database     | SQLite via Prisma ORM 6                   |
| Styling      | Tailwind CSS 4                            |
| UI           | shadcn/ui (Radix primitives)              |
| Tables       | TanStack React Table v8                   |
| Charts       | Recharts                                  |
| State        | Zustand                                   |
| Notifications| Sonner                                    |
| Icons        | Lucide React                              |

---

## Project Structure

```
smart-socket/
├── prisma/
│   ├── schema.prisma      # Database schema (9 models)
│   └── seed.ts            # Seed script with sample data
├── src/
│   ├── app/
│   │   ├── api/           # REST API routes (CRUD for all entities)
│   │   ├── globals.css    # Tailwind theme config
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Single-page app with sidebar routing
│   ├── components/
│   │   ├── layout/        # Sidebar navigation
│   │   ├── pages/         # 10 page components
│   │   ├── shared/        # DataTable, FormDialog, StatusBadge
│   │   └── ui/            # shadcn/ui primitives
│   └── lib/
│       ├── db.ts          # Prisma client singleton
│       ├── store.ts       # Zustand store (page nav + sidebar)
│       └── utils.ts       # cn() helper
├── .env                   # DATABASE_URL
├── package.json
└── tsconfig.json
```

---

## Database Schema

9 entities with full relational mapping:

- **HostelBlock** — hostel building (name, gender type, floors)
- **Room** — room in a block (number, floor, type, capacity)
- **Student** — student with room allocation
- **Socket** — electrical socket per room (type, status)
- **PowerEvent** — power usage event on a socket (watts, duration)
- **LoadRule** — violation threshold rules (max watts, max duration)
- **Warden** — block warden with contact info
- **ViolationCase** — detected violation linked to an event and rule
- **Fine** — fine issued against a student for a violation

---

## Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm (comes with Node.js)

### Clone

```bash
git clone https://github.com/Kishalll/smart-socket.git
cd smart-socket
```

### Install dependencies

```bash
npm install
```

If `sharp` (native module) fails to compile on Linux, run:
```bash
npm install --ignore-scripts sharp
npm install
```

### Configure database

The `.env` file comes preconfigured:

```
DATABASE_URL=file:./dev.db
```

This creates an SQLite file at `<project_root>/dev.db`.

### Push schema to database

```bash
npx prisma db push
```

### Seed sample data

```bash
npx tsx prisma/seed.ts
```

This populates the database with 4 blocks, 68 rooms, 60 students, 170 sockets, 120 power events, 45 violation cases, and 25 fines. Safe to run multiple times — it clears existing data before seeding.

### Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Troubleshooting

**Unable to open the database file**
Delete existing db files and re-push:
```bash
rm -f dev.db prisma/dev.db
npx prisma db push
npx tsx prisma/seed.ts
```

**Port 3000 already in use**
Change port in `package.json`:
```json
"dev": "next dev -p 3001"
```

**`sharp` build error during `npm install`**
```bash
npm install --ignore-scripts sharp
```

**NOTE: Prisma version mismatch**
This project uses Prisma 6.19.2 (pinned). Do not upgrade to v7 — it has breaking changes to the datasource config.
