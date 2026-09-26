'use strict';
const { adminLayout } = require('../layout');
const { escapeHtml } = require('../../../lib/format');
const { icons } = require('../../icons');

function renderWhatsappSettings(req, { settings, saved }) {
  const s = settings;
  const body = `
  <div class="page-head"><div><h1>Pengaturan WhatsApp</h1><p>Atur nomor tujuan &amp; template pesan otomatis untuk checkout.</p></div></div>
  ${saved ? `<div class="admin-card" style="border-color:var(--success);color:var(--success);font-weight:600">${icons.check} Perubahan berhasil disimpan.</div>` : ''}

  <form method="POST" action="/admin/pengaturan/whatsapp">
    <div class="admin-card">
      <h3>Nomor WhatsApp Tujuan</h3>
      <div class="form-row-2">
        <div class="form-group">
          <label>Nomor WhatsApp (format 62xxxxxxxxxx) *</label>
          <input type="text" class="form-control" name="whatsapp_number" id="wa-number" value="${escapeHtml(s.whatsapp_number)}" required>
          <p class="form-hint">Semua pesanan customer akan dikirim ke nomor ini. Contoh: 6282232274476</p>
        </div>
        <div class="form-group">
          <label>Nama Admin</label>
          <input type="text" class="form-control" name="wa_admin_name" value="${escapeHtml(s.wa_admin_name)}">
        </div>
      </div>
      <button type="button" class="btn btn-outline" id="btn-test-wa">${icons.whatsapp} Test WhatsApp</button>
    </div>

    <div class="admin-card">
      <h3>Pesan Pembuka &amp; Penutup</h3>
      <div class="form-group"><label>Pesan Pembuka</label><textarea class="form-control" name="wa_opening_message" rows="2">${escapeHtml(s.wa_opening_message)}</textarea></div>
      <div class="form-group"><label>Pesan Penutup</label><textarea class="form-control" name="wa_closing_message" rows="2">${escapeHtml(s.wa_closing_message)}</textarea></div>
    </div>

    <div class="admin-card">
      <h3>Template Per-Item</h3>
      <p class="form-hint" style="margin-bottom:10px">Variabel: {no} {nama_produk} {sku} {kategori} {ukuran} {jumlah} {harga} {subtotal}</p>
      <div class="form-group"><textarea class="form-control" name="wa_item_template" rows="6" style="font-family:monospace;font-size:13px">${escapeHtml(s.wa_item_template)}</textarea></div>
    </div>

    <div class="admin-card">
      <h3>Template Pesan Keseluruhan</h3>
      <p class="form-hint" style="margin-bottom:10px">Variabel: {opening} {closing} {items} {total} {nama_customer} {nomor_customer} {alamat} {catatan} {nomor_pesanan} {tanggal}</p>
      <div class="form-group"><textarea class="form-control" name="wa_message_template" rows="10" style="font-family:monospace;font-size:13px">${escapeHtml(s.wa_message_template)}</textarea></div>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:60px">
      <button type="submit" class="btn btn-primary btn-lg">Simpan Pengaturan</button>
    </div>
  </form>

  <script>
    document.getElementById('btn-test-wa').addEventListener('click', function(){
      var num = document.getElementById('wa-number').value.replace(/[^0-9]/g,'');
      if (!num) { showToast('Isi nomor WhatsApp terlebih dahulu', 'error'); return; }
      window.open('https://wa.me/' + num + '?text=' + encodeURIComponent('Ini adalah pesan test dari dashboard admin.'), '_blank');
    });
  </script>
  `;
  return adminLayout(req, { title: 'Pengaturan WhatsApp', activeKey: 'whatsapp', body });
}

module.exports = { renderWhatsappSettings };
