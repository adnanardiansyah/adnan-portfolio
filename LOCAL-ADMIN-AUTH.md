# Tahap 5.5 — Autentikasi admin lokal

Tanggal: 3 November 2026.

## Audit

- Login menggunakan `ADMIN_PASSWORD` dan `JWT_SECRET` di server. Password
  dibandingkan dengan SHA-256 + timing-safe compare; password tidak disimpan di DB.
- JWT memakai HS256, claim `admin: true`, dan kedaluwarsa tujuh hari. Verifier
  bersama memeriksa algoritma, signature, expiry dan claim admin pada API/middleware.
- Cookie `admin_token`: HttpOnly, SameSite Strict, path `/`, Secure pada production.
- Login memakai same-origin check, validasi input, dan counter persisten Neon:
  maksimal lima percobaan per 15 menit/IP. Karena itu login nyata menulis counter
  di `portfolio.settings`, bukan data proyek. Jangan mengubah URL ke branch main.
- Logout menghapus cookie. JWT yang sudah disalin tetap valid sampai expiry;
  sistem ini belum memakai revocation list. Rotasi JWT_SECRET membatalkan semua
  sesi yang ditandatangani secret sebelumnya.
- Input password pada login saat ini di-trim. Gunakan password tanpa spasi di awal/
  akhir. Panjang secret minimal 32 byte harus dipenuhi dalam konfigurasi; endpoint
  saat ini memeriksa keberadaan secret, bukan mengukur entropinya.

## Hasil pemeriksaan awal

`DATABASE_URL` tersedia. `ADMIN_PASSWORD` dan `JWT_SECRET` belum tersedia pada
environment efektif Next.js; `.env.local` belum ada. Nilai rahasia tidak dicetak.
`.env` dan `.env.local` cocok dengan aturan `.env*` di `.gitignore` dan tidak
tercatat oleh `git ls-files`. `.env.example` sengaja hanya memuat nilai kosong.

Fingerprint branch Neon diperiksa melalui query metadata read-only dan cocok
dengan baseline development Tahap 5.4; role tetap `portfolio_app`. Tidak ada query
tulis atau perubahan connection string.

Pengujian HTTP production lokal tanpa kredensial:

- Halaman `/admin/projects` tanpa cookie mengalihkan ke `/admin/login`.
- `/api/works?all=true` tanpa cookie mengembalikan 401.
- Cookie invalid ditolak oleh proteksi halaman admin.
- POST logout menghasilkan cookie kosong yang kedaluwarsa.

## Verifikasi setelah pengguna mengisi .env.local

Konfigurasi efektif sekarang memuat ADMIN_PASSWORD nonkosong minimal 20 karakter
tanpa spasi batas, serta JWT_SECRET nonkosong dengan panjang minimal 32 byte.
Panjang dapat diverifikasi tanpa menampilkan nilai; kualitas keacakan secret
bergantung pada metode pembuatannya oleh pengguna. Kedua file env tetap ignored
dan tidak tracked. Fingerprint Neon tetap cocok dengan baseline development.

Pengujian HTTP memakai **password dan JWT_SECRET pengguna yang sebenarnya**,
dibaca hanya di memori, tanpa kredensial QA pengganti:

- Password salah: 401, tanpa menerbitkan cookie sesi.
- Password benar: 200; JWT diverifikasi signature HS256, claim admin, dan expiry
  tujuh hari. Cookie HttpOnly, Secure pada production, SameSite Strict dan path
  `/` terverifikasi tanpa mencetak header/token.
- Halaman `/admin/projects`, daftar proyek admin dan inquiries dapat diakses
  dengan sesi sah. Empat proyek terbaca.
- JWT yang dimodifikasi ditolak dengan 401.
- Logout mengirim cookie kosong dan kedaluwarsa. Setelah cookie dihapus dari
  cookie jar pengujian, halaman admin kembali mengalihkan ke login dan API privat
  kembali 401. Ini menguji penghapusan sesi browser, bukan revokasi token salinan.
- Counter login QA menggunakan IP dokumentasi khusus, kemudian key tepatnya
  dibersihkan. Empat row proyek sebelum/sesudah sama; branch main tidak diakses.

Hasil lengkap: **PASS**. Tidak ada password, secret, token sesi, atau connection
string dicetak/disimpan dalam laporan pengujian. Tidak ada perubahan kode
autentikasi, env pengguna, aset, desain, atau deployment. Server QA dihentikan.

## Referensi konfigurasi manual (sudah diselesaikan pengguna)

1. Buat `.env.local` di root project, tanpa mengubah DATABASE_URL development
   di `.env`. `.env.local` memiliki prioritas lebih tinggi; jangan menambahkan
   DATABASE_URL berbeda tanpa sengaja.
2. Buat password unik minimal 20 karakter lewat password manager. Isi
   `ADMIN_PASSWORD` dengan nilai tersebut secara privat, gunakan tanda kutip bila
   diperlukan. Hindari `$` karena environment Next.js melakukan ekspansi variabel;
   password acak dengan huruf/angka serta `-` dan `_` mudah dikonfigurasi dengan aman.
3. Buat JWT_SECRET acak minimal 32 byte. Perintah PowerShell berikut menambahkan
   secret acak 48 byte sebagai hex tanpa mencetaknya dan menolak overwrite jika
   JWT_SECRET sudah ada. Jalankan sendiri; jangan kirim hasil file ke chat:

```powershell
node -e "const fs=require('node:fs'),crypto=require('node:crypto'); const p='.env.local'; const s=fs.existsSync(p)?fs.readFileSync(p,'utf8'):''; if (/JWT_SECRET\s*=/.test(s)) process.exit(1); fs.appendFileSync(p,(s&&!s.endsWith('\n')?'\n':'')+'JWT_SECRET='+crypto.randomBytes(48).toString('hex')+'\n');"
```

4. Restart server setelah mengubah environment. Login lewat `/admin/login`.
   Jangan menyalin token dari browser atau connection string ke laporan/chat.
5. Setelah variabel tersedia, pengujian harus membaca password hanya di memori,
   memastikan fingerprint branch development sesuai baseline sebelum request
   login yang menulis rate counter, dan tidak mencetak cookie/token/password.

Tidak ada perubahan desain, animasi, aset, dependency, database main atau deployment.
Kode autentikasi tidak diubah pada pemeriksaan awal ini.
