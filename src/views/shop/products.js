'use strict';
const { shopLayout } = require('./layout');
const { productGrid } = require('./productCard');
const { escapeHtml } = require('../../lib/format');
const { icons } = require('../icons');

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];
const SORT_OPTIONS = [
  ['newest', 'Terbaru'],
  ['price_asc', 'Harga Terendah'],
  ['price_desc', 'Harga Tertinggi'],
  ['bestseller', 'Terlaris'],
];

function buildQuery(base, overrides) {
  const params = new URLSearchParams(base);
  Object.entries(overrides).forEach(([k, v]) => {
    if (v == null || v === '') params.delete(k); else params.set(k, v);
  });
  return '?' + params.toString();
}

function renderProductsPage(req, { products, total, categories, filters, page, perPage, categoryContext }) {
  const qs = req.query;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const activeCategories = (filters.categorySlugs || []);
  const activeSizes = (filters.sizes || []);

  const chips = [];
  if (filters.search) chips.push({ key: 'q', value: '', label: `Pencarian: "${escapeHtml(filters.search)}"` });
  activeCategories.forEach((slug) => {
    const c = categories.find((x) => x.slug === slug);
    if (c) chips.push({ key: 'category', value: slug, label: escapeHtml(c.name) });
  });
  activeSizes.forEach((sz) => chips.push({ key: 'sizes', value: sz, label: `Ukuran ${sz}` }));

  const title = categoryContext ? categoryContext.name : (filters.search ? `Hasil untuk "${filters.search}"` : 'Semua Produk');

  const filterSidebar = `
  <aside class="filters-panel" id="filters-panel">
    <button class="icon-btn filters-close-btn" id="btn-close-filters" style="display:none;position:absolute;top:14px;right:14px">${icons.close}</button>
    <div class="filter-group">
      <h4>Kategori</h4>
      ${categories.map((c) => `
        <label>
          <input type="checkbox" name="category" value="${c.slug}" ${activeCategories.includes(c.slug) ? 'checked' : ''} ${categoryContext ? 'disabled' : ''}>
          ${escapeHtml(c.name)}
        </label>`).join('')}
    </div>
    <div class="filter-group">
      <h4>Ukuran</h4>
      ${SIZE_OPTIONS.map((sz) => `
        <label><input type="checkbox" name="sizes" value="${sz}" ${activeSizes.includes(sz) ? 'checked' : ''}> ${sz}</label>`).join('')}
    </div>
    <div class="filter-group">
      <h4>Rentang Harga (Rp)</h4>
      <div style="display:flex;gap:8px">
        <input type="number" placeholder="Min" name="minPrice" value="${filters.minPrice || ''}" style="padding:9px 10px;border:1px solid var(--border);border-radius:8px;width:100%">
        <input type="number" placeholder="Max" name="maxPrice" value="${filters.maxPrice || ''}" style="padding:9px 10px;border:1px solid var(--border);border-radius:8px;width:100%">
      </div>
    </div>
    <button class="btn btn-dark btn-block" id="apply-filters" type="button" style="margin-top:14px">Terapkan Filter</button>
    <a href="${categoryContext ? `/kategori/${categoryContext.slug}` : '/produk'}" class="btn btn-ghost btn-block" style="margin-top:8px">Reset Filter</a>
  </aside>`;

  const body = `
<div class="container">
  <div class="breadcrumb"><a href="/">Beranda</a> <span>/</span> ${categoryContext ? `<a href="/kategori">Kategori</a><span>/</span> <span>${escapeHtml(categoryContext.name)}</span>` : `<span>Semua Produk</span>`}</div>
  <div class="page-title-block"><h1>${escapeHtml(title)}</h1></div>

  <div class="products-layout" style="margin-top:20px">
    ${filterSidebar}
    <div>
      <div class="toolbar">
        <button class="mobile-filter-btn" id="btn-open-filters">${icons.filter} Filter</button>
        <span class="count">${total} produk ditemukan</span>
        <select class="select-sort" id="sort-select">
          ${SORT_OPTIONS.map(([val, label]) => `<option value="${val}" ${filters.sort === val ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      ${chips.length ? `<div class="chip-row">${chips.map((c) => `
        <span class="chip">${c.label}<button data-remove-filter="${c.key}" data-value="${c.value}">${icons.close}</button></span>`).join('')}</div>` : ''}

      ${productGrid(products, { emptyText: 'Coba ubah kata kunci atau filter pencarian Anda.' })}

      ${totalPages > 1 ? `
      <div style="display:flex;justify-content:center;gap:8px;margin-top:32px;flex-wrap:wrap">
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => `
          <a href="${buildQuery(qs, { page: p })}" class="btn ${p === page ? 'btn-dark' : 'btn-outline'} btn-sm">${p}</a>`).join('')}
      </div>` : ''}
    </div>
  </div>
</div>

<div class="sidebar-overlay" id="filters-backdrop"></div>

<script>
(function(){
  function currentBase(){ return window.location.search; }
  document.getElementById('sort-select').addEventListener('change', function(e){
    var p = new URLSearchParams(currentBase()); p.set('sort', e.target.value); p.delete('page');
    window.location.search = p.toString();
  });
  document.getElementById('apply-filters').addEventListener('click', function(){
    var p = new URLSearchParams(currentBase());
    p.delete('category'); p.delete('sizes');
    document.querySelectorAll('input[name="category"]:checked').forEach(function(el){ p.append('category', el.value); });
    document.querySelectorAll('input[name="sizes"]:checked').forEach(function(el){ p.append('sizes', el.value); });
    var minP = document.querySelector('input[name="minPrice"]').value;
    var maxP = document.querySelector('input[name="maxPrice"]').value;
    if (minP) p.set('minPrice', minP); else p.delete('minPrice');
    if (maxP) p.set('maxPrice', maxP); else p.delete('maxPrice');
    p.delete('page');
    window.location.search = p.toString();
  });
  document.querySelectorAll('[data-remove-filter]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.getAttribute('data-remove-filter');
      var val = btn.getAttribute('data-value');
      var p = new URLSearchParams(currentBase());
      if (val) {
        var all = p.getAll(key).filter(function(v){ return v !== val; });
        p.delete(key); all.forEach(function(v){ p.append(key, v); });
      } else { p.delete(key); }
      window.location.search = p.toString();
    });
  });
  var panel = document.getElementById('filters-panel');
  var openBtn = document.getElementById('btn-open-filters');
  var closeBtn = document.getElementById('btn-close-filters');
  var backdrop = document.getElementById('filters-backdrop');
  function openPanel(){ panel.classList.add('mobile-open'); closeBtn.style.display='flex'; backdrop.classList.add('open'); document.body.style.overflow='hidden'; }
  function closePanel(){ panel.classList.remove('mobile-open'); closeBtn.style.display='none'; backdrop.classList.remove('open'); document.body.style.overflow=''; }
  if (openBtn) openBtn.addEventListener('click', openPanel);
  if (closeBtn) closeBtn.addEventListener('click', closePanel);
  if (backdrop) backdrop.addEventListener('click', closePanel);
})();
</script>
`;

  return shopLayout(req, {
    title,
    activeNav: 'produk',
    body,
  });
}

module.exports = { renderProductsPage, SIZE_OPTIONS };
