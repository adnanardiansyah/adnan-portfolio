# Tahap 5.6 — Upload gambar Vercel Blob

Tanggal: 3 November 2026. Status: **implementasi siap; upload ke storage nyata
belum diuji** karena token/hostname Blob belum tersedia. Tidak ada permintaan ke
Blob, biaya storage, deployment, migrasi schema atau perubahan branch main.

## Audit awal

- `/api/upload` sebelumnya memverifikasi admin lalu selalu 503.
- Form panel projects sebelumnya upload segera ketika dipilih dan mengonversi di
  browser. Gallery memakai Promise.all: kegagalan sebagian berisiko kehilangan
  URL yang sudah berhasil diunggah. Menutup draft juga dapat meninggalkan file.
- Form add-project menampilkan object URL lokal, tetapi nama field file untuk
  cover/logo/desktop/phone tidak sesuai nama yang dibaca saat submit. Ini dapat
  meneruskan object URL browser sebagai metadata, bukan URL storage.
- `portfolio.works` sudah mempunyai image_url, variasi URL, gallery JSONB,
  image_fit dan gallery_layout. Tidak perlu mengubah tabel. Repository yang ada
  menyimpan URL melalui query JSONB berparameter.
- ProjectCard memakai Next Image unoptimized; detail/gallery dan admin memakai
  elemen gambar biasa. Semuanya mendukung path lokal dan URL HTTPS. Tidak perlu
  mengubah desain kartu/halaman detail atau animasi.
- Tidak ditemukan BLOB_READ_WRITE_TOKEN/BLOB_PUBLIC_HOSTNAME pada environment
  efektif. Tidak membuat token atau store pengganti.

## Arsitektur

1. Admin memilih file. Helper client memvalidasi JPEG/PNG/WebP dan ukuran maksimal
   **3 MiB per file**, lalu membuat preview object URL. Tidak ada upload saat
   pemilihan, penggantian, penghapusan pilihan, atau pembatalan draft.
2. Saat Simpan, helper mengunggah file yang masih dipakai secara berurutan melalui
   POST multipart `/api/upload`. Pilihan yang dihapus tidak dikirim. File yang sama
   dalam satu batch diunggah sekali; URL sukses di-cache selama form tetap terbuka.
3. API memakai verifier JWT admin dan pemeriksaan same-origin yang sudah lulus.
   Anonymous ditolak sebelum membaca isi request. Maksimal satu field `file`;
   URL, path, field tambahan, dan nama objek dari request tidak diterima.
4. Seluruh request dibatasi **4 MiB**, termasuk ketika Content-Length tidak ada.
   Server memvalidasi MIME dan format hasil decode Sharp, menolak SVG/GIF/video,
   gambar rusak, multi-frame/animasi, dan lebih dari 20 juta pixel.
5. Sharp menghormati orientasi, menghapus metadata, dan mengubah hasil ke WebP.
   **Tidak ada crop atau resize**; rasio desktop/mobile dipertahankan. Output
   juga dibatasi 3 MiB. Aset asli dalam public tidak disentuh.
6. Tanpa token atau hostname store yang valid, API memberikan 503 yang jelas.
   Payload malformed/tidak valid ditolak 400/413 terlebih dahulu. Tidak ada URL
   atau status sukses palsu.
7. Bila storage siap: batas persisten 40 upload/jam/IP, kemudian reservasi ledger
   `_blob:upload:<pathname>` pada `portfolio.settings` sebelum memanggil Blob.
   Jika reservasi DB gagal, tidak ada upload. Key ledger tidak masuk settings
   publik. Tidak ada tambahan tabel/migration.
8. Nama objek ditetapkan server: `portfolio/projects/<UUID>.webp`, public-read,
   tanpa overwrite. Tidak memakai nama file/path dari pengguna. UUID menjadi
   keunikan pathname; random suffix SDK tidak diperlukan.
9. SDK `put` menerima token hanya dari server. URL hasil harus cocok dengan
   hostname/path store yang dikonfigurasi; ledger lalu berstatus uploaded.
   API tetap mengembalikan kontrak `{ url }` yang digunakan form.
10. Setelah seluruh URL siap, form menyimpan metadata memakai POST/PATCH works
    yang sudah ada. Jika penyimpanan metadata gagal, form tidak ditutup dan URL
    upload sukses dapat dipakai saat retry tanpa upload ulang selama sesi form.

Metode server upload dipilih karena batas gambar 3 MiB dan total body 4 MiB berada
di bawah batas request Vercel Functions 4.5 MB. Tidak ada scoped client token atau
callback publik yang diperlukan untuk alur ini. Jika kelak menerima file lebih
besar, jangan sekadar menaikkan batas: gunakan direct client upload dengan endpoint
penerbit token yang tetap memeriksa JWT admin. Lihat
[batas server upload Vercel](https://vercel.com/docs/vercel-blob/server-upload) dan
[pola client upload resmi](https://vercel.com/docs/vercel-blob/client-upload).

## Penggantian gambar, kegagalan, dan orphan

- Menghapus gambar dari form hanya mengubah pilihan metadata. Tidak ada `del`
  pada implementasi ini, termasuk saat mengganti cover atau menghapus proyek.
  Blob lama dapat dipakai proyek lain dan tidak boleh dihapus otomatis.
- Preview menggunakan object URL yang dibersihkan saat form ditutup/unmount.
  Cancel sebelum Simpan tidak menghasilkan file storage.
- Gallery diunggah berurutan dengan cache per item. Jika item berikutnya gagal,
  hasil sebelumnya tetap diingat dan tidak diunggah ulang saat retry.
- Kegagalan Neon setelah upload tidak menghapus file atau metadata lama. URL
  sukses tetap di-cache. Reload/menutup form akan menghilangkan cache browser;
  ledger server menyediakan pathname/URL untuk rekonsiliasi manual.
- Jika put berhasil tetapi update ledger atau respons terputus, API memberi
  error hasil belum dapat dipastikan. Reservasi pathname tetap tersedia, bukan
  sukses palsu atau penghapusan berisiko.
- Ledger sengaja mempertahankan catatan upload, termasuk yang akhirnya sudah
  dipakai. Status uploaded **bukan bukti file masih orphan**. Sebelum cleanup,
  cocokkan URL dengan seluruh field gambar/gallery `works`, `projects`, avatar
  reviews dan referensi lain. Jangan menghapus berdasarkan umur/status saja.
- Cleanup otomatis belum diaktifkan. File yang berhasil diunggah tetapi draft
  dibatalkan setelah upload dapat tetap menjadi **orphan yang tercatat**. Penanganan
  ini menghindari kehilangan file tak terlacak, bukan menjamin nol orphan pada
  crash/kegagalan jaringan. Tetapkan masa tenggang dan review referensi sebelum
  pembersihan manual. Tidak ada delete/list Blob pada tahap pengujian ini.

## Perubahan form

Panel add/edit: preview cover/galeri dahulu, replacement, remove, cancel,
upload-on-save, pertahankan pilihan ketika error. Label menjelaskan JPEG/PNG/WebP
3 MiB, dan badge rasio tidak lagi menjanjikan crop 4:5. Struktur/layout/warna tetap.

Halaman add-project menggunakan helper yang sama untuk cover, logo, desktop,
phone dan galeri; ketidaksesuaian field file diperbaiki. Setelah sukses, submit
ulang dinonaktifkan untuk menghindari pembuatan proyek ganda. Untuk membuat proyek
baru berikutnya, buka ulang halaman. Ini tidak mengubah data proyek asli.

## Konfigurasi manual

1. Buat/pilih **store Vercel Blob public khusus pengembangan**. Gambar portofolio
   memang publik; jangan menggunakan store ini untuk dokumen rahasia. Tinjau
   kuota/biaya di dashboard Vercel sebelum melakukan pengujian nyata.
2. Isi secara privat di `.env.local`:

   ```dotenv
   BLOB_READ_WRITE_TOKEN=
   BLOB_PUBLIC_HOSTNAME=
   ```

   Token diperoleh dari store yang dipilih, bukan dibuat sendiri. Hostname adalah
   hostname store public, berakhiran `.public.blob.vercel-storage.com`, tanpa
   `https://`, slash, wildcard atau path. Hostname harus cocok dengan token store.
   Jangan gunakan prefix NEXT_PUBLIC_ untuk token.
3. Pertahankan DATABASE_URL branch development, ADMIN_PASSWORD dan JWT_SECRET
   yang sudah dikonfigurasi. Role membutuhkan insert/update settings untuk ledger
   serta rate limit, dan hak works yang sudah diberikan. Tidak perlu DDL.
4. Restart server dan ulangi build agar hostname store persis masuk allowlist
   Next Image untuk `/portfolio/projects/**`. Path gambar lokal tetap didukung.
5. Berikan persetujuan eksplisit sebelum pengujian yang membuat blob/biaya atau
   memakai token produksi. Tahap ini belum menjalankan tes storage meskipun kode
   SDK siap. Tidak memerlukan callback URL/tunnel untuk metode server upload.

## Hasil pengujian

| Pengujian | Hasil dan batas bukti |
| --- | --- |
| Anonymous upload | HTTP nyata 401 sebelum pembacaan file |
| SVG dan file PNG palsu | HTTP nyata 400 |
| Field path tambahan | HTTP nyata 400 |
| Request >4 MiB | HTTP nyata 413; file >3 MiB juga ditolak pada validasi |
| Gambar valid, admin, konfigurasi kosong | HTTP nyata 503, tanpa URL atau akses storage |
| Preview cover, replacement, beberapa gallery, remove | Browser admin nyata lulus memakai aset lokal sebagai pilihan, tanpa upload Blob |
| Submit gagal karena storage kosong | Browser nyata: error jelas, preview tetap ada, empat row Neon tidak berubah |
| Cover/desktop/phone/gallery pada add-project | Browser nyata: seluruh preview termuat; mapping field benar |
| Rasio gambar | Test Sharp nyata untuk desktop/mobile: ukuran tetap, format output WebP |
| DB gagal sebelum upload | Test offline transport: put tidak dipanggil |
| DB gagal setelah put | Test offline transport: reservation tetap, error generik, tidak ada DELETE |
| Retry metadata gagal | Test helper offline: URL upload sukses dipakai kembali, tanpa upload ulang |
| SDK put sukses, URL hasil | **Mock offline saja**; bukan keberhasilan upload storage nyata |
| URL Blob nyata tersimpan/ditampilkan, penggantian end-to-end | **Belum diuji**; menunggu konfigurasi store dan persetujuan pengujian |
| Lint | Lulus, 0 error, 16 warning img yang sudah ada |
| Production build | Lulus, Next 15.5.28 |
| Seluruh test offline | 16/16 lulus |
| Audit production dependencies | 0 vulnerability |

SDK terbaru yang diperiksa (2.8.2) membawa empat High melalui rantai OIDC /
cli-config / Zod. Setelah analisis dipilih **@vercel/blob 2.4.0 exact**, yang
mendukung put/token/allowOverwrite pada alur ini dan tidak membutuhkan rantai
tersebut. Tidak memakai audit fix --force. Lockfile menambah tujuh package;
tidak ada perubahan versi package lama. Empat belas moderate tooling development
dari audit sebelumnya tetap ada. Node >=20 diperlukan; Node lokal 24 kompatibel.

Foto profil, screenshot asli, CV, empat proyek, dan modul GSAP/OGL/Three/Lenis/
shader tidak diubah. Tidak mengklaim tes ulang seluruh cinematic pada tahap ini;
perubahannya hanya form admin dan backend upload, tanpa menyentuh modul visual inti.
Perbandingan SHA-256 pada 57 file aset/modul inti cocok dengan baseline.
Pemindaian static bundle tidak menemukan tiga nilai privat yang terkonfigurasi
(DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET). Token Blob memang belum tersedia.
Server QA telah dihentikan; `.env`, `.env.local`, dan harness QA tetap ignored Git.

## File dibuat/diubah

- Baru: `src/lib/image-policy.js`, `src/lib/blob-storage.js`,
  `src/lib/upload-images.js`, laporan ini.
- Diubah: `src/app/api/upload/route.js`,
  `src/app/admin/(panel)/projects/page.jsx`, `src/app/admin/add-project/page.jsx`.
- Konfigurasi: `next.config.mjs`, `.env.example`, `package.json`, `package-lock.json`.
- Test: `tests/api-cutover.test.mjs`. Harness HTTP/browser di `.qa/blob` diabaikan Git.

Autentikasi JWT, connection string, env privat, repository CRUD, migration,
frontend publik dan file aset tidak diubah. Tidak ada token/kredensial dicetak
atau dimasukkan ke source. Tidak ada deployment.
