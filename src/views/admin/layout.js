'use strict';
const { icons } = require('../icons');
const { escapeHtml } = require('../../lib/format');
const { getSettings } = require('../../lib/settings');

const NAV = [
  { group: 'Utama', items: [
    { href: '/admin', key: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
  ]},
  { group: 'Katalog', items: [
    { href: '/admin/produk', key: 'produk', label: 'Produk', icon: icons.package },
    { href: '/admin/kategori', key: 'kategori', label: 'Kategori', icon: icons.tag },
  ]},
  { group: 'Penjualan', items: [
    { href: '/admin/pesanan', key: 'pesanan', label: 'Pesanan', icon: icons.clipboard },
  ]},
  { group: 'Pengaturan', items: [
    { href: '/admin/pengaturan/toko', key: 'toko', label: 'Info Toko', icon: icons.settings },
    { href: '/admin/pengaturan/whatsapp', key: 'whatsapp', label: 'WhatsApp', icon: icons.whatsapp },
    { href: '/admin/pengaturan/akun', key: 'akun', label: 'Akun Admin', icon: icons.users },
  ]},
];

function adminLayout(req, { title, activeKey, body, pageActions }) {
  const s = getSettings();
  const admin = req.admin;

  const navHtml = NAV.map((g) => `
    <div class="group-label">${g.group}</div>
    ${g.items.map((it) => `<a href="${it.href}" class="${activeKey === it.key ? 'active' : ''}">${it.icon}<span>${it.label}</span></a>`).join('')}
  `).join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Admin ${escapeHtml(s.store_name)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/admin.css">
<style>:root{--primary:${s.primary_color};--primary-dark:${s.primary_color};--secondary:${s.secondary_color};}</style>
</head>
<body class="admin-body">
<div class="admin-shell">
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  <aside class="admin-sidebar" id="admin-sidebar">
    <div class="brand">
      ${s.logo ? `<img src="${s.logo}" alt="">` : ''}
      <span>${escapeHtml(s.store_name)}</span>
    </div>
    <nav class="admin-nav">
      ${navHtml}
      <a href="/admin/logout" style="margin-top:14px;color:#e7a89a">${icons.logout}<span>Keluar</span></a>
    </nav>
  </aside>

  <div class="admin-main">
    <div class="admin-topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="icon-btn admin-menu-btn" id="btn-open-sidebar">${icons.menu}</button>
        <span class="title">${escapeHtml(title)}</span>
      </div>
      <div class="right">
        ${pageActions || ''}
        <a href="/" target="_blank" class="btn btn-ghost btn-sm" rel="noopener">${icons.eye} Lihat Toko</a>
        <div class="admin-user">
          <div class="admin-avatar">${escapeHtml((admin.name || 'A').charAt(0).toUpperCase())}</div>
          <span>${escapeHtml(admin.name)}</span>
        </div>
      </div>
    </div>
    <div class="admin-content">
      ${body}
    </div>
  </div>
</div>

<div id="toast-root"></div>
<div class="confirm-overlay" id="confirm-overlay">
  <div class="confirm-box">
    <h3 id="confirm-title">Konfirmasi</h3>
    <p id="confirm-message">Apakah Anda yakin?</p>
    <div class="confirm-actions">
      <button class="btn btn-outline" id="confirm-cancel">Batal</button>
      <button class="btn btn-primary" id="confirm-ok" style="background:var(--danger)">Ya, Lanjutkan</button>
    </div>
  </div>
</div>
<script src="/js/admin.js"></script>
</body></html>`;
}

module.exports = { adminLayout };
