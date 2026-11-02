# Aset portfolio aktif

Seluruh aset asli yang diberikan sudah terhubung melalui `src/lib/assets.js`.

- Foto: `public/images/profile/adnan-ardiansyah.webp`.
- SnapNext: `public/images/projects/snapnext/cover.webp`.
- TRIASE-Net: `public/images/projects/triase-net/cover.webp`.
- Siskamling Digital: `public/images/projects/siskamling/cover.webp`. Slug `siskamling` dipertahankan agar link lama tetap berfungsi.
- Suara Digital Desa: `cover.webp` dan `mobile-1.webp` sampai `mobile-5.webp` pada `public/images/projects/suara-digital-desa/`.
- CV asli: `public/resume/Adnan-Ardiansyah-CV.pdf`; link diaktifkan dengan pemeriksaan file PDF.

Cover yang tersedia juga menjadi galeri awal untuk SnapNext, TRIASE-Net, dan Siskamling Digital. Tidak ada screenshot tambahan yang direka. Suara Digital Desa memakai kelima screenshot mobile dengan rasio asli, tanpa pemotongan isi.

Untuk menambahkan screenshot baru, unggah file dan tambahkan path-nya pada `gallery` di `src/lib/assets.js`, lalu rebuild. File foto dan screenshot asli tidak dimodifikasi; framing foto diatur melalui CSS.
