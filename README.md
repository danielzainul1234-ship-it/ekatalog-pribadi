# Ekatalog Pribadi — Marketplace / Katalog Fashion + Checkout WhatsApp

Website marketplace/katalog online untuk fashion wanita (gamis, dress, hijab, dll), lengkap dengan:

- Etalase produk yang dinamis (100% dari database, bukan hardcode)
- Detail produk dengan varian ukuran & stok per ukuran
- Keranjang belanja & checkout yang mengirim pesanan otomatis ke WhatsApp admin
- Dashboard admin (CMS) untuk kelola produk, kategori, pesanan, dan pengaturan toko — tanpa coding
- SEO (slug rapi, sitemap.xml, robots.txt, Open Graph, Product Schema)
- Desain premium, minimalis, mobile-first, dan cepat

## Teknologi

Proyek ini dibangun **tanpa framework/paket eksternal** (Express, EJS, dll tidak digunakan) karena lingkungan pengembangan tidak memiliki akses ke registry npm. Semuanya berjalan di atas modul bawaan Node.js:

- **Server & routing**: modul `http` bawaan Node + router kecil buatan sendiri (`src/lib/miniweb.js`) — perilakunya serupa Express (get/post/use, req.params/query/body, res.send/json/redirect/cookie).
- **Database**: `node:sqlite` — modul SQLite bawaan Node.js (stabil sejak Node 22.5+, masih berstatus "experimental" sehingga akan muncul warning saat start, ini aman diabaikan). Tidak butuh instalasi database eksternal apa pun.
- **Autentikasi admin**: hashing password dengan `crypto.scrypt` bawaan Node + session token tersimpan di tabel `sessions` (cookie httpOnly).
- **Upload gambar**: dikirim sebagai base64 dari browser (tanpa multipart parser eksternal), lalu dioptimasi otomatis ke format WebP menggunakan `sharp` (jika tersedia) sebelum disimpan ke `public/uploads/`.
- **Tampilan**: HTML dirender di server lewat fungsi JS (di folder `src/views/`) — cepat, tanpa engine template eksternal. CSS ditulis manual (tanpa Tailwind CDN) supaya ringan dan tidak bergantung koneksi luar.

Karena itu, project ini **tidak punya `node_modules` dependency wajib** kecuali Node.js itu sendiri. Ini justru membuatnya sangat ringan dan cepat di-deploy.

> Catatan: jika di lingkungan Anda tersedia akses npm normal, project ini tetap bisa dijalankan apa adanya (tidak ada `require` ke paket yang tidak ada), dan Anda **boleh** menambahkan `express`/`ejs` di kemudian hari jika ingin migrasi — tapi tidak wajib.

## Menjalankan di Lokal

Butuh Node.js versi **22.5 atau lebih baru** (karena memakai `node:sqlite`).

```bash
npm install     # tidak ada dependency wajib, tapi tetap aman dijalankan
npm start        # menjalankan server di http://localhost:3000
```

Saat pertama kali dijalankan, database `data/ekatalog.sqlite` akan dibuat otomatis beserta:

- 1 akun admin default → **username: `admin`** / **password: `admin123`** (⚠️ segera ganti lewat menu *Akun Admin*)
- 6 kategori contoh (Gamis, Dress, Hijab, Setelan, Fashion Wanita, Promo)
- 6 produk contoh dengan gambar placeholder (termasuk produk bervarian ukuran & tanpa ukuran)

Dashboard admin: **http://localhost:3000/admin**

## Struktur Folder

```
src/
  lib/            -> logic inti: database, auth, produk, pesanan, WhatsApp, settings, dll
  routes/         -> routing: shop.js (customer), admin.js (dashboard admin), api.js (endpoint JSON)
  views/
    shop/         -> halaman customer (home, produk, detail, keranjang, checkout, dll)
    admin/        -> halaman dashboard admin
public/
  css/            -> style.css (customer) & admin.css (dashboard admin)
  js/             -> main.js, cart.js (customer) & admin.js (dashboard admin)
  uploads/        -> hasil upload foto produk/kategori/logo (dibuat otomatis)
data/
  ekatalog.sqlite -> database utama (dibuat otomatis saat pertama jalan)
```

## Fitur Utama

**Customer**
- Beranda: hero banner (dapat diedit admin), kategori, produk terbaru, produk terlaris, section promo
- Halaman "Semua Produk": search, filter kategori/ukuran/harga, sorting, grid responsif (2/3/4 kolom)
- Detail produk: galeri foto, pilih ukuran (otomatis disable jika stok habis), quantity stepper, wishlist, produk terkait, baru dilihat
- Keranjang & checkout: form data pembeli → validasi → simpan order ke database → kurangi stok → generate pesan WhatsApp otomatis → redirect ke WhatsApp
- Floating tombol WhatsApp, bottom navigation di mobile

**Admin (`/admin`)**
- Dashboard: statistik (total produk, pesanan, pesanan hari ini, penjualan hari ini, stok menipis, stok habis) + grafik penjualan harian/mingguan/bulanan
- Produk: tambah/edit/hapus/duplikat/aktif-nonaktifkan, upload multi-foto, varian ukuran+harga+stok per ukuran, badge (baru/best seller/promo/terbatas), SEO title & meta description
- Kategori: tambah/edit/hapus/urutkan/aktif-nonaktifkan + gambar kategori
- Pesanan: daftar & detail pesanan, ubah status (pending → dikonfirmasi → diproses → dikirim → selesai / dibatalkan — status dibatalkan otomatis mengembalikan stok)
- Pengaturan Toko: nama, logo, favicon, warna, banner, promo, kontak, sosial media, footer
- Pengaturan WhatsApp: nomor tujuan, nama admin, pesan pembuka/penutup, template pesan (mendukung variabel `{produk}`, `{ukuran}`, `{jumlah}`, `{harga}`, `{subtotal}`, `{total}`, `{nomor_pesanan}`, dll), tombol Test WhatsApp
- Akun Admin: ubah nama/username/password

## Deploy ke Railway (via GitHub) — sama seperti proyek Laporan Keuangan Anda

1. Push folder ini ke repo GitHub baru (bisa lewat GitHub web editor kalau tidak ada akses git di komputer Anda).
2. Di Railway: **New Project → Deploy from GitHub repo**, pilih repo tersebut.
3. Railway akan otomatis mendeteksi Node.js dan menjalankan `npm install && npm start` (file `.node-version` memastikan Node 22 dipakai, dibutuhkan untuk `node:sqlite`).
4. **Penting — data & foto agar tidak hilang saat redeploy**: tambahkan **Volume** di Railway, mount ke path `/app/data` (untuk database) dan `/app/public/uploads` (untuk foto upload). Tanpa volume, redeploy akan mengembalikan ke data awal (seed default).
5. Set environment variable `PORT` biasanya otomatis di-inject Railway — pastikan **Networking → target port** di Railway sama dengan port yang di-listen aplikasi (aplikasi otomatis memakai `process.env.PORT`).
6. Setelah live, langsung login ke `/admin`, ganti password default, lalu atur nomor WhatsApp & info toko di menu Pengaturan.

## Keamanan

- Password admin di-hash dengan `scrypt` (bawaan Node, tidak disimpan plain text).
- Session admin memakai cookie httpOnly + token acak 32-byte, tersimpan di database, otomatis kedaluwarsa (7 hari).
- Semua endpoint `/admin/*` (kecuali halaman login) diproteksi middleware auth.
- Validasi stok & harga pada saat checkout selalu dihitung ulang dari database di server (harga dari browser tidak pernah dipercaya begitu saja) untuk mencegah manipulasi harga oleh customer.
- Data pesanan customer (nomor WA, alamat) hanya bisa dilihat lewat dashboard admin yang butuh login.

## Mengganti Data Awal (Seed)

Data contoh dibuat otomatis hanya saat database masih kosong (`src/lib/seed.js`). Untuk mulai dari nol dengan data asli toko Anda, cukup hapus produk/kategori contoh lewat dashboard admin — tidak perlu utak-atik kode maupun database secara manual.
