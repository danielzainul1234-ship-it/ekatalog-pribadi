'use strict';
const { adminLayout } = require('../layout');
const { escapeHtml } = require('../../../lib/format');
const { icons } = require('../../icons');

function renderProductForm(req, { product, categories, errors }) {
  const isEdit = !!product;
  const images = product ? JSON.stringify(product.images) : '[]';
  const variants = product && product.has_variants ? product.variants : [];

  const variantRows = (variants.length ? variants : [{ size: '', price: '', stock: 0, sku: '' }])
    .map((v) => `
    <tr>
      <td><input type="text" name="variant_size[]" value="${escapeHtml(v.size || '')}" placeholder="Contoh: M" required></td>
      <td><input type="number" name="variant_price[]" value="${v.price || ''}" placeholder="Kosongkan = harga utama" min="0"></td>
      <td><input type="number" name="variant_stock[]" value="${v.stock || 0}" min="0" required></td>
      <td><input type="text" name="variant_sku[]" value="${escapeHtml(v.sku || '')}" placeholder="SKU varian"></td>
      <td><button type="button" class="rm-variant">Hapus</button></td>
    </tr>`).join('');

  const body = `
  <div class="page-head">
    <div><h1>${isEdit ? 'Edit Produk' : 'Tambah Produk'}</h1><p>Lengkapi detail produk agar tampil optimal di katalog.</p></div>
  </div>

  ${errors && errors.length ? `<div class="admin-card" style="border-color:var(--danger)"><strong style="color:var(--danger)">Periksa kembali form:</strong><ul style="margin:8px 0 0 18px">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}

  <form method="POST" action="${isEdit ? `/admin/produk/${product.id}/edit` : '/admin/produk/baru'}">
    <div class="admin-card">
      <h3>Foto Produk</h3>
      <div class="upload-drop" data-image-upload data-target="#images-json" data-preview="#images-preview" data-multiple="true" data-max="6">
        <input type="file" accept="image/*" multiple>
        ${icons.upload}
        <p style="margin:10px 0 0;font-weight:600;font-size:13.5px">Klik untuk upload foto</p>
        <p class="dropzone-hint">Foto pertama akan menjadi foto utama. Maks 6 foto.</p>
      </div>
      <input type="hidden" id="images-json" name="images_json" value='${images.replace(/'/g, '&#39;')}'>
      <div class="img-thumb-grid" id="images-preview"></div>
    </div>

    <div class="admin-card">
      <h3>Informasi Produk</h3>
      <div class="form-row-2">
        <div class="form-group">
          <label>Nama Produk *</label>
          <input type="text" class="form-control" name="name" value="${escapeHtml(product ? product.name : '')}" required>
        </div>
        <div class="form-group">
          <label>SKU</label>
          <input type="text" class="form-control" name="sku" value="${escapeHtml(product ? product.sku : '')}" placeholder="Otomatis jika kosong">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Kategori</label>
          <select class="form-control" name="category_id">
            <option value="">Pilih kategori</option>
            ${categories.map((c) => `<option value="${c.id}" ${product && product.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" name="status">
            <option value="active" ${!product || product.status === 'active' ? 'selected' : ''}>Aktif (tampil di toko)</option>
            <option value="inactive" ${product && product.status === 'inactive' ? 'selected' : ''}>Nonaktif (disembunyikan)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Deskripsi</label>
        <textarea class="form-control" name="description" rows="4">${escapeHtml(product ? product.description : '')}</textarea>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Harga Normal (Rp) *</label>
          <input type="number" class="form-control" name="price" value="${product ? product.price : ''}" min="0" required>
        </div>
        <div class="form-group">
          <label>Harga Promo (Rp)</label>
          <input type="number" class="form-control" name="promo_price" value="${product && product.promo_price ? product.promo_price : ''}" min="0" placeholder="Kosongkan jika tidak ada promo">
        </div>
      </div>
      <div class="form-group">
        <label>Label Produk</label>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:6px">
          <label style="display:flex;align-items:center;gap:8px;font-weight:500"><input type="checkbox" name="is_new" ${product && product.is_new ? 'checked' : ''}> Produk Baru</label>
          <label style="display:flex;align-items:center;gap:8px;font-weight:500"><input type="checkbox" name="is_bestseller" ${product && product.is_bestseller ? 'checked' : ''}> Best Seller</label>
          <label style="display:flex;align-items:center;gap:8px;font-weight:500"><input type="checkbox" name="is_promo" ${product && product.is_promo ? 'checked' : ''}> Promo</label>
          <label style="display:flex;align-items:center;gap:8px;font-weight:500"><input type="checkbox" name="is_limited" ${product && product.is_limited ? 'checked' : ''}> Terbatas</label>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="margin:0">Stok &amp; Ukuran</h3>
        <label class="switch"><input type="checkbox" id="toggle-has-variants" name="has_variants" ${product && product.has_variants ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <p class="form-hint" style="margin-top:-8px;margin-bottom:14px">Aktifkan jika produk memiliki pilihan ukuran (gamis, dress, dll). Nonaktifkan untuk produk tanpa ukuran (hijab, tas, aksesoris).</p>

      <div id="simple-stock-block">
        <div class="form-group" style="max-width:240px">
          <label>Stok</label>
          <input type="number" class="form-control" name="stock" min="0" value="${product && !product.has_variants ? product.stock : 0}">
        </div>
      </div>

      <div id="variant-block">
        <div class="variant-table" style="overflow-x:auto">
          <table class="variant-table" style="width:100%">
            <thead><tr><th>Ukuran</th><th>Harga (opsional)</th><th>Stok</th><th>SKU Varian</th><th></th></tr></thead>
            <tbody id="variant-rows">${variantRows}</tbody>
          </table>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-add-variant" style="margin-top:10px">${icons.plus} Tambah Ukuran</button>
      </div>
    </div>

    <div class="admin-card">
      <h3>SEO</h3>
      <div class="form-group">
        <label>SEO Title</label>
        <input type="text" class="form-control" name="seo_title" value="${escapeHtml(product ? product.seo_title || '' : '')}" placeholder="Judul untuk mesin pencari">
      </div>
      <div class="form-group">
        <label>Meta Description</label>
        <textarea class="form-control" name="meta_description" rows="2" placeholder="Ringkasan singkat untuk mesin pencari (maks 160 karakter)">${escapeHtml(product ? product.meta_description || '' : '')}</textarea>
      </div>
      <p class="form-hint">URL produk: /produk/${product ? escapeHtml(product.slug) : '(dibuat otomatis dari nama produk)'}</p>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-bottom:60px">
      <a href="/admin/produk" class="btn btn-outline">Batal</a>
      <button type="submit" class="btn btn-primary btn-lg">${isEdit ? 'Simpan Perubahan' : 'Publish Produk'}</button>
    </div>
  </form>
  `;

  return adminLayout(req, { title: isEdit ? 'Edit Produk' : 'Tambah Produk', activeKey: 'produk', body });
}

module.exports = { renderProductForm };
