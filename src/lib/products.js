'use strict';
const { all, get, run } = require('./db');

const LOW_STOCK_THRESHOLD = 5;

function parseImages(product) {
  try {
    const arr = JSON.parse(product.images || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function getVariants(productId) {
  return all('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC, id ASC', [productId]);
}

function getCategoryOf(product) {
  if (!product.category_id) return null;
  return get('SELECT * FROM categories WHERE id = ?', [product.category_id]);
}

/**
 * Enriches a raw product row with computed display fields used across views.
 */
function decorate(product) {
  const images = parseImages(product);
  const variants = product.has_variants ? getVariants(product.id) : [];
  const category = getCategoryOf(product);

  const totalStock = product.has_variants
    ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : (product.stock || 0);

  const basePrice = product.price;
  const promoPrice = product.promo_price && product.promo_price > 0 ? product.promo_price : null;
  const priceNow = promoPrice || basePrice;
  const priceOld = promoPrice ? basePrice : null;
  const discountPercent = priceOld ? Math.round(((priceOld - priceNow) / priceOld) * 100) : 0;

  return {
    ...product,
    images,
    mainImage: images[0] || '/img/placeholder/og-default.svg',
    variants,
    category,
    totalStock,
    inStock: totalStock > 0,
    lowStock: totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD,
    priceNow,
    priceOld,
    discountPercent,
  };
}

function findBySlug(slug) {
  const p = get('SELECT * FROM products WHERE slug = ? AND status = ?', [slug, 'active']);
  return p ? decorate(p) : null;
}

function findById(id) {
  const p = get('SELECT * FROM products WHERE id = ?', [id]);
  return p ? decorate(p) : null;
}

/**
 * Query product list with filters. Used by both the public "/produk" page and the admin list.
 * opts: { search, categorySlug, categoryId, sizes: [], minPrice, maxPrice, sort, status, limit, offset, badge }
 */
function queryProducts(opts = {}) {
  const where = [];
  const params = [];

  if (opts.status) {
    where.push('p.status = ?');
    params.push(opts.status);
  }
  if (opts.search) {
    where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
    const term = `%${opts.search}%`;
    params.push(term, term, term, term);
  }
  if (opts.categorySlug) {
    where.push('c.slug = ?');
    params.push(opts.categorySlug);
  }
  if (opts.categoryId) {
    where.push('p.category_id = ?');
    params.push(opts.categoryId);
  }
  if (opts.minPrice != null) {
    where.push('COALESCE(p.promo_price, p.price) >= ?');
    params.push(opts.minPrice);
  }
  if (opts.maxPrice != null) {
    where.push('COALESCE(p.promo_price, p.price) <= ?');
    params.push(opts.maxPrice);
  }
  if (opts.badge === 'new') where.push('p.is_new = 1');
  if (opts.badge === 'bestseller') where.push('p.is_bestseller = 1');
  if (opts.badge === 'promo') where.push('p.is_promo = 1');

  let orderBy = 'p.created_at DESC';
  if (opts.sort === 'price_asc') orderBy = 'COALESCE(p.promo_price, p.price) ASC';
  else if (opts.sort === 'price_desc') orderBy = 'COALESCE(p.promo_price, p.price) DESC';
  else if (opts.sort === 'bestseller') orderBy = 'p.sold_count DESC';
  else if (opts.sort === 'newest') orderBy = 'p.created_at DESC';
  else if (opts.sort === 'name') orderBy = 'p.name ASC';

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const baseSql = `FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`;

  let rows = all(`SELECT p.* ${baseSql} ORDER BY ${orderBy}`, params);
  let decorated = rows.map(decorate);

  // Size filter needs variant awareness, applied after decoration (variants loaded on demand).
  if (opts.sizes && opts.sizes.length) {
    decorated = decorated.filter((p) => {
      if (!p.has_variants) return false;
      return p.variants.some((v) => opts.sizes.includes(v.size) && v.stock > 0);
    });
  }

  const total = decorated.length;
  if (opts.limit != null) {
    const offset = opts.offset || 0;
    decorated = decorated.slice(offset, offset + opts.limit);
  }
  return { items: decorated, total };
}

function getBestsellers(limit = 8) {
  return queryProducts({ status: 'active', sort: 'bestseller', limit }).items;
}
function getNewest(limit = 8) {
  return queryProducts({ status: 'active', sort: 'newest', limit }).items;
}
function getPromo(limit = 8) {
  return queryProducts({ status: 'active', badge: 'promo', limit }).items;
}
function getRelated(product, limit = 8) {
  const rows = all(
    `SELECT * FROM products WHERE status = 'active' AND category_id = ? AND id != ? ORDER BY sold_count DESC LIMIT ?`,
    [product.category_id, product.id, limit]
  );
  return rows.map(decorate);
}
function getByIds(ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = all(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
  return rows.map(decorate);
}

module.exports = {
  LOW_STOCK_THRESHOLD, decorate, findBySlug, findById, queryProducts,
  getBestsellers, getNewest, getPromo, getRelated, getByIds, parseImages, getVariants, getCategoryOf,
};
