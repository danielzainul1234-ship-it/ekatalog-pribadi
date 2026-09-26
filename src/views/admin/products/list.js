'use strict';
const { adminLayout } = require('../layout');
const { rupiah, escapeHtml } = require('../../../lib/format');
const { icons } = require('../../icons');

function renderProductList(req, { products, categories, filters }) {
  const rows = products.map((p) => {
    const stockLabel = p.totalStock <= 0
      ? `<span class="status-pill status-dibatalkan">Habis</span>`
      : (p.lowStock ? `<span class="status-pill status-pending">Sisa ${p.totalStock}</span>` : `${p.totalStock}`);
    return `
    <tr>
      <td><img class="row-thumb" src="${p.mainImage}" alt=""></td>
      <td>
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="font-size:11.5px;color:var(--ink-soft)">${escapeHtml(p.sku || '-')}</div>
      </td>
      <td>${p.category ? escapeHtml(p.category.name) : '-'}</td>
      <td>
        ${rupiah(p.priceNow)}
        ${p.priceOld ? `<br><span style="text-decoration:line-through;color:var(--ink-soft);font-size:11.5px">${rupiah(p.priceOld)}</span>` : ''}
      </td>
      <td>${stockLabel}</td>
      <td>
        ${p.is_new ? '<span class="badge badge-new" style="position:static">NEW</span> ' : ''}
        ${p.is_bestseller ? '<span class="badge badge-best" style="position:static">BEST</span> ' : ''}
        ${p.is_promo ? '<span class="badge badge-promo" style="position:static">PROMO</span>' : ''}
      </td>
      <td><span class="status-pill status-${p.status}">${p.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/produk/${p.id}/edit" class="icon-btn btn-icon" title="Edit">${icons.edit}</a>
          <form method="POST" action="/admin/produk/${p.id}/duplikat" style="display:inline">
            <button class="icon-btn btn-icon" title="Duplikat" type="submit">${icons.copy}</button>
          </form>
          <form method="POST" action="/admin/produk/${p.id}/toggle-status" style="display:inline">
            <button class="icon-btn btn-icon" title="${p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}" type="submit">${icons.eye}</button>
          </form>
          <form method="POST" action="/admin/produk/${p.id}/hapus" class="js-confirm" data-message="Hapus produk '${escapeHtml(p.name)}'? Tindakan ini tidak dapat dibatalkan." style="display:inline">
            <button class="icon-btn btn-icon" title="Hapus" type="submit" style="color:var(--danger)">${icons.trash}</button>
          </form>
        </div>
      </td>
    </tr>`;
  }).join('');

  const body = `
  <div class="page-head">
    <div><h1>Produk</h1><p>Kelola seluruh produk di katalog Anda.</p></div>
    <a href="/admin/produk/baru" class="btn btn-primary">${icons.plus} Tambah Produk</a>
  </div>

  <div class="admin-toolbar">
    <form method="GET" class="admin-search">
      <span>${icons.search}</span>
      <input type="text" name="q" value="${escapeHtml(filters.q || '')}" placeholder="Cari nama, SKU, kategori...">
    </form>
    <form method="GET" style="display:flex;gap:8px">
      <input type="hidden" name="q" value="${escapeHtml(filters.q || '')}">
      <select name="category" class="select-sort" onchange="this.form.submit()">
        <option value="">Semua Kategori</option>
        ${categories.map((c) => `<option value="${c.id}" ${String(filters.category) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
      </select>
      <select name="status" class="select-sort" onchange="this.form.submit()">
        <option value="">Semua Status</option>
        <option value="active" ${filters.status === 'active' ? 'selected' : ''}>Aktif</option>
        <option value="inactive" ${filters.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
      </select>
    </form>
  </div>

  <div class="data-table-wrap">
    <table class="data-table">
      <thead><tr><th>Foto</th><th>Nama Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Label</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--ink-soft)">Belum ada produk. Klik "Tambah Produk" untuk membuat produk pertama.</td></tr>`}</tbody>
    </table>
  </div>
  `;

  return adminLayout(req, { title: 'Produk', activeKey: 'produk', body });
}

module.exports = { renderProductList };
