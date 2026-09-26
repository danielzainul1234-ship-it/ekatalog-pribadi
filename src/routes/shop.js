'use strict';
const { Router } = require('../lib/miniweb');
const { all, get, run } = require('../lib/db');
const products = require('../lib/products');
const { renderHome } = require('../views/shop/home');
const { renderProductsPage } = require('../views/shop/products');
const { renderProductDetail } = require('../views/shop/productDetail');
const { renderCartPage } = require('../views/shop/cart');
const { renderCheckoutPage } = require('../views/shop/checkout');
const { renderAbout, renderContact, renderCategoryIndex, renderWishlist } = require('../views/shop/staticPages');
const { renderError } = require('../views/shop/error');

const router = new Router();
const PER_PAGE = 12;

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

router.get('/', (req, res) => {
  const categories = req.ctx.navCategories;
  const newest = products.getNewest(8);
  const bestsellers = products.getBestsellers(8);
  const promo = products.getPromo(8);
  res.send(renderHome(req, { categories, newest, bestsellers, promo }));
});

router.get('/kategori', (req, res) => {
  res.send(renderCategoryIndex(req, req.ctx.navCategories));
});

router.get('/kategori/:slug', (req, res) => {
  const category = get('SELECT * FROM categories WHERE slug = ? AND active = 1', [req.params.slug]);
  if (!category) return res.status(404).send(renderError(req, { code: 404, message: 'Kategori tidak ditemukan.' }));
  handleProductsQuery(req, res, { forcedCategorySlug: category.slug, categoryContext: category });
});

router.get('/produk', (req, res) => {
  handleProductsQuery(req, res, {});
});

function handleProductsQuery(req, res, { forcedCategorySlug, categoryContext }) {
  const q = req.query;
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const categorySlugs = forcedCategorySlug ? [forcedCategorySlug] : toArray(q.category);
  const sizes = toArray(q.sizes);
  const filters = {
    search: q.q || '',
    categorySlugs,
    sizes,
    minPrice: q.minPrice ? parseInt(q.minPrice, 10) : null,
    maxPrice: q.maxPrice ? parseInt(q.maxPrice, 10) : null,
    sort: q.sort || 'newest',
    badge: q.badge || null,
  };

  // support multi-category by running query per category slug and merging (kept simple: use first for SQL filter, refine after)
  const result = products.queryProducts({
    status: 'active',
    search: filters.search,
    categorySlug: categorySlugs.length === 1 ? categorySlugs[0] : null,
    sizes: filters.sizes,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    badge: filters.badge,
  });

  let items = result.items;
  if (categorySlugs.length > 1) {
    items = items.filter((p) => p.category && categorySlugs.includes(p.category.slug));
  }

  const total = items.length;
  const start = (page - 1) * PER_PAGE;
  const pageItems = items.slice(start, start + PER_PAGE);

  res.send(renderProductsPage(req, {
    products: pageItems, total, categories: req.ctx.navCategories, filters, page, perPage: PER_PAGE, categoryContext,
  }));
}

router.get('/produk/:slug', (req, res) => {
  const product = products.findBySlug(req.params.slug);
  if (!product) return res.status(404).send(renderError(req, { code: 404, message: 'Produk tidak ditemukan atau sudah tidak tersedia.' }));
  run('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]);
  const related = products.getRelated(product, 8);
  res.send(renderProductDetail(req, { product, related }));
});

router.get('/keranjang', (req, res) => { res.send(renderCartPage(req)); });
router.get('/checkout', (req, res) => { res.send(renderCheckoutPage(req)); });
router.get('/wishlist', (req, res) => { res.send(renderWishlist(req)); });
router.get('/tentang-kami', (req, res) => { res.send(renderAbout(req)); });
router.get('/kontak', (req, res) => { res.send(renderContact(req)); });

// ---- SEO ----
router.get('/robots.txt', (req, res) => {
  const host = req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${proto}://${host}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const host = req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const base = `${proto}://${host}`;
  const staticUrls = ['/', '/produk', '/kategori', '/tentang-kami', '/kontak'];
  const cats = all('SELECT slug FROM categories WHERE active = 1');
  const prods = all("SELECT slug, updated_at FROM products WHERE status = 'active'");
  const urls = [
    ...staticUrls.map((u) => ({ loc: base + u, lastmod: null })),
    ...cats.map((c) => ({ loc: `${base}/kategori/${c.slug}`, lastmod: null })),
    ...prods.map((p) => ({ loc: `${base}/produk/${p.slug}`, lastmod: p.updated_at })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

module.exports = { router };
