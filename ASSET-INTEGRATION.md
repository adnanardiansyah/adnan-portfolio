# Tahap 4 — integrasi aset asli

## Hasil integrasi

- Foto memakai `public/images/profile/adnan-ardiansyah.webp`; label placeholder dinonaktifkan. Framing menggunakan `object-fit: cover` dengan fokus `50% 30%`, agar wajah tetap utuh dan tidak bertabrakan dengan judul kartu. Avatar kecil memakai fokus tersendiri. File gambar asli tidak diedit.
- Empat proyek aktif: **SnapNext**, **TRIASE-Net**, **Suara Digital Desa**, **Siskamling Digital**. Slug `/project/siskamling` dipertahankan untuk kompatibilitas tautan.
- Cover asli terhubung pada kartu Home, daftar Projects, galeri melengkung OGL, dan halaman detail.
- SnapNext, TRIASE-Net, dan Siskamling Digital masing-masing memiliki satu screenshot yang disediakan. Cover yang sama digunakan sebagai galeri awal; tidak membuat gambar tambahan.
- Suara Digital Desa memakai kelima file `mobile-1.webp` sampai `mobile-5.webp` pada halaman detail. Gambar menggunakan tinggi otomatis dan rasio asli, tanpa memotong isi. Setiap screenshot bisa dibuka dalam ukuran aslinya.
- Layout empat kartu menjadi dua kolom pada layar yang cukup lebar dan satu kolom pada mobile.
- CV asli ditemukan pada `public/resume/Adnan-Ardiansyah-CV.pdf`, terverifikasi berformat PDF, dan link download diaktifkan melalui pemeriksaan file yang sudah tersedia.

## Penghapusan proyek

Regal Stay dihapus dari konfigurasi aset, daftar proyek utama, Hero, About, pengalaman proyek, dan konten LLM publik. Daftar hasil CMS juga disaring pada frontend agar entri lama tidak kembali muncul di kartu/galeri/filter. Halaman detail menolak entri yang telah dipensiunkan; sitemap menyaring entri CMS tersebut. Tidak ada modul rekomendasi proyek terkait terpisah pada template saat ini.

Data CMS tidak dihapus atau dimutasi. Tidak mengubah kode API, autentikasi, dependency, atau konfigurasi keamanan. Dokumen audit tahap sebelumnya tetap menjadi catatan historis.

## Aset yang tersedia

| Proyek / profil | Aset asli |
| --- | --- |
| Adnan | `public/images/profile/adnan-ardiansyah.webp` |
| SnapNext | `public/images/projects/snapnext/cover.webp` |
| TRIASE-Net | `public/images/projects/triase-net/cover.webp` |
| Suara Digital Desa | `cover.webp`, `mobile-1.webp` sampai `mobile-5.webp` dalam `public/images/projects/suara-digital-desa/` |
| Siskamling Digital | `public/images/projects/siskamling/cover.webp` |
| CV | `public/resume/Adnan-Ardiansyah-CV.pdf` |

Semua aset utama tersedia. Yang belum disediakan: screenshot tambahan untuk SnapNext, TRIASE-Net, dan Siskamling Digital (opsional), serta URL demo publik Siskamling Digital. URL localhost pada screenshot bukan URL demo publik dan tidak dipakai sebagai tautan.

## Validasi

- `npm.cmd run lint`: lolos dengan **0 error / 16 warning `<img>` bawaan**.
- `npm.cmd run build`: lolos pada Next.js 15.5.28; 43 halaman statis berhasil dihasilkan. Build final mencakup penyesuaian framing foto.
- Edge headless memeriksa Home, About, Projects, Contact, detail Suara Digital Desa, dan detail Siskamling Digital pada 1440×1000, 820×1180, dan 390×844: **18 kombinasi halaman/viewport**, tanpa horizontal overflow. Crop foto final diperiksa kembali pada tiga ukuran layar tersebut.
- Home/Projects menampilkan tepat empat kartu asli, tanpa label placeholder dan tanpa Regal Stay. Filter App menampilkan Siskamling Digital. URL lama `/project/regal-stay` menampilkan status proyek tidak ditemukan.
- Kelima screenshot mobile berhasil dimuat dan di-decode. Rasio tampilan sesuai rasio file asli (tanpa crop), dan tautan ukuran asli tersedia. Cover dan galeri seluruh proyek merespons HTTP 200.
- Foto profil asli berhasil dimuat. Pemeriksaan geometri framing memastikan area wajah berada di dalam kartu; screenshot desktop/mobile juga diperiksa secara visual. Framing final memberi jarak dari teks kartu.
- CV merespons 200 dengan Content-Type PDF dan signature `%PDF-`; tombol download terlihat setelah verifikasi file.
- WebGL galeri/shader tetap aktif, tidak kehilangan konteks, dan tidak menghasilkan error GL. Menu mobile, filter, tilt, video scrub, drag galeri, dan redraw shader lolos; tidak ada exception JavaScript pada rangkaian interaksi.
- SHA-256 **50 file terlindungi** cocok dengan baseline: seluruh foto/screenshot/PDF asli, dependency, konfigurasi, API, middleware, migrasi, serta implementasi inti video/OGL/Three.js/shader/Lenis. Tidak ada modifikasi byte pada aset asli. `git diff --check` lolos.
- Tidak melakukan deployment atau penulisan data ke layanan eksternal.

## File implementasi yang berubah

- `src/lib/assets.js`, `src/lib/profile.js`
- `src/app/about/content.js`, `src/app/project/[id]/page.jsx`, `src/app/sitemap.js`
- `src/components/Hero.jsx`, `src/components/Work.jsx`, `src/components/ProjectCard.jsx`, `src/components/ProfileCard.css`
- `src/views/projects.jsx`
- `public/llms.txt`, `public/llms-full.txt`
- `public/images/README.md`, `public/resume/README.md`
- `ASSET-INTEGRATION.md`

Tidak membuat gambar atau data proyek palsu dan tidak melakukan deployment.
