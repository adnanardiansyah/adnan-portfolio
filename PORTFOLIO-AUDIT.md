# Audit dan konfigurasi portofolio Adnan Ardiansyah

> Pembaruan keamanan dependency: lihat [SECURITY-AUDIT.md](SECURITY-AUDIT.md) untuk versi dan hasil audit terbaru. Bagian dependency di bawah mencatat kondisi saat personalisasi awal.

## Struktur

- Next.js 15 App Router, React 19, Tailwind CSS 4.
- `src/app/page.js`: rangkaian Hero → About → Work → Contact → Footer.
- `src/components`: GSAP/ScrollTrigger, Lenis, BlurText, cursor, video scrub maju/mundur, kartu profil tilt, dan shader.
- `src/views`: tampilan About, Contact, dan galeri Projects berbasis OGL/WebGL.
- `src/app/api`: admin JWT, proyek, upload, inquiries, analytics, newsletter, dan integrasi email.
- `supabase/migrations/run-sql-supabase.sql`: referensi skema database asli; tidak diubah. Header file menyatakan bahwa file ini bukan migrasi siap eksekusi.
- `supabase/migrations/20261102_contact_rate_limit.sql`: tambahan idempotent kolom `inquiries.ip` dan indeks untuk rate limit kontak, yang belum ada pada referensi skema asli.
- `src/lib/models` dan `mongodb.js`: kode MongoDB lama tetap tersedia. API aktif menggunakan Supabase.

## Perbaikan dan personalisasi

- Identitas, hero, bio, pendidikan, expertise, proyek, footer, metadata, JSON-LD, manifest, ikon, dan konten LLM disesuaikan.
- Palet violet dan electric blue; video dan gambar cinematic asli diberi color grading CSS. Aset video, model 3D, shader, dan interaksi asli tetap dipertahankan.
- GSAP, Three.js/React Three Fiber, OGL, Lenis, kartu tilt, galeri melengkung, transisi scroll, dan shader kontak tidak diganti dengan versi statis.
- Konfigurasi PostCSS yang hilang ditambahkan agar utility Tailwind benar-benar dikompilasi. Konfigurasi ESLint 9 ditambahkan dan error JSX bawaan diperbaiki.
- Rute About duplikat `page.jsx` dihapus; `page.js` menjadi rute tunggal.
- Pembersihan ticker Lenis saat navigasi diperbaiki. Dependensi efek galeri/video diperbaiki tanpa mengganti perilaku animasi.
- Lima proyek tersedia melalui data lokal di `src/lib/profile.js`, termasuk halaman detail dan galeri 3D tanpa database. Link biasa melengkapi canvas untuk navigasi keyboard.
- Tidak ada riwayat kerja, tanggal pendidikan, penghargaan, testimoni, rating, atau angka pencapaian yang ditambahkan. Statistik lama pada Hero dihapus. Experience berisi pengalaman proyek yang disebutkan pemilik.
- Tech Stack diberi label **Exploration**; daftar ini bukan klaim tingkat kemahiran. Sesuaikan daftar teknologi setelah stack personal dikonfirmasi.
- Foto profil dan visual proyek adalah placeholder yang diberi label. Ilustrasi cinematic bawaan tetap menjadi latar dekoratif, bukan foto Adnan.
- Link Suara Digital Desa diberi keterangan halaman kebijakan privasi, sesuai URL yang diberikan. Detail fitur, peran, stack per proyek, hasil, dan studi kasus tidak direka. Empat URL proyek tidak dapat dibaca melalui alat web pada sesi ini; konten dibatasi pada informasi pemilik.
- Supabase service role diisolasi melalui `server-only`. Tidak ada `.env.local` atau kredensial nyata dalam checkout saat audit.
- Resend dibuat hanya ketika API key tersedia. Form dan layanan opsional mengembalikan 503 bila belum dikonfigurasi, bukan sukses palsu. Input kontak divalidasi dan di-escape pada email HTML.
- Popup kontak kini meminta alamat email, memperbaiki pengiriman email kosong pada template. Nomor WhatsApp palsu dihapus; pilihan WhatsApp dinonaktifkan sebelum nomor asli diisi.
- Webhook Resend memverifikasi signature Svix sebelum memasukkan email ke database. File verifikasi Bing milik template dihapus; verifikasi pemilik baru tetap didukung melalui environment.

## Menjalankan lokal

```powershell
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:3000`. Portofolio publik dapat berjalan tanpa `.env.local`. Pada Windows dengan execution policy yang membatasi `npm.ps1`, gunakan `npm.cmd` seperti di atas.

## Konfigurasi yang diperlukan

Salin `.env.example` menjadi `.env.local`, lalu isi hanya layanan yang digunakan. Jangan commit `.env.local`.

| Fitur | Konfigurasi |
| --- | --- |
| Domain dan SEO | `NEXT_PUBLIC_SITE_URL`: URL HTTPS deployment milik Adnan. Tanpa ini, pengembangan memakai localhost dan sitemap kosong. Jangan memakai domain pembuat template. |
| Database/admin CMS | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; siapkan tabel berdasarkan referensi skema asli melalui migrasi yang sudah diperiksa. File `run-sql-supabase.sql` diberi label context-only oleh template, jadi jangan langsung mengeksekusinya tanpa pemeriksaan. Setelah tabel `inquiries` tersedia, terapkan `20261102_contact_rate_limit.sql`. |
| Login admin | `ADMIN_PASSWORD`, `JWT_SECRET` acak yang kuat (minimal 32 byte). Cookie tetap HttpOnly, SameSite strict, dan Secure pada production. Tanpa konfigurasi, login dinonaktifkan. |
| Upload gambar/video | Supabase Storage dengan izin bucket `project-photos`. Endpoint upload asli tetap dipertahankan. |
| Form email dan balasan admin | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` dari domain yang sudah diverifikasi, dan `ADMIN_EMAIL` asli. Form juga membutuhkan Supabase untuk penyimpanan inquiry dan rate limit. |
| Email masuk | Tambahkan `RESEND_WEBHOOK_SECRET` dari dashboard webhook Resend dan arahkan event `email.received` ke `/api/webhooks/resend`. Signature Svix wajib valid. |
| Newsletter | Supabase dengan tabel `subscribers`, lalu `NEXT_PUBLIC_ENABLE_NEWSLETTER=true`. Popup tidak aktif secara default. |
| WhatsApp | `NEXT_PUBLIC_WHATSAPP_NUMBER` berupa nomor asli format internasional tanpa `+`. Tidak diperlukan untuk LinkedIn atau email. |
| Coming soon | Pengaturan `coming_soon` pada Supabase dan `COMING_SOON_PASSWORD` jika perlu bypass. Tanpa database, halaman publik tetap terbuka. |
| Verifikasi mesin pencari | Opsional: `NEXT_PUBLIC_GOOGLE_VERIFICATION`, `NEXT_PUBLIC_BING_VERIFICATION` milik pemilik baru. |
| MongoDB lama | `MONGODB_URI` hanya jika kode model lama akan digunakan kembali; tidak dibutuhkan untuk halaman publik/API Supabase saat ini. |

`SUPABASE_SERVICE_ROLE_KEY`, JWT, password admin, dan key Resend harus berada di server; jangan beri prefix `NEXT_PUBLIC_`. Variabel `NEXT_PUBLIC_` memang terlihat oleh browser.

Data lokal proyek dikelola di `src/lib/profile.js`. CMS admin tetap mengelola baris Supabase; proyek lokal tidak muncul sebagai baris yang bisa dihapus di CMS. Proyek Supabase dengan ID yang sama dapat menggantikan data lokal pada daftar, sedangkan slug lokal tetap mempunyai detail statis. Gunakan ID unik untuk tambahan CMS. Untuk memindahkan kelima proyek sepenuhnya ke CMS, masukkan kontennya ke database lalu hapus entri lokal yang sesuai secara sengaja.

Tombol resume diarahkan ke LinkedIn karena file CV belum diberikan. Ganti placeholder profil dan proyek ketika aset asli tersedia. Tambahkan deskripsi, peran, teknologi, dan detail Siskamling hanya setelah informasinya dikonfirmasi.

## Validasi

- `npm.cmd run lint`: lolos tanpa error. Tersisa peringatan `<img>` pada komponen template yang mendukung gambar/video dinamis dan preview admin.
- `npm.cmd run build`: berhasil tanpa Supabase, Resend, atau kredensial admin. Google Fonts membutuhkan akses jaringan pada build pertama; font Inter dan Playfair Display asli dipertahankan.
- Edge headless: Home, About, Projects, Contact, detail SnapNext, dan detail Siskamling pada viewport 1440×1000, 820×1180, dan 390×844; tidak ada overflow horizontal atau exception JavaScript. Galeri dan shader menghasilkan canvas WebGL.
- HTTP: daftar/detail proyek lokal 200, proyek tak dikenal 404, settings/reviews tanpa database tetap dapat dibaca, `/admin` diarahkan ke login, dan email/login/newsletter yang belum dikonfigurasi 503.
- Pengiriman email nyata, CRUD Supabase, upload Storage, dan autentikasi memakai kredensial produksi belum diuji karena kredensial tidak tersedia.

## Dependency

Audit npm pada 2 November 2026 masih melaporkan **23 vulnerabilities: 16 moderate, 6 high, 1 critical** dari instalasi awal. Paket `next` tercatat critical. Beberapa rekomendasi npm melibatkan perubahan mayor/downgrade tooling; `npm audit fix --force` tidak dijalankan. Versi dependency belum dimigrasikan dalam personalisasi ini; perubahan nama pada lockfile tetap mempertahankan perubahan instalasi milik pengguna. `@supabase/auth-helpers-nextjs` juga deprecated dan tetap dipertahankan agar integrasi lama tidak berubah tanpa migrasi yang diuji.

## Fondasi dan lisensi

Fondasi: [Nextjs-cinematic-portfolio](https://github.com/5araang/Nextjs-cinematic-portfolio). Lisensi sumber tetap tersedia di `LICENSE`. Tidak ada deployment atau perubahan pada layanan eksternal yang dilakukan.

## Daftar file diubah / ditambahkan / dihapus

Daftar ini termasuk perubahan instalasi awal pada lockfile. File About duplikat dan verifikasi Bing lama dihapus; file lainnya diubah atau ditambahkan.

- `.env.example`
- `.gitignore`
- `PORTFOLIO-AUDIT.md`
- `eslint.config.mjs`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `public/BingSiteAuth.xml`
- `public/favicon.ico`
- `public/llms-full.txt`
- `public/llms.txt`
- `public/placeholders/mark.svg`
- `public/placeholders/profile.svg`
- `public/placeholders/project-1.svg`
- `public/placeholders/project-2.svg`
- `public/placeholders/project-3.svg`
- `public/placeholders/project-4.svg`
- `public/placeholders/project-5.svg`
- `public/placeholders/social.png`
- `public/placeholders/social.svg`
- `public/searchwords.xml`
- `src/app/about/content.js`
- `src/app/about/page.js`
- `src/app/about/page.jsx`
- `src/app/admin/(panel)/analytics/page.jsx`
- `src/app/admin/(panel)/inquiries/page.jsx`
- `src/app/admin/(panel)/links/page.jsx`
- `src/app/admin/(panel)/page.jsx`
- `src/app/admin/(panel)/projects/page.jsx`
- `src/app/admin/(panel)/reviews/page.jsx`
- `src/app/admin/(panel)/settings/page.jsx`
- `src/app/admin/add-project/page.jsx`
- `src/app/admin/login/page.jsx`
- `src/app/api/admin/login/route.js`
- `src/app/api/admin/send-email/route.js`
- `src/app/api/analytics/click/route.js`
- `src/app/api/analytics/ping-leave/route.js`
- `src/app/api/analytics/ping/route.js`
- `src/app/api/analytics/search/route.js`
- `src/app/api/analytics/stats/route.js`
- `src/app/api/analytics/visit/route.js`
- `src/app/api/contact/route.js`
- `src/app/api/inquiries/[id]/route.js`
- `src/app/api/inquiries/route.js`
- `src/app/api/llms/route.js`
- `src/app/api/projects/[id]/route.js`
- `src/app/api/projects/route.js`
- `src/app/api/reviews/[id]/route.js`
- `src/app/api/reviews/route.js`
- `src/app/api/settings/route.js`
- `src/app/api/subscribe/route.js`
- `src/app/api/upload/route.js`
- `src/app/api/webhooks/resend/route.js`
- `src/app/api/works/[id]/route.js`
- `src/app/api/works/route.js`
- `src/app/apple-icon.png`
- `src/app/coming-soon/page.jsx`
- `src/app/contact/content.js`
- `src/app/contact/page.js`
- `src/app/favicon.png`
- `src/app/globals.css`
- `src/app/icon.png`
- `src/app/layout.js`
- `src/app/manifest.js`
- `src/app/not-found.jsx`
- `src/app/project/[id]/page.jsx`
- `src/app/projects/page.js`
- `src/app/robots.js`
- `src/app/sitemap.js`
- `src/app/work/content.js`
- `src/components/About.jsx`
- `src/components/CircularGallery/CircularGallery.jsx`
- `src/components/Contact.jsx`
- `src/components/ContactPopup.jsx`
- `src/components/Dither.jsx`
- `src/components/Footer.jsx`
- `src/components/Hero.jsx`
- `src/components/Navbar.jsx`
- `src/components/NewsletterPopup.jsx`
- `src/components/PageShell.jsx`
- `src/components/ProfileCard.css`
- `src/components/ProfileCard.jsx`
- `src/components/SeoContent.jsx`
- `src/components/VideoScrub.jsx`
- `src/components/Work.jsx`
- `src/components/admin/AdminNav.jsx`
- `src/hooks/useGeoDialCode.js`
- `src/lib/mongodb.js`
- `src/lib/profile.js`
- `src/lib/supabase.js`
- `src/lib/trackClick.js`
- `src/middleware.js`
- `src/views/about.jsx`
- `src/views/contact.jsx`
- `src/views/open-source.jsx`
- `src/views/projects.jsx`
- `supabase/migrations/20261102_contact_rate_limit.sql`
