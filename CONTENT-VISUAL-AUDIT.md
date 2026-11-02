# Tahap 3 — konten dan visual Adnan Ardiansyah

## Hasil audit konten

| Bagian | Kondisi sebelum tahap 3 | Hasil |
| --- | --- | --- |
| Spesialisasi | Belum mencakup cybersecurity, cloud, dan Linux secara lengkap | Lima spesialisasi yang diberikan pemilik ditampilkan pada Hero/About, metadata, JSON-LD, SEO, dan konten LLM. |
| Foto profil | SVG generik pada `public/placeholders/profile.svg` | Placeholder AA khusus potret pada `public/images/profile/placeholder.svg`, dengan label eksplisit; tidak memakai foto orang lain. |
| Visual proyek | SVG bernomor dan fallback Picsum | Placeholder per slug proyek, tipografi di area tengah, dan fallback lokal. Tidak lagi mengambil gambar acak. |
| Kartu proyek | Daftar teks sederhana | Kartu konsisten dengan preview, nomor urut, kategori, deskripsi, tombol detail, link eksternal, hover, focus, dan layout responsif. Galeri melengkung OGL tetap tersedia. |
| Deskripsi proyek | Deskripsi umum; Suara Digital Desa dianggap hanya halaman privasi | Deskripsi mengikuti judul, metadata, dan heading halaman publik yang berhasil dibaca. Suara Digital Desa menampilkan landing page transparansi APBDes beserta informasi hukum/privasi. |
| CV | Tidak ditemukan PDF; variabel `RESUME_URL` mengarah ke LinkedIn | Kontak LinkedIn dipisahkan namanya dari CV. Folder dan path PDF asli disiapkan; tombol CV tidak ditampilkan sebelum file asli tersedia dan diaktifkan. |
| Social preview | Gambar pada direktori placeholder | Open Graph/Twitter memakai gambar identitas personal 1200×630 yang memuat bidang spesialisasi. |
| Social links | Default benar, tetapi pengaturan lama bisa mengganti atau mengosongkan GitHub/LinkedIn footer | Kedua tautan identitas selalu memakai alamat Adnan yang diberikan. Pengaturan layanan lain tetap dapat dibaca. |

Tidak ada informasi pemilik lama pada identitas UI atau metadata yang aktif. Kredit sumber template/lisensi dan aset legacy yang tidak dirujuk UI tetap dipertahankan. Potret/logo lama di `public/photo` tidak dipakai sebagai foto pribadi Adnan. Video, model 3D, dan ilustrasi latar cinematic tetap menjadi elemen dekoratif template.

## Spesialisasi

1. Full-Stack Web Development
2. Artificial Intelligence & Machine Learning
3. Computer Vision
4. Computer Networking & Cybersecurity
5. Cloud & Linux Administration

Daftar teknologi eksplorasi tetap dipisahkan dari spesialisasi; tidak menambahkan klaim tingkat kemahiran, sertifikasi, riwayat kerja, penghargaan, metrik keberhasilan, atau testimoni.

## Proyek dan sumber konten

| Proyek | Kategori tampilan | Tautan publik |
| --- | --- | --- |
| SnapNext | Photo booth · SaaS | [Website SnapNext](https://photobox-saas-main-ews1.vercel.app/) |
| TRIASE-Net | Student services | [Website TRIASE-Net](https://triase-net-rouge.vercel.app/) |
| Suara Digital Desa | Village transparency | [Website Suara Digital Desa](https://suges-privacy-policy.vercel.app/) |
| Regal Stay | Hospitality website | [Website Regal Stay](https://regal-stay.vercel.app/) |
| Siskamling App | App · KMIPN 2026 | Tidak ada URL demo yang diberikan; tidak dibuat tombol demo palsu. Halaman detail tetap dapat dibuka. |

Empat URL publik di atas merespons HTTP 200 saat pembacaan langsung. Deskripsi dirangkum dari konten publiknya, tanpa menambahkan peran personal, stack proyek, hasil bisnis, jumlah pengguna, atau keberhasilan kompetisi. Fungsi pembayaran, keamanan, dan layanan proyek eksternal belum diuji dalam tahap ini.

GitHub: [adnanardiansyah](https://github.com/adnanardiansyah). LinkedIn: [Adnan Ardiansyah](https://www.linkedin.com/in/adnanardiansyah/).

## Aset asli yang perlu diunggah

| Aset | Lokasi yang disiapkan | Status |
| --- | --- | --- |
| Foto profil Adnan | `public/images/profile/adnan-ardiansyah.webp` | Belum tersedia; placeholder AA aktif. |
| Cover SnapNext | `public/images/projects/snapnext/cover.webp` | Belum tersedia. |
| Cover TRIASE-Net | `public/images/projects/triase-net/cover.webp` | Belum tersedia. |
| Cover Suara Digital Desa | `public/images/projects/suara-digital-desa/cover.webp` | Belum tersedia. |
| Cover Regal Stay | `public/images/projects/regal-stay/cover.webp` | Belum tersedia. |
| Cover Siskamling App | `public/images/projects/siskamling/cover.webp` | Belum tersedia. |
| CV asli | `public/resume/Adnan-Ardiansyah-CV.pdf` | Belum tersedia; tidak membuat PDF placeholder. |

Disarankan potret 4:5 minimal 800×1000 dan cover 1600×1000 atau lebih besar. Screenshot tambahan opsional dapat memakai nama `desktop.webp` dan `mobile.webp` di folder proyek yang sama.

Setelah upload, arahkan `src` pada `src/lib/assets.js` ke `uploadPath` masing-masing dan set `isPlaceholder: false`. Untuk CV, set `assets.resume.available: true` setelah file asli tersedia. Komponen CV kemudian memeriksa respons file dan Content-Type PDF sebelum menampilkan link download. Rebuild setelah mengganti aset. Petunjuk rinci tersedia pada `public/images/README.md` dan `public/resume/README.md`.

Gambar Open Graph personal sudah tersedia di `public/images/og/adnan-ardiansyah.png`; pemilik tidak perlu mengunggahnya agar metadata dapat berjalan. Sumber SVG juga disertakan agar dapat diedit.

## Batas perubahan

- Tidak menambahkan atau mengubah dependency, lockfile, atau konfigurasi keamanan.
- Tidak mengubah kode API, database, autentikasi, middleware, atau migrasi.
- Implementasi utama video scrub, CircularGallery/OGL, shader GradientBlinds, Dither/Three.js, dan PageShell/Lenis tidak diubah.
- Efek GSAP pada Hero, About, kartu Work, dan halaman detail dipertahankan. Kartu profil tetap memakai engine tilt asli; perubahan di sana terbatas pada sumber/label placeholder.
- Tidak melakukan deployment dan tidak mengulang audit dependency tahap 2.

## Pengujian

- `npm.cmd run lint`: berhasil, **0 error dan 16 warning `<img>` bawaan**; tidak menonaktifkan rule.
- `npm.cmd run build`: berhasil; seluruh **43 halaman statis** berhasil dihasilkan pada Next.js 15.5.28 yang sudah diperbaiki pada tahap 2.
- Edge headless memeriksa **Home, About, Projects, Contact** pada **1440×1000**, **820×1180**, dan **390×844**. Seluruh 12 kombinasi lolos, tidak ada horizontal overflow.
- Home/About menampilkan kelima spesialisasi lengkap. Home/Projects menampilkan lima kartu dengan judul, label placeholder, dan empat URL eksternal yang tepat. Siskamling memiliki halaman detail tanpa link demo rekaan.
- Kelima gambar preview dimuat dan berhasil di-decode setelah digulir ke viewport; pemuatan lazy-load tetap dipertahankan. Tampilan desktop, tablet, dan mobile diperiksa melalui screenshot.
- Tidak ada anchor Download CV pada halaman yang diperiksa; file PDF memang belum ada. GitHub dan LinkedIn pada Contact mengarah ke akun Adnan yang diminta.
- Metadata empat halaman menunjuk ke Open Graph personal baru; gambar PNG terverifikasi berukuran **1200×630**. Halaman publik dan kelima halaman detail proyek merespons 200. Seluruh URL placeholder baru merespons 200.
- Galeri OGL dan shader kontak memiliki konteks **WebGL 2** yang aktif, tidak hilang, dengan `gl.getError() = 0`. Menu mobile, filter App, tilt kartu, video scrub melalui scroll, drag galeri, dan redraw shader kontak lolos pengujian.
- Saat permintaan `/api/works` disimulasikan gagal, fallback frontend tetap menampilkan kelima kartu dan canvas galeri. Tidak ada exception JavaScript pada rangkaian browser akhir.
- Hash SHA-256 **39 file terlindungi** cocok dengan baseline tahap 3: dependency/lockfile, konfigurasi, middleware, kode API, migrasi, dan implementasi inti animasi. `git diff --check` lolos.
- Tidak melakukan deployment, perubahan kredensial, atau penulisan data ke layanan eksternal.

Pengujian proyek eksternal terbatas pada pembacaan halaman publik dan kesesuaian link. Aset foto, screenshot asli, isi CV, serta informasi peran/stack/hasil proyek yang belum disediakan tetap membutuhkan input pemilik.

## File yang diubah atau ditambahkan pada tahap 3

- `src/app/about/content.js`
- `src/app/about/page.js`
- `src/app/contact/page.js`
- `src/app/layout.js`
- `src/app/project/[id]/page.jsx`
- `src/app/projects/page.js`
- `src/components/About.jsx`
- `src/components/Contact.jsx`
- `src/components/Footer.jsx`
- `src/components/Hero.jsx`
- `src/components/ProfileCard.css`
- `src/components/ProfileCard.jsx`
- `src/components/ProjectCard.jsx`
- `src/components/ResumeLink.jsx`
- `src/components/SeoContent.jsx`
- `src/components/Work.jsx`
- `src/lib/assets.js`
- `src/lib/profile.js`
- `src/views/about.jsx`
- `src/views/contact.jsx`
- `src/views/projects.jsx`
- `public/images/og/adnan-ardiansyah.png`
- `public/images/og/adnan-ardiansyah.svg`
- `public/images/profile/placeholder.svg`
- `public/images/projects/placeholder.svg`
- `public/images/projects/regal-stay/placeholder.svg`
- `public/images/projects/siskamling/placeholder.svg`
- `public/images/projects/snapnext/placeholder.svg`
- `public/images/projects/suara-digital-desa/placeholder.svg`
- `public/images/projects/triase-net/placeholder.svg`
- `public/images/README.md`
- `public/llms-full.txt`
- `public/llms.txt`
- `public/resume/README.md`
- `public/searchwords.xml`
- `CONTENT-VISUAL-AUDIT.md`
