'use strict';
const { shopLayout } = require('./layout');
const { escapeHtml } = require('../../lib/format');
const { icons } = require('../icons');

function renderAbout(req) {
  const s = req.ctx.settings;
  const body = `
<div class="container" style="padding-top:16px;padding-bottom:50px;max-width:820px">
  <div class="page-title-block"><h1>Tentang Kami</h1></div>
  <div style="margin-top:16px">
    <img src="/img/placeholder/banner-hero.svg" alt="" style="border-radius:var(--radius-lg);margin-bottom:24px;aspect-ratio:16/7;object-fit:cover;width:100%">
    <p class="pd-desc" style="font-size:15.5px;line-height:1.9">${escapeHtml(s.store_description)}</p>
    <p class="pd-desc" style="font-size:15.5px;line-height:1.9">Kami berkomitmen menghadirkan produk fashion muslimah berkualitas dengan bahan premium, jahitan rapi, dan harga yang bersahabat. Setiap pesanan diproses dengan teliti agar sampai ke tangan Anda dalam kondisi terbaik.</p>
    <div class="divider"></div>
    <div class="form-row-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center">
      <div><h3 style="font-size:22px">100%</h3><p style="color:var(--ink-soft);font-size:13.5px">Original &amp; Berkualitas</p></div>
      <div><h3 style="font-size:22px">Cepat</h3><p style="color:var(--ink-soft);font-size:13.5px">Respon &amp; Pengiriman</p></div>
      <div><h3 style="font-size:22px">Aman</h3><p style="color:var(--ink-soft);font-size:13.5px">Transaksi via WhatsApp</p></div>
    </div>
  </div>
</div>`;
  return shopLayout(req, { title: 'Tentang Kami', activeNav: 'tentang', body });
}

function renderContact(req) {
  const s = req.ctx.settings;
  const body = `
<div class="container" style="padding-top:16px;padding-bottom:50px;max-width:720px">
  <div class="page-title-block"><h1>Kontak Kami</h1></div>
  <div class="admin-card" style="margin-top:16px">
    <div style="display:flex;flex-direction:column;gap:16px">
      <a href="https://wa.me/${s.whatsapp_number}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg">${icons.whatsapp} Chat via WhatsApp</a>
      ${s.email ? `<div><strong>Email</strong><br><a href="mailto:${s.email}">${escapeHtml(s.email)}</a></div>` : ''}
      <div><strong>Alamat</strong><br>${escapeHtml(s.address)}</div>
      <div>
        <strong>Sosial Media</strong><br>
        <div class="social-row" style="margin-top:8px">
          ${s.instagram ? `<a href="${s.instagram}" target="_blank" rel="noopener" style="background:var(--border)">${icons.instagram}</a>` : ''}
          ${s.facebook ? `<a href="${s.facebook}" target="_blank" rel="noopener" style="background:var(--border)">${icons.facebook}</a>` : ''}
          ${s.tiktok ? `<a href="${s.tiktok}" target="_blank" rel="noopener" style="background:var(--border)">${icons.tiktok}</a>` : ''}
        </div>
      </div>
    </div>
  </div>
</div>`;
  return shopLayout(req, { title: 'Kontak', activeNav: 'kontak', body });
}

function renderCategoryIndex(req, categories) {
  const body = `
<div class="container" style="padding-top:16px;padding-bottom:50px">
  <div class="page-title-block"><h1>Semua Kategori</h1></div>
  <div class="cat-grid" style="margin-top:20px;grid-template-columns:repeat(2,1fr)">
    ${categories.map((c) => `
      <a href="/kategori/${c.slug}" class="cat-card">
        <div class="thumb" style="aspect-ratio:4/3"><img src="${c.image || '/img/placeholder/cat-fashion.svg'}" alt="${escapeHtml(c.name)}" loading="lazy"></div>
        <span style="font-size:14.5px">${escapeHtml(c.name)}</span>
      </a>`).join('')}
  </div>
</div>`;
  return shopLayout(req, { title: 'Kategori', activeNav: 'kategori', body });
}

function renderWishlist(req) {
  const body = `
<div class="container" style="padding-top:16px;padding-bottom:50px">
  <div class="page-title-block"><h1>Wishlist Saya</h1></div>
  <div id="wishlist-grid" style="margin-top:20px"></div>
  <div class="empty-state" id="wishlist-empty" style="display:none">
    ${icons.heart}
    <h3>Belum ada produk favorit</h3>
    <p>Tekan ikon hati pada produk untuk menyimpannya di sini.</p>
    <a href="/produk" class="btn btn-primary">Jelajahi Produk</a>
  </div>
</div>
<script>
(function(){
  var ids = window.Wishlist.getIds();
  if (!ids.length) { document.getElementById('wishlist-empty').style.display = 'block'; return; }
  fetch('/api/products-by-ids?ids=' + ids.join(',')).then(function(r){ return r.json(); }).then(function(data){
    if (data.ok && data.html) {
      document.getElementById('wishlist-grid').innerHTML = '<div class="product-grid">' + data.html + '</div>';
    } else {
      document.getElementById('wishlist-empty').style.display = 'block';
    }
  });
})();
</script>`;
  return shopLayout(req, { title: 'Wishlist', activeNav: '', body });
}

module.exports = { renderAbout, renderContact, renderCategoryIndex, renderWishlist };
