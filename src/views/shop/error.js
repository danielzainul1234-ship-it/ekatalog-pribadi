'use strict';
const { shopLayout } = require('./layout');

function renderError(req, { code, message }) {
  const body = `
<div class="container error-page">
  <div class="code">${code}</div>
  <h1 style="margin-bottom:8px;font-size:20px">${code === 404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan'}</h1>
  <p style="color:var(--ink-soft);margin-bottom:24px;max-width:420px">${message}</p>
  <div style="display:flex;gap:10px">
    <a href="/" class="btn btn-primary">Ke Beranda</a>
    <a href="/produk" class="btn btn-outline">Lihat Produk</a>
  </div>
</div>`;
  // req.ctx may not be set yet if the error happened before context middleware; guard it.
  if (!req.ctx) {
    req.ctx = { settings: require('../../lib/settings').getSettings(), navCategories: [] };
  }
  return shopLayout(req, { title: code === 404 ? 'Halaman Tidak Ditemukan' : 'Error', body, activeNav: '' });
}

module.exports = { renderError };
