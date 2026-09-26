'use strict';
const { rupiah, escapeHtml } = require('../../lib/format');
const { icons } = require('../icons');

function productCard(p, opts = {}) {
  const badges = [];
  if (p.is_new) badges.push('<span class="badge badge-new">NEW</span>');
  if (p.is_bestseller) badges.push('<span class="badge badge-best">BEST SELLER</span>');
  if (p.is_promo && p.priceOld) badges.push('<span class="badge badge-promo">PROMO</span>');
  if (p.is_limited) badges.push('<span class="badge badge-limited">TERBATAS</span>');

  const sizesMini = p.has_variants
    ? `<div class="size-pills-mini">${p.variants.slice(0, 5).map((v) => `<span style="${v.stock <= 0 ? 'text-decoration:line-through;opacity:.5' : ''}">${escapeHtml(v.size)}</span>`).join('')}</div>`
    : '';

  return `
<div class="product-card" data-product-id="${p.id}">
  <a href="/produk/${p.slug}" class="thumb-wrap" aria-label="${escapeHtml(p.name)}">
    ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
    <img src="${p.mainImage}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" width="400" height="500">
    ${!p.inStock ? `<div class="badge-outstock"><span>Habis</span></div>` : ''}
  </a>
  <button class="quick-add btn-icon" title="Tambah ke keranjang" data-quick-add="${p.id}" ${!p.inStock ? 'disabled' : ''}>${icons.plus}</button>
  <a href="/produk/${p.slug}" class="info">
    <span class="cat-label">${p.category ? escapeHtml(p.category.name) : ''}</span>
    <span class="p-name">${escapeHtml(p.name)}</span>
    <div class="price-row">
      <span class="price-now">${rupiah(p.priceNow)}</span>
      ${p.priceOld ? `<span class="price-old">${rupiah(p.priceOld)}</span><span class="price-off">-${p.discountPercent}%</span>` : ''}
    </div>
    ${p.lowStock ? `<span class="stock-hint">Stok tersisa ${p.totalStock}</span>` : ''}
    ${sizesMini}
  </a>
</div>`;
}

function productGrid(products, opts = {}) {
  if (!products.length) {
    return `<div class="empty-state">${icons.box}<h3>Belum ada produk</h3><p>${opts.emptyText || 'Produk akan segera tersedia.'}</p></div>`;
  }
  return `<div class="${opts.rail ? 'rail' : 'product-grid'}">${products.map((p) => productCard(p)).join('')}</div>`;
}

module.exports = { productCard, productGrid };
