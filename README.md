# Human Evaluation ANRI — Netlify + Supabase

Aplikasi evaluasi manusia untuk 152 caption model BLIP-2 ANRI Fase 2 v13. Paket ini sudah berisi 152 foto terpilih yang dicocokkan berdasarkan `image_id`.

## Fitur

- Informed consent dan nama/ID evaluator.
- Penilaian Fluency 1–5, Accuracy 1–5, Factual Error, dan catatan opsional.
- Penyimpanan setiap foto, kode resume, dan validasi kelengkapan 152 item.
- Ekspor CSV yang menggabungkan respons dengan stratum dan ground truth rahasia.
- Next.js standar, Netlify Functions, dan Supabase PostgreSQL.

## 1. Siapkan Supabase

1. Buat project Supabase.
2. Buka **SQL Editor**.
3. Salin seluruh isi `supabase/schema.sql`, lalu klik **Run**.
4. Buka **Project Settings → API** dan catat:
   - Project URL
   - Service role key

Jangan pernah menaruh service role key di GitHub atau kode browser.

## 2. Siapkan environment variables

Gunakan `.env.example` sebagai daftar nama variabel:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_KEY=YOUR_LONG_RANDOM_SECRET
```

Untuk pengembangan lokal, simpan nilai aslinya di `.env.local`. File tersebut otomatis diabaikan Git.

## 3. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 4. Deploy ke Netlify

1. Push folder project ini ke repository GitHub.
2. Di Netlify pilih **Add new project → Import an existing project**.
3. Pilih repository GitHub tersebut.
4. Netlify membaca `netlify.toml` secara otomatis.
5. Tambahkan tiga environment variables di **Project configuration → Environment variables**.
6. Klik **Deploy**.

Build command: `npm run build`
Publish directory: `.next`

## Ekspor hasil

Setelah aplikasi aktif, buka:

```text
https://NAMA-SITE.netlify.app/api/export?key=ADMIN_KEY
```

Ganti `ADMIN_KEY` dengan nilai rahasia yang Anda simpan di Netlify.

## Struktur penting

- `app/` — halaman dan API.
- `components/evaluation-app.tsx` — antarmuka evaluator.
- `public/photos/` — 152 foto evaluasi.
- `data/human_eval_sample.csv` — sumber urutan, stratum, ground truth, dan caption.
- `data/generated/items-public.ts` — data aman untuk browser evaluator.
- `data/generated/items-confidential.ts` — data server-only untuk ekspor.
- `supabase/schema.sql` — tabel dan pengamanan database.
- `netlify.toml` — konfigurasi build Netlify.
