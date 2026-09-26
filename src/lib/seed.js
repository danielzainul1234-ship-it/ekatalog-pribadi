'use strict';
const { get, run } = require('./db');
const { hashPassword } = require('./password');
const { slugify } = require('./slugify');

function seedIfEmpty() {
  const adminCount = get('SELECT COUNT(*) as c FROM admins').c;
  if (adminCount === 0) {
    run('INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)', [
      'admin',
      hashPassword('admin123'),
      'Admin Toko',
    ]);
    console.log('[seed] Admin default dibuat -> username: admin / password: admin123 (segera ganti di Pengaturan)');
  }

  const catCount = get('SELECT COUNT(*) as c FROM categories').c;
  if (catCount === 0) {
    const categories = [
      { name: 'Gamis', image: '/img/placeholder/cat-gamis.svg' },
      { name: 'Dress', image: '/img/placeholder/cat-dress.svg' },
      { name: 'Hijab', image: '/img/placeholder/cat-hijab.svg' },
      { name: 'Setelan', image: '/img/placeholder/cat-setelan.svg' },
      { name: 'Fashion Wanita', image: '/img/placeholder/cat-fashion.svg' },
      { name: 'Promo', image: '/img/placeholder/cat-promo.svg' },
    ];
    categories.forEach((c, i) => {
      run('INSERT INTO categories (name, slug, image, sort_order, active) VALUES (?, ?, ?, ?, 1)', [
        c.name, slugify(c.name), c.image, i,
      ]);
    });
    console.log('[seed] Kategori awal dibuat.');
  }

  const prodCount = get('SELECT COUNT(*) as c FROM products').c;
  if (prodCount === 0) {
    const catId = (name) => get('SELECT id FROM categories WHERE name = ?', [name]).id;

    const products = [
      {
        name: 'Gamis Aurelia', category: 'Gamis', price: 189000, promo_price: null,
        desc: 'Gamis Aurelia hadir dengan bahan Ceruty Babydoll premium yang adem dan jatuh, dilengkapi detail bordir minimalis di bagian dada. Cocok untuk acara formal maupun harian.',
        images: ['/img/placeholder/gamis-aurelia-1.svg', '/img/placeholder/gamis-aurelia-2.svg'],
        badges: { bestseller: 1, new: 0, promo: 0 },
        variants: [ ['S', 5], ['M', 10], ['L', 8], ['XL', 3], ['XXL', 0] ],
      },
      {
        name: 'Gamis Zahra', category: 'Gamis', price: 199000, promo_price: 179000,
        desc: 'Gamis Zahra dengan siluet A-line yang menyamarkan bentuk tubuh, bahan Moscrepe tebal tidak menerawang, cocok dipadukan dengan hijab segi empat maupun pashmina.',
        images: ['/img/placeholder/gamis-zahra-1.svg', '/img/placeholder/gamis-zahra-2.svg'],
        badges: { bestseller: 0, new: 1, promo: 1 },
        variants: [ ['M', 10], ['L', 8], ['XL', 4] ],
      },
      {
        name: 'Dress Aisyah', category: 'Dress', price: 229000, promo_price: null,
        desc: 'Dress Aisyah bergaya modest modern dengan potongan asimetris, bahan Linen premium yang breathable, ideal untuk gathering maupun acara semi-formal.',
        images: ['/img/placeholder/dress-aisyah-1.svg', '/img/placeholder/dress-aisyah-2.svg'],
        badges: { bestseller: 1, new: 1, promo: 0 },
        variants: [ ['S', 6], ['M', 9], ['L', 7], ['XL', 2] ],
      },
      {
        name: 'Hijab Voal Premium', category: 'Hijab', price: 49000, promo_price: null,
        desc: 'Hijab segi empat berbahan voal premium anti serat, ringan, dan mudah dibentuk. Tersedia banyak pilihan warna elegan.',
        images: ['/img/placeholder/hijab-voal-1.svg'],
        badges: { bestseller: 1, new: 0, promo: 0 },
        variants: null, stock: 25,
      },
      {
        name: 'Setelan Rayyan', category: 'Setelan', price: 259000, promo_price: 229000,
        desc: 'Setelan atasan dan rok senada berbahan katun toyobo, nyaman dipakai seharian, jahitan rapi dan rapih.',
        images: ['/img/placeholder/setelan-rayyan-1.svg'],
        badges: { bestseller: 0, new: 1, promo: 1 },
        variants: [ ['S', 4], ['M', 6], ['L', 5], ['XL', 0] ],
      },
      {
        name: 'Tas Selempang Wanita', category: 'Fashion Wanita', price: 99000, promo_price: null,
        desc: 'Tas selempang mini berbahan kulit sintetis premium, muat untuk kebutuhan harian, tersedia warna netral yang mudah dipadupadankan.',
        images: ['/img/placeholder/tas-1.svg'],
        badges: { bestseller: 0, new: 0, promo: 0 },
        variants: null, stock: 15,
      },
    ];

    products.forEach((p) => {
      const slug = slugify(p.name);
      const sku = 'SKU-' + slug.toUpperCase().replace(/-/g, '').slice(0, 8);
      const hasVariants = p.variants ? 1 : 0;
      const totalStock = p.variants ? p.variants.reduce((s, v) => s + v[1], 0) : (p.stock || 0);
      const info = run(
        `INSERT INTO products
         (name, slug, sku, category_id, description, price, promo_price, has_variants, stock, images, status,
          is_bestseller, is_new, is_promo, seo_title, meta_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
        [
          p.name, slug, sku, catId(p.category), p.desc, p.price, p.promo_price,
          hasVariants, totalStock, JSON.stringify(p.images),
          p.badges.bestseller, p.badges.new, p.badges.promo,
          p.name + ' — ' + p.category + ' Premium', p.desc.slice(0, 155),
        ]
      );
      const productId = info.lastInsertRowid;
      if (p.variants) {
        p.variants.forEach(([size, stock], idx) => {
          const vsku = `${sku}-${size}`;
          run('INSERT INTO product_variants (product_id, size, price, stock, sku, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [
            productId, size, null, stock, vsku, idx,
          ]);
        });
      }
    });
    console.log('[seed] Produk contoh dibuat.');
  }
}

module.exports = { seedIfEmpty };
