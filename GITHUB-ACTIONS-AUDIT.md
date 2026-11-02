# Audit dan perbaikan GitHub Actions

Tanggal: 3 November 2026. Commit yang diaudit:
`6f17a24df67ff1f84a107639ac983759814fbc9f`.

## Penyebab yang terkonfirmasi dari log GitHub

Log kedua workflow dapat dibaca melalui GitHub CLI. Filter hash singkat awal
tidak memberikan hasil; API daftar run mengembalikan kedua run dengan full SHA
yang tepat. Diagnosis berikut bukan perkiraan dari file workflow saja.

| Workflow/run | Bukti dan penyebab |
| --- | --- |
| [Node.js CI — 41514723793](https://github.com/adnanardiansyah/adnan-portfolio/actions/runs/41514723793) | Job Node 22 gagal pada `npm test`: script test tidak ada di package.json. Build Next bukan step gagal pada job itu. Job matrix lain dibatalkan oleh fail-fast; tidak menyimpulkan pembatalan sebagai error database. |
| [NodeJS with Webpack — 41514723886](https://github.com/adnanardiansyah/adnan-portfolio/actions/runs/41514723886) | Step Build Node 22 menjalankan `npx webpack`. Karena dependency CLI tidak ada, npx mengunduh webpack lalu meminta instalasi webpack-cli secara interaktif. Proses keluar dengan kode 1. |

Kedua YAML adalah workflow generik lama, berasal dari commit template `90c169a`
dan `74ae7b6`. Tidak ditemukan konfigurasi Webpack standalone di project. Next.js
menangani bundling lewat `next build`; tidak perlu menambah webpack/webpack-cli.

Matrix 18/20/22 juga tidak lagi sesuai baseline project: Next 15 sendiri memiliki
batas Node berbeda dari dependency aplikasi. Lockfile menunjukkan Sharp 0.35.5
memerlukan >=20.9, Neon driver >=19, dan Blob >=20; Node 18 tidak memenuhi itu.
Ini masalah kompatibilitas tambahan, bukan klaim bahwa itulah error pertama yang
terbukti pada job Node 18 yang dibatalkan. Node 24 dipilih sebagai LTS yang juga
sudah dipakai lokal. Referensi: [status rilis Node](https://nodejs.org/en/about/previous-releases).

## Perubahan

- Hapus `.github/workflows/node.js.yml` dan `.github/workflows/webpack.yml`;
  keduanya diganti **satu** `.github/workflows/ci.yml`, bernama Portfolio CI.
- Trigger push/PR ke main dipertahankan, ditambah manual dispatch.
- Satu job `Next.js checks (Node 24)`, urutan wajib: `npm ci`, `npm run lint`,
  `npm test`, `npm run build`. Tidak ada `--if-present`, skip test,
  continue-on-error, instalasi Webpack manual atau langkah deployment.
- Checkout dan setup-node resmi dipin SHA commit v7. Ref serta action.yml diperiksa
  read-only; keduanya memakai runtime node24. Token checkout tidak dipersist.
  Permissions hanya contents: read; cache npm memakai package-lock.json.
  Ada timeout 20 menit dan pembatalan run lama untuk ref yang sama.
- `.nvmrc` menetapkan major 24. `package.json` engines dan root metadata lockfile
  diselaraskan ke Node >=24.0.0 <25 untuk baseline CI/development yang konsisten.
  Tidak ada versi dependency lama berubah, tidak ada dependency ditambah/dihapus.
- Script test baru menjalankan **dua file test yang sudah ada**, bukan tes kosong:
  `node --experimental-vm-modules --test tests/*.test.mjs`.
- `next.config.mjs` diaudit dan tidak diubah. Konfigurasi App Router, image
  allowlist, optimizeCss, dan `next build` tetap sesuai aplikasi sekarang.

## Perlindungan layanan dan secret

Workflow tidak merujuk GitHub Secrets database, tidak menjalankan migration,
server aplikasi, seed, psql, CRUD integration, storage upload atau email eksternal.
DATABASE_URL, Mongo/Supabase, autentikasi, Blob, Resend dan password gate sengaja
kosong dalam job. CI menghentikan proses bila checkout memuat file `.env*` privat
(selain `.env.example`) sebelum install/checks berjalan.

Test menggunakan VM environment dan transport stub terisolasi. Mereka menguji
kontrak, autentikasi, validasi, fallback, parameterisasi, dan upload error flow;
bukan memanggil Neon nyata. Build memakai koneksi lazy, API/sitemap dinamis,
dan tidak membutuhkan credential database. Tidak ada mutasi Neon development
atau main selama pekerjaan ini. Tidak membuat/mengubah secret atau environment
di GitHub. Google Fonts tetap membutuhkan akses internet saat cold build.

## Hasil lokal

Lingkungan: Windows PowerShell, Node **24.14.0**, npm **11.9.0**.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm ci` | Lulus, exit 0; instalasi bersih 443 package dari lockfile |
| `npm run lint` | Lulus, exit 0; 0 error, 16 warning img lama |
| `npm test` | Lulus, exit 0; 16 pass, 0 fail, 0 skipped |
| `npm run build` | Lulus, exit 0; Next 15.5.28, 41/41 halaman statis |
| Parse YAML workflow | Lulus; satu job, empat perintah npm wajib, tidak ada reference secrets |
| `git diff --check` | Lulus |
| Perbandingan versi lockfile | Tidak ada perubahan versi, penambahan atau penghapusan dependency |

Lint/test/build dijalankan berurutan melalui proses QA dengan variabel layanan
kosong, walaupun workstation mempunyai env privat untuk pengembangan. Env lokal
tidak dipindahkan, diubah atau dicetak. Harness ada di `.qa/ci` dan ignored Git.
Check penolakan env pada workflow memang ditujukan ke checkout runner yang bersih;
tidak dijalankan terhadap workstation yang sengaja mempunyai `.env.local`.

Peringatan yang tidak disembunyikan:

- npm ci melaporkan deprecation ESLint 9 dan 14 moderate pada tooling yang sudah
  didokumentasikan. Tidak melakukan audit fix/force atau mengubah dependency
  untuk membuat CI hijau.
- VM Modules mengeluarkan ExperimentalWarning karena test memang memakai API VM
  dengan flag yang diperlukan; seluruh test tetap berjalan.
- Clean build memberi warning Edge Runtime untuk CompressionStream dan
  DecompressionStream pada import internal JWE paket jose melalui admin-token.
  Build tetap selesai. Tidak mengubah verifier HS256 atau kode autentikasi untuk
  menyembunyikan warning tersebut; perubahan CI ini tidak mengaudit ulang seluruh
  perilaku Edge/JWE yang tidak dipakai login.

## File untuk review

1. `.github/workflows/ci.yml` — baru.
2. `.github/workflows/node.js.yml` — dihapus, digantikan checks baru.
3. `.github/workflows/webpack.yml` — dihapus, bundling tetap melalui Next build.
4. `.nvmrc` — baru.
5. `package.json` — script test dan engines.
6. `package-lock.json` — engines root saja.
7. `GITHUB-ACTIONS-AUDIT.md` — laporan ini.

Source aplikasi, database, autentikasi, aset dan modul cinematic tidak diubah.
Tidak ada commit atau push. Tidak ada deployment. Workflow baru **belum dijalankan
di GitHub**; hasil hijau lokal tidak diklaim sebagai run GitHub yang sudah lulus.
Run lama tetap berstatus gagal dan tidak diubah/rerun.

Setelah review dan persetujuan push, periksa run baru di GitHub. Jika branch
protection/ruleset memakai nama check matrix lama, perbarui required check ke
`Next.js checks (Node 24)` tanpa menghapus kewajiban pemeriksaan. Konfigurasi ruleset
tidak diubah dalam pekerjaan ini. Tidak perlu menambahkan secret Neon produksi
untuk meluluskan CI.
