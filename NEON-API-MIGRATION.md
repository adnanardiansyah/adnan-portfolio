# Tahap 5.4 — Migrasi API dan Admin Dashboard

Tanggal: 3 November 2026. Tidak ada deployment, push GitHub, perubahan schema,
migrasi SQL, atau penambahan dependency aplikasi pada tahap ini.

## Implementasi

Semua endpoint aktif yang dahulu memakai Supabase sekarang memakai Neon melalui
`src/lib/neon.js`. Semua identifier SQL ditulis tetap dalam source; input request
menjadi parameter atau JSONB berparameter. API mengembalikan error generik dan
tidak mencetak raw exception/SQL/parameter/credential. Tidak ada koneksi pada import.

| Endpoint | Implementasi/status |
| --- | --- |
| `/api/works`, `/api/works/[id]` | GET/POST/PATCH/DELETE `portfolio.works`, whitelist field, alias JSON untuk gambar/galeri, visible/order/category, 404 untuk hidden/deleted di akses anonim |
| `/api/projects`, `/api/projects/[id]` | Endpoint legacy tetap terpisah dan kompatibel dengan tabel `portfolio.projects` |
| `/api/settings` | GET hanya `social_links` dan `coming_soon`; JWT PATCH terverifikasi; rate counter/webhook marker tidak dapat dibaca publik |
| `/api/inquiries`, `/api/inquiries/[id]` | Inbox privat JWT, read/unread dan delete; PATCH hanya mengizinkan `read` |
| `/api/contact` | Validasi nama/email/pesan, same-origin, batas persisten 3 pesan per 24 jam per IP, simpan inquiry sebelum Resend; gagal DB tidak mengirim email |
| `/api/reviews`, `/api/reviews/[id]` | JWT CRUD; publik hanya approved; alias `_id` dan `createdAt` dipertahankan |
| `/api/analytics/visit`, `/click`, `/search` | Insert Neon, input dibatasi, same-origin dan rate limit; increment search atomik, pekerjaan di-await; geolokasi memakai header platform tanpa mengirim IP ke API eksternal |
| `/api/analytics/ping`, `/ping-leave`, `/active-users` | Sesi per baris di `active_sessions`, TTL hitung 60 detik, upsert/delete per sesi |
| `/api/analytics/stats` | JWT; agregasi SQL, filter tahun/bulan tervalidasi, JSON dashboard tetap; hitungan negara tidak menggandakan recent visits |
| `/api/subscribe` | Normalisasi email, rate limit, unique conflict menjadi sukses idempotent |
| `/api/webhooks/resend` | Signature tetap wajib; marker event dan inquiry dalam satu pernyataan SQL atomik untuk deduplikasi retry |
| `/api/admin/send-email` | JWT, batas ukuran attachment dan rate; Resend tetap layanan email, riwayat masuk Neon; pesan khusus bila email terkirim tetapi riwayat gagal disimpan |
| `/api/llms` | Data proyek visible dari Neon; profil lokal tetap sumber identitas; fallback hanya saat kegagalan DB |
| `/api/upload` | JWT dahulu, lalu **503**: object storage belum dikonfigurasi; tidak pernah mengembalikan URL/sukses palsu |

`src/lib/supabase.js` dan dependency Supabase lama tersisa sebagai kode legacy
tidak terpakai. Tidak ada import/penggunaan Supabase di endpoint, middleware,
sitemap atau frontend aktif. Tidak dihapus lewat perubahan dependency agar
perbaikan keamanan sebelumnya tetap terjaga; penghapusan paket bisa menjadi
cleanup terpisah setelah review. MongoDB legacy juga tidak diaktifkan.

## Sumber data dan dashboard

- GET publik tidak lagi menggabungkan seed dengan hasil database. Hasil Neon
  kosong tetap kosong; proyek hidden/deleted tidak kembali lewat seed lokal.
- Ketika query gagal/tidak dikonfigurasi, GET works publik menggunakan empat
  proyek lokal dengan header `X-Portfolio-Source: fallback`. Hasil Neon memakai
  header `neon`. Dashboard `?all=true` memerlukan admin dan tidak memakai fallback.
- Detail mencari data Neon terbaru dahulu. Fallback lokal hanya pada kegagalan
  database; hasil tidak ditemukan/hidden dari database sehat tetap 404.
- Kartu Home, Projects, dan detail membaca API dengan `cache: no-store`. Tidak
  ada merge lokal tersembunyi di halaman yang menghidupkan kembali data lama.
- Sitemap bersifat dinamis dan memakai visible rows yang sama; tidak menambahkan
  empat slug tanpa syarat. `/api/llms` mengikuti aturan sumber yang sama.
- CMS menampilkan data Neon, kategori App tersedia, edit metadata/order/status
  dan konfirmasi delete tetap menggunakan UI asli. Kesalahan load/toggle/delete
  dan upload ditangani; upload gagal tidak diteruskan sebagai proyek sukses.
- Filter proyek retired tetap aktif. Regal Stay juga ditolak oleh validasi create.

Layout/kelas visual, struktur kartu, aset dan karakter animasi dipertahankan.
Perubahan `Work.jsx` hanya mengambil data API dan memasang ulang animasi item
saat data tiba, dengan cleanup GSAP context yang sama. VideoScrub, CircularGallery,
GradientBlinds, Dither, ProfileCard, PageShell, shader dan CSS inti tidak diedit.

## Keamanan

Verifier JWT bersama memeriksa HS256, signature, expiry dan `admin === true`.
Mutasi CMS, inbox, settings, review, upload dan admin email memerlukan admin;
mutasi dengan Origin lintas situs ditolak. Endpoint publik contact/newsletter/
analytics sengaja tidak memerlukan login, tetapi dibatasi input, same-origin,
ukuran payload dan rate limit. Webhook memakai signature provider, bukan cookie.

Login tetap memakai ADMIN_PASSWORD/JWT_SECRET dan cookie HttpOnly, Secure pada
production, SameSite Strict, umur tujuh hari. Perbandingan password memakai hash
dan timing-safe compare. Login dibatasi 5 percobaan per 15 menit/IP, persisten
lintas instance lewat counter JSONB atomik di `portfolio.settings`.
Endpoint change-password tidak lagi memantulkan password ke respons; ia tetap
memberikan instruksi mengubah env secara privat, bukan mengganti env otomatis.

Counter juga dipakai contact (3/24 jam), subscribe (10/jam), analytics bersama
(120/menit), dan admin email (20/jam). IP rate key di-hash, tidak dikirim ke publik.
IP kunjungan/contact tetap disimpan seperti kontrak analytics/inbox sebelumnya.
Counter expired di-reset pada pemakaian ulang; sesi expired tidak dihitung.
Pembersihan data lama/retensi IP dan rate keys tetap perlu kebijakan operasional.
Rate key dan marker webhook sengaja tidak masuk allowlist settings publik.

## Target pengujian dan perlindungan data

Pengguna mengonfirmasi pembuatan branch **development** dari main dan mengganti
DATABASE_URL sebelum ada pengujian tulis. Endpoint pada connection string
dicocokkan dengan `neon.endpoint_id` dari server; role `portfolio_app`, `neondb`,
pooling, TLS, izin works, dan empat proyek diperiksa baca-saja. Nama branch tidak
disediakan sebagai setting SQL; label development berasal dari konfirmasi pengguna.
Harness mengunci fingerprint branch/endpoint terhadap baseline sebelum CRUD.

Backup empat row works lengkap disimpan di
`.qa/cutover/neon-development-baseline.json` (diabaikan Git, tanpa connection string).
Fixture memakai UUID otomatis dan judul/marker `qa-cutover-*`, terpisah dari empat
slug asli. Cleanup dibatasi ID/marker fixture dan rate key IP dokumentasi QA.
Tidak ada mutasi ke branch main atau empat proyek asli. Setelah pengujian API,
empat row asli dibandingkan sebagai JSON dengan backup dan cocok seluruh field.
Nilai sequence identity dapat bertambah akibat fixture; tidak di-reset.

## Hasil pengujian

- Pengujian kontrak offline: **12/12 lulus**, termasuk modul Neon, empty result,
  hidden/deleted 404, fallback outage, admin claim salah, unknown fields,
  javascript URL, retired title, cross-site request, bound JSON, private settings,
  dan upload 503. Mock transport digunakan hanya untuk pengujian kontrak ini.
- Pengujian HTTP nyata di branch development: **lulus** GET empat proyek, login
  password QA sementara dan cookie JWT Secure/HttpOnly/Strict, CREATE/UPDATE/order/
  publish/hide/DELETE works dan detail publik terbaru, legacy projects CRUD,
  reviews CRUD, inbox list/read/delete, public settings allowlist, upsert dengan
  nilai gate yang sama, newsletter insert/duplicate, analytics, search increment,
  session ping/leave/count, stats dan validasi filter, serta rate limit login 429.
- Fixture API dibersihkan; empat proyek asli cocok dengan backup. Tidak ada email
  eksternal dikirim: konfigurasi Resend dinonaktifkan hanya di proses QA.
- Server HTTP kedua dengan DATABASE_URL kosong: fallback empat proyek publik,
  ID tidak duplikat, detail lokal tersedia, admin/private API **503** generik.
- Uji tanpa autentikasi: endpoint mutasi/admin privat **401** sebelum query data.
  Input field terlarang/URL unsafe/retired title **400**, cross-site admin **403**.
- Browser production lokal: **12 kombinasi halaman/viewport lulus** (Home, About,
  Projects, Contact, detail Suara Digital Desa dan Siskamling × desktop/mobile).
  Tidak ada horizontal overflow atau runtime exception. Galeri OGL/WebGL2,
  shader Contact, tilt profil, video scrub/scroll cinematic, menu mobile dan filter
  App diuji interaksinya. Tracking otomatis diblokir hanya oleh harness browser
  agar tidak mencemari analytics; penulisan analytics sudah diuji lewat API nyata.
- **CRUD UI admin nyata lulus**: render empat proyek Neon, tambah fixture, ubah
  judul/urutan, sembunyikan dari katalog publik, lalu hapus dengan dialog konfirmasi
  browser yang benar-benar muncul. Fixture UI dibersihkan. Edit kategori, teknologi,
  deskripsi/link dan publikasi juga diverifikasi melalui request API nyata.
- Lint: **0 error**, 16 warning `<img>` yang sudah ada.
- Build production: **berhasil**, Next 15.5.28; sitemap dinamis, tanpa query DB
  build untuk katalog, **41/41 halaman statis**. Lint/build final lulus setelah
  perubahan terakhir. Smoke test build final memastikan GET works dan llms sama
  dari Neon serta lima gambar/contain/mobile mapping Suara Digital Desa benar.
- Pemeriksaan akhir database setelah CRUD UI: **0 fixture tersisa** di sembilan
  tabel yang digunakan untuk pengujian; empat row works asli sama dengan backup.
  Pemindaian browser static bundle tidak menemukan nilai DATABASE_URL yang
  terkonfigurasi; file env dan direktori QA tetap diabaikan Git.

Harness QA lokal ada di `.qa/cutover` dan diabaikan Git. Credential/token/password
QA bersifat sementara, berbeda dari autentikasi pengguna, dan tidak dicetak.
Tidak membuat credential produksi atau menuliskannya ke `.env`.

## File yang diubah

File API: seluruh route pada tabel endpoint di atas, serta
`src/app/api/admin/login/route.js` dan `src/app/api/admin/change-password/route.js`.

File pendukung/data/frontend:

- `src/lib/neon.js`, `src/lib/admin-token.js` (baru), `src/lib/api.js` (baru),
  `src/lib/records.js` (baru), `src/lib/repository.js` (baru),
  `src/lib/rate-limit.js` (baru), `src/lib/analytics.js` (baru), `src/lib/trackClick.js`.
- `src/middleware.js`, `src/app/layout.js`, `src/app/sitemap.js`.
- `src/components/Work.jsx`, `src/views/projects.jsx`,
  `src/app/project/[id]/page.jsx` (pengambilan data; bukan perubahan desain).
- `src/app/admin/(panel)/projects/page.jsx`, `src/app/admin/add-project/page.jsx`.
- `.env.example`, `tests/api-cutover.test.mjs` (baru), laporan ini.

`package.json`, lockfile, foto, screenshot, CV, dan file migration tidak diubah.
Saat awal tes ditemukan `.env` berupa URL tanpa assignment; pengguna memperbarui
file menjadi DATABASE_URL branch development ketika klarifikasi berlangsung.
Agent tidak menimpa nilai `.env` atau mengubah konfigurasi autentikasi pengguna.

## Konfigurasi dan kendala yang masih tersisa

1. `DATABASE_URL` branch development sudah dapat dipakai. Untuk menjalankan login
   pada server lokal pengguna, isi **ADMIN_PASSWORD** dan **JWT_SECRET** sendiri
   (secret acak 32+ byte). Saat pemeriksaan env awal, keduanya belum tersedia;
   pengujian login menggunakan env QA sementara, bukan mengarang kredensial untuk
   konfigurasi pengguna. Jangan menyalin kredensial QA ke env aplikasi.
2. Contact dan admin email memerlukan `RESEND_API_KEY`, sender terverifikasi
   `RESEND_FROM_EMAIL`, dan `ADMIN_EMAIL`; inbound webhook juga memerlukan
   `RESEND_WEBHOOK_SECRET`. Pengiriman/delivery email dan webhook signed end-to-end
   **belum diuji dengan layanan Resend nyata**. Retry deduplication sudah
   diimplementasikan tetapi perlu tes provider setelah konfigurasi tersedia.
3. Upload CMS sengaja 503. Gambar lokal, screenshot mobile, foto, dan CV tetap
   tersedia. Integrasi Vercel Blob/S3/R2 terpisah perlu dipilih, token server-only,
   JWT upload, validasi tipe/ukuran, direct upload untuk file besar, URL allowlist,
   dan pelestarian rasio screenshot. Belum menambah SDK atau token storage.
4. Rate limiting server bergantung pada IP header terpercaya dari proxy Vercel;
   jika memakai proxy lain, konfigurasi kepercayaan header harus ditinjau. Rate
   limit login gagal tertutup saat DB gagal; admin tidak diberi sukses palsu.
5. Kuota contact adalah fixed window 24 jam dari request pertama, bukan reset
   tengah malam lokal. Email notification gagal tidak menghapus inquiry; respons
   menyatakan pesan tersimpan dan meminta pengguna tidak mengirim ulang.
6. Data/marker analytics dan webhook memerlukan retensi/cleanup berkala; tidak
   menambahkan cron/deployment otomatis atau menghapus data lama pada tahap ini.
7. Klaim sukses CRUD nyata berlaku untuk branch development yang dikonfirmasi.
   Tidak ada pengujian tulis pada main dan tidak ada perpindahan konfigurasi main.

## Sebelum deployment nanti

Tinjau diff dan laporan, isi autentikasi lokal serta email sendiri, lakukan uji
pengiriman/webhook nyata, pilih object storage jika CMS upload diperlukan, dan
tetapkan retensi analytics. Verifikasi env tiap environment Vercel agar preview
tetap memakai development dan production hanya memakai main setelah persetujuan.
Jalankan lint/build serta smoke test setelah konfigurasi final. Push/deployment
tetap tindakan manual terpisah; tidak dilakukan pada tahap ini.
