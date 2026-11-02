# Tahap 5.2 — Audit dan persiapan Neon PostgreSQL

Tanggal: 2 November 2026. Status: **persiapan selesai; cutover API dan migrasi database belum dilakukan**.

Tidak ada koneksi/query/migrasi ke Neon, impor data, push GitHub, atau deployment
yang dijalankan. Database Neon yang dibuat melalui Vercel belum diperiksa isinya.
Kesimpulan skema di bawah berasal dari source code dan referensi SQL lokal,
bukan klaim tentang kondisi database remote.

## Batas perubahan dan koneksi

- Ditambahkan `@neondatabase/serverless` **1.2.0**, driver resmi dengan transport
  HTTP untuk query singkat di Next.js/Vercel serverless. Membutuhkan Node >=19;
  lingkungan lokal memakai Node 24.14.0. Pilih Node 22/24 LTS untuk runtime.
- `src/lib/neon.js` memakai `server-only`, membaca `DATABASE_URL` secara lazy,
  memvalidasi protokol PostgreSQL dan TLS (`sslmode=require` / `verify-full`),
  menggunakan tagged template berparameter, dan tidak memasukkan detail error
  driver/URL/parameter ke error aplikasi. HTTP fetch memakai `cache: no-store`.
- Tidak ada koneksi saat import, query saat build, endpoint health publik,
  migration runner, atau auto-detection yang mengganti database aktif.
- `DATABASE_URL` ditemukan sebagai nama variabel dalam `.env` lokal; nilainya
  tidak ditampilkan/disalin. Tidak ditemukan nama variabel database dengan
  prefix `NEXT_PUBLIC_` di env lokal yang diperiksa. Koneksi belum diuji.
- API lama dan Supabase SDK **sengaja tetap aktif sesuai konfigurasi sebelumnya**.
  Mengisi DATABASE_URL saja belum mengaktifkan CMS/kontak/analytics di Neon.
  Kode UI, autentikasi JWT, aset, dan animasi tidak diubah.

Referensi teknis: [driver resmi Neon](https://github.com/neondatabase/serverless)
menjelaskan query HTTP berparameter dan transaksi noninteraktif;
[panduan koneksi Neon](https://github.com/neondatabase/website/blob/main/content/docs/get-started/connect-neon.md)
menjelaskan URL aplikasi dan koneksi langsung untuk migrasi. Tidak diperlukan ORM
atau pengganti Supabase Auth untuk kebutuhan sekarang.

## Hasil audit Supabase

| Lokasi/fitur | Penggunaan saat ini | Rencana saat cutover |
| --- | --- | --- |
| `src/lib/supabase.js` | Client server dengan service-role, bypass RLS | Repository server memakai query Neon; hapus client setelah seluruh konsumen dipindahkan |
| `/api/works`, `/api/works/[id]` | CRUD tabel `works`; proyek publik + fallback lokal; JWT untuk mutasi | Query `portfolio.works`, pertahankan URL/kontrak JSON, visibility, category dan sort; whitelist kolom mutasi |
| `/api/projects`, `/api/projects/[id]` | CRUD tabel `projects` versi template lama | Pertahankan tabel/endpoint kompatibilitas sampai dipastikan tidak ada konsumen eksternal; jangan otomatis digabung dengan works |
| `/api/inquiries`, `/api/inquiries/[id]` | Inbox admin, read/unread, hapus | Query `portfolio.inquiries` setelah JWT, jangan pernah sediakan daftar pesan publik |
| `/api/contact` | Hitung pesan per IP/hari, simpan inquiry, kirim Resend | Simpan/count di Neon dengan batas kirim atomik; pertahankan validasi input, HTML escaping dan konfigurasi Resend |
| `/api/admin/send-email` | JWT + Resend + simpan riwayat terkirim sebagai inquiry | Ganti penyimpanan riwayat; pengiriman email tetap Resend |
| `/api/webhooks/resend` | Verifikasi signature lalu simpan email masuk | Ganti insert setelah signature terverifikasi; tambahkan deduplikasi event pada tahap implementasi agar retry tidak menggandakan pesan |
| `/api/subscribe` | Membuat Supabase client sendiri, insert email, menangani unique violation | Normalisasi email lalu insert `portfolio.subscribers`, `ON CONFLICT (email) DO NOTHING`; pertahankan respons idempotent |
| `/api/reviews`, `/api/reviews/[id]` | CRUD reviews, publik hanya approved; alias `_id`, `createdAt` | Pertahankan filter dan alias JSON; jangan seed testimoni |
| `/api/settings` | Public GET settings, JWT PATCH upsert key/value JSON | Neon upsert; public GET hanya allowlist `social_links`, `coming_soon`; session/private settings tidak ikut dikirim |
| `/api/analytics/visit`, `/click`, `/search` | Insert visits/clicks, read-then-write hit pencarian | Insert berparameter, increment atomik `ON CONFLICT (query) DO UPDATE`; await penyimpanan, bukan pekerjaan lepas setelah request |
| `/api/analytics/ping`, `/ping-leave`, `/active-users` | JSON `settings.active_sessions`, read/overwrite per request | Pindah ke tabel `active_sessions`, upsert/delete per sesi, konsisten TTL 60 detik; respons count sama |
| `/api/analytics/stats` | JWT, count + baca banyak rows lalu agregasi JS | SQL count/group by dengan filter tanggal dan indeks, pertahankan bentuk JSON serta alias UI |
| `/api/upload` | JWT + Sharp + Supabase Storage, bucket `project-photos`, dapat membuat bucket otomatis | Pisahkan dari DB; tetap JWT, gunakan object storage terpilih; jangan mencoba menulis ke Neon atau filesystem Vercel |
| `src/app/sitemap.js` | Membaca visible works, gabung empat slug lokal, filter proyek retired | Pertahankan fallback dan filter; pertimbangkan sitemap dinamis agar build tidak mengakses DB |
| `src/middleware.js` | REST Supabase langsung untuk gate coming-soon; JWT admin terpisah | Ganti lookup gate dengan query HTTP/caching terkontrol di middleware atau server gate; fail-open tetap untuk publik, JWT admin tidak berubah |
| `src/app/layout.js` | `hasDatabase` khusus konfigurasi Supabase mengaktifkan TrackVisit | Ganti boolean kesiapan backend setelah cutover; kirim boolean saja ke browser, tidak URL koneksi |
| `src/lib/trackClick.js` | Guard client `NEXT_PUBLIC_SUPABASE_URL` sebelum POST API | Hapus ketergantungan provider publik; gunakan API internal/boolean tracking |

CMS browser (`src/app/admin/(panel)/*`, `src/app/admin/add-project/page.jsx`)
mengakses API internal, bukan database langsung. Projects admin memakai `/api/works`;
Links memakai settings `social_links`; dashboard memakai analytics dan gate
`coming_soon`; inquiries memakai inbox dan send-email; reviews memakai reviews.
Halaman settings admin mengubah password melalui API, bukan tabel Supabase.

`/api/admin/login`, `/logout`, `/change-password` dan JWT middleware memakai
`ADMIN_PASSWORD`, `JWT_SECRET`, cookie `admin_token`, dan `jose`; **tidak ada
Supabase Auth/session yang perlu dimigrasikan**. `/api/settings/bypass` juga tidak
memakai Supabase SDK. `/api/llms` memakai profil lokal. Model Mongoose di
`src/lib/models/*` dan `src/lib/mongodb.js` merupakan jalur legacy; tidak ditemukan
import oleh API aktif. Tidak ada penggunaan Realtime/RPC/Edge Functions Supabase
di source yang diaudit.

### Perbedaan dan risiko yang harus ditangani ketika mengganti API

1. `supabase/migrations/run-sql-supabase.sql` ditandai **context only**, bukan
   migration siap jalan. Bagian `storage.*` dan policy Supabase tidak berlaku
   untuk Neon. Script lama tidak idempotent dan tidak boleh dijalankan di Neon.
2. Tabel lama memakai UUID untuk works/projects; empat ID lokal berupa slug
   (`snapnext`, `triase-net`, `suara-digital-desa`, `siskamling`). Neon memakai
   text primary key untuk mempertahankan slug sekaligus UUID lama sebagai string.
   Tidak ada FK dalam referensi lama yang perlu dipindahkan otomatis.
3. Kontak membutuhkan `inquiries.ip`, yang tidak ada di dump awal tetapi ada di
   migration lokal `20261102_contact_rate_limit.sql`. Draft baru menyertakannya
   beserta indeks `(ip, created_at)`.
4. Storage route memakai `project-photos`, sedangkan SQL lama membuat `projects`.
   Inventory kedua bucket sebelum menonaktifkan Supabase. Policy upload lama
   juga tidak membuktikan pemeriksaan admin; server JWT tetap wajib.
5. Searches belum memiliki unique query dalam dump lama. Deduplikasi/agregasi
   data lama sebelum mengimpor ke unique query baru. Increment lama rawan race;
   beberapa Supabase query background bahkan tidak di-await hingga selesai.
6. JSON sessions ditimpa secara bersamaan dan TTL aktif 15/60 detik tidak
   konsisten. Tabel sesi baru menghindari lost update; sessions lama tidak perlu
   diimpor karena ephemeral. Cleanup TTL dilakukan secara terkontrol nantinya.
7. `visits.source` ada dalam referensi, tetapi sengaja tidak ditulis oleh route
   lama. Perbaiki mapping saat cutover. Fallback geolokasi lama mengirim IP ke
   `ip-api.com` via HTTP; evaluasi penggunaan hanya header Vercel/Cloudflare
   agar tidak perlu layanan tambahan untuk fungsi analytics dasar.
8. Detail `/api/works/[id]` mengembalikan profil lokal lebih dahulu, sehingga edit
   CMS untuk empat slug bisa tidak terlihat pada detail. Cutover perlu memakai
   row database visible lebih dahulu dan fallback lokal hanya saat layanan
   belum siap/gagal. Bedakan row hidden/deleted dari gangguan koneksi: jangan
   menghidupkan kembali proyek yang sengaja disembunyikan melalui fallback.
9. Beberapa endpoint lama belum menangani Supabase null secara konsisten
   (misalnya inquiries GET, projects detail GET, stats); beberapa mengirim
   `error.message` asli. Saat cutover gunakan respons 503/500 generik dan log
   kode peristiwa aman, tanpa raw error, SQL, data pribadi, URL atau parameter.
10. Public settings saat ini dapat mengungkap sessions; wajib allowlist saat
    implementasi. Pastikan semua detail nonpublik juga memeriksa visibility.
    PATCH/POST lama menerima body luas: repository baru harus memvalidasi tipe,
    panjang, allowlist kolom/key dan URL aset. Jangan interpolasi identifier.
11. Pertahankan JWT dan cookie flags. Saat menyentuh route nanti, pastikan claim
    `admin === true` dan algoritma HS256 diperiksa secara konsisten. Endpoint
    change-password lama mengembalikan password baru yang dimasukkan pengguna;
    hilangkan echo itu saat hardening endpoint, tanpa memindahkan password ke DB.

Temuan di atas dicatat untuk tahap implementasi; tidak mengubah endpoint aktif
diam-diam dalam tahap persiapan ini.

## Struktur dan dampak migrasi yang diusulkan

Semua tabel berada di schema baru **`portfolio`**, bukan public. Query repository
nanti harus memakai nama schema lengkap. Database tidak disajikan sebagai REST
publik seperti Supabase: semua akses melalui API server dan JWT/validasi aplikasi.

| Tabel | Struktur utama | Indeks/aturan penting |
| --- | --- | --- |
| `works` | text id, title/description/category/tech, image URL, nullable link, order/visible, timestamps, client/services/month/year, URL variasi gambar, JSONB gallery/review | public order; gallery array; `image_fit`, `gallery_layout`, `category_label` untuk mempertahankan mobile layout |
| `projects` | text id, photo_url, tech/review/num, metadata lama dan JSONB gallery | kompatibilitas legacy; public order |
| `inquiries` | bigint identity, created_at, name/email/message, read, ip | created_at, ip+created_at; hanya admin boleh membaca |
| `reviews` | bigint identity, author/role/company/content/rating/approved/avatar | rating 1–5; approved+created_at; tanpa seed |
| `settings` | text key PK, JSONB value | upsert by key; bukan tempat secret |
| `subscribers` | UUID, normalized unique email, created_at | trim + lowercase sebelum insert |
| `visits` | UUID, page/referrer/useragent/ip/country/city/source, created_at | created_at; data sensitif harus memiliki kebijakan retensi |
| `ad_clicks` | bigint identity, label/url/page, created_at | created_at |
| `searches` | bigint identity, unique query, count, timestamps | unique query, count descending; increment atomik |
| `active_sessions` | text session_id PK, page, started_at, last_seen | last_seen untuk count/TTL, tidak mengimpor sessions lama |

File review:

- `database/neon/preflight.sql`: introspeksi read-only target/kolom/indeks/grant;
  **belum dijalankan**.
- `database/neon/migrations/001_portfolio.sql`: transaksi, advisory lock, batas
  waktu lock/statement; membuat sepuluh tabel dan sembilan indeks sekunder.
  Menggunakan `gen_random_uuid()` bawaan PostgreSQL modern; tanpa ekstensi
  Supabase/uuid-ossp. Tidak membuat akun/auth/bucket/policy Supabase.
- `database/neon/migrations/002_seed_portfolio.sql`: empat proyek dengan URL/aset
  asli, delapan entri galeri total, Siskamling tanpa demo URL, gate false dan
  dua link sosial yang sudah terverifikasi dari profil pengguna. Tidak mengisi
  pengalaman/testimoni/analytics palsu. `ON CONFLICT DO NOTHING` menjaga edit lama.

Draft bersifat idempotent **untuk schema yang sesuai draft**: `CREATE IF NOT EXISTS`
dan insert conflict tidak menggandakan objek/data ketika dijalankan ulang.
Mereka tidak memperbaiki schema berbeda. Jika preflight menemukan objek
`portfolio` yang tidak sesuai, berhenti dan buat migration additive khusus;
jangan menganggap sukses `IF NOT EXISTS` sebagai validasi kompatibilitas.

Tidak ada DROP/TRUNCATE, perubahan public, penghapusan Regal Stay dari database
lama, atau overwrite proyek. Seed tidak otomatis mengimpor isi Supabase.
Jika data lama diimpor, lakukan pemetaan ke empat slug sebelum seed supaya
tidak ada duplikasi proyek UUID dan slug; excluded/retired projects tetap tidak
boleh muncul di publik. Identity IDs impor memerlukan reset sequence.
Konversi `tech` lokal array ke text (sesuai editor CMS lama), snake_case database
ke `categoryLabel`, `imageFit`, `galleryLayout`, serta serialisasi bigint/timestamp
harus eksplisit di repository. Update `updated_at` di query PATCH; tidak ada
trigger tersembunyi. Semua respons tetap mengikuti kontrak API lama.

Schema/tabel/sequence direvoke dari PUBLIC. Buat runtime role terpisah dengan
grant minimal yang dijelaskan di `database/neon/README.md`; owner hanya untuk
migrasi. Belum ada role/password/grant runtime yang dibuat. Tidak menggunakan
RLS sebagai pengganti JWT aplikasi; aplikasi server adalah batas akses, dan tidak
ada kredensial database yang boleh diberikan ke browser.

## Empat proyek dan keberlangsungan publik

Profil lokal `src/lib/profile.js`, aset dan seluruh empat ID dipertahankan.
Seed menggunakan nilai dari profil dan `src/lib/assets.js`:

| ID tetap | Judul | Screenshot |
| --- | --- | --- |
| `snapnext` | SnapNext | cover asli |
| `triase-net` | TRIASE-Net | cover asli |
| `suara-digital-desa` | Suara Digital Desa | cover + lima mobile gallery, contain/mobile layout |
| `siskamling` | Siskamling Digital | cover asli; demo URL tetap null |

Tidak ada Regal Stay dalam seed. Filter retired pada UI/sitemap tetap ada.
Fallback lokal memungkinkan portofolio publik tetap tampil tanpa backend opsional.
Sampai cutover, CMS/upload/inquiries/analytics masih membutuhkan konfigurasi
Supabase lama; DATABASE_URL belum menggantikannya secara otomatis.

## Strategi Storage

**Sekarang:** aset asli di `public/images/profile`, `public/images/projects`, CV
di `public/resume` tetap menjadi sumber. URL relatif yang sama disimpan di seed;
tidak perlu memindahkannya ke database atau layanan lain. Berkas akan ikut source
ketika pengguna nantinya melakukan push/deploy sendiri. Jangan memasukkan dump
database atau env ke direktori public.

**Untuk upload CMS nanti:** rekomendasi Vercel Blob sebagai layanan terpisah
karena alur deployment sudah Vercel. Alternatif S3/R2 bila dipilih pengguna.
Belum menambah SDK, membuat store atau kredensial Blob. Neon menyimpan URL dan
metadata, bukan biner gambar/video. Tidak memakai disk lokal fungsi Vercel
sebagai penyimpanan permanen. Supabase Storage dapat ditahan sementara sampai
seluruh URL lama telah disalin dan diverifikasi; jangan menghapus bucket awal.

Rencana adapter upload mempertahankan respons `{ url }` dan JWT admin:

1. Provision object storage dan token server-only secara manual. Public-read
   boleh untuk gambar portofolio; upload/delete tetap hanya admin.
2. Validasi MIME berdasarkan isi, ukuran dan batas dimensi; nama object acak,
   bukan nama/path dari request. Pertahankan Sharp/WebP, tetapi **jangan memaksa
   crop 4:5 pada screenshot desktop/mobile** seperti route lama. Original ratio
   harus tetap tersedia agar aset Tahap 4 tidak rusak.
3. Gunakan direct/client upload bertoken dengan callback server terautentikasi
   untuk file besar. Route lama menerima 50 MB, tetapi proxy body fungsi Vercel
   tidak cocok untuk batas itu. Jangan sekadar mengganti `.storage.upload()`.
4. Tambah hostname gambar yang dipilih ke konfigurasi Next Image bila dibutuhkan;
   jangan mengizinkan remote host arbitrer. Jangan bocorkan token ke URL publik.
5. Inventory objek kedua bucket lama, salin file tanpa modifikasi, verifikasi
   ukuran/hash dan keterjangkauan, lalu update URL secara terkontrol dengan backup
   mapping. Bersihkan orphan hanya setelah memastikan tidak ada referensi lain.

## Urutan penggantian API berikutnya

1. Tinjau laporan/draft, tentukan branch development dan backup/export data lama.
   Tidak perlu mengirim credential ke chat.
2. Jalankan preflight dan migrasi secara manual hanya setelah dampak disetujui.
   Siapkan runtime role dan environment privat. Uji read-only `SELECT 1` secara
   manual setelah schema siap; tidak disediakan probe publik.
3. Buat repository Neon dengan allowlist/validasi, mapping JSON, error generik.
   Mulai works/settings + sitemap/gate; pertahankan fallback empat proyek.
4. Pindah inquiry/contact/email/webhook/newsletter/reviews, dengan rate limit
   atomik per IP/hari. Count lalu insert terpisah belum cukup aman untuk request
   bersamaan. Gunakan transaksi/lock yang tepat dan jangan kirim email jika
   penyimpanan atau pemeriksaan limit gagal.
5. Pindah analytics, increment searches atomik, sesi per-row, agregasi SQL,
   batas retensi IP/visits. Hilangkan guard client bergantung Supabase.
6. Implementasikan object storage pilihan dan test upload admin/akses anonim.
7. Test unauthorized/authorized CRUD, hidden project/detail, empat slug, galeri,
   duplicate subscribe, session bersamaan, batas contact, email/webhook, sitemap,
   gate coming-soon, dan kegagalan koneksi. Pastikan tidak ada secret dalam log
   atau browser bundle. Jalankan lint/build dan regression visual cinematic.
8. Baru pilih satu backend penulisan; jangan dual-write tanpa rekonsiliasi.
   Hindari split-brain: hentikan mutasi selama copy final, cocokkan count/data,
   switch read/write bersama. Rollback ke backend lama memerlukan rekonsiliasi
   data yang sudah ditulis di Neon. Pertahankan backup dan aset lama.
9. Hapus Supabase SDK/env hanya setelah seluruh API, middleware, layout,
   trackClick, sitemap dan Storage selesai dipindahkan. Deployment tetap manual.

## File yang berubah pada tahap ini

| File | Perubahan |
| --- | --- |
| `.env.example` | Kontrak DATABASE_URL kosong dan penjelasan status legacy |
| `package.json` | Tambah satu dependency driver Neon exact 1.2.0 |
| `package-lock.json` | Lock driver baru; versi dependency lama tidak berubah |
| `src/lib/neon.js` | Koneksi lazy server-only, TLS, query parameter dan redaksi error |
| `database/neon/preflight.sql` | Draft audit target read-only |
| `database/neon/migrations/001_portfolio.sql` | Draft schema/tabel/indeks/permissions |
| `database/neon/migrations/002_seed_portfolio.sql` | Draft seed empat proyek dan dua settings |
| `database/neon/README.md` | Urutan manual, role, env, batas idempotensi dan contoh query |
| `tests/neon.test.mjs` | Enam pengujian offline koneksi/keamanan query |
| `NEON-INTEGRATION-PLAN.md` | Laporan ini |

Tidak mengubah `.env` asli, Next/React/ESLint/PostCSS override, API aktif, login,
model lama, source UI, foto, screenshot, CV atau modul cinematic. Perbandingan
lockfile menunjukkan hanya **satu package baru**, tanpa perubahan versi package
yang sudah ada. Snapshot SHA-256 pada 146 file source/aset/SQL lama semuanya sama.

## Validasi

- `npm.cmd run lint`: lulus, **0 error, 16 warning `<img>` lama**.
- `npm.cmd run build`: lulus, Next 15.5.28, **43/43 halaman statis**.
- `node --experimental-vm-modules --test tests/neon.test.mjs`: **6/6 lulus**.
  Test memakai env terisolasi dan driver stub; tidak membaca `.env` atau mengakses
  Neon. Mencakup lazy/no query on import, config kosong/invalid/TLS, parameter
  query, client reuse, error redaction dan penolakan raw string query.
- `npm.cmd audit --omit=dev`: **0 vulnerability production**. Instalasi tetap
  melaporkan 14 moderate pada tool development yang sudah didokumentasikan pada
  audit keamanan sebelumnya; tidak menggunakan audit fix/force.
- SHA-256 source/UI/API/animasi dan aset lama tidak berubah. Tidak mengklaim
  browser regression baru untuk animasi yang tidak disentuh.
- Pemeriksaan offline seed terhadap profil/aset lokal: empat proyek dan delapan
  entri galeri cocok, semua file ada. Pemindaian `.next/static` tidak menemukan
  nilai environment privat yang terkonfigurasi dan diperiksa; `.env` tetap
  diabaikan Git. Nilai credential tidak dicetak oleh pemeriksaan.
- SQL belum dieksekusi/diuji ulang pada PostgreSQL: tidak ada `psql` lokal dan
  Docker engine tidak berjalan. Idempotensi merupakan rancangan SQL, bukan hasil
  eksekusi pada Neon. Uji dua kali di development branch setelah review sebelum
  mempertimbangkan produksi. Build bukan pengujian koneksi atau skema remote.

## Langkah manual pengguna

Tinjau tabel/schema terpisah dan strategi Storage di atas, pastikan branch
development Neon yang benar serta backup data lama. Setelah struktur disetujui,
ikuti urutan `database/neon/README.md` untuk preflight, migration, import/seed dan
grant runtime. Isi DATABASE_URL privat dengan role runtime/TLS; jangan mengganti
JWT_SECRET atau ADMIN_PASSWORD hanya karena berpindah database. Tahap selanjutnya
adalah implementasi cutover API teruji dan pilihan object storage. Portofolio
belum membutuhkan deployment untuk menyelesaikan langkah persiapan ini.
