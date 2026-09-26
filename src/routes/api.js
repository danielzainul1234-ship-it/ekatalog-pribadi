'use strict';
const { Router } = require('../lib/miniweb');
const products = require('../lib/products');
const { createOrder } = require('../lib/orders');
const { productCard } = require('../views/shop/productCard');

const router = new Router();

router.get('/product/:id', (req, res) => {
  const product = products.findById(parseInt(req.params.id, 10));
  if (!product) return res.status(404).json({ ok: false, message: 'Produk tidak ditemukan' });
  res.json({
    ok: true,
    product: {
      id: product.id, slug: product.slug, name: product.name, image: product.mainImage,
      sku: product.sku, priceNow: product.priceNow, hasVariants: !!product.has_variants,
      inStock: product.inStock, stock: product.totalStock, categoryName: product.category ? product.category.name : '',
    },
  });
});

router.get('/products-by-ids', (req, res) => {
  const ids = String(req.query.ids || '').split(',').map((x) => parseInt(x, 10)).filter(Boolean);
  const items = products.getByIds(ids);
  // preserve original order requested
  const ordered = ids.map((id) => items.find((p) => p.id === id)).filter(Boolean);
  res.json({ ok: true, html: ordered.map((p) => productCard(p)).join('') });
});

router.post('/checkout', (req, res) => {
  const body = req.body || {};
  const result = createOrder(
    {
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_address: body.customer_address,
      notes: body.notes,
    },
    body.items || []
  );
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

module.exports = { router };
