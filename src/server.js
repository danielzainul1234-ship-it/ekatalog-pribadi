'use strict';
require('./lib/db'); // ensures schema exists
const { seedIfEmpty } = require('./lib/seed');
seedIfEmpty();

const path = require('path');
const { createApp, Router } = require('./lib/miniweb');
const { cleanupExpired } = require('./lib/session');
const { getSettings } = require('./lib/settings');
const { all } = require('./lib/db');

const app = createApp();

// ---- static assets ----
app.use(app.static('/public', path.join(__dirname, '..', 'public')));
app.use(app.static('/uploads', path.join(__dirname, '..', 'public', 'uploads')));
app.use(app.static('/css', path.join(__dirname, '..', 'public', 'css')));
app.use(app.static('/js', path.join(__dirname, '..', 'public', 'js')));
app.use(app.static('/img', path.join(__dirname, '..', 'public', 'img')));

// ---- global context (settings + nav categories available to every view) ----
app.use((req, res, next) => {
  req.ctx = {
    settings: getSettings(),
    navCategories: all('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order ASC, id ASC'),
  };
  next();
});

// ---- mount routers ----
app.use('/admin', require('./routes/admin').router);
app.use('/api', require('./routes/api').router);
app.use('', require('./routes/shop').router);

app.notFound((req, res) => {
  const { renderError } = require('./views/shop/error');
  res.status(404).send(renderError(req, { code: 404, message: 'Halaman yang Anda cari tidak ditemukan.' }));
});
app.onError((err, req, res) => {
  console.error('[ERROR]', err);
  const { renderError } = require('./views/shop/error');
  res.status(500).send(renderError(req, { code: 500, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ekatalog Pribadi berjalan di http://localhost:${PORT}`);
  console.log(`Dashboard admin: http://localhost:${PORT}/admin (default: admin / admin123)`);
});

// periodic session cleanup
setInterval(cleanupExpired, 60 * 60 * 1000).unref();
