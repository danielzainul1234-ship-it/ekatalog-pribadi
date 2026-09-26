'use strict';
const { adminLayout } = require('./layout');
const { rupiah } = require('../../lib/format');
const { icons } = require('../icons');

function renderDashboard(req, { stats, series, range }) {
  const maxVal = Math.max(1, ...series.map((s) => s.total));

  const chart = `
  <div class="chart-bars">
    ${series.map((s) => `
      <div class="bar-col">
        <div class="bar" style="height:${Math.max(2, Math.round((s.total / maxVal) * 130))}px" title="${rupiah(s.total)}"></div>
        <div class="bar-label">${s.label}</div>
      </div>`).join('')}
  </div>`;

  const body = `
  <div class="stat-grid">
    <div class="stat-card"><div class="label">Total Produk</div><div class="value">${stats.totalProducts}</div></div>
    <div class="stat-card"><div class="label">Total Pesanan</div><div class="value">${stats.totalOrders}</div></div>
    <div class="stat-card"><div class="label">Pesanan Hari Ini</div><div class="value">${stats.ordersToday}</div></div>
    <div class="stat-card"><div class="label">Penjualan Hari Ini</div><div class="value">${rupiah(stats.salesToday)}</div></div>
    <div class="stat-card"><div class="label">Stok Menipis</div><div class="value warn">${stats.lowStockCount}</div></div>
    <div class="stat-card"><div class="label">Produk Habis</div><div class="value danger">${stats.outOfStockCount}</div></div>
  </div>

  <div class="admin-card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <h3 style="margin:0">Grafik Penjualan</h3>
      <div class="tabs" style="margin:0;border-bottom:none">
        <a href="?range=daily" class="${range === 'daily' ? 'active' : ''}">Harian</a>
        <a href="?range=weekly" class="${range === 'weekly' ? 'active' : ''}">Mingguan</a>
        <a href="?range=monthly" class="${range === 'monthly' ? 'active' : ''}">Bulanan</a>
      </div>
    </div>
    ${chart}
  </div>

  <div class="form-row-2">
    <a href="/admin/produk/baru" class="admin-card" style="display:flex;align-items:center;gap:14px;text-decoration:none">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center">${icons.plus}</div>
      <div><strong>Tambah Produk Baru</strong><div style="font-size:12.5px;color:var(--ink-soft)">Upload foto, atur harga &amp; stok</div></div>
    </a>
    <a href="/admin/pesanan" class="admin-card" style="display:flex;align-items:center;gap:14px;text-decoration:none">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center">${icons.clipboard}</div>
      <div><strong>Kelola Pesanan</strong><div style="font-size:12.5px;color:var(--ink-soft)">Lihat &amp; update status pesanan masuk</div></div>
    </a>
  </div>
  `;

  return adminLayout(req, { title: 'Dashboard', activeKey: 'dashboard', body });
}

module.exports = { renderDashboard };
