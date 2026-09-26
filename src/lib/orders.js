'use strict';
const { db, all, get, run } = require('./db');
const productsLib = require('./products');
const { isValidPhone, buildOrderMessage, buildWaLink } = require('./whatsapp');

function generateOrderNumber() {
  const d = new Date();
  const datePart = d.toISOString().slice(0, 10).replace(/-/g, '');
  let attempt = 0;
  while (attempt < 20) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const candidate = `ORD-${datePart}-${rand}`;
    const exists = get('SELECT id FROM orders WHERE order_number = ?', [candidate]);
    if (!exists) return candidate;
    attempt++;
  }
  return `ORD-${datePart}-${Date.now()}`;
}

/**
 * Validates & creates an order from cart-like items, decrementing stock atomically.
 * items: [{ productId, size, qty }]  (price/name are re-derived from DB — never trusted from client)
 * customer: { customer_name, customer_phone, customer_address, notes }
 * Returns { ok, message?, order?, waLink? }
 */
function createOrder(customer, rawItems) {
  if (!customer.customer_name || !customer.customer_name.trim()) {
    return { ok: false, message: 'Nama pemesan wajib diisi.' };
  }
  if (!isValidPhone(customer.customer_phone)) {
    return { ok: false, message: 'Nomor WhatsApp tidak valid.' };
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, message: 'Keranjang belanja kosong.' };
  }

  // Resolve + validate every item against the live database (authoritative).
  const resolved = [];
  for (const raw of rawItems) {
    const product = get('SELECT * FROM products WHERE id = ? AND status = ?', [raw.productId, 'active']);
    if (!product) return { ok: false, message: `Produk tidak ditemukan (mungkin sudah dihapus).` };
    const qty = Math.max(1, parseInt(raw.qty, 10) || 1);

    let variant = null;
    let availableStock;
    let price;
    if (product.has_variants) {
      if (!raw.size) return { ok: false, message: `Ukuran belum dipilih untuk ${product.name}.` };
      variant = get('SELECT * FROM product_variants WHERE product_id = ? AND size = ?', [product.id, raw.size]);
      if (!variant) return { ok: false, message: `Varian ukuran ${raw.size} untuk ${product.name} tidak ditemukan.` };
      availableStock = variant.stock;
      price = variant.price || product.price;
    } else {
      availableStock = product.stock;
      price = product.promo_price && product.promo_price > 0 ? product.promo_price : product.price;
    }

    if (availableStock <= 0) return { ok: false, message: `Maaf, stok ${product.name}${variant ? ' (' + variant.size + ')' : ''} sudah habis.` };
    if (qty > availableStock) return { ok: false, message: `Stok ${product.name}${variant ? ' (' + variant.size + ')' : ''} hanya tersisa ${availableStock}.` };

    resolved.push({
      product, variant, qty, price, subtotal: price * qty,
      category: productsLib.getCategoryOf(product),
    });
  }

  const total = resolved.reduce((s, r) => s + r.subtotal, 0);
  const orderNumber = generateOrderNumber();

  try {
    db.exec('BEGIN');
    const info = run(
      `INSERT INTO orders (order_number, customer_name, customer_phone, customer_address, notes, total, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderNumber, customer.customer_name.trim(), customer.customer_phone.trim(), customer.customer_address || '', customer.notes || '', total]
    );
    const orderId = info.lastInsertRowid;

    for (const r of resolved) {
      run(
        `INSERT INTO order_items (order_id, product_id, product_name, sku, variant_size, qty, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, r.product.id, r.product.name, r.variant ? r.variant.sku : r.product.sku, r.variant ? r.variant.size : null, r.qty, r.price, r.subtotal]
      );
      if (r.variant) {
        run('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [r.qty, r.variant.id]);
      } else {
        run('UPDATE products SET stock = stock - ? WHERE id = ?', [r.qty, r.product.id]);
      }
      run('UPDATE products SET sold_count = sold_count + ? WHERE id = ?', [r.qty, r.product.id]);
    }
    db.exec('COMMIT');

    const orderForMessage = {
      order_number: orderNumber,
      customer_name: customer.customer_name,
      customer_phone: customer.customer_phone,
      customer_address: customer.customer_address,
      notes: customer.notes,
      total,
      items: resolved.map((r) => ({
        product_name: r.product.name,
        sku: r.variant ? r.variant.sku : r.product.sku,
        category_name: r.category ? r.category.name : '',
        variant_size: r.variant ? r.variant.size : null,
        qty: r.qty,
        price: r.price,
        subtotal: r.subtotal,
      })),
    };
    const message = buildOrderMessage(orderForMessage);
    const waLink = buildWaLink(require('./settings').getSetting('whatsapp_number'), message);

    return { ok: true, orderNumber, total, waLink };
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (e) {}
    console.error('[createOrder] failed', err);
    return { ok: false, message: 'Gagal menyimpan pesanan. Silakan coba lagi.' };
  }
}

function restoreStockForOrder(orderId) {
  const items = all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  for (const it of items) {
    if (it.variant_size) {
      run('UPDATE product_variants SET stock = stock + ? WHERE product_id = ? AND size = ?', [it.qty, it.product_id, it.variant_size]);
    } else if (it.product_id) {
      run('UPDATE products SET stock = stock + ? WHERE id = ?', [it.qty, it.product_id]);
    }
    if (it.product_id) run('UPDATE products SET sold_count = MAX(0, sold_count - ?) WHERE id = ?', [it.qty, it.product_id]);
  }
}

module.exports = { generateOrderNumber, createOrder, restoreStockForOrder };
