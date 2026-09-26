'use strict';
const { icons } = require('../icons');
const { escapeHtml } = require('../../lib/format');

function absUrl(req, p) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers.host}${p}`;
}

function renderHead(req, opts) {
  const s = req.ctx.settings;
  const title = opts.title ? `${opts.title} — ${s.store_name}` : `${s.store_name} — ${s.store_tagline}`;
  const desc = opts.description || s.store_description;
  const ogImage = opts.ogImage || `${req.headers.host ? '' : ''}/img/placeholder/og-default.svg`;
  const canonical = absUrl(req, opts.canonical || req.pathname);
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${opts.ogType || 'website'}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${absUrl(req, ogImage)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
${s.favicon ? `<link rel="icon" href="${s.favicon}">` : '<link rel="icon" href="/img/placeholder/og-default.svg">'}
<meta name="theme-color" content="${s.primary_color}">
<link rel="preload" href="/css/style.css" as="style">
<link rel="stylesheet" href="/css/style.css">
${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ''}
<style>:root{--primary:${s.primary_color};--primary-dark:${s.primary_color};--secondary:${s.secondary_color};}</style>
</head>`;
}

function renderHeader(req, active) {
  const s = req.ctx.settings;
  const cats = req.ctx.navCategories;
  const nav = [
    ['/', 'Beranda', 'home'],
    ['/kategori', 'Kategori', 'kategori'],
    ['/produk', 'Semua Produk', 'produk'],
    ['/tentang-kami', 'Tentang Kami', 'tentang'],
    ['/kontak', 'Kontak', 'kontak'],
  ];
  return `
<header class="site-header">
  <div class="container bar">
    <a href="/" class="brand">
      ${s.logo ? `<img src="${s.logo}" alt="${escapeHtml(s.store_name)}">` : ''}
      <span class="name">${escapeHtml(s.store_name)}</span>
    </a>
    <nav class="main-nav">
      ${nav.map(([href, label, key]) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`).join('')}
    </nav>
    <div class="header-actions">
      <button class="icon-btn" id="btn-open-search" aria-label="Cari"><span class="search-icon" style="position:static">${icons.search}</span></button>
      <div class="search-bar-wrap">
        <span class="search-icon">${icons.search}</span>
        <input type="search" class="search-input" id="header-search" placeholder="Cari produk..." autocomplete="off">
      </div>
      <a href="/wishlist" class="icon-btn" aria-label="Wishlist">${icons.heart}<span class="cart-badge" id="wishlist-count" style="display:none">0</span></a>
      <a href="/keranjang" class="icon-btn" aria-label="Keranjang">${icons.cart}<span class="cart-badge" id="cart-count" style="display:none">0</span></a>
      <a href="https://wa.me/${s.whatsapp_number}" target="_blank" rel="noopener" class="wa-btn-header">${icons.whatsapp}<span>Chat Kami</span></a>
      <button class="icon-btn hamburger" id="btn-open-menu" aria-label="Menu">${icons.menu}</button>
    </div>
  </div>
</header>

<div class="mobile-menu-overlay" id="mobile-menu-overlay">
  <div class="mobile-menu">
    <div class="mobile-menu-header">
      <span class="brand" style="font-size:17px">${escapeHtml(s.store_name)}</span>
      <button class="icon-btn" id="btn-close-menu">${icons.close}</button>
    </div>
    <div class="mobile-search">
      <span class="search-icon">${icons.search}</span>
      <input type="search" id="mobile-search" placeholder="Cari produk...">
    </div>
    ${nav.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
    <a href="https://wa.me/${s.whatsapp_number}" target="_blank" rel="noopener" style="border-bottom:none;color:#25D366">${icons.whatsapp} <span style="margin-left:8px">Chat WhatsApp</span></a>
  </div>
</div>`;
}

function renderFooter(req) {
  const s = req.ctx.settings;
  const cats = req.ctx.navCategories.slice(0, 5);
  return `
<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      <div class="footer-brand">
        ${s.logo ? `<img src="${s.logo}" alt="">` : ''}
        <span>${escapeHtml(s.store_name)}</span>
      </div>
      <p class="footer-desc">${escapeHtml(s.footer_text)}</p>
      <div class="social-row">
        ${s.instagram ? `<a href="${s.instagram}" target="_blank" rel="noopener">${icons.instagram}</a>` : ''}
        ${s.facebook ? `<a href="${s.facebook}" target="_blank" rel="noopener">${icons.facebook}</a>` : ''}
        ${s.tiktok ? `<a href="${s.tiktok}" target="_blank" rel="noopener">${icons.tiktok}</a>` : ''}
      </div>
    </div>
    <div>
      <h4>Kategori</h4>
      ${cats.map((c) => `<a href="/kategori/${c.slug}">${escapeHtml(c.name)}</a>`).join('<br>')}
    </div>
    <div>
      <h4>Navigasi</h4>
      <a href="/produk">Semua Produk</a><br>
      <a href="/tentang-kami">Tentang Kami</a><br>
      <a href="/kontak">Kontak</a><br>
      <a href="/keranjang">Keranjang</a>
    </div>
    <div>
      <h4>Kontak</h4>
      <p>${escapeHtml(s.address)}</p>
      <a href="https://wa.me/${s.whatsapp_number}" target="_blank" rel="noopener">WA: ${escapeHtml(s.phone_display)}</a><br>
      ${s.email ? `<a href="mailto:${s.email}">${escapeHtml(s.email)}</a>` : ''}
    </div>
  </div>
  <div class="footer-bottom">&copy; ${new Date().getFullYear()} ${escapeHtml(s.store_name)}. Semua hak dilindungi.</div>
</footer>`;
}

function renderBottomNav(req, active) {
  const s = req.ctx.settings;
  const items = [
    ['/', 'home', icons.home, 'Home'],
    ['/kategori', 'kategori', icons.grid, 'Kategori'],
    ['/produk?focus=search', 'search', icons.search, 'Cari'],
    ['/keranjang', 'keranjang', icons.cart, 'Keranjang', 'cart-count-bn'],
    [`https://wa.me/${s.whatsapp_number}`, 'wa', icons.whatsapp, 'WhatsApp'],
  ];
  return `
<nav class="bottom-nav">
  ${items.map(([href, key, icon, label, badgeId]) => `
    <a href="${href}" class="${active === key ? 'active' : ''}" ${key === 'wa' ? 'target="_blank" rel="noopener"' : ''}>
      ${icon}
      <span>${label}</span>
      ${badgeId ? `<span class="bn-badge" id="${badgeId}" style="display:none">0</span>` : ''}
    </a>`).join('')}
</nav>`;
}

function renderScripts(extra = []) {
  return `
<div id="toast-root"></div>
<div class="modal-overlay" id="global-modal"><div class="modal-box" id="global-modal-box"></div></div>
<script src="/js/cart.js"></script>
<script src="/js/main.js"></script>
${extra.map((s) => `<script src="${s}"></script>`).join('\n')}
</body></html>`;
}

function waFloat(req) {
  const s = req.ctx.settings;
  return `<a href="https://wa.me/${s.whatsapp_number}" target="_blank" rel="noopener" class="wa-float" aria-label="Chat WhatsApp">${icons.whatsapp}</a>`;
}

function shopLayout(req, opts) {
  return `${renderHead(req, opts)}
<body>
<a href="#main" class="skip-link">Ke konten utama</a>
${renderHeader(req, opts.activeNav)}
<main id="main">
${opts.body}
</main>
${renderFooter(req)}
${waFloat(req)}
${renderBottomNav(req, opts.activeNav)}
${renderScripts(opts.extraScripts || [])}`;
}

module.exports = { shopLayout, renderHead, renderHeader, renderFooter, renderBottomNav, absUrl };
