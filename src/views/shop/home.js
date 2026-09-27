'use strict';
const { shopLayout } = require('./layout');
const { productGrid } = require('./productCard');
const { escapeHtml, rupiah } = require('../../lib/format');
const { icons } = require('../icons');

function renderHome(req, { categories, newest, bestsellers, promo }) {
  const s = req.ctx.settings;

  const hero = `
<section class="container" style="padding-top:16px">
  <div class="hero">
    ${s.banner_image ? `<img src="${s.banner_image}" alt="${escapeHtml(s.banner_title)}">` : `<img src="/img/placeholder/banner-hero.svg" alt="">`}
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <span class="eyebrow">${escapeHtml(s.store_tagline)}</span>
      <h1>${escapeHtml(s.banner_title)}</h1>
      <p>${escapeHtml(s.banner_subtitle)}</p>
      <div><a href="${s.banner_cta_link || '/produk'}" class="btn btn-primary btn-lg">${escapeHtml(s.banner_cta_text)}</a></div>
    </div>
  </div>
</section>`;

  const catSection = `
<section class="section container">
  <div class="section-head">
    <div><span class="eyebrow">Belanja Sesuai Kebutuhan</span><h2>Kategori Produk</h2></div>
    <a href="/kategori" class="link">Lihat semua ${icons.chevronRight}</a>
  </div>
  <div class="cat-grid">
    ${categories.map((c) => `
      <a href="/kategori/${c.slug}" class="cat-card">
        <div class="thumb"><img src="${c.image || '/img/placeholder/cat-fashion.svg'}" alt="${escapeHtml(c.name)}" loading="lazy" width="200" height="200"></div>
        <span>${escapeHtml(c.name)}</span>
      </a>`).join('')}
  </div>
</section>`;

  const newestSection = `
<section class="section container">
  <div class="section-head">
    <div><span class="eyebrow">Baru Hadir</span><h2>Produk Terbaru</h2></div>
    <a href="/produk?sort=newest" class="link">Lihat semua ${icons.chevronRight}</a>
  </div>
  ${productGrid(newest, { emptyText: 'Belum ada produk terbaru.' })}
</section>`;

  const promoSection = promo.length ? `
<section class="section container">
  <div class="promo-section">
    <span class="eyebrow" style="color:#f0d9c2">Jangan Sampai Terlewat</span>
    <h2>${escapeHtml(s.promo_title)}</h2>
    <p>${escapeHtml(s.promo_subtitle)}</p>
    <div style="margin-top:22px"><a href="/produk?badge=promo" class="btn btn-primary">Lihat Semua Promo</a></div>
  </div>
</section>
<section class="section container" style="padding-top:0">
  ${productGrid(promo)}
</section>` : '';

  const body = `${hero}${catSection}${newestSection}${promoSection}`;

  return shopLayout(req, {
    title: null,
    description: s.store_description,
    activeNav: 'home',
    body,
  });
}

module.exports = { renderHome };
