'use strict';
const { adminLayout } = require('../layout');
const { escapeHtml } = require('../../../lib/format');
const { icons } = require('../../icons');

function renderAkunSettings(req, { admin, saved, errors }) {
  const body = `
  <div class="page-head"><div><h1>Akun Admin</h1><p>Kelola informasi login &amp; password Anda.</p></div></div>
  ${saved ? `<div class="admin-card" style="border-color:var(--success);color:var(--success);font-weight:600">${icons.check} Perubahan berhasil disimpan.</div>` : ''}
  ${errors && errors.length ? `<div class="admin-card" style="border-color:var(--danger)"><strong style="color:var(--danger)">Periksa kembali form:</strong><ul style="margin:8px 0 0 18px">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}

  <form method="POST" action="/admin/pengaturan/akun">
    <div class="admin-card">
      <h3>Informasi Akun</h3>
      <div class="form-row-2">
        <div class="form-group"><label>Nama</label><input type="text" class="form-control" name="name" value="${escapeHtml(admin.name)}" required></div>
        <div class="form-group"><label>Username</label><input type="text" class="form-control" name="username" value="${escapeHtml(admin.username)}" required></div>
      </div>
    </div>
    <div class="admin-card">
      <h3>Ubah Password</h3>
      <p class="form-hint" style="margin-bottom:12px">Kosongkan jika tidak ingin mengubah password.</p>
      <div class="form-row-2">
        <div class="form-group"><label>Password Baru</label><input type="password" class="form-control" name="new_password" placeholder="Minimal 6 karakter"></div>
        <div class="form-group"><label>Konfirmasi Password</label><input type="password" class="form-control" name="confirm_password"></div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:60px">
      <button type="submit" class="btn btn-primary btn-lg">Simpan Perubahan</button>
    </div>
  </form>
  `;
  return adminLayout(req, { title: 'Akun Admin', activeKey: 'akun', body });
}

module.exports = { renderAkunSettings };
