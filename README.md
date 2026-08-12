# XI RPL 2 PROJECT — Full Stack

Versi ini sudah disiapkan untuk menjadi aplikasi sungguhan:
- Frontend responsive/PWA
- Node.js + Express sebagai server
- Supabase Auth + PostgreSQL sebagai database
- Row Level Security (RLS)
- Login/register
- Tugas, jadwal, keuangan, catatan, buku, pengumuman
- Admin Panel
- Superadmin dapat membuat/revoke kode Admin Khusus
- Contact Developer ke WhatsApp

## 1. Buat database gratis
Buat project Supabase, buka SQL Editor, lalu jalankan `supabase/schema.sql`.

Supabase Free saat ini menyediakan PostgreSQL 500 MB/project dan kuota gratis lainnya. Project Free dapat dipause setelah 1 minggu tidak aktif, jadi ini cocok untuk belajar/prototype.

## 2. Buat akun Admin Utama
Daftar satu akun melalui aplikasi (`/`). Setelah akun dibuat, buka Supabase Dashboard > Authentication > Users dan salin UUID akun tersebut.
Di SQL Editor jalankan:
`update public.profiles set role='superadmin' where id='UUID_KAMU';`

Jangan menaruh password admin di source code atau ZIP.

## 3. Hubungkan server
Salin `.env.example` menjadi `.env`, lalu isi:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

ANON key boleh dipakai di browser; jangan pernah memasukkan `service_role` key ke frontend.

## 4. Jalankan lokal
```bash
npm install
npm start
```
Buka `http://localhost:3000`.

## 5. Deploy gratis
Gunakan GitHub + Render Free Web Service. Set:
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

Render Free Web Service dapat spin down setelah 15 menit tidak ada aktivitas, jadi pembukaan pertama setelah idle bisa lebih lambat.

## 6. Admin khusus
Admin Utama (superadmin) masuk ke `/admin.html` lalu membuat kode seperti `RPL2-XXXXXXXX`.
Kode disimpan di database, dapat dilihat dan dicabut. Mekanisme redeem sudah disediakan melalui RPC `redeem_admin_code`; halaman pendaftaran lanjutan dapat memanggil RPC itu setelah user login.

## Catatan
Saya tidak bisa membuat project Supabase/Render atas nama kamu tanpa akses akunmu. ZIP ini adalah paket full-stack siap dikonfigurasi dan dideploy.


## Tampilan
Frontend sudah direvisi mengikuti screenshot referensi yang diberikan: splash/logo, dashboard, progress 70%, menu 2x4, jadwal, keuangan, Info Developer, bottom navigation, dan Admin Panel. Tampilan tetap responsif dan data tetap menggunakan Supabase.

### Finishing visual
Jika environment belum diberi Supabase, aplikasi otomatis masuk **Demo Preview** sehingga tampilan tetap dapat dilihat. Setelah Supabase dikonfigurasi, mode login/database aktif kembali.
