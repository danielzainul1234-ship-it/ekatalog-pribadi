'use strict';
const { Router } = require('../lib/miniweb');
const { all, get, run } = require('../lib/db');
const { requireAuth, COOKIE_NAME } = require('../lib/adminAuth');
const { verifyPassword, hashPassword } = require('../lib/password');
const { createSession, destroySession } = require('../lib/session');
const { slugify, uniqueSlug } = require('../lib/slugify');
const { saveDataUrlImage, deleteUploadedFile } = require('../lib/image');
const { getSettings, setSettings } = require('../lib/settings');
const productsLib = require('../lib/products');
const stats = require('../lib/stats');

const { renderLogin } = require('../views/admin/login');
const { renderDashboard } = require('../views/admin/dashboard');
const { renderProductList } = require('../views/admin/products/list');
const { renderProductForm } = require('../views/admin/products/form');
const { renderCategories } = require('../views/admin/categories');
const { renderOrderList } = require('../views/admin/orders/list');
const { renderOrderDetail } = require('../views/admin/orders/detail');
const { renderTokoSettings } = require('../views/admin/settings/toko');
const { renderWhatsappSettings } = require('../views/admin/settings/whatsapp');
const { renderAkunSettings } = require('../views/admin/settings/akun');
const { restoreStockForOrder } = require('../lib/orders');

const router = new Router();

// ---------------------------------------------------------------- auth ----
router.get('/login', (req, res) => {
  res.send(renderLogin({ next: req.query.next }));
});

router.post('/login', (req, res) => {
  const { username, password, next } = req.body;
  const admin = get('SELECT * FROM admins WHERE username = ?', [String(username || '').trim()]);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return res.status(401).send(renderLogin({ error: 'Username atau password salah.', next }));
  }
  const session = createSession(admin.id);
  res.cookie(COOKIE_NAME, session.id, { maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect(next && next.startsWith('/admin') ? next : '/admin');
});

router.get('/logout', (req, res) => {
  destroySession(req.cookies[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME);
  res.redirect('/admin/login');
});

// Everything below requires authentication.
router.use(requireAuth);

// ------------------------------------------------------------ dashboard ----
router.get('/', (req, res) => {
  const range = ['daily', 'weekly', 'monthly'].includes(req.query.range) ? req.query.range : 'daily';
  res.send(renderDashboard(req, { stats: stats.getDashboardStats(), series: stats.getSalesSeries(range), range }));
});

// ------------------------------------------------------------- products ----
router.get('/produk', (req, res) => {
  const filters = { q: req.query.q || '', category: req.query.category || '', status: req.query.status || '' };
  const result = productsLib.queryProducts({
    search: filters.q,
    categoryId: filters.category ? parseInt(filters.category, 10) : null,
    status: filters.status || null,
    sort: 'newest',
  });
  const categories = all('SELECT * FROM categories ORDER BY sort_order ASC');
  res.send(renderProductList(req, { products: result.items, categories, filters }));
});

router.get('/produk/baru', (req, res) => {
  const categories = all('SELECT * FROM categories ORDER BY sort_order ASC');
  res.send(renderProductForm(req, { product: null, categories, errors: null }));
});

router.get('/produk/:id/edit', (req, res) => {
  const product = productsLib.findById(parseInt(req.params.id, 10));
  if (!product) return res.status(404).send('Produk tidak ditemukan');
  const categories = all('SELECT * FROM categories ORDER BY sort_order ASC');
  res.send(renderProductForm(req, { product, categories, errors: null }));
});

function parseProductBody(body) {
  const toArr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const hasVariants = body.has_variants === 'on' || body.has_variants === 'true';
  let images = [];
  try { images = JSON.parse(body.images_json || '[]'); } catch (e) { images = []; }

  const variants = [];
  if (hasVariants) {
    const sizes = toArr(body['variant_size[]'] || body.variant_size);
    const prices = toArr(body['variant_price[]'] || body.variant_price);
    const stocks = toArr(body['variant_stock[]'] || body.variant_stock);
    const skus = toArr(body['variant_sku[]'] || body.variant_sku);
    sizes.forEach((size, i) => {
      if (!size || !size.trim()) return;
      variants.push({
        size: size.trim(),
        price: prices[i] ? parseInt(prices[i], 10) : null,
        stock: parseInt(stocks[i], 10) || 0,
        sku: (skus[i] || '').trim(),
      });
    });
  }

  return {
    name: (body.name || '').trim(),
    sku: (body.sku || '').trim(),
    category_id: body.category_id ? parseInt(body.category_id, 10) : null,
    description: body.description || '',
    price: parseInt(body.price, 10) || 0,
    promo_price: body.promo_price ? parseInt(body.promo_price, 10) : null,
    status: body.status === 'inactive' ? 'inactive' : 'active',
    is_new: body.is_new === 'on' ? 1 : 0,
    is_bestseller: body.is_bestseller === 'on' ? 1 : 0,
    is_promo: body.is_promo === 'on' ? 1 : 0,
    is_limited: body.is_limited === 'on' ? 1 : 0,
    seo_title: body.seo_title || '',
    meta_description: body.meta_description || '',
    has_variants: hasVariants ? 1 : 0,
    stock: hasVariants ? 0 : (parseInt(body.stock, 10) || 0),
    images,
    variants,
  };
}

async function persistImages(images, subdir) {
  const out = [];
  for (const img of images) {
    if (img && img.startsWith('data:')) {
      const saved = await saveDataUrlImage(img, subdir);
      if (saved) out.push(saved);
    } else if (img) {
      out.push(img); // already a saved /uploads/... path (untouched on edit)
    }
  }
  return out;
}

router.post('/produk/baru', async (req, res) => {
  const data = parseProductBody(req.body);
  const errors = [];
  if (!data.name) errors.push('Nama produk wajib diisi.');
  if (!data.price) errors.push('Harga normal wajib diisi.');
  if (data.has_variants && data.variants.length === 0) errors.push('Tambahkan minimal 1 ukuran untuk produk dengan varian.');

  if (errors.length) {
    const categories = all('SELECT * FROM categories ORDER BY sort_order ASC');
    return res.status(400).send(renderProductForm(req, { product: { ...data, id: null }, categories, errors }));
  }

  const slug = uniqueSlug(data.name, (s) => !!get('SELECT id FROM products WHERE slug = ?', [s]));
  const sku = data.sku || `SKU-${slug.toUpperCase().replace(/-/g, '').slice(0, 10)}`;
  const savedImages = await persistImages(data.images, 'products');
  const totalStock = data.has_variants ? data.variants.reduce((s, v) => s + v.stock, 0) : data.stock;

  const info = run(
    `INSERT INTO products (name, slug, sku, category_id, description, price, promo_price, has_variants, stock, images, status, is_bestseller, is_new, is_promo, is_limited, seo_title, meta_description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, slug, sku, data.category_id, data.description, data.price, data.promo_price, data.has_variants, totalStock,
      JSON.stringify(savedImages), data.status, data.is_bestseller, data.is_new, data.is_promo, data.is_limited, data.seo_title, data.meta_description]
  );
  const productId = info.lastInsertRowid;
  if (data.has_variants) {
    data.variants.forEach((v, idx) => {
      run('INSERT INTO product_variants (product_id, size, price, stock, sku, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [
        productId, v.size, v.price, v.stock, v.sku || `${sku}-${v.size}`, idx,
      ]);
    });
  }
  res.redirect('/admin/produk');
});

router.post('/produk/:id/edit', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = get('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) return res.status(404).send('Produk tidak ditemukan');

  const data = parseProductBody(req.body);
  const errors = [];
  if (!data.name) errors.push('Nama produk wajib diisi.');
  if (!data.price) errors.push('Harga normal wajib diisi.');
  if (data.has_variants && data.variants.length === 0) errors.push('Tambahkan minimal 1 ukuran untuk produk dengan varian.');

  if (errors.length) {
    const categories = all('SELECT * FROM categories ORDER BY sort_order ASC');
    return res.status(400).send(renderProductForm(req, { product: { ...data, id, variants: data.variants }, categories, errors }));
  }

  let slug = existing.slug;
  if (slugify(data.name) !== existing.slug) {
    slug = uniqueSlug(data.name, (s, ignoreId) => {
      const row = get('SELECT id FROM products WHERE slug = ?', [s]);
      return row && row.id !== ignoreId;
    }, id);
  }

  const savedImages = await persistImages(data.images, 'products');
  const totalStock = data.has_variants ? data.variants.reduce((s, v) => s + v.stock, 0) : data.stock;

  run(
    `UPDATE products SET name=?, slug=?, sku=?, category_id=?, description=?, price=?, promo_price=?, has_variants=?, stock=?, images=?, status=?, is_bestseller=?, is_new=?, is_promo=?, is_limited=?, seo_title=?, meta_description=?, updated_at=datetime('now') WHERE id=?`,
    [data.name, slug, data.sku || existing.sku, data.category_id, data.description, data.price, data.promo_price, data.has_variants,
      totalStock, JSON.stringify(savedImages), data.status, data.is_bestseller, data.is_new, data.is_promo, data.is_limited,
      data.seo_title, data.meta_description, id]
  );

  run('DELETE FROM product_variants WHERE product_id = ?', [id]);
  if (data.has_variants) {
    data.variants.forEach((v, idx) => {
      run('INSERT INTO product_variants (product_id, size, price, stock, sku, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [
        id, v.size, v.price, v.stock, v.sku || `${data.sku || existing.sku}-${v.size}`, idx,
      ]);
    });
  }
  res.redirect('/admin/produk');
});

router.post('/produk/:id/hapus', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = get('SELECT * FROM products WHERE id = ?', [id]);
  if (product) {
    JSON.parse(product.images || '[]').forEach((img) => deleteUploadedFile(img));
    run('DELETE FROM product_variants WHERE product_id = ?', [id]);
    run('DELETE FROM products WHERE id = ?', [id]);
  }
  res.redirect('/admin/produk');
});

router.post('/produk/:id/duplikat', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const p = get('SELECT * FROM products WHERE id = ?', [id]);
  if (!p) return res.redirect('/admin/produk');
  const newName = `${p.name} (Copy)`;
  const slug = uniqueSlug(newName, (s) => !!get('SELECT id FROM products WHERE slug = ?', [s]));
  const newSku = `${p.sku || 'SKU'}-COPY`;
  const info = run(
    `INSERT INTO products (name, slug, sku, category_id, description, price, promo_price, has_variants, stock, images, status, is_bestseller, is_new, is_promo, is_limited, seo_title, meta_description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inactive', ?, ?, ?, ?, ?, ?)`,
    [newName, slug, newSku, p.category_id, p.description, p.price, p.promo_price, p.has_variants, p.stock, p.images,
      p.is_bestseller, p.is_new, p.is_promo, p.is_limited, p.seo_title, p.meta_description]
  );
  const newId = info.lastInsertRowid;
  all('SELECT * FROM product_variants WHERE product_id = ?', [id]).forEach((v) => {
    run('INSERT INTO product_variants (product_id, size, price, stock, sku, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [
      newId, v.size, v.price, v.stock, v.sku, v.sort_order,
    ]);
  });
  res.redirect('/admin/produk');
});

router.post('/produk/:id/toggle-status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const p = get('SELECT status FROM products WHERE id = ?', [id]);
  if (p) run('UPDATE products SET status = ? WHERE id = ?', [p.status === 'active' ? 'inactive' : 'active', id]);
  res.redirect('/admin/produk');
});

// ------------------------------------------------------------ categories ----
function withProductCount(cat) {
  const c = get('SELECT COUNT(*) as c FROM products WHERE category_id = ?', [cat.id]).c;
  return { ...cat, product_count: c };
}

router.get('/kategori', (req, res) => {
  const categories = all('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').map(withProductCount);
  const editing = req.query.edit ? get('SELECT * FROM categories WHERE id = ?', [parseInt(req.query.edit, 10)]) : null;
  res.send(renderCategories(req, { categories, editing, errors: null }));
});

function extractSingleImage(fieldValue) {
  if (!fieldValue) return null;
  try {
    const parsed = JSON.parse(fieldValue);
    if (Array.isArray(parsed)) return parsed[0] || null;
    return fieldValue;
  } catch (e) {
    return fieldValue.startsWith('data:') ? fieldValue : null;
  }
}

router.post('/kategori/baru', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    const categories = all('SELECT * FROM categories ORDER BY sort_order ASC').map(withProductCount);
    return res.status(400).send(renderCategories(req, { categories, editing: null, errors: ['Nama kategori wajib diisi.'] }));
  }
  const slug = uniqueSlug(name, (s) => !!get('SELECT id FROM categories WHERE slug = ?', [s]));
  const maxOrder = get('SELECT MAX(sort_order) as m FROM categories').m || 0;
  const rawImage = extractSingleImage(req.body.image_data);
  const image = rawImage && rawImage.startsWith('data:') ? await saveDataUrlImage(rawImage, 'categories') : rawImage;
  run('INSERT INTO categories (name, slug, image, description, sort_order, active) VALUES (?, ?, ?, ?, ?, 1)', [
    name, slug, image, req.body.description || '', maxOrder + 1,
  ]);
  res.redirect('/admin/kategori');
});

router.post('/kategori/:id/edit', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = get('SELECT * FROM categories WHERE id = ?', [id]);
  if (!existing) return res.redirect('/admin/kategori');
  const name = (req.body.name || '').trim();
  let slug = existing.slug;
  if (slugify(name) !== existing.slug) {
    slug = uniqueSlug(name, (s, ignoreId) => {
      const row = get('SELECT id FROM categories WHERE slug = ?', [s]);
      return row && row.id !== ignoreId;
    }, id);
  }
  const rawImage = extractSingleImage(req.body.image_data);
  const image = rawImage && rawImage.startsWith('data:') ? await saveDataUrlImage(rawImage, 'categories') : (rawImage || existing.image);
  run('UPDATE categories SET name=?, slug=?, image=?, description=? WHERE id=?', [name, slug, image, req.body.description || '', id]);
  res.redirect('/admin/kategori');
});

router.post('/kategori/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = get('SELECT active FROM categories WHERE id = ?', [id]);
  if (c) run('UPDATE categories SET active = ? WHERE id = ?', [c.active ? 0 : 1, id]);
  res.redirect('/admin/kategori');
});

router.post('/kategori/:id/hapus', (req, res) => {
  const id = parseInt(req.params.id, 10);
  run('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
  run('DELETE FROM categories WHERE id = ?', [id]);
  res.redirect('/admin/kategori');
});

router.post('/kategori/:id/naik', (req, res) => { reorderCategory(parseInt(req.params.id, 10), -1); res.redirect('/admin/kategori'); });
router.post('/kategori/:id/turun', (req, res) => { reorderCategory(parseInt(req.params.id, 10), 1); res.redirect('/admin/kategori'); });

function reorderCategory(id, dir) {
  const list = all('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
  const idx = list.findIndex((c) => c.id === id);
  const swapIdx = idx + dir;
  if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;
  const a = list[idx], b = list[swapIdx];
  run('UPDATE categories SET sort_order = ? WHERE id = ?', [b.sort_order, a.id]);
  run('UPDATE categories SET sort_order = ? WHERE id = ?', [a.sort_order, b.id]);
}

// ----------------------------------------------------------------- orders ----
router.get('/pesanan', (req, res) => {
  const filters = { q: req.query.q || '', status: req.query.status || '' };
  const where = [];
  const params = [];
  if (filters.q) { where.push('(order_number LIKE ? OR customer_name LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`); }
  if (filters.status) { where.push('status = ?'); params.push(filters.status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orders = all(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC`, params).map((o) => ({
    ...o, item_count: get('SELECT COALESCE(SUM(qty),0) c FROM order_items WHERE order_id = ?', [o.id]).c,
  }));
  res.send(renderOrderList(req, { orders, filters }));
});

router.get('/pesanan/:id', (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ?', [parseInt(req.params.id, 10)]);
  if (!order) return res.status(404).send('Pesanan tidak ditemukan');
  const items = all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.send(renderOrderDetail(req, { order, items }));
});

router.post('/pesanan/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = get('SELECT * FROM orders WHERE id = ?', [id]);
  if (order) {
    const newStatus = req.body.status;
    if (newStatus === 'dibatalkan' && order.status !== 'dibatalkan') {
      restoreStockForOrder(id);
    }
    run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [newStatus, id]);
  }
  res.redirect(`/admin/pesanan/${id}`);
});

// -------------------------------------------------------------- settings ----
router.get('/pengaturan/toko', (req, res) => { res.send(renderTokoSettings(req, { settings: getSettings(), saved: req.query.saved })); });

router.post('/pengaturan/toko', async (req, res) => {
  const b = req.body;
  const updates = {
    store_name: b.store_name, store_tagline: b.store_tagline, store_description: b.store_description,
    primary_color: b.primary_color, secondary_color: b.secondary_color,
    banner_title: b.banner_title, banner_subtitle: b.banner_subtitle, banner_cta_text: b.banner_cta_text, banner_cta_link: b.banner_cta_link,
    promo_title: b.promo_title, promo_subtitle: b.promo_subtitle,
    email: b.email, phone_display: b.phone_display, address: b.address,
    instagram: b.instagram, facebook: b.facebook, tiktok: b.tiktok, footer_text: b.footer_text,
  };
  const logo = extractSingleImage(b.logo_data);
  if (logo && logo.startsWith('data:')) updates.logo = await saveDataUrlImage(logo, 'site');
  const favicon = extractSingleImage(b.favicon_data);
  if (favicon && favicon.startsWith('data:')) updates.favicon = await saveDataUrlImage(favicon, 'site');
  const banner = extractSingleImage(b.banner_image_data);
  if (banner && banner.startsWith('data:')) updates.banner_image = await saveDataUrlImage(banner, 'site');

  setSettings(updates);
  res.redirect('/admin/pengaturan/toko?saved=1');
});

router.get('/pengaturan/whatsapp', (req, res) => { res.send(renderWhatsappSettings(req, { settings: getSettings(), saved: req.query.saved })); });

router.post('/pengaturan/whatsapp', (req, res) => {
  const b = req.body;
  setSettings({
    whatsapp_number: String(b.whatsapp_number || '').replace(/[^0-9]/g, ''),
    wa_admin_name: b.wa_admin_name,
    wa_opening_message: b.wa_opening_message,
    wa_closing_message: b.wa_closing_message,
    wa_item_template: b.wa_item_template,
    wa_message_template: b.wa_message_template,
  });
  res.redirect('/admin/pengaturan/whatsapp?saved=1');
});

router.get('/pengaturan/akun', (req, res) => { res.send(renderAkunSettings(req, { admin: req.admin, saved: req.query.saved, errors: null })); });

router.post('/pengaturan/akun', (req, res) => {
  const b = req.body;
  const errors = [];
  const name = (b.name || '').trim();
  const username = (b.username || '').trim();
  if (!name) errors.push('Nama wajib diisi.');
  if (!username) errors.push('Username wajib diisi.');
  const existing = get('SELECT id FROM admins WHERE username = ? AND id != ?', [username, req.admin.id]);
  if (existing) errors.push('Username sudah digunakan.');
  if (b.new_password) {
    if (b.new_password.length < 6) errors.push('Password baru minimal 6 karakter.');
    if (b.new_password !== b.confirm_password) errors.push('Konfirmasi password tidak cocok.');
  }
  if (errors.length) {
    return res.status(400).send(renderAkunSettings(req, { admin: { ...req.admin, name, username }, saved: false, errors }));
  }
  if (b.new_password) {
    run('UPDATE admins SET name = ?, username = ?, password_hash = ? WHERE id = ?', [name, username, hashPassword(b.new_password), req.admin.id]);
  } else {
    run('UPDATE admins SET name = ?, username = ? WHERE id = ?', [name, username, req.admin.id]);
  }
  res.redirect('/admin/pengaturan/akun?saved=1');
});

module.exports = { router };
