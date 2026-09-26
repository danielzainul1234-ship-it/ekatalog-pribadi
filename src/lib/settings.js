'use strict';
const { all, get, run } = require('./db');

const DEFAULTS = {
  store_name: 'Ekatalog Pribadi',
  store_tagline: 'Fashion Muslimah Elegan untuk Setiap Momen',
  store_description: 'Koleksi gamis, dress, dan hijab premium dengan kualitas terbaik dan harga bersahabat.',
  logo: '',
  favicon: '',
  email: '',
  phone_display: '+62 822-3227-4476',
  whatsapp_number: '6282232274476',
  address: 'Jakarta, Indonesia',
  instagram: '',
  facebook: '',
  tiktok: '',
  primary_color: '#b8895f',
  secondary_color: '#2b2420',
  banner_image: '',
  banner_title: 'KOLEKSI TERBARU',
  banner_subtitle: 'Temukan fashion favoritmu dengan mudah, tampil elegan setiap hari',
  banner_cta_text: 'Lihat Koleksi',
  banner_cta_link: '/produk',
  promo_title: 'Promo Spesial Minggu Ini',
  promo_subtitle: 'Diskon terbatas untuk koleksi pilihan — jangan sampai terlewat',
  footer_text: 'Belanja fashion muslimah terpercaya, dikirim dengan aman ke seluruh Indonesia.',
  wa_admin_name: 'Admin Toko',
  wa_opening_message: "Halo Admin, saya ingin melakukan pemesanan:",
  wa_closing_message: 'Mohon dibantu untuk proses pesanannya. Terima kasih.',
  wa_item_template:
    '{no}. {nama_produk}\nUkuran: {ukuran}\nQty: {jumlah}\nHarga: {harga}\nSubtotal: {subtotal}',
  wa_message_template:
    '{opening}\n\nDETAIL PESANAN\n{items}\n\nTOTAL: {total}\n\nNama: {nama_customer}\nNo. WhatsApp: {nomor_customer}\nAlamat: {alamat}\nCatatan: {catatan}\nNo. Pesanan: {nomor_pesanan}\n\n{closing}',
};

let cache = null;

function loadAll() {
  const rows = all('SELECT key, value FROM settings');
  const map = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  cache = map;
  return map;
}

function getSettings() {
  if (!cache) return loadAll();
  return cache;
}

function getSetting(key) {
  return getSettings()[key];
}

function setSetting(key, value) {
  run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value == null ? '' : String(value)]
  );
  loadAll();
}

function setSettings(obj) {
  for (const [k, v] of Object.entries(obj)) setSetting(k, v);
}

module.exports = { getSettings, getSetting, setSetting, setSettings, DEFAULTS, loadAll };
