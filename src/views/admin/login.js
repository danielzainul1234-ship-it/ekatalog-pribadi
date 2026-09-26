'use strict';
const { getSettings } = require('../../lib/settings');
const { escapeHtml } = require('../../lib/format');

function renderLogin({ error, next }) {
  const s = getSettings();
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Login Admin — ${escapeHtml(s.store_name)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/admin.css">
<style>:root{--primary:${s.primary_color};--secondary:${s.secondary_color};}</style>
</head>
<body class="admin-body">
<div class="login-shell">
  <div class="login-box">
    <h1>Login Admin</h1>
    <p>${escapeHtml(s.store_name)} — Dashboard Pengelola Toko</p>
    ${error ? `<div class="form-error" style="margin-bottom:14px">${escapeHtml(error)}</div>` : ''}
    <form method="POST" action="/admin/login">
      <input type="hidden" name="next" value="${escapeHtml(next || '')}">
      <div class="form-group">
        <label>Username</label>
        <input type="text" name="username" class="form-control" required autofocus placeholder="admin">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" class="form-control" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;">
      </div>
      <button type="submit" class="btn btn-primary btn-block btn-lg">Masuk</button>
    </form>
  </div>
</div>
</body></html>`;
}

module.exports = { renderLogin };
