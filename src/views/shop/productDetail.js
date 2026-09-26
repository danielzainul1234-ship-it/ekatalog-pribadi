'use strict';
const { shopLayout } = require('./layout');
const { productGrid } = require('./productCard');
const { rupiah, escapeHtml } = require('../../lib/format');
const { icons } = require('../icons');
const { absUrl } = require('./layout');

function renderProductDetail(req, { product, related, recentIds }) {
  const s = req.ctx.settings;

  const gallery = product.images.length ? product.images : ['/img/placeholder/og-default.svg'];

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: gallery.map((g) => absUrl(req, g)),
    description: product.description,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: product.priceNow,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absUrl(req, `/produk/${product.slug}`),
    },
  };

  const sizeBlock = product.has_variants ? `
  <div class="pd-block">
    <label>Pilih Ukuran</label>
    <div class="size-pills" id="size-pills">
      ${product.variants.map((v) => `
        <button type="button" class="size-pill" data-size="${escapeHtml(v.size)}" data-stock="${v.stock}" data-price="${v.price || product.price}" ${v.stock <= 0 ? 'disabled' : ''}>
          ${escapeHtml(v.size)}
          <span class="stx">${v.stock <= 0 ? 'Habis' : 'Stok ' + v.stock}</span>
        </button>`).join('')}
    </div>
    <div class="form-error" id="size-error" style="display:none">Silakan pilih ukuran terlebih dahulu.</div>
  </div>` : '';

  const qtyBlock = `
  <div class="pd-block">
    <label>Jumlah</label>
    <div class="qty-stepper">
      <button type="button" id="qty-minus">${icons.minus}</button>
      <input type="text" id="qty-input" value="1" inputmode="numeric" readonly>
      <button type="button" id="qty-plus">${icons.plus}</button>
    </div>
    <div class="pd-stock-note" id="stock-note" style="color:var(--ink-soft)">
      ${product.has_variants ? 'Pilih ukuran untuk melihat stok' : (product.inStock ? `Stok tersedia: ${product.totalStock}` : 'Stok habis')}
    </div>
  </div>`;

  const body = `
<div class="container" style="padding-top:16px">
  <div class="breadcrumb">
    <a href="/">Beranda</a><span>/</span>
    ${product.category ? `<a href="/kategori/${product.category.slug}">${escapeHtml(product.category.name)}</a><span>/</span>` : ''}
    <span>${escapeHtml(product.name)}</span>
  </div>

  <div class="pd-layout">
    <div>
      <div class="pd-gallery-main"><img id="pd-main-img" src="${gallery[0]}" alt="${escapeHtml(product.name)}"></div>
      ${gallery.length > 1 ? `
      <div class="pd-thumbs">
        ${gallery.map((g, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-img="${g}"><img src="${g}" alt=""></button>`).join('')}
      </div>` : ''}
    </div>

    <div class="pd-info">
      <span class="cat-label">${product.category ? escapeHtml(product.category.name) : ''}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <div class="pd-price">
        <span class="now" id="pd-price">${rupiah(product.priceNow)}</span>
        ${product.priceOld ? `<span class="old">${rupiah(product.priceOld)}</span><span class="off">-${product.discountPercent}%</span>` : ''}
      </div>
      <div class="pd-meta-row">SKU: ${escapeHtml(product.sku || '-')}
        ${product.is_bestseller ? ' &middot; <span class="badge badge-best" style="position:static;display:inline-block">BEST SELLER</span>' : ''}
        ${product.is_new ? ' &middot; <span class="badge badge-new" style="position:static;display:inline-block">NEW</span>' : ''}
      </div>
      <p class="pd-desc">${escapeHtml(product.description || '')}</p>

      ${sizeBlock}
      ${qtyBlock}

      <div class="pd-actions">
        <button class="btn btn-outline btn-block btn-lg" id="btn-add-cart" ${!product.inStock ? 'disabled' : ''}>${icons.cart} Tambah ke Keranjang</button>
        <button class="btn btn-primary btn-block btn-lg" id="btn-buy-now" ${!product.inStock ? 'disabled' : ''}>Pesan Sekarang via WhatsApp</button>
      </div>

      <div class="pd-share">
        <button class="icon-btn wishlist-btn" data-wishlist-toggle="${product.id}" title="Simpan ke Wishlist">${icons.heart}</button>
        <a class="icon-btn" href="https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent('Halo, saya ingin tanya tentang produk ' + product.name)}" target="_blank" rel="noopener" title="Tanya via WhatsApp">${icons.whatsapp}</a>
      </div>
    </div>
  </div>
</div>

${related.length ? `
<section class="section container">
  <div class="section-head"><div><span class="eyebrow">Mungkin Anda Suka</span><h2>Produk Terkait</h2></div></div>
  ${productGrid(related, { rail: true })}
</section>` : ''}

<section class="section container" id="recently-viewed-section" style="display:none">
  <div class="section-head"><div><span class="eyebrow">Riwayat</span><h2>Baru Dilihat</h2></div></div>
  <div class="rail" id="recently-viewed-rail"></div>
</section>

<script>
(function(){
  var product = ${JSON.stringify({
    id: product.id, slug: product.slug, name: product.name, image: gallery[0], sku: product.sku,
    price: product.priceNow, stock: product.totalStock, hasVariants: !!product.has_variants,
    categoryName: product.category ? product.category.name : '',
  })};

  // gallery thumbnail switch
  document.querySelectorAll('.pd-thumbs button').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.getElementById('pd-main-img').src = btn.getAttribute('data-img');
      document.querySelectorAll('.pd-thumbs button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  var selectedSize = null, selectedStock = product.stock, selectedPrice = product.price;
  document.querySelectorAll('.size-pill').forEach(function(btn){
    btn.addEventListener('click', function(){
      if (btn.disabled) return;
      document.querySelectorAll('.size-pill').forEach(function(b){ b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedSize = btn.getAttribute('data-size');
      selectedStock = parseInt(btn.getAttribute('data-stock'), 10);
      selectedPrice = parseInt(btn.getAttribute('data-price'), 10);
      document.getElementById('size-error').style.display = 'none';
      document.getElementById('stock-note').textContent = 'Stok tersedia: ' + selectedStock;
      document.getElementById('pd-price').textContent = 'Rp' + selectedPrice.toLocaleString('id-ID');
      var qtyInput = document.getElementById('qty-input');
      if (parseInt(qtyInput.value, 10) > selectedStock) qtyInput.value = Math.max(1, selectedStock);
    });
  });

  var qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', function(){
    var v = Math.max(1, parseInt(qtyInput.value, 10) - 1); qtyInput.value = v;
  });
  document.getElementById('qty-plus').addEventListener('click', function(){
    var max = product.hasVariants ? selectedStock : product.stock;
    var v = Math.min(max || 1, parseInt(qtyInput.value, 10) + 1); qtyInput.value = v;
  });

  function validateSelection(){
    if (product.hasVariants && !selectedSize) {
      document.getElementById('size-error').style.display = 'block';
      document.getElementById('size-pills').scrollIntoView({behavior:'smooth', block:'center'});
      return false;
    }
    return true;
  }

  function buildCartItem(){
    return {
      productId: product.id, slug: product.slug, name: product.name, image: product.image,
      size: selectedSize, price: selectedPrice, sku: product.sku,
      stock: product.hasVariants ? selectedStock : product.stock, categoryName: product.categoryName,
    };
  }

  document.getElementById('btn-add-cart').addEventListener('click', function(){
    if (!validateSelection()) return;
    var qty = parseInt(qtyInput.value, 10) || 1;
    window.Cart.addItem(buildCartItem(), qty);
    showToast('Ditambahkan ke keranjang', 'success');
  });

  document.getElementById('btn-buy-now').addEventListener('click', function(){
    if (!validateSelection()) return;
    var qty = parseInt(qtyInput.value, 10) || 1;
    window.Cart.addItem(buildCartItem(), qty);
    window.location.href = '/keranjang';
  });

  // recently viewed
  window.RecentlyViewed.push(product.id);
  var ids = window.RecentlyViewed.getIds(product.id);
  if (ids.length) {
    fetch('/api/products-by-ids?ids=' + ids.slice(0,8).join(','))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data.ok && data.html) {
          document.getElementById('recently-viewed-rail').innerHTML = data.html;
          document.getElementById('recently-viewed-section').style.display = 'block';
        }
      }).catch(function(){});
  }
})();
</script>
`;

  return shopLayout(req, {
    title: product.seo_title || product.name,
    description: product.meta_description || product.description,
    ogImage: gallery[0],
    ogType: 'product',
    jsonLd,
    activeNav: 'produk',
    body,
  });
}

module.exports = { renderProductDetail };
