'use strict';
const { getSettings } = require('./settings');
const { rupiah, dateID } = require('./format');

function fillTemplate(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
  });
}

/**
 * Build the final WhatsApp message text for an order.
 * order: { order_number, customer_name, customer_phone, customer_address, notes, total, items: [...] }
 * item: { product_name, sku, category_name, variant_size, qty, price, subtotal }
 */
function buildOrderMessage(order) {
  const s = getSettings();
  const itemsText = order.items
    .map((it, idx) =>
      fillTemplate(s.wa_item_template, {
        no: idx + 1,
        produk: it.product_name,
        nama_produk: it.product_name,
        sku: it.sku || '-',
        kategori: it.category_name || '-',
        ukuran: it.variant_size || '-',
        jumlah: it.qty,
        harga: rupiah(it.price),
        subtotal: rupiah(it.subtotal),
      })
    )
    .join('\n\n');

  return fillTemplate(s.wa_message_template, {
    opening: s.wa_opening_message,
    closing: s.wa_closing_message,
    items: itemsText,
    total: rupiah(order.total),
    nama_customer: order.customer_name,
    nomor_customer: order.customer_phone,
    alamat: order.customer_address || '-',
    catatan: order.notes || '-',
    nomor_pesanan: order.order_number,
    tanggal: dateID(),
  });
}

// Normalizes an Indonesian phone number to international format without '+' (for wa.me links).
function normalizePhone(phone) {
  let p = String(phone || '').replace(/[^\d]/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p;
}

function isValidPhone(phone) {
  const p = String(phone || '').replace(/[^\d]/g, '');
  return p.length >= 9 && p.length <= 15;
}

function buildWaLink(phone, message) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

module.exports = { fillTemplate, buildOrderMessage, normalizePhone, isValidPhone, buildWaLink };
