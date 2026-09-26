'use strict';
const { adminLayout } = require('../layout');
const { rupiah, dateTimeID, escapeHtml } = require('../../../lib/format');

const STATUS_LABELS = {
  pending: 'Pending', dikonfirmasi: 'Dikonfirmasi', diproses: 'Diproses',
  dikirim: 'Dikirim', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
};

function renderOrderList(req, { orders, filters }) {
  const rows = orders.map((o) => `
    <tr>
      <td><a href="/admin/pesanan/${o.id}" style="font-weight:700;color:var(--primary)">${escapeHtml(o.order_number)}</a></td>
      <td>${escapeHtml(o.customer_name)}<div style="font-size:11.5px;color:var(--ink-soft)">${escapeHtml(o.customer_phone)}</div></td>
      <td>${o.item_count} produk</td>
      <td style="font-weight:600">${rupiah(o.total)}</td>
      <td>${dateTimeID(o.created_at)}</td>
      <td><span class="status-pill status-${o.status}">${STATUS_LABELS[o.status] || o.status}</span></td>
      <td><a href="/admin/pesanan/${o.id}" class="btn btn-ghost btn-sm">Lihat</a></td>
    </tr>`).join('');

  const body = `
  <div class="page-head"><div><h1>Pesanan</h1><p>Semua pesanan yang masuk dari customer.</p></div></div>

  <div class="admin-toolbar">
    <form method="GET" class="admin-search" style="max-width:280px">
      <span></span>
      <input type="text" name="q" value="${escapeHtml(filters.q || '')}" placeholder="Cari No. Order / Nama...">
    </form>
    <form method="GET">
      <input type="hidden" name="q" value="${escapeHtml(filters.q || '')}">
      <select name="status" class="select-sort" onchange="this.form.submit()">
        <option value="">Semua Status</option>
        ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${filters.status === k ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </form>
  </div>

  <div class="data-table-wrap">
    <table class="data-table">
      <thead><tr><th>No. Order</th><th>Customer</th><th>Produk</th><th>Total</th><th>Tanggal</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--ink-soft)">Belum ada pesanan.</td></tr>`}</tbody>
    </table>
  </div>
  `;
  return adminLayout(req, { title: 'Pesanan', activeKey: 'pesanan', body });
}

module.exports = { renderOrderList, STATUS_LABELS };
