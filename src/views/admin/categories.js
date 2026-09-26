'use strict';
const { adminLayout } = require('./layout');
const { escapeHtml } = require('../../lib/format');
const { icons } = require('../icons');

function renderCategories(req, { categories, editing, errors }) {
  const rows = categories.map((c, idx) => `
    <tr>
      <td><img class="row-thumb" style="width:42px;height:42px;border-radius:8px" src="${c.image || '/img/placeholder/cat-fashion.svg'}" alt=""></td>
      <td style="font-weight:600">${escapeHtml(c.name)}</td>
      <td style="color:var(--ink-soft)">/kategori/${escapeHtml(c.slug)}</td>
      <td>${c.product_count}</td>
      <td><span class="status-pill status-${c.active ? 'active' : 'inactive'}">${c.active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/kategori?edit=${c.id}" class="icon-btn btn-icon" title="Edit">${icons.edit}</a>
          <form method="POST" action="/admin/kategori/${c.id}/toggle" style="display:inline"><button class="icon-btn btn-icon" title="Aktif/Nonaktif" type="submit">${icons.eye}</button></form>
          <form method="POST" action="/admin/kategori/${c.id}/naik" style="display:inline"><button class="icon-btn btn-icon" title="Naikkan urutan" type="submit" ${idx === 0 ? 'disabled' : ''}>&uarr;</button></form>
          <form method="POST" action="/admin/kategori/${c.id}/turun" style="display:inline"><button class="icon-btn btn-icon" title="Turunkan urutan" type="submit" ${idx === categories.length - 1 ? 'disabled' : ''}>&darr;</button></form>
          <form method="POST" action="/admin/kategori/${c.id}/hapus" class="js-confirm" data-message="Hapus kategori '${escapeHtml(c.name)}'?" style="display:inline"><button class="icon-btn btn-icon" title="Hapus" type="submit" style="color:var(--danger)">${icons.trash}</button></form>
        </div>
      </td>
    </tr>`).join('');

  const body = `
  <div class="page-head"><div><h1>Kategori</h1><p>Atur kategori produk yang tampil di halaman beranda &amp; filter.</p></div></div>

  ${errors && errors.length ? `<div class="admin-card" style="border-color:var(--danger)"><strong style="color:var(--danger)">Periksa kembali form:</strong><ul style="margin:8px 0 0 18px">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}

  <div class="admin-card">
    <h3>${editing ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
    <form method="POST" action="${editing ? `/admin/kategori/${editing.id}/edit` : '/admin/kategori/baru'}">
      <div class="upload-drop" data-image-upload data-target="#cat-image-json" data-preview="#cat-image-preview" data-multiple="false">
        <input type="file" accept="image/*">
        ${icons.upload}
        <p style="margin:10px 0 0;font-weight:600;font-size:13.5px">Klik untuk upload gambar kategori</p>
      </div>
      <input type="hidden" id="cat-image-json" name="image_data" value="">
      <div class="img-thumb-grid" id="cat-image-preview">${editing && editing.image ? `<div class="img-thumb"><img src="${editing.image}"></div>` : ''}</div>

      <div class="form-row-2" style="margin-top:16px">
        <div class="form-group">
          <label>Nama Kategori *</label>
          <input type="text" class="form-control" name="name" value="${editing ? escapeHtml(editing.name) : ''}" required>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <input type="text" class="form-control" name="description" value="${editing ? escapeHtml(editing.description || '') : ''}">
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button type="submit" class="btn btn-primary">${editing ? 'Simpan Perubahan' : 'Tambah Kategori'}</button>
        ${editing ? `<a href="/admin/kategori" class="btn btn-outline">Batal</a>` : ''}
      </div>
    </form>
  </div>

  <div class="data-table-wrap">
    <table class="data-table">
      <thead><tr><th>Gambar</th><th>Nama</th><th>Slug</th><th>Jumlah Produk</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--ink-soft)">Belum ada kategori.</td></tr>`}</tbody>
    </table>
  </div>
  `;

  return adminLayout(req, { title: 'Kategori', activeKey: 'kategori', body });
}

module.exports = { renderCategories };
