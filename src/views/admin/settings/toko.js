'use strict';
const { adminLayout } = require('../layout');
const { escapeHtml } = require('../../../lib/format');
const { icons } = require('../../icons');

function renderTokoSettings(req, { settings, saved }) {
  const s = settings;
  const body = `
  <div class="page-head"><div><h1>Info Toko</h1><p>Atur identitas &amp; tampilan toko Anda tanpa perlu menyentuh kode.</p></div></div>
  ${saved ? `<div class="admin-card" style="border-color:var(--success);color:var(--success);font-weight:600">${icons.check} Perubahan berhasil disimpan.</div>` : ''}

  <form method="POST" action="/admin/pengaturan/toko">
    <div class="admin-card">
      <h3>Identitas Toko</h3>
      <div class="form-row-2">
        <div class="form-group"><label>Nama Toko</label><input type="text" class="form-control" name="store_name" value="${escapeHtml(s.store_name)}"></div>
        <div class="form-group"><label>Tagline</label><input type="text" class="form-control" name="store_tagline" value="${escapeHtml(s.store_tagline)}"></div>
      </div>
      <div class="form-group"><label>Deskripsi Toko</label><textarea class="form-control" name="store_description" rows="2">${escapeHtml(s.store_description)}</textarea></div>

      <div class="form-row-2">
        <div class="form-group">
          <label>Logo</label>
          <div class="upload-drop" data-image-upload data-target="#logo-json" data-preview="#logo-preview" data-multiple="false">
            <input type="file" accept="image/*">${icons.upload}<p class="dropzone-hint">Klik untuk upload logo</p>
          </div>
          <input type="hidden" id="logo-json" name="logo_data" value="">
          <div class="img-thumb-grid" id="logo-preview">${s.logo ? `<div class="img-thumb"><img src="${s.logo}"></div>` : ''}</div>
        </div>
        <div class="form-group">
          <label>Favicon</label>
          <div class="upload-drop" data-image-upload data-target="#favicon-json" data-preview="#favicon-preview" data-multiple="false">
            <input type="file" accept="image/*">${icons.upload}<p class="dropzone-hint">Klik untuk upload favicon</p>
          </div>
          <input type="hidden" id="favicon-json" name="favicon_data" value="">
          <div class="img-thumb-grid" id="favicon-preview">${s.favicon ? `<div class="img-thumb"><img src="${s.favicon}"></div>` : ''}</div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <h3>Warna Website</h3>
      <div class="form-row-2">
        <div class="form-group"><label>Warna Utama</label><div class="color-swatch-input"><input type="color" name="primary_color" value="${s.primary_color}"><input type="text" class="form-control" value="${s.primary_color}" disabled></div></div>
        <div class="form-group"><label>Warna Sekunder</label><div class="color-swatch-input"><input type="color" name="secondary_color" value="${s.secondary_color}"><input type="text" class="form-control" value="${s.secondary_color}" disabled></div></div>
      </div>
    </div>

    <div class="admin-card">
      <h3>Banner Homepage</h3>
      <div class="form-group">
        <label>Gambar Banner</label>
        <div class="upload-drop" data-image-upload data-target="#banner-json" data-preview="#banner-preview" data-multiple="false">
          <input type="file" accept="image/*">${icons.upload}<p class="dropzone-hint">Rekomendasi ukuran 1600x900px</p>
        </div>
        <input type="hidden" id="banner-json" name="banner_image_data" value="">
        <div class="img-thumb-grid" id="banner-preview">${s.banner_image ? `<div class="img-thumb"><img src="${s.banner_image}"></div>` : ''}</div>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label>Judul Banner</label><input type="text" class="form-control" name="banner_title" value="${escapeHtml(s.banner_title)}"></div>
        <div class="form-group"><label>Teks Tombol</label><input type="text" class="form-control" name="banner_cta_text" value="${escapeHtml(s.banner_cta_text)}"></div>
      </div>
      <div class="form-group"><label>Subjudul Banner</label><input type="text" class="form-control" name="banner_subtitle" value="${escapeHtml(s.banner_subtitle)}"></div>
      <div class="form-group"><label>Link Tujuan Tombol</label><input type="text" class="form-control" name="banner_cta_link" value="${escapeHtml(s.banner_cta_link)}"></div>
    </div>

    <div class="admin-card">
      <h3>Section Promo</h3>
      <div class="form-group"><label>Judul Promo</label><input type="text" class="form-control" name="promo_title" value="${escapeHtml(s.promo_title)}"></div>
      <div class="form-group"><label>Subjudul Promo</label><input type="text" class="form-control" name="promo_subtitle" value="${escapeHtml(s.promo_subtitle)}"></div>
    </div>

    <div class="admin-card">
      <h3>Kontak &amp; Sosial Media</h3>
      <div class="form-row-2">
        <div class="form-group"><label>Email</label><input type="email" class="form-control" name="email" value="${escapeHtml(s.email)}"></div>
        <div class="form-group"><label>Nomor Telepon (tampilan)</label><input type="text" class="form-control" name="phone_display" value="${escapeHtml(s.phone_display)}"></div>
      </div>
      <div class="form-group"><label>Alamat</label><input type="text" class="form-control" name="address" value="${escapeHtml(s.address)}"></div>
      <div class="form-row-3">
        <div class="form-group"><label>Instagram (URL)</label><input type="text" class="form-control" name="instagram" value="${escapeHtml(s.instagram)}"></div>
        <div class="form-group"><label>Facebook (URL)</label><input type="text" class="form-control" name="facebook" value="${escapeHtml(s.facebook)}"></div>
        <div class="form-group"><label>TikTok (URL)</label><input type="text" class="form-control" name="tiktok" value="${escapeHtml(s.tiktok)}"></div>
      </div>
    </div>

    <div class="admin-card">
      <h3>Footer</h3>
      <div class="form-group"><label>Teks Footer</label><textarea class="form-control" name="footer_text" rows="2">${escapeHtml(s.footer_text)}</textarea></div>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:60px">
      <button type="submit" class="btn btn-primary btn-lg">Simpan Pengaturan</button>
    </div>
  </form>
  `;
  return adminLayout(req, { title: 'Info Toko', activeKey: 'toko', body });
}

module.exports = { renderTokoSettings };
