'use strict';
const { adminLayout } = require('../layout');
const { rupiah, dateTimeID, escapeHtml } = require('../../../lib/format');
const { STATUS_LABELS } = require('./list');
const { icons } = require('../../icons');

function renderOrderDetail(req, { order, items }) {
  const itemRows = items.map((it) => `
    <tr>
      <td>${escapeHtml(it.product_name)}</td>
      <td>${escapeHtml(it.sku || '-')}</td>
      <td>${it.variant_size ? escapeHtml(it.variant_size) : '-'}</td>
      <td>${it.qty}</td>
      <td>${rupiah(it.price)}</td>
      <td style="font-weight:600">${rupiah(it.subtotal)}</td>
    </tr>`).join('');

  const body = `
  <div class="page-head">
    <div><h1>Pesanan ${escapeHtml(order.order_number)}</h1><p>Dibuat ${dateTimeID(order.created_at)}</p></div>
    <a href="/admin/pesanan" class="btn btn-outline">Kembali</a>
  </div>

  <div class="form-row-2">
    <div>
      <div class="admin-card">
        <h3>Detail Produk</h3>
        <div class="data-table-wrap" style="border:none">
          <table class="data-table">
            <thead><tr><th>Produk</th><th>SKU</th><th>Ukuran</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>
        <div class="summary-total" style="margin-top:14px"><span>Total Pesanan</span><span>${rupiah(order.total)}</span></div>
      </div>

      ${order.notes ? `<div class="admin-card"><h3>Catatan Customer</h3><p style="color:var(--ink-soft)">${escapeHtml(order.notes)}</p></div>` : ''}
    </div>

    <div>
      <div class="admin-card">
        <h3>Data Customer</h3>
        <p><strong>${escapeHtml(order.customer_name)}</strong></p>
        <p style="color:var(--ink-soft);font-size:13.5px">${icons.whatsapp} ${escapeHtml(order.customer_phone)}</p>
        <p style="color:var(--ink-soft);font-size:13.5px">${escapeHtml(order.customer_address || 'Alamat tidak diisi')}</p>
        <a href="https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-block" style="margin-top:14px">${icons.whatsapp} Chat Customer</a>
      </div>

      <div class="admin-card">
        <h3>Status Pesanan</h3>
        <form method="POST" action="/admin/pesanan/${order.id}/status">
          <div class="form-group">
            <select class="form-control" name="status">
              ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${order.status === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Update Status</button>
        </form>
      </div>
    </div>
  </div>
  `;
  return adminLayout(req, { title: `Pesanan ${order.order_number}`, activeKey: 'pesanan', body });
}

module.exports = { renderOrderDetail };
