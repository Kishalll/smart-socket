# S.A.F.E System

**Selective Appliance Filtering & Enforcement** — A hostel socket load and appliance violation monitoring system. Web dashboard for managing hostel blocks, rooms, students, electrical sockets, power events, load rules, wardens, violation cases, and fines.

Course: BCSE302L — Database Systems

---

## Tech Stack

| Layer         | Tech                           |
|---------------|--------------------------------|
| Framework     | Next.js 16 (App Router)       |
| Language      | TypeScript 5                   |
| Database      | SQLite via Prisma ORM 6        |
| Styling       | Tailwind CSS 4                 |
| UI Components | shadcn/ui (Radix primitives)   |
| Data Tables   | TanStack React Table v8        |
| Charts        | Recharts                       |
| State         | Zustand                        |
| Notifications | Sonner                         |
| Icons         | Lucide React                   |

---

## Project Structure

```
smart-socket/
├── prisma/
│   ├── schema.prisma      # Database schema (9 models)
│   ├── seed.ts            # Seed script with sample data
│   └── dev.db             # SQLite database file
├── src/
│   ├── app/
│   │   ├── api/           # REST API routes (10 endpoints)
│   │   ├── globals.css    # Tailwind theme config
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Single-page app entry
│   ├── components/
│   │   ├── layout/        # Sidebar navigation
│   │   ├── pages/         # 10 page components
│   │   ├── shared/        # DataTable, FormDialog, StatusBadge
│   │   └── ui/            # shadcn/ui primitives
│   └── lib/
│       ├── db.ts          # Prisma client singleton
│       ├── store.ts       # Zustand store
│       └── utils.ts       # cn() helper
├── .env                   # DATABASE_URL
├── package.json
└── tsconfig.json
```

---

## Database Schema

9 entities with full relational mapping:

| Entity         | Description                                      |
|----------------|--------------------------------------------------|
| HostelBlock    | Hostel building (name, gender type, floors)      |
| Room           | Room in a block (number, floor, type, capacity)   |
| Student        | Student with room allocation                     |
| Socket         | Electrical socket per room (type, status)        |
| PowerEvent     | Power usage event (watts, duration, timestamps)  |
| LoadRule       | Violation threshold rules (max watts, duration)  |
| Warden         | Block supervisor with contact info               |
| ViolationCase  | Detected violation linked to event and rule      |
| Fine           | Fine issued against a student for a violation    |

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

### Install Dependencies

```bash
npm install
```

If `sharp` (native module) fails to compile on Linux:
```bash
npm install --ignore-scripts sharp
npm install
```

### Configure Database

The `.env` file is preconfigured:
```
DATABASE_URL=file:./dev.db
```

### First-Time Setup

Run these commands in order:

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Push schema to database (creates dev.db)
npm run db:push

# 3. Seed sample data
npm run db:seed
```

### Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Commands

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run db:generate`| Generate Prisma client                    |
| `npm run db:push`    | Push schema changes to database           |
| `npm run db:migrate` | Create and apply migrations               |
| `npm run db:seed`    | Seed database with sample data            |

---

## Seeding Data

### What the Seed Creates

| Entity         | Count | Description                                    |
|----------------|-------|------------------------------------------------|
| Hostel Blocks  | 4     | A-D Block (2 Boys, 2 Girls)                    |
| Rooms          | 68    | 4 rooms per floor across all blocks            |
| Students       | 60    | Distributed across all rooms                   |
| Sockets        | ~166  | 2-3 per room based on capacity                 |
| Load Rules     | 5     | Violation threshold configurations             |
| Wardens        | 4     | One per block                                  |
| Power Events   | 120   | Random usage events over past 30 days          |
| Violation Cases| 45    | Linked to power events and rules               |
| Fines          | 25    | Issued against violations                      |

### Re-seeding (Clear & Regenerate)

The seed script **clears all existing data** before inserting new data. Run it anytime to reset:

```bash
npm run db:seed
```

This is safe to run multiple times — it handles foreign key constraints by deleting in the correct order.

### Modify Seed Data

Edit `prisma/seed.ts` to customize:

1. **Change entity counts** — modify loop limits (e.g., `i < 60` for students)
2. **Change sample values** — edit arrays like `firstNames`, `depts`, `violationReasons`
3. **Add new entities** — follow the existing pattern with `prisma.entity.create()`
4. **Remove entities** — delete the corresponding section and its `deleteMany()` call

After editing the seed file:
```bash
npm run db:seed
```

### Wipe Database Completely

To start fresh:

```bash
rm -f prisma/dev.db dev.db
npm run db:push
npm run db:seed
```

---

## Troubleshooting

### Unable to open database file

Delete existing db files and re-push:
```bash
rm -f dev.db prisma/dev.db
npm run db:push
npm run db:seed
```

### Port 3000 already in use

Change port in `package.json`:
```json
"dev": "next dev -p 3001"
```

### `sharp` build error during `npm install`

```bash
npm install --ignore-scripts sharp
```

### Prisma client not generated

```bash
npm run db:generate
```

---

## Notes

- **Prisma version**: This project uses Prisma 6.19.2 (pinned). Do not upgrade to v7 — it has breaking changes to datasource config.
- **SQLite limitations**: Not suitable for production with concurrent writes. For production, switch to PostgreSQL or MySQL.
- **Single-page app**: Navigation is handled via Zustand state, not Next.js file-based routing.