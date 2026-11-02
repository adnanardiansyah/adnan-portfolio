# Audit keamanan dependency — 2 November 2026

## Ruang lingkup

Audit ini melanjutkan personalisasi portofolio Adnan. Perbandingan menggunakan kondisi workspace pada awal tugas keamanan, termasuk perubahan personalisasi yang belum di-commit. Tidak ada deployment, perubahan database, autentikasi, API, desain, konten, atau kode animasi.

## Hasil npm audit

| Pemeriksaan | Critical | High | Moderate | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sebelum perbaikan, seluruh dependency | 1 | 6 | 16 | 0 | 23 |
| Setelah perbaikan, seluruh dependency | 0 | 0 | 14 | 0 | 14 |
| Setelah perbaikan, `--omit=dev` | 0 | 0 | 0 | 0 | 0 |

Angka ini merupakan jumlah paket yang ditandai npm, termasuk paket induk yang terdampak dependency transitif. Empat belas temuan yang tersisa bukan empat belas akar masalah berbeda: semuanya mengikuti advisori Minimatch yang sama pada rantai tooling ESLint.

## Perbaikan bertahap

1. Menyimpan baseline manifest, lockfile, versi terpasang, hasil audit, dan hash SHA-256 kode aplikasi/aset/database/konfigurasi.
2. Memperbarui Next.js ke **15.5.28** dan `eslint-config-next` yang selaras. Tetap menggunakan major 15 untuk menghindari migrasi framework, middleware, konfigurasi, dan proses build ke Next.js 16.
3. Memperbarui React dan React DOM bersama-sama ke **19.2.9**, tetap pada jalur patch 19.2. React tidak ditandai sebagai paket rentan secara langsung pada baseline; patch pasangan runtime diambil untuk menjaga konsistensi dan kompatibilitas framework.
4. Memperbarui Sharp ke **0.35.5**. Next.js menerima `^0.34.3 || ^0.35.5`; resolusi akhir memakai Sharp aman yang sama dan menghapus salinan Sharp lama yang sebelumnya tersarang. Tidak diperlukan perubahan API upload.
5. Memperbarui Mongoose dalam major 9; versi terpasang **9.11.4**, dengan batas minimum manifest `^9.7.2`, yaitu jalur yang sudah menutup prototype pollution. Model dan akses database tidak diubah.
6. Memperbarui ESLint pada major kompatibel **9.39.5** dan mendeklarasikan `@eslint/eslintrc` **3.3.7** sebagai dev dependency langsung, karena konfigurasi memang mengimpor `FlatCompat` dari paket ini.
7. Menghapus `@supabase/auth-helpers-nextjs` **0.15.0** yang deprecated setelah memastikan tidak ada import/pemakaian pada kode aplikasi. Tidak menambahkan `@supabase/ssr`, karena aplikasi tidak menggunakan Supabase Auth Helpers: autentikasi admin tetap JWT/Jose dan database tetap memakai `@supabase/supabase-js`.
8. Memperbarui dependency transitif dalam jalur kompatibel: PostCSS, JS-YAML, brace-expansion, nanoid, source-map-js, dan fflate.
9. Menambahkan `overrides.postcss = "8.5.32"`. Next.js 15 masih memin PostCSS **8.4.31** yang rentan. Seluruh pemakai PostCSS pada graph ini menggunakan major 8; override menutup kerentanan tanpa mengganti konfigurasi Tailwind maupun optimizer CSS. Override khusus Next.js sempat tetap menghasilkan salinan lama pada resolver npm; override global lalu berhasil dideduplikasi. Evaluasi ulang override ini bila kelak ada dependency yang memerlukan PostCSS major berbeda atau framework berhenti memin versi rentan.
10. Menguji instalasi ulang melalui `npm ci`, lint, build production, fungsi halaman, dan audit ulang.

`npm audit fix --force` tidak dijalankan. Perubahan paket dipilih berdasarkan advisori, metadata registry, peer dependency, dan batas versi yang digunakan proyek.

## Kompatibilitas dan dependency deprecated

**Sharp:** perpindahan `0.33` → `0.35` melewati minor pada paket pra-1.0 dan berpotensi breaking. Sharp 0.35 membutuhkan Node >=20.9. Mongoose yang digunakan juga membutuhkan Node >=20.19. Lingkungan verifikasi memakai Node **24.14.0**. Pemakaian aplikasi tetap `metadata`, `resize`, `webp`, dan `toBuffer`; konversi gambar serta endpoint optimasi gambar diperiksa setelah pembaruan. Tidak menonaktifkan SVG atau AVIF melalui perubahan UI/config sebagai pengganti patch.

**Auth Helpers:** penghapusan dependency yang tidak digunakan menghilangkan paket deprecated tanpa memigrasikan alur autentikasi. Bila kelak memakai Supabase Auth untuk sesi pengguna, gunakan migrasi resmi ke `@supabase/ssr` sebagai pekerjaan terpisah; jangan memasang keduanya sekaligus.

**ESLint 9:** versi terbaru pada major 9 tetap EOL/deprecated. `eslint-config-next@15.5.28` mendukung ESLint 7/8/9, sedangkan beberapa plugin React/import/accessibility yang digunakan belum mendeklarasikan dukungan ESLint 10. Pembaruan paksa ke ESLint 10 atau downgrade ke ESLint 4 bukan perbaikan kompatibel untuk konfigurasi ini. Tidak menonaktifkan rule atau menyembunyikan audit untuk menurunkan jumlah temuan.

**Critters:** versi terpasang tetap **0.0.23**. Versi publik 0.0.24/0.0.25 menyatakan deprecation dan mengarahkan ke fork Beasties. Paket ini dimuat oleh `experimental.optimizeCss` Next.js; mengganti nama paket langsung akan membuat framework gagal memuat optimizer. Tidak ada temuan audit tersisa pada Critters setelah PostCSS diperbaiki. Migrasi ke Beasties memerlukan pemeriksaan integrasi/alias serta perbandingan CSS dan visual tersendiri; tidak dilakukan pada tugas ini agar output desain tetap sama.

## Temuan yang belum terselesaikan

Akar masalah: [GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249), potensi denial of service melalui amplifikasi pola glob pada Minimatch. npm menandai versi **<11.0.1**. Graph terpasang berisi **3.1.5** dan **10.2.5** pada tooling pengembangan.

Paket induk masih meminta `^3` atau `^10`; metadata terbaru plugin dan TypeScript ESLint juga diperiksa. Minimatch modern memiliki bentuk ekspor/API berbeda dari penggunaan callable/default import pada plugin lama. Override global ke versi 11 tidak dianggap perbaikan kompatibel. Risiko yang relevan berada pada proses lint/analisis dengan pola glob yang dipengaruhi input tak tepercaya; input lint proyek ini berasal dari konfigurasi repository. `npm audit --omit=dev` tidak menemukan dependency rentan. Hasil audit bukan jaminan bebas seluruh kerentanan di luar database advisori npm.

Alternatif:

- Ambil patch/backport dari pemelihara yang tetap cocok dengan major yang diminta paket induk.
- Lakukan migrasi tooling terpisah ke ESLint yang masih didukung beserta plugin yang kompatibel dengan Minimatch aman. Migrasi Next.js saja belum menjamin akar transitif ini hilang; audit dan pemeriksaan rule tetap diperlukan.
- Sampai migrasi tersedia, hindari menjalankan lint pada konfigurasi glob tidak tepercaya tanpa pembatasan sumber daya. Jangan memaksa seluruh graph memakai Minimatch 11 atau memakai `npm audit fix --force` yang menyarankan downgrade tidak relevan.

## Validasi

- **Instalasi bersih:** `npm.cmd ci --cache .npm-cache --no-audit` berhasil dari lockfile akhir; 435 paket terpasang. Resolver menggunakan satu PostCSS 8.5.32 bersama Next.js/Tailwind/Critters dan satu Sharp 0.35.5 untuk aplikasi/Next.js.
- **Lint:** `npm.cmd run lint` berhasil, exit 0, **0 error / 16 warning** penggunaan `<img>` yang sudah ada pada template. Tidak ada rule yang dimatikan untuk meloloskan upgrade.
- **Build production:** `npm.cmd run build` berhasil, exit 0, seluruh **43 halaman statis** berhasil dihasilkan. Build pertama dalam sandbox gagal mengunduh Google Fonts; setelah akses jaringan untuk font diberikan, build berhasil tanpa mengganti font atau kode layout. Build bersih juga menampilkan warning bundler tentang `CompressionStream`/`DecompressionStream` dari modul JWE Jose pada Edge Runtime. Versi Jose dan middleware tidak berubah; alur yang digunakan tetap JWT. Tidak mengubah autentikasi untuk menghilangkan warning tersebut.
- **Browser production:** Edge headless menjalankan Home, About, Projects, Contact, detail SnapNext, dan detail Siskamling pada **1440×1000**, **820×1180**, dan **390×844**. Seluruh 18 kombinasi halaman/viewport lolos pemeriksaan overflow, branding/title, navigasi fixed, dan canvas WebGL pada halaman yang menggunakannya. Konteks WebGL 2 aktif, tidak hilang, dan `gl.getError()` mengembalikan 0.
- **Interaksi:** filter App menghasilkan hanya Siskamling, menu mobile terbuka dan navigasi berikutnya memulihkan halaman, tilt kartu desktop merespons pointer, video maju/mundur merespons scroll (posisi scroll 1600; waktu video berubah menjadi sekitar 5.46 dan 9.84 detik), drag galeri menghasilkan frame baru, dan shader kontak menghasilkan frame baru. Tidak ada exception JavaScript pada pemeriksaan interaksi akhir. Pemeriksaan tilt awal sempat memilih kartu mobile tersembunyi; selector pengujian diperbaiki agar memilih kartu yang terlihat, tanpa mengubah kode aplikasi.
- **Native image processing:** Sharp memproses WebP, SVG placeholder tepercaya, dan PNG menjadi WebP 240×300. Binary terpasang melaporkan Sharp **0.35.5**, libvips **8.18.7**, dan librsvg **2.63.2**.
- **Image Optimization API:** permintaan `/_next/image?url=%2Fphoto%2Fhero.webp&w=640&q=75` dengan Accept WebP mengembalikan 200 dan gambar WebP dengan lebar 640; bukan hanya berhasil mengimpor modul native.
- **Library cinematic:** import React/React DOM server, GSAP, Three.js, OGL, Lenis, React Three Fiber, Drei, React Three Postprocessing, Postprocessing, dan Mongoose berhasil. Versi seluruh library animasi tidak berubah. Komponen Three.js yang tidak dipasang pada rute publik diperiksa pada tingkat import/peer dependency; tidak diklaim telah dirender pada halaman yang tidak memakainya.
- **HTTP/API:** enam halaman publik 200; daftar dan kelima detail proyek lokal 200; filter App berisi satu proyek; ID tak dikenal 404; settings/reviews tanpa database dapat dibaca; inquiries dan analytics admin tanpa sesi 401; `/admin` dan `/admin/projects` mengarah ke login dengan 307. Form email, login, newsletter, upload, dan webhook tanpa konfigurasi memberi 503, tanpa pengiriman atau penyimpanan palsu.
- **Audit akhir setelah pengujian:** `npm.cmd audit` tetap **14 moderate / 0 high / 0 critical**, exit 1 karena temuan moderate; `npm.cmd audit --omit=dev` **0 vulnerabilities**, exit 0. Tidak ada advisori yang diabaikan atau disembunyikan dari hitungan.
- **Integritas:** SHA-256 **130 file** kode aplikasi/aset/database/konfigurasi cocok dengan baseline awal tugas. `git diff --check` lolos. Tidak melakukan deployment.

Pengujian login dengan kredensial produksi, CRUD pada Supabase/MongoDB, upload Storage nyata, serta pengiriman/penerimaan email nyata belum dilakukan karena layanan dan kredensial tidak tersedia. Pemeriksaan API di atas memvalidasi proteksi tanpa sesi dan fallback konfigurasi. Tidak membuat kredensial palsu atau mengubah data layanan untuk pengujian.

## File yang dimodifikasi pada tugas keamanan

- `package.json`: batas minimum versi aman, penghapusan Auth Helpers yang tidak digunakan, dev dependency FlatCompat, dan override PostCSS.
- `package-lock.json`: resolusi dan integrity dependency hasil npm; mencakup penghapusan Sharp lama dan dependency yang tidak lagi diperlukan.
- `SECURITY-AUDIT.md`: laporan ini.
- `PORTFOLIO-AUDIT.md`: penunjuk ke hasil audit keamanan terbaru; audit personalisasi awal tetap disimpan sebagai catatan historis.

Kode aplikasi, shader, video, foto/placeholder, model 3D, database, API, middleware, konfigurasi ESLint/Next.js/PostCSS, dan stylesheet dibandingkan dengan hash baseline untuk memastikan tidak berubah.

## Sumber primer

- [Advisori Next.js RCE dan patch 15.5.28](https://github.com/advisories/GHSA-2464-fhr4-w9xw).
- [Advisori Sharp/librsvg dan patch 0.35.5](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
- [Catatan rilis Sharp 0.35.5](https://sharp.pixelplumbing.com/changelog/v0.35.5/).
- [Advisori Mongoose prototype pollution](https://github.com/advisories/GHSA-664h-wqgq-64gw).
- [Advisori PostCSS source-map disclosure](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp).
- [Status dukungan ESLint](https://eslint.org/version-support/).
- [Migrasi resmi Supabase Auth Helpers](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers).
- [Fork Critters yang dipelihara: Beasties](https://github.com/danielroe/beasties).

Versi, engine, peer dependency, deprecation, dan hasil audit diverifikasi pula langsung melalui registry npm pada tanggal audit.

## Daftar temuan sebelum dan sesudah

| Paket ditandai npm | Sebelum | Sesudah |
| --- | --- | --- |
| `@eslint-community/eslint-utils` | moderate | moderate |
| `@eslint/config-array` | moderate | moderate |
| `@eslint/eslintrc` | moderate | moderate |
| `@typescript-eslint/eslint-plugin` | moderate | moderate |
| `@typescript-eslint/parser` | moderate | moderate |
| `@typescript-eslint/type-utils` | moderate | moderate |
| `@typescript-eslint/typescript-estree` | moderate | moderate |
| `@typescript-eslint/utils` | moderate | moderate |
| `brace-expansion` | high | Tidak terdeteksi lagi |
| `eslint` | moderate | moderate |
| `eslint-config-next` | moderate | moderate |
| `eslint-plugin-import` | moderate | moderate |
| `eslint-plugin-jsx-a11y` | moderate | moderate |
| `eslint-plugin-react` | moderate | moderate |
| `fflate` | moderate | Tidak terdeteksi lagi |
| `js-yaml` | high | Tidak terdeteksi lagi |
| `minimatch` | moderate | moderate |
| `mongoose` | moderate | Tidak terdeteksi lagi |
| `nanoid` | high | Tidak terdeteksi lagi |
| `next` | critical | Tidak terdeteksi lagi |
| `postcss` | high | Tidak terdeteksi lagi |
| `sharp` | high | Tidak terdeteksi lagi |
| `source-map-js` | high | Tidak terdeteksi lagi |

## Versi seluruh dependency langsung yang diperiksa

Versi di bawah adalah versi terpasang pada lockfile, bukan sekadar rentang manifest. Paket visual/animasi dipertahankan.

| Dependency | Sebelum | Sesudah |
| --- | --- | --- |
| `@eslint/eslintrc` | 3.3.5 | 3.3.7 |
| `@react-three/drei` | 10.7.7 | 10.7.7 |
| `@react-three/fiber` | 9.6.1 | 9.6.1 |
| `@react-three/postprocessing` | 3.0.4 | 3.0.4 |
| `@supabase/auth-helpers-nextjs` | 0.15.0 | Dihapus |
| `@supabase/supabase-js` | 2.105.4 | 2.105.4 |
| `@tailwindcss/postcss` | 4.3.0 | 4.3.0 |
| `@vercel/analytics` | 2.0.1 | 2.0.1 |
| `critters` | 0.0.23 | 0.0.23 |
| `eslint` | 9.39.4 | 9.39.5 |
| `eslint-config-next` | 15.5.18 | 15.5.28 |
| `framer-motion` | 12.38.0 | 12.38.0 |
| `gsap` | 3.15.0 | 3.15.0 |
| `jose` | 6.2.3 | 6.2.3 |
| `lenis` | 1.3.23 | 1.3.23 |
| `maath` | 0.10.8 | 0.10.8 |
| `mongoose` | 9.6.2 | 9.11.4 |
| `motion` | 12.38.0 | 12.38.0 |
| `next` | 15.5.18 | 15.5.28 |
| `ogl` | 1.0.11 | 1.0.11 |
| `postprocessing` | 6.39.1 | 6.39.1 |
| `react` | 19.2.4 | 19.2.9 |
| `react-dom` | 19.2.4 | 19.2.9 |
| `react-icons` | 5.6.0 | 5.6.0 |
| `resend` | 6.12.3 | 6.12.3 |
| `sharp` | 0.33.5 | 0.35.5 |
| `tailwindcss` | 4.3.0 | 4.3.0 |
| `three` | 0.184.0 | 0.184.0 |

## Patch transitif utama

| Paket | Versi lama | Versi terkunci setelah perbaikan |
| --- | --- | --- |
| `postcss` | 8.4.31, 8.5.14 | 8.5.32 |
| `brace-expansion` | 5.0.6, 1.1.14 | 5.0.12, 1.1.21 |
| `nanoid` | 3.3.12 | 3.3.20 |
| `source-map-js` | 1.2.1 | 1.2.2 |
| `fflate` | 0.8.3, 0.6.10 | 0.8.3, 0.6.11 |
| `js-yaml` | 4.1.1 | 4.3.2 |
