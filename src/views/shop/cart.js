'use strict';
const { shopLayout } = require('./layout');
const { icons } = require('../icons');

function renderCartPage(req) {
  const body = `
<div class="container" style="padding-top:16px;padding-bottom:40px">
  <div class="page-title-block"><h1>Keranjang Belanja</h1></div>

  <div id="cart-loaded" style="display:none">
    <div style="display:grid;grid-template-columns:1fr;gap:24px" id="cart-grid">
      <div id="cart-items-list"></div>
      <div class="cart-summary" id="cart-summary-box" style="max-width:420px">
        <h3 style="font-size:15px;margin-bottom:14px">Ringkasan Belanja</h3>
        <div id="cart-summary-rows"></div>
        <div class="summary-total"><span>Total</span><span id="cart-total">Rp0</span></div>
        <a href="/checkout" class="btn btn-primary btn-block btn-lg" style="margin-top:18px" id="btn-checkout">${icons.whatsapp} Isi Data &amp; Pesan</a>
        <a href="/produk" class="btn btn-ghost btn-block" style="margin-top:8px">Lanjutkan Belanja</a>
      </div>
    </div>
  </div>

  <div id="cart-empty" class="empty-state" style="display:none">
    ${icons.cart}
    <h3>Keranjang Anda masih kosong</h3>
    <p>Yuk, mulai belanja koleksi fashion favorit Anda.</p>
    <a href="/produk" class="btn btn-primary">Mulai Belanja</a>
  </div>
</div>

<template id="cart-item-template">
  <div class="cart-item">
    <img class="ci-img" src="" alt="">
    <div>
      <div class="name ci-name"></div>
      <div class="variant ci-variant"></div>
      <div class="price ci-price"></div>
      <button class="remove-btn ci-remove">Hapus</button>
    </div>
    <div class="qty-stepper" style="height:38px">
      <button type="button" class="ci-minus">${icons.minus}</button>
      <input type="text" class="ci-qty" readonly style="width:34px">
      <button type="button" class="ci-plus">${icons.plus}</button>
    </div>
  </div>
</template>

<script>
(function(){
  function rupiah(n){ return 'Rp' + Math.round(n).toLocaleString('id-ID'); }

  function render(){
    var items = window.Cart.getItems();
    var listEl = document.getElementById('cart-items-list');
    var loaded = document.getElementById('cart-loaded');
    var empty = document.getElementById('cart-empty');

    if (!items.length) {
      loaded.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    loaded.style.display = 'block';
    empty.style.display = 'none';

    var tpl = document.getElementById('cart-item-template');
    listEl.innerHTML = '';
    items.forEach(function(item){
      var node = tpl.content.cloneNode(true);
      node.querySelector('.ci-img').src = item.image;
      node.querySelector('.ci-img').alt = item.name;
      node.querySelector('.ci-name').textContent = item.name;
      node.querySelector('.ci-variant').textContent = item.size ? ('Ukuran ' + item.size) : '';
      node.querySelector('.ci-price').textContent = rupiah(item.price * item.qty);
      node.querySelector('.ci-qty').value = item.qty;
      node.querySelector('.ci-minus').addEventListener('click', function(){
        window.Cart.updateQty(item.productId, item.size, item.qty - 1);
        render();
      });
      node.querySelector('.ci-plus').addEventListener('click', function(){
        window.Cart.updateQty(item.productId, item.size, item.qty + 1);
        render();
      });
      node.querySelector('.ci-remove').addEventListener('click', function(){
        window.Cart.removeItem(item.productId, item.size);
        render();
        showToast('Produk dihapus dari keranjang');
      });
      listEl.appendChild(node);
    });

    var rowsEl = document.getElementById('cart-summary-rows');
    rowsEl.innerHTML = items.map(function(i){
      return '<div class="summary-row"><span>' + i.name + (i.size ? (' (' + i.size + ')') : '') + ' &times; ' + i.qty + '</span><span>' + rupiah(i.price * i.qty) + '</span></div>';
    }).join('');
    document.getElementById('cart-total').textContent = rupiah(window.Cart.totalPrice());
  }

  render();
  window.addEventListener('cart:updated', render);
})();
</script>
`;
  return shopLayout(req, { title: 'Keranjang Belanja', activeNav: 'keranjang', body });
}

module.exports = { renderCartPage };
