# MyFamilyFinance — App

Next.js 15 (App Router) + Supabase + Tailwind v4

## ตั้งค่า Supabase

1. สร้าง project ที่ <https://supabase.com> (region: Singapore)
2. คัดลอกค่าจาก Settings → API:
   - Project URL
   - anon public key
3. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ค่า:

```bash
cp .env.local.example .env.local
```

4. รัน migration บน Supabase:

**ทางเลือก 1 — ผ่าน Supabase CLI (แนะนำ)**
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**ทางเลือก 2 — paste SQL ใน Dashboard**
- เปิด Supabase Dashboard → SQL Editor
- รัน `supabase/migrations/0001_init_schema.sql` ก่อน
- รัน `supabase/migrations/0002_summary_views.sql` ทีหลัง

5. (เลือกได้) Generate TypeScript types จาก schema จริง:
```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## ตั้งค่า Google OAuth (เลือกได้)

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web)
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google: ใส่ Client ID + Secret
4. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (dev) → ภายหลังเปลี่ยนเป็น production domain
   - Redirect URLs: เพิ่ม `http://localhost:3000/auth/callback`

## รัน dev server

```bash
npm run dev
```

เปิด <http://localhost:3000> — จะถูก redirect ไปหน้า `/login` ถ้ายังไม่ login

## โครงสร้าง

```
src/
├── app/
│   ├── (app)/               # routes ที่ต้อง login
│   │   ├── layout.tsx       # nav header + auth guard
│   │   ├── dashboard/       # หน้าหลัก — pool + summary
│   │   ├── incomes/         # ลงรายรับ (หลายรอบ/เดือนได้)
│   │   ├── allocations/     # กระจายยอดเข้าบัญชี
│   │   ├── expenses/        # ลงรายจ่าย
│   │   ├── budget-accounts/ # CRUD บัญชี + ผูกกับธนาคาร
│   │   └── bank-accounts/   # CRUD บัญชีธนาคาร
│   ├── auth/
│   │   ├── callback/        # OAuth code exchange
│   │   └── signout/         # POST signout
│   ├── login/               # หน้า login (Google + email/password)
│   ├── layout.tsx           # root layout (Sarabun font)
│   └── page.tsx             # / → redirect ไป /dashboard
├── components/ui/           # shadcn-style ui primitives
├── lib/
│   ├── supabase/            # client/server helpers + types
│   ├── period.ts            # get-or-create current period
│   └── utils.ts             # cn(), formatTHB, period helpers
└── middleware.ts            # session refresh + auth gating

supabase/migrations/
├── 0001_init_schema.sql     # 7 ตาราง + RLS
└── 0002_summary_views.sql   # views คำนวณ pool + rollover
```

## Verification

ทดสอบตามลำดับนี้:
1. Sign up ด้วย email/password → confirm email → login เข้า `/dashboard`
2. `/budget-accounts` → สร้าง 3 บัญชี: เงินเก็บ, ค่ากิน, น้ำมัน
3. `/incomes` → ลงรายรับ 2 รายการ ในเดือนนี้: เงินเดือน 20,000 + โบนัส 10,000
4. `/dashboard` → ต้องเห็น total_income = 30,000, unallocated_pool = 30,000
5. `/allocations` → กระจาย เงินเก็บ 10,000, ค่ากิน 15,000, น้ำมัน 5,000 → pool = 0
6. `/expenses` → ลง 8,000 ใน "ค่ากิน"
7. `/dashboard` → ต้องเห็น remaining(ค่ากิน) = 7,000
8. เลื่อนเดือนถัดไป (สร้าง income ในเดือนหน้า) → opening_balance(ค่ากิน) ของเดือนหน้า = 7,000 (rollover)
