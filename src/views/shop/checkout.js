'use strict';
const { shopLayout } = require('./layout');

function renderCheckoutPage(req) {
  const body = `
<div class="container" style="padding-top:16px;padding-bottom:50px;max-width:720px">
  <div class="page-title-block"><h1>Checkout</h1></div>

  <div id="checkout-empty" class="empty-state" style="display:none">
    <h3>Keranjang Anda kosong</h3>
    <p>Silakan pilih produk terlebih dahulu sebelum checkout.</p>
    <a href="/produk" class="btn btn-primary">Belanja Sekarang</a>
  </div>

  <div id="checkout-form-wrap" style="display:none">
    <div class="admin-card" style="margin-bottom:20px">
      <h3 style="font-size:15px;margin-bottom:12px">Ringkasan Pesanan</h3>
      <div id="checkout-items"></div>
      <div class="summary-total" style="margin-top:10px"><span>Total</span><span id="checkout-total">Rp0</span></div>
    </div>

    <form id="checkout-form" class="admin-card">
      <h3 style="font-size:15px;margin-bottom:16px">Data Pemesan</h3>
      <div class="form-group">
        <label>Nama Lengkap *</label>
        <input type="text" class="form-control" name="customer_name" id="f-name" required placeholder="Nama Anda">
        <div class="form-error" id="err-name" style="display:none">Nama wajib diisi.</div>
      </div>
      <div class="form-group">
        <label>Nomor WhatsApp *</label>
        <input type="tel" class="form-control" name="customer_phone" id="f-phone" required placeholder="Contoh: 081234567890">
        <div class="form-error" id="err-phone" style="display:none">Nomor WhatsApp tidak valid.</div>
      </div>
      <div class="form-group">
        <label>Alamat Pengiriman</label>
        <textarea class="form-control" name="customer_address" id="f-address" placeholder="Alamat lengkap untuk pengiriman"></textarea>
      </div>
      <div class="form-group">
        <label>Catatan (opsional)</label>
        <textarea class="form-control" name="notes" id="f-notes" placeholder="Contoh: warna, request khusus, dll"></textarea>
      </div>
      <div class="form-error" id="err-general" style="display:none;margin-bottom:12px"></div>
      <button type="submit" class="btn btn-whatsapp btn-block btn-lg" id="btn-submit-checkout">Lanjutkan ke WhatsApp</button>
      <p class="form-hint" style="text-align:center;margin-top:10px">Pesanan akan tersimpan dan Anda akan diarahkan ke WhatsApp untuk konfirmasi.</p>
    </form>
  </div>
</div>

<script>
(function(){
  function rupiah(n){ return 'Rp' + Math.round(n).toLocaleString('id-ID'); }
  var items = window.Cart.getItems();
  if (!items.length) {
    document.getElementById('checkout-empty').style.display = 'block';
    return;
  }
  document.getElementById('checkout-form-wrap').style.display = 'block';
  document.getElementById('checkout-items').innerHTML = items.map(function(i){
    return '<div class="summary-row"><span>' + i.name + (i.size ? (' (' + i.size + ')') : '') + ' &times; ' + i.qty + '</span><span>' + rupiah(i.price * i.qty) + '</span></div>';
  }).join('');
  document.getElementById('checkout-total').textContent = rupiah(window.Cart.totalPrice());

  document.getElementById('checkout-form').addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var phone = document.getElementById('f-phone').value.trim();
    var address = document.getElementById('f-address').value.trim();
    var notes = document.getElementById('f-notes').value.trim();

    document.getElementById('err-name').style.display = 'none';
    document.getElementById('err-phone').style.display = 'none';
    document.getElementById('err-general').style.display = 'none';

    var valid = true;
    if (!name) { document.getElementById('err-name').style.display = 'block'; valid = false; }
    var digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 9) { document.getElementById('err-phone').style.display = 'block'; valid = false; }
    if (!valid) return;

    var btn = document.getElementById('btn-submit-checkout');
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name, customer_phone: phone, customer_address: address, notes: notes,
        items: window.Cart.getItems(),
      }),
    }).then(function(r){ return r.json(); }).then(function(data){
      if (!data.ok) {
        document.getElementById('err-general').textContent = data.message || 'Terjadi kesalahan. Silakan coba lagi.';
        document.getElementById('err-general').style.display = 'block';
        btn.disabled = false; btn.textContent = 'Lanjutkan ke WhatsApp';
        return;
      }
      window.Cart.clear();
      window.location.href = data.waLink;
    }).catch(function(){
      document.getElementById('err-general').textContent = 'Gagal terhubung ke server. Periksa koneksi Anda.';
      document.getElementById('err-general').style.display = 'block';
      btn.disabled = false; btn.textContent = 'Lanjutkan ke WhatsApp';
    });
  });
})();
</script>
`;
  return shopLayout(req, { title: 'Checkout', activeNav: 'keranjang', body });
}

module.exports = { renderCheckoutPage };
