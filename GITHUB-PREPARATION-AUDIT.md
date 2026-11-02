# Audit persiapan GitHub dan initial commit

Tanggal: 3 November 2026. Project: `D:\adnan-portfolio`.
Tujuan: `https://github.com/adnanardiansyah/adnan-portfolio.git`.

**Tidak ada staging, commit, push, reset, penghapusan .git, rewrite history,
perubahan database, kode aplikasi, autentikasi atau deployment dalam audit ini.**
File yang dibuat hanya laporan ini serta harness/manifest lokal di `.qa/git-audit`
yang diabaikan Git. `.gitignore`, LICENSE dan dokumen template tidak diubah.

## Hasil audit

Snapshot sebelum laporan ini: **82 modified, 2 deleted, 57 untracked, 0 staged**.
Scanner memeriksa 186 kandidat file yang ada (sekitar 22,02 MiB), serta seluruh
objek yang dilaporkan `git rev-list --objects --all --reflog`: 440 objek,
269 blob, dengan 11 commit pada ref lokal. Inventaris perubahan per file berada
di lampiran. Laporan ini menambah satu file untracked setelah snapshot awal.

Branch lokal `main`; origin cocok dengan repository tujuan. Pemeriksaan read-only
`git ls-remote --heads --tags` dan `git ls-remote --symref` berhasil (exit 0) dan
keduanya tidak mengembalikan ref. **Remote terlihat kosong, tanpa HEAD/branch/tag
yang diiklankan saat audit**. Periksa ulang sebelum push nanti karena keadaan
remote dapat berubah. Tidak melakukan fetch atau membuat remote tracking ref.

### Rahasia dan Git ignore

- `.env`, `.env.local`, `.qa`, `node_modules`, `.next`, `.npm-cache`, build/out,
  `.vercel`, dan file PEM dicakup ignore yang sesuai. Pengujian `check-ignore`
  lulus untuk path environment/QA/dependency/build yang diminta.
- `git ls-files` tidak menunjukkan env privat, QA, dependency atau build tracked.
  Kedua file env lokal tetap tidak tracked. Ignore tidak menghapus file yang
  sudah tracked; karena itu pemeriksaan indeks juga dilakukan.
- `.env.example` berisi 16 nama variabel. Semua nilai rahasia kosong; satu nilai
  nonkosong hanyalah boolean `NEXT_PUBLIC_ENABLE_NEWSLETTER=false`, bukan secret.
- Tidak ditemukan kecocokan literal dengan credential efektif lokal, assignment
  env privat lokal, atau password dalam URL database lokal, pada kandidat commit
  maupun objek riwayat yang dipindai. Nilai pembanding hanya ada di memori dan
  tidak dicetak, dimasukkan ke laporan, atau disimpan oleh scanner.
- Pemindaian pola mencakup private key, URL database berpassword, credentialed
  HTTP URL, GitHub/AWS/Resend/Blob/provider token, JWT literal, dan assignment
  password/secret. Tiga lokasi temuan telah ditinjau: generator secret dalam
  `LOCAL-ADMIN-AUTH.md`, dan dua credential sintetis **khusus test offline** di
  `tests/api-cutover.test.mjs`. Bukan credential aplikasi/layanan nyata; nilainya
  tidak direproduksi dalam laporan ini. Temuan pola yang sama juga muncul pada
  objek Git yang dipindai.
- Tidak ditemukan path env privat/QA/node_modules/.next/key SSH/credentials pada
  nama blob historis yang dilaporkan Git. Tidak ada symlink dalam kandidat file.
- Gitleaks/TruffleHog tidak tersedia. Ini audit lokal berbasis pola dan pembanding
  credential, bukan jaminan semua secret yang belum diketahui pasti terdeteksi.
  Tidak memanggil provider untuk mencoba credential atau mengirim source ke layanan
  pemindai eksternal. Pertimbangkan secret scanning GitHub setelah publikasi nanti.

`.gitignore` sudah memenuhi kebutuhan saat ini. Duplikasi baris node_modules
bersifat kosmetik. Untuk file rahasia baru di masa depan, tambah aturan spesifik
sebelum membuatnya: ekstensi key/p12/pfx atau direktori credential tidak otomatis
aman hanya karena env sudah diabaikan. Tidak ada file tersebut dalam kandidat
commit sekarang; audit tidak menambah ignore luas yang dapat menyembunyikan source.

### Perubahan yang akan dibawa

| Kelompok | Isi perubahan |
| --- | --- |
| Branding/konten publik | Identitas Adnan, metadata/OG, About/Contact/Projects, ikon dan profil empat proyek |
| Aset | Foto asli, empat cover, lima mobile screenshot, CV asli, gambar OG dan placeholder yang sudah ada |
| API/database | Repository Neon, JWT/rate limit, works/settings/inbox/reviews/analytics/newsletter/email, fallback publik yang benar |
| Storage admin | SDK Blob, validasi upload server, preview/draft/retry form; konfigurasi storage nyata masih opsional |
| Konfigurasi/dependency | Lockfile, versi keamanan, PostCSS/Tailwind/ESLint, Next Image allowlist Blob tanpa token |
| SQL | Schema/seed/preflight Neon, README migration dan referensi Supabase lama; tidak berisi credential dan tidak dijalankan saat install/build |
| Test/dokumentasi | Test terisolasi dan laporan tiap tahap; `.qa` beserta backup/hasil browser tidak ikut commit |

Dua penghapusan yang sudah ada:

- `public/BingSiteAuth.xml`: verifikasi Bing pemilik template; pengaturan Adnan
  menggunakan environment sendiri. Bukan aset cinematic.
- `src/app/about/page.jsx`: duplicate route lama; `src/app/about/page.js` tetap
  tersedia. Tidak menghapus halaman About aktif.

16 file wajib yang diperiksa semuanya ada dalam kandidat: LICENSE, helper Neon,
foto profil, CV, empat cover, lima mobile screenshot, dua migration Neon dan
referensi SQL Supabase. Source dan lockfile ikut kandidat. Tidak menghapus aset
template yang masih dipakai animasi; foto/logo Sarang lama yang tidak dipakai
masih ada dalam `public/photo` dan dapat ditinjau terpisah nanti.

`git diff --check` lulus. Pesan LF/CRLF dari Git berkaitan normalisasi line ending,
bukan secret atau file build. Audit ini tidak mengubah konfigurasi line ending.

### Ukuran file

| File | Ukuran |
| --- | ---: |
| `public/videos/optimized-rev.mp4` | 10.339.942 byte ≈ 9,86 MiB |
| `public/videos/optimized.mp4` | 8.750.700 byte ≈ 8,35 MiB |
| `public/images/profile/adnan-ardiansyah.webp` | 379.604 byte |
| `public/resume/Adnan-Ardiansyah-CV.pdf` | 155.738 byte |

Tidak ada kandidat maupun blob historis yang lebih besar dari 50 MiB; terbesar
tetap dua video di atas. GitHub memerlukan LFS untuk file lebih dari 100 MiB,
sehingga aset sekarang tidak membutuhkan migrasi LFS karena batas ukuran itu.
Lihat [dokumentasi batas file GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).
File build/cache/dependency tidak termasuk ukuran kandidat tersebut.

## Lisensi dan dokumentasi

`LICENSE` asli masih utuh: MIT, copyright 2025 Sarang. Teksnya mewajibkan notice
copyright dan permission disertakan pada salinan/bagian substansial software.
**Pertahankan LICENSE tersebut**, termasuk jika membuat root commit baru.
Riwayat Git baru tidak menggantikan atribusi lisensi.

README sekarang masih README template Sarang, termasuk deskripsi Next.js 16,
Supabase dan instruksi template yang tidak mencerminkan Next.js 15/Neon saat ini.
INSTALL/CONTRIBUTING/CHANGELOG juga merupakan dokumen template. Sebelum publikasi,
sebaiknya buat README personal dengan link sumber
`https://github.com/5araang/Nextjs-cinematic-portfolio` dan LICENSE yang tetap utuh;
README template dapat dipertahankan sebagai referensi terpisah bila dibutuhkan.
Audit ini tidak menulis ulang dokumen tersebut atau menghapus atribusinya.

## Strategi Git yang direkomendasikan

| Opsi | Dampak | Rekomendasi |
| --- | --- | --- |
| A — lanjutkan 11 commit template | Tambah commit personal di atas HEAD; atribusi/provenance tetap jelas; tidak ada rewrite | **Paling aman saat ini** karena scan tidak menemukan credential nyata yang perlu dibersihkan dari history |
| B — repository lokal baru di folder berbeda | Root commit hanya snapshot project personal; repository/folder kerja lama tetap utuh | Pilihan bila Anda menginginkan history personal satu root; lakukan hanya setelah memilih opsi ini secara sadar |

Tidak ada alasan dari audit secret/ukuran untuk memaksa rewrite sekarang. Remote
yang terlihat kosong memungkinkan kedua opsi dievaluasi tanpa force push, tetapi
audit ini **tidak melakukan push apa pun**.

Hindari `git switch --orphan` pada working tree ini sebagai shortcut: perintah
tersebut dapat menghapus tracked files dari working tree dan berisiko pada kondisi
banyak perubahan. Lihat [dokumentasi Git switch](https://git-scm.com/docs/git-switch).
Opsi B di bawah memakai salinan selektif dalam folder baru, tanpa reset atau
penghapusan .git lama. Semua perintah adalah usulan untuk dijalankan pengguna,
bukan tindakan yang sudah dilakukan agent.

## Perintah opsi A — paling aman, mempertahankan history

Jalankan di PowerShell setelah meninjau laporan dan memutuskan memakai history
template. Ini membuat commit personal pertama, **bukan root commit baru**.

```powershell
Set-Location -LiteralPath 'D:\adnan-portfolio'
git status --short
git add --dry-run --all
# Tinjau nama file; env privat, .qa, node_modules dan .next tidak boleh muncul.
git add --all
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only
# Jika ada file tak diinginkan, berhenti dan tinjau staging sebelum commit.
git commit -m "feat: personalize Adnan Ardiansyah portfolio with Neon admin CMS"
git log -1 --oneline
```

Tidak ada perintah push dalam rangkaian ini. Jangan gunakan `git add -f` untuk env
atau QA. Jika Anda mengubah file setelah audit, ulangi pemeriksaan sebelum commit.

## Perintah opsi B — root commit personal pada salinan terisolasi

**Alternatif, bukan langkah lanjutan opsi A.** Gunakan hanya jika Anda memilih
history baru. Folder tujuan harus belum ada. Manifest dibuat dari kandidat yang
diaudit, termasuk LICENSE/laporan, tanpa env privat, Git lama, QA atau build.
Setiap file diverifikasi SHA-256 agar perubahan setelah audit tidak tersalin
diam-diam. Jika hash berubah, berhenti dan buat audit/manifest baru.

```powershell
$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath('D:\adnan-portfolio')
$targetRoot = [IO.Path]::GetFullPath('D:\adnan-portfolio-initial')
if (Test-Path -LiteralPath $targetRoot) { throw 'Folder tujuan sudah ada; pilih folder baru.' }
$manifest = Get-Content -LiteralPath (Join-Path $sourceRoot '.qa\git-audit\export-manifest.json') -Raw | ConvertFrom-Json
if (-not $manifest.files.Count) { throw 'Manifest kosong atau tidak tersedia.' }
New-Item -ItemType Directory -Path $targetRoot | Out-Null
foreach ($entry in $manifest.files) {
    $relative = [string]$entry.path
    if (($relative -ne '.env.example' -and $relative -match '(^|[\\/])\.env([^\\/]*)($|[\\/])') -or
        $relative -match '(^|[\\/])(\.git|\.qa|node_modules|\.next|\.vercel)([\\/]|$)') {
        throw 'Manifest memuat path terlarang; hentikan ekspor.'
    }
    $fromPath = [IO.Path]::GetFullPath((Join-Path $sourceRoot $relative))
    $toPath = [IO.Path]::GetFullPath((Join-Path $targetRoot $relative))
    if (-not $fromPath.StartsWith($sourceRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
        -not $toPath.StartsWith($targetRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Path berada di luar folder yang diizinkan.'
    }
    if ((Get-Item -LiteralPath $fromPath).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Symlink tidak diizinkan.' }
    if ((Get-FileHash -LiteralPath $fromPath -Algorithm SHA256).Hash -ne $entry.sha256) { throw 'File berubah setelah audit; hentikan ekspor.' }
    New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($toPath)) | Out-Null
    Copy-Item -LiteralPath $fromPath -Destination $toPath
}
Set-Location -LiteralPath $targetRoot
git init -b main
git remote add origin https://github.com/adnanardiansyah/adnan-portfolio.git
git add --dry-run --all
# Tinjau daftar salinan. LICENSE harus ikut; env privat/QA/build tidak boleh ikut.
git add --all
git diff --cached --check
git diff --cached --stat
git commit -m "Initial Adnan Ardiansyah portfolio, based on Sarang MIT template"
git rev-list --count HEAD
```

Hasil yang diharapkan opsi B: satu commit pada repository lokal baru. Folder
`D:\adnan-portfolio`, history lama, env lokal, cache dan database tetap tidak
tersentuh. Env sengaja tidak disalin: salinan belum dapat menjalankan layanan
privat sebelum pengguna mengonfigurasinya sendiri. Jangan melakukan push sebelum
meninjau snapshot baru dan memeriksa remote kembali.

## Batas audit dan hasil kerja

Tidak menjalankan lint/build ulang karena tugas ini tidak mengubah kode aplikasi;
hasil validasi tahap sebelumnya tetap tercatat pada laporan masing-masing.
Tidak melakukan rotasi password/secret atau query Neon. Tidak ada tindakan Git
mutatif pada indeks/ref/history. Manifest dan laporan aman untuk ditinjau sebelum
Anda memilih strategi. Laporan ini dapat disertakan dalam commit.

## Lampiran — seluruh perubahan pada snapshot awal

| Status | File |
| --- | --- |
| Modified | `.gitignore` |
| Modified | `next.config.mjs` |
| Modified | `package-lock.json` |
| Modified | `package.json` |
| Deleted | `public/BingSiteAuth.xml` |
| Modified | `public/favicon.ico` |
| Modified | `public/llms-full.txt` |
| Modified | `public/llms.txt` |
| Modified | `public/searchwords.xml` |
| Modified | `src/app/about/content.js` |
| Modified | `src/app/about/page.js` |
| Deleted | `src/app/about/page.jsx` |
| Modified | `src/app/admin/(panel)/analytics/page.jsx` |
| Modified | `src/app/admin/(panel)/inquiries/page.jsx` |
| Modified | `src/app/admin/(panel)/links/page.jsx` |
| Modified | `src/app/admin/(panel)/page.jsx` |
| Modified | `src/app/admin/(panel)/projects/page.jsx` |
| Modified | `src/app/admin/(panel)/reviews/page.jsx` |
| Modified | `src/app/admin/(panel)/settings/page.jsx` |
| Modified | `src/app/admin/add-project/page.jsx` |
| Modified | `src/app/admin/login/page.jsx` |
| Modified | `src/app/api/admin/change-password/route.js` |
| Modified | `src/app/api/admin/login/route.js` |
| Modified | `src/app/api/admin/send-email/route.js` |
| Modified | `src/app/api/analytics/active-users/route.js` |
| Modified | `src/app/api/analytics/click/route.js` |
| Modified | `src/app/api/analytics/ping-leave/route.js` |
| Modified | `src/app/api/analytics/ping/route.js` |
| Modified | `src/app/api/analytics/search/route.js` |
| Modified | `src/app/api/analytics/stats/route.js` |
| Modified | `src/app/api/analytics/visit/route.js` |
| Modified | `src/app/api/contact/route.js` |
| Modified | `src/app/api/inquiries/[id]/route.js` |
| Modified | `src/app/api/inquiries/route.js` |
| Modified | `src/app/api/llms/route.js` |
| Modified | `src/app/api/projects/[id]/route.js` |
| Modified | `src/app/api/projects/route.js` |
| Modified | `src/app/api/reviews/[id]/route.js` |
| Modified | `src/app/api/reviews/route.js` |
| Modified | `src/app/api/settings/route.js` |
| Modified | `src/app/api/subscribe/route.js` |
| Modified | `src/app/api/upload/route.js` |
| Modified | `src/app/api/webhooks/resend/route.js` |
| Modified | `src/app/api/works/[id]/route.js` |
| Modified | `src/app/api/works/route.js` |
| Modified | `src/app/apple-icon.png` |
| Modified | `src/app/coming-soon/page.jsx` |
| Modified | `src/app/contact/content.js` |
| Modified | `src/app/contact/page.js` |
| Modified | `src/app/favicon.png` |
| Modified | `src/app/globals.css` |
| Modified | `src/app/icon.png` |
| Modified | `src/app/layout.js` |
| Modified | `src/app/manifest.js` |
| Modified | `src/app/not-found.jsx` |
| Modified | `src/app/project/[id]/page.jsx` |
| Modified | `src/app/projects/page.js` |
| Modified | `src/app/robots.js` |
| Modified | `src/app/sitemap.js` |
| Modified | `src/app/work/content.js` |
| Modified | `src/components/About.jsx` |
| Modified | `src/components/CircularGallery/CircularGallery.jsx` |
| Modified | `src/components/Contact.jsx` |
| Modified | `src/components/ContactPopup.jsx` |
| Modified | `src/components/Dither.jsx` |
| Modified | `src/components/Footer.jsx` |
| Modified | `src/components/Hero.jsx` |
| Modified | `src/components/Navbar.jsx` |
| Modified | `src/components/NewsletterPopup.jsx` |
| Modified | `src/components/PageShell.jsx` |
| Modified | `src/components/ProfileCard.css` |
| Modified | `src/components/ProfileCard.jsx` |
| Modified | `src/components/SeoContent.jsx` |
| Modified | `src/components/VideoScrub.jsx` |
| Modified | `src/components/Work.jsx` |
| Modified | `src/components/admin/AdminNav.jsx` |
| Modified | `src/hooks/useGeoDialCode.js` |
| Modified | `src/lib/mongodb.js` |
| Modified | `src/lib/supabase.js` |
| Modified | `src/middleware.js` |
| Modified | `src/views/about.jsx` |
| Modified | `src/views/contact.jsx` |
| Modified | `src/views/open-source.jsx` |
| Modified | `src/views/projects.jsx` |
| New | `.env.example` |
| New | `ASSET-INTEGRATION.md` |
| New | `CONTENT-VISUAL-AUDIT.md` |
| New | `LOCAL-ADMIN-AUTH.md` |
| New | `NEON-API-MIGRATION.md` |
| New | `NEON-INTEGRATION-PLAN.md` |
| New | `PORTFOLIO-AUDIT.md` |
| New | `SECURITY-AUDIT.md` |
| New | `VERCEL-BLOB-INTEGRATION.md` |
| New | `database/neon/README.md` |
| New | `database/neon/migrations/001_portfolio.sql` |
| New | `database/neon/migrations/002_seed_portfolio.sql` |
| New | `database/neon/preflight.sql` |
| New | `eslint.config.mjs` |
| New | `postcss.config.mjs` |
| New | `public/images/README.md` |
| New | `public/images/og/adnan-ardiansyah.png` |
| New | `public/images/og/adnan-ardiansyah.svg` |
| New | `public/images/profile/adnan-ardiansyah.webp` |
| New | `public/images/profile/placeholder.svg` |
| New | `public/images/projects/siskamling/cover.webp` |
| New | `public/images/projects/snapnext/cover.webp` |
| New | `public/images/projects/suara-digital-desa/cover.webp` |
| New | `public/images/projects/suara-digital-desa/mobile-1.webp` |
| New | `public/images/projects/suara-digital-desa/mobile-2.webp` |
| New | `public/images/projects/suara-digital-desa/mobile-3.webp` |
| New | `public/images/projects/suara-digital-desa/mobile-4.webp` |
| New | `public/images/projects/suara-digital-desa/mobile-5.webp` |
| New | `public/images/projects/triase-net/cover.webp` |
| New | `public/placeholders/mark.svg` |
| New | `public/placeholders/profile.svg` |
| New | `public/placeholders/project-1.svg` |
| New | `public/placeholders/project-2.svg` |
| New | `public/placeholders/project-3.svg` |
| New | `public/placeholders/project-4.svg` |
| New | `public/placeholders/project-5.svg` |
| New | `public/placeholders/social.png` |
| New | `public/placeholders/social.svg` |
| New | `public/resume/Adnan-Ardiansyah-CV.pdf` |
| New | `public/resume/README.md` |
| New | `src/components/ProjectCard.jsx` |
| New | `src/components/ResumeLink.jsx` |
| New | `src/lib/admin-token.js` |
| New | `src/lib/analytics.js` |
| New | `src/lib/api.js` |
| New | `src/lib/assets.js` |
| New | `src/lib/blob-storage.js` |
| New | `src/lib/image-policy.js` |
| New | `src/lib/neon.js` |
| New | `src/lib/profile.js` |
| New | `src/lib/rate-limit.js` |
| New | `src/lib/records.js` |
| New | `src/lib/repository.js` |
| New | `src/lib/upload-images.js` |
| New | `supabase/migrations/20261102_contact_rate_limit.sql` |
| New | `tests/api-cutover.test.mjs` |
| New | `tests/neon.test.mjs` |
