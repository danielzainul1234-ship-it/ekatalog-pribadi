/* Ekatalog Pribadi — client-side cart (stored in localStorage; no backend session needed). */
(function (global) {
  'use strict';
  var KEY = 'ekatalog_cart_v1';
  var WISH_KEY = 'ekatalog_wishlist_v1';
  var RECENT_KEY = 'ekatalog_recent_v1';

  function safeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function lineKey(productId, size) { return productId + '::' + (size || 'none'); }

  var Cart = {
    getItems: function () { return safeGet(KEY, []); },
    save: function (items) {
      safeSet(KEY, items);
      Cart.updateBadges();
      window.dispatchEvent(new Event('cart:updated'));
    },
    addItem: function (item, qty) {
      qty = qty || 1;
      var items = Cart.getItems();
      var key = lineKey(item.productId, item.size);
      var existing = items.find(function (i) { return lineKey(i.productId, i.size) === key; });
      if (existing) {
        existing.qty = Math.min(existing.qty + qty, item.stock != null ? item.stock : 999);
      } else {
        items.push({
          productId: item.productId, slug: item.slug, name: item.name, image: item.image,
          size: item.size || null, price: item.price, sku: item.sku, qty: Math.min(qty, item.stock != null ? item.stock : 999),
          stock: item.stock, categoryName: item.categoryName || '',
        });
      }
      Cart.save(items);
      return existing || items[items.length - 1];
    },
    updateQty: function (productId, size, qty) {
      var items = Cart.getItems();
      var key = lineKey(productId, size);
      items = items.map(function (i) {
        if (lineKey(i.productId, i.size) === key) i.qty = Math.max(1, Math.min(qty, i.stock != null ? i.stock : 999));
        return i;
      });
      Cart.save(items);
    },
    removeItem: function (productId, size) {
      var key = lineKey(productId, size);
      var items = Cart.getItems().filter(function (i) { return lineKey(i.productId, i.size) !== key; });
      Cart.save(items);
    },
    clear: function () { Cart.save([]); },
    totalCount: function () { return Cart.getItems().reduce(function (s, i) { return s + i.qty; }, 0); },
    totalPrice: function () { return Cart.getItems().reduce(function (s, i) { return s + i.qty * i.price; }, 0); },
    updateBadges: function () {
      var count = Cart.totalCount();
      document.querySelectorAll('#cart-count, #cart-count-bn').forEach(function (el) {
        el.textContent = count > 99 ? '99+' : String(count);
        el.style.display = count > 0 ? 'flex' : 'none';
      });
    },
  };

  var Wishlist = {
    getIds: function () { return safeGet(WISH_KEY, []); },
    has: function (id) { return Wishlist.getIds().indexOf(id) !== -1; },
    toggle: function (id) {
      var ids = Wishlist.getIds();
      var idx = ids.indexOf(id);
      if (idx === -1) ids.push(id); else ids.splice(idx, 1);
      safeSet(WISH_KEY, ids);
      Wishlist.updateBadge();
      return idx === -1;
    },
    updateBadge: function () {
      var count = Wishlist.getIds().length;
      var el = document.getElementById('wishlist-count');
      if (el) { el.textContent = count > 99 ? '99+' : String(count); el.style.display = count > 0 ? 'flex' : 'none'; }
    },
  };

  var RecentlyViewed = {
    push: function (productId) {
      var ids = safeGet(RECENT_KEY, []).filter(function (i) { return i !== productId; });
      ids.unshift(productId);
      safeSet(RECENT_KEY, ids.slice(0, 12));
    },
    getIds: function (excludeId) {
      return safeGet(RECENT_KEY, []).filter(function (i) { return i !== excludeId; });
    },
  };

  global.Cart = Cart;
  global.Wishlist = Wishlist;
  global.RecentlyViewed = RecentlyViewed;

  document.addEventListener('DOMContentLoaded', function () {
    Cart.updateBadges();
    Wishlist.updateBadge();
  });
})(window);
