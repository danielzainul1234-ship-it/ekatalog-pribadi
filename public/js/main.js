/* Ekatalog Pribadi — shared front-end behavior (mobile menu, search, toast, quick add). */
(function () {
  'use strict';

  function toast(message, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      setTimeout(function () { el.remove(); }, 260);
    }, 2400);
  }
  window.showToast = toast;

  // ---- mobile menu ----
  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.getElementById('mobile-menu-overlay');
    var openBtn = document.getElementById('btn-open-menu');
    var closeBtn = document.getElementById('btn-close-menu');
    if (openBtn && overlay) openBtn.addEventListener('click', function () { overlay.classList.add('open'); });
    if (closeBtn && overlay) closeBtn.addEventListener('click', function () { overlay.classList.remove('open'); });
    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('open'); });

    // ---- search ----
    function goSearch(value) {
      if (!value || !value.trim()) return;
      window.location.href = '/produk?q=' + encodeURIComponent(value.trim());
    }
    ['header-search', 'mobile-search'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') goSearch(input.value); });
    });
    var openSearchBtn = document.getElementById('btn-open-search');
    if (openSearchBtn) {
      openSearchBtn.addEventListener('click', function () {
        var el = document.getElementById('header-search');
        if (el) { el.style.width = '220px'; el.focus(); }
        else { window.location.href = '/produk'; }
      });
    }

    // ---- quick add to cart (non-variant products only) ----
    document.querySelectorAll('[data-quick-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = btn.getAttribute('data-quick-add');
        fetch('/api/product/' + id)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.ok) { toast('Produk tidak ditemukan', 'error'); return; }
            var p = data.product;
            if (p.hasVariants) {
              window.location.href = '/produk/' + p.slug;
              return;
            }
            if (!p.inStock) { toast('Maaf, stok habis', 'error'); return; }
            window.Cart.addItem({
              productId: p.id, slug: p.slug, name: p.name, image: p.image,
              size: null, price: p.priceNow, sku: p.sku, stock: p.stock, categoryName: p.categoryName,
            }, 1);
            toast('Ditambahkan ke keranjang', 'success');
          })
          .catch(function () { toast('Gagal menambahkan ke keranjang', 'error'); });
      });
    });

    // ---- wishlist toggle buttons ----
    document.querySelectorAll('[data-wishlist-toggle]').forEach(function (btn) {
      var id = parseInt(btn.getAttribute('data-wishlist-toggle'), 10);
      if (window.Wishlist.has(id)) btn.classList.add('active');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var active = window.Wishlist.toggle(id);
        btn.classList.toggle('active', active);
        toast(active ? 'Ditambahkan ke wishlist' : 'Dihapus dari wishlist', 'success');
      });
    });

    // ---- generic confirm modal (data-confirm="text" data-confirm-action="href or form id") ----
    document.querySelectorAll('[data-confirm]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (!confirm(el.getAttribute('data-confirm'))) e.preventDefault();
      });
    });
  });
})();
